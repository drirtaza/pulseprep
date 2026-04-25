import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Clock, 
  CheckCircle,
  XCircle,
  Circle,
  Home,
  Play,
  Pause
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

import { BookmarkButton } from './bookmarks/BookmarkButton';
import { UserData, PageType, PracticeSessionConfig, MockExamConfig, MockExamResults, MCQQuestion } from '../types';
import { savePracticeProgress, updateUserAccuracy, saveActiveSession, loadActiveSession, clearActiveSession, ActiveSessionData } from '../utils/practiceProgressUtils';

interface MCQInterfaceProps {
  onNavigate: (page: PageType) => void;
  user: UserData;
  sessionConfig?: PracticeSessionConfig | null;
  mockExamConfig?: MockExamConfig | null;
  onMockExamComplete?: (results: MockExamResults) => void;
}

interface QuestionAttempt {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  timeTaken: number;
  isBookmarked: boolean;
}

const MCQInterface: React.FC<MCQInterfaceProps> = ({
  onNavigate,
  user,
  sessionConfig,
  mockExamConfig,
  onMockExamComplete
}) => {
  // State management
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Determine if this is a mock exam
  const isMockExam = !!mockExamConfig;
  const config = mockExamConfig || sessionConfig;

  // Timer effect
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, isPaused]);

  // ✅ NEW: Function to get answered question IDs for exclusion
  const getAnsweredQuestionIds = (userId: string, system?: string): Set<string> => {
    try {
      const progressKey = `pulseprep_practice_progress_${userId}`;
      const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      const answeredIds = new Set<string>();
      
      if (progress.sessions && Array.isArray(progress.sessions)) {
        progress.sessions.forEach((session: any) => {
          // Filter by system if specified
          if (system && session.system !== system) return;
          
          if (session.questions && Array.isArray(session.questions)) {
            session.questions.forEach((q: any) => {
              if (q.questionId) {
                answeredIds.add(q.questionId);
              }
            });
          }
        });
      }
      
  
      return answeredIds;
    } catch (error) {
      console.error('❌ Error getting answered question IDs:', error);
      return new Set<string>();
    }
  };

  // ✅ NEW: Function to check if system is completed
  const isSystemCompleted = (userId: string, system: string, totalAvailableQuestions: number): boolean => {
    const answeredIds = getAnsweredQuestionIds(userId, system);
    const isCompleted = answeredIds.size >= totalAvailableQuestions;
    
    return isCompleted;
  };

  // Load questions from CMS
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);

      
      // 🆕 CHECK FOR EXISTING SESSION FIRST (for continue sessions)
      if (sessionConfig?.sessionType === 'continue' && !sessionRestored) {

        const existingSession = loadActiveSession(user.id);
        
        if (existingSession && existingSession.system === sessionConfig.system) {

          
          try {
            // Validate session questions
            if (!existingSession.questions || existingSession.questions.length === 0) {
              throw new Error('Session has no questions');
            }
            
            if (existingSession.currentQuestionIndex >= existingSession.questions.length) {
              throw new Error('Invalid question index in session');
            }
            
            // Restore session state
            setQuestions(existingSession.questions);
            setCurrentQuestionIndex(existingSession.currentQuestionIndex);
            setAttempts(existingSession.userAnswers);
            setElapsedTime(existingSession.totalTimeSpent);
            setSessionRestored(true);
            
            // Set current question state
            const currentAttempt = existingSession.userAnswers[existingSession.currentQuestionIndex];
            if (currentAttempt) {
              setSelectedAnswer(currentAttempt.selectedAnswer);
              setHasSubmitted(currentAttempt.selectedAnswer !== null);
              setShowExplanation(currentAttempt.selectedAnswer !== null && !isMockExam);
            } else {
              setSelectedAnswer(null);
              setHasSubmitted(false);
              setShowExplanation(false);
            }
            
            setIsLoading(false);

            return;
                      } catch (sessionError) {
              console.error('❌ Error restoring session:', sessionError);

              clearActiveSession(user.id);
            setSessionRestored(false);
            // Continue to load new questions below
          }
        } else {

          setSessionRestored(false);
        }
      }
      
      // EXISTING QUESTION LOADING LOGIC (unchanged)
      let allQuestions: any[] = [];
      
      if (mockExamConfig) {
        const { getMockExamQuestionsBySet } = await import('../utils/mockExamUtils');
        
        const mockExamNameMapping = {
          'mock-1': 'Mock 1',
          'mock-2': 'Mock 2', 
          'mock-3': 'Mock 3',
          'previous-years': 'Previous Years'
        };
        
        const actualMockExamName = mockExamNameMapping[mockExamConfig.type as keyof typeof mockExamNameMapping] || mockExamConfig.type;
        

        
        if (actualMockExamName) {
          allQuestions = getMockExamQuestionsBySet(user.specialty, actualMockExamName, false);
        }
        

        
        if (allQuestions.length === 0) {
          console.warn(`⚠️ No approved mock exam questions found for ${actualMockExamName}`);
        }
      } else if (sessionConfig) {
        const fcpsQuestions = JSON.parse(localStorage.getItem('pulseprep_fcps_questions') || '[]');
        allQuestions = fcpsQuestions.filter((q: any) => q.status === 'approved');

      }
      
      let filteredQuestions = allQuestions;
      
      // Filter by specialty
      if (config?.specialty || user.specialty) {
        const specialty = config?.specialty || user.specialty;
        filteredQuestions = filteredQuestions.filter((q: any) => q.specialty === specialty);

      }
      
      // Filter by system if specified (for practice sessions)
      if (sessionConfig?.system) {
        filteredQuestions = filteredQuestions.filter((q: any) => q.system === sessionConfig.system);

      }
      
      // ✅ NEW: Question exclusion logic for practice sessions (NOT mock exams)
      if (sessionConfig && !isMockExam && sessionConfig.sessionType !== 'continue') {
        const totalAvailableQuestions = filteredQuestions.length;
        
        // Check if system is already completed
        if (isSystemCompleted(user.id, sessionConfig.system, totalAvailableQuestions)) {
  
          
          // Show completion message
          setQuestions([]);
          setIsLoading(false);
          
          // Navigate back with completion message
          setTimeout(() => {
            alert(`🎉 Congratulations! You have completed all ${totalAvailableQuestions} questions in ${sessionConfig.system}. This system is now 100% complete!`);
            onNavigate('dashboard');
          }, 1000);
          
          return;
        }
        
        // Get previously answered questions for this system
        const answeredQuestionIds = getAnsweredQuestionIds(user.id, sessionConfig.system);
        
        // Filter out previously answered questions
        const beforeExclusion = filteredQuestions.length;
        filteredQuestions = filteredQuestions.filter((q: any) => !answeredQuestionIds.has(q.id));
        const afterExclusion = filteredQuestions.length;
        
        console.log(`🔍 Question exclusion for ${sessionConfig.system}:`, {
          totalAvailable: totalAvailableQuestions,
          previouslyAnswered: answeredQuestionIds.size,
          beforeExclusion: beforeExclusion,
          afterExclusion: afterExclusion,
          excluded: beforeExclusion - afterExclusion
        });
        
        // If not enough new questions for requested session size, adjust session size
        const requestedCount = sessionConfig.mcqCount || 25;
        if (filteredQuestions.length < requestedCount) {
          console.log(`⚠️ Only ${filteredQuestions.length} new questions available (requested ${requestedCount})`);
          
          if (filteredQuestions.length === 0) {
            // This shouldn't happen due to completion check above, but just in case
            console.log('❌ No new questions available');
            alert('All questions in this system have been completed!');
            onNavigate('dashboard');
            return;
          }
          
          console.log(`📝 Adjusting session to ${filteredQuestions.length} questions (all remaining new questions)`);
        }
      }
      
      if (filteredQuestions.length === 0) {
        console.log('No questions found for the specified criteria');
        setQuestions([]);
        setIsLoading(false);
        return;
      }
      
      // Shuffle and limit questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      const questionCount = (() => {
        if (isMockExam && mockExamConfig) {
          return mockExamConfig.questionCount || mockExamConfig.totalQuestions || 100;
        }
        if (sessionConfig) {
          // For practice sessions, use available questions if less than requested
          const requested = sessionConfig.mcqCount || 25;
          return Math.min(requested, filteredQuestions.length);
        }
        return 25;
      })();
      
      const selectedQuestions = shuffled.slice(0, questionCount);
      console.log(`Selected ${selectedQuestions.length} questions for session`);
      
      // Convert to MCQQuestion format
      const formattedQuestions: MCQQuestion[] = selectedQuestions.map((q: any, index: number) => ({
        id: q.id || `q-${index}`,
        question: q.question || q.questionText || '',
        options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 
                      typeof q.correctAnswer === 'string' ? ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer.toUpperCase()) : 0,
        explanation: q.explanation || 'No explanation available.',
        optionExplanations: q.optionExplanations || [
          q.explanationCorrect || 'This is the correct answer based on current medical knowledge.',
          'This option is incorrect based on current medical evidence.',
          'This option is incorrect based on current medical evidence.',
          'This option is incorrect based on current medical evidence.'
        ],
        system: q.system || 'General',
        difficulty: q.difficulty || 'medium',
        tags: q.tags || [],
        specialty: q.specialty || user.specialty,
        isBookmarked: false
      }));
      
      setQuestions(formattedQuestions);
      
      // Initialize attempts for new session
      const initialAttempts: QuestionAttempt[] = formattedQuestions.map(q => ({
        questionId: q.id,
        selectedAnswer: null,
        isCorrect: null,
        timeTaken: 0,
        isBookmarked: false
      }));
      setAttempts(initialAttempts);
      
      console.log('Questions loaded successfully');
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [config, user.specialty, isMockExam, sessionConfig, mockExamConfig, user.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Save session when component unmounts (user exits)
  // Save session continuously as user progresses
useEffect(() => {
  if (sessionConfig && !isMockExam && questions.length > 0 && user?.id) {
    try {
      const sessionData: ActiveSessionData = {
        id: `session-${user.id}-${Date.now()}`,
        userId: user.id,
        specialty: user.specialty,
        system: sessionConfig.system,
        sessionType: 'practice',
        currentQuestionIndex,
        questions,
        userAnswers: attempts,
        sessionConfig: {
          mcqCount: sessionConfig.mcqCount,
          includeWrongMCQs: sessionConfig.includeWrongMCQs,
          difficulty: sessionConfig.difficulty
        },
        startTime: new Date(sessionStartTime).toISOString(),
        totalTimeSpent: elapsedTime,
        lastActiveTime: new Date().toISOString(),
        isActive: true
      };
      
      saveActiveSession(sessionData);
      
    } catch (error) {
      console.error('❌ Error saving session progress:', error);
    }
  }
}, [currentQuestionIndex, attempts, elapsedTime, questions, user?.id, sessionConfig, isMockExam, sessionStartTime]);

  // Current question data
  const currentQuestion = questions[currentQuestionIndex];

  // Navigation handlers
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(attempts[currentQuestionIndex - 1]?.selectedAnswer || null);
      setHasSubmitted(attempts[currentQuestionIndex - 1]?.selectedAnswer !== null);
      setShowExplanation(attempts[currentQuestionIndex - 1]?.selectedAnswer !== null && !isMockExam);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(attempts[currentQuestionIndex + 1]?.selectedAnswer || null);
      setHasSubmitted(attempts[currentQuestionIndex + 1]?.selectedAnswer !== null);
      setShowExplanation(attempts[currentQuestionIndex + 1]?.selectedAnswer !== null && !isMockExam);
      setQuestionStartTime(Date.now());
      if (sessionConfig && !isMockExam) saveSessionProgress();
    }
  };

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedAnswer(attempts[index]?.selectedAnswer || null);
    setHasSubmitted(attempts[index]?.selectedAnswer !== null);
    setShowExplanation(attempts[index]?.selectedAnswer !== null && !isMockExam);
    setQuestionStartTime(Date.now());
  };

  // Answer submission
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || hasSubmitted) return;

    const timeTaken = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const updatedAttempts = [...attempts];
    updatedAttempts[currentQuestionIndex] = {
      ...updatedAttempts[currentQuestionIndex],
      selectedAnswer,
      isCorrect,
      timeTaken
    };

    setAttempts(updatedAttempts);
    setHasSubmitted(true);
    // Only show explanation if it's NOT a mock exam
    setShowExplanation(!isMockExam);
    if (sessionConfig && !isMockExam) saveSessionProgress();

    // Save progress
    savePracticeProgress(user.id, {
      questionId: currentQuestion.id,
      isCorrect,
      timeTaken,
      system: currentQuestion.system,
      difficulty: currentQuestion.difficulty,
      specialty: user.specialty
    });

    // Auto-advance for mock exams after 2 seconds
    if (isMockExam) {
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          handleNext();
        }
      }, 2000);
    }
  };

  // ✅ ENHANCED: Session completion with detailed tracking for question exclusion
  const handleCompleteSession = () => {
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalTime = elapsedTime;

    // ✅ NEW: Save detailed session data for question exclusion
    if (sessionConfig && !isMockExam) {
      try {
        const detailedSessionData = {
          id: `session-${Date.now()}-${user.id}`,
          userId: user.id,
          specialty: user.specialty,
          system: sessionConfig.system,
          sessionType: 'practice',
          startTime: new Date(sessionStartTime).toISOString(),
          endTime: new Date().toISOString(),
          questions: questions.map((q, index) => ({
            questionId: q.id,
            question: q.question,
            userAnswer: attempts[index].selectedAnswer ?? -1,
            correctAnswer: q.correctAnswer,
            isCorrect: attempts[index].isCorrect || false,
            timeSpent: attempts[index].timeTaken,
            system: q.system,
            difficulty: q.difficulty,
            specialty: q.specialty
          })),
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          incorrectAnswers: attempts.filter(a => a.isCorrect === false).length,
          accuracy: accuracy,
          timeSpent: totalTime,
          completedAt: new Date().toISOString(),
          config: {
            mcqCount: sessionConfig.mcqCount,
            includeWrongMCQs: sessionConfig.includeWrongMCQs,
            difficulty: sessionConfig.difficulty
          }
        };
        
        // Save to practice progress with detailed session tracking
        const progressKey = `pulseprep_practice_progress_${user.id}`;
        const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        
        // Initialize progress structure if needed
        if (!progress.userId) {
          progress.userId = user.id;
          progress.sessions = [];
          progress.totalQuestions = 0;
          progress.totalCorrect = 0;
          progress.totalTime = 0;
          progress.streak = 0;
          progress.lastStudyDate = null;
          progress.systemStats = {};
          progress.createdAt = new Date().toISOString();
        }
        
        if (!progress.sessions) {
          progress.sessions = [];
        }
        
        // Add the detailed session
        progress.sessions.push(detailedSessionData);
        
        // Update totals
        progress.totalQuestions = (progress.totalQuestions || 0) + totalQuestions;
        progress.totalCorrect = (progress.totalCorrect || 0) + correctAnswers;
        progress.totalTime = (progress.totalTime || 0) + totalTime;
        progress.lastStudyDate = detailedSessionData.completedAt;
        
        // Update system stats
        if (!progress.systemStats) {
          progress.systemStats = {};
        }
        
        const systemKey = sessionConfig.system;
        if (!progress.systemStats[systemKey]) {
          progress.systemStats[systemKey] = {
            totalQuestions: 0,
            correctAnswers: 0,
            sessions: 0,
            lastStudied: detailedSessionData.completedAt
          };
        }
        
        progress.systemStats[systemKey].totalQuestions += totalQuestions;
        progress.systemStats[systemKey].correctAnswers += correctAnswers;
        progress.systemStats[systemKey].sessions += 1;
        progress.systemStats[systemKey].lastStudied = detailedSessionData.completedAt;
        
        localStorage.setItem(progressKey, JSON.stringify(progress));
        
        console.log('✅ Detailed session data saved for question exclusion tracking:', {
          system: sessionConfig.system,
          questionsAnswered: totalQuestions,
          totalSessionsForSystem: progress.systemStats[systemKey].sessions,
          totalQuestionsForSystem: progress.systemStats[systemKey].totalQuestions
        });
        
      } catch (error) {
        console.error('❌ Error saving detailed session data:', error);
      }
    }

    // Update user accuracy
    updateUserAccuracy(user.id);
    clearActiveSession(user.id);

    if (isMockExam && onMockExamComplete) {
      const results: MockExamResults = {
        examId: `exam-${Date.now()}-${user.id}`,
        examName: mockExamConfig!.name || mockExamConfig!.type || 'Mock Exam',
        userId: user.id,
        userName: user.name || user.fullName || 'User',
        specialty: mockExamConfig!.specialty,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: attempts.filter(a => a.isCorrect === false).length,
        skippedAnswers: attempts.filter(a => a.selectedAnswer === null).length,
        timeSpent: Math.floor(totalTime / 1000),
        timeLimit: mockExamConfig!.timeLimit || mockExamConfig!.duration || 0,
        score: correctAnswers,
        percentage: accuracy,
        passed: accuracy >= 70,
        completedAt: new Date().toISOString(),
        questions: questions.map((q, index) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          optionExplanations: q.optionExplanations,
          system: q.system,
          difficulty: q.difficulty,
          tags: q.tags,
          specialty: q.specialty,
          isBookmarked: q.isBookmarked,
          selectedAnswer: attempts[index].selectedAnswer ?? undefined,
          userAnswer: attempts[index].selectedAnswer ?? undefined,
          isCorrect: attempts[index].isCorrect || false,
          timeTaken: attempts[index].timeTaken,
          timeSpent: attempts[index].timeTaken
        })),
        systemWiseResults: [],
        difficultyWiseResults: [],
        answers: questions.map((q, index) => ({
          questionId: q.id,
          selectedOptionId: attempts[index].selectedAnswer?.toString() ?? '',
          isCorrect: attempts[index].isCorrect ?? false,
          timeSpent: Math.floor((attempts[index].timeTaken || 0) / 1000)
        }))
      };
      
      onMockExamComplete(results);
    } else {
      onNavigate('dashboard');
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const answered = attempts.filter(a => a.selectedAnswer !== null).length;
    const correct = attempts.filter(a => a.isCorrect).length;
    const incorrect = attempts.filter(a => a.isCorrect === false).length;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { answered, correct, incorrect, accuracy };
  }, [attempts]);

  // Format time
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  // Get option button styling - Modified to hide feedback during mock exams
  const getOptionButtonStyle = (optionIndex: number) => {
    const baseStyle = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 flex items-center space-x-3";
    
    if (!hasSubmitted) {
      if (selectedAnswer === optionIndex) {
        return `${baseStyle} border-theme-primary bg-theme-primary/10 text-theme-primary-dark`;
      }
      return `${baseStyle} border-gray-200 bg-white hover:border-theme-primary/50 hover:bg-theme-primary/5`;
    }
    
    // After submission - Hide feedback during mock exams
    if (isMockExam) {
      // During mock exams, just show neutral styling for submitted answers
      if (selectedAnswer === optionIndex) {
        return `${baseStyle} border-theme-primary bg-theme-primary/10 text-theme-primary-dark`;
      }
      return `${baseStyle} border-gray-200 bg-gray-50 text-gray-700`;
    }
    
    // For practice sessions, show correct/incorrect feedback as before
    if (optionIndex === currentQuestion.correctAnswer) {
      return `${baseStyle} border-green-500 bg-green-50 text-green-900`;
    }
    
    if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.correctAnswer) {
      return `${baseStyle} border-red-500 bg-red-50 text-red-900`;
    }
    
    return `${baseStyle} border-gray-200 bg-gray-50 text-gray-700`;
  };

  // Get option circle styling - Modified to hide feedback during mock exams
  const getOptionCircleStyle = (optionIndex: number) => {
    const baseStyle = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium";
    
    if (!hasSubmitted) {
      if (selectedAnswer === optionIndex) {
        return `${baseStyle} bg-theme-primary text-white`;
      }
      return `${baseStyle} bg-gray-200 text-gray-700`;
    }
    
    // After submission - Hide feedback during mock exams
    if (isMockExam) {
      // During mock exams, show neutral styling
      if (selectedAnswer === optionIndex) {
        return `${baseStyle} bg-theme-primary text-white`;
      }
      return `${baseStyle} bg-gray-300 text-gray-600`;
    }
    
    // For practice sessions, show correct/incorrect feedback as before
    if (optionIndex === currentQuestion.correctAnswer) {
      return `${baseStyle} bg-green-500 text-white`;
    }
    
    if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.correctAnswer) {
      return `${baseStyle} bg-red-500 text-white`;
    }
    
    return `${baseStyle} bg-gray-300 text-gray-600`;
  };

  // Get question navigation button style - Modified to hide feedback during mock exams
  const getQuestionNavStyle = (index: number) => {
    const baseStyle = "w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200";
    const attempt = attempts[index];
    
    if (index === currentQuestionIndex) {
      return `${baseStyle} bg-theme-primary text-white border-2 border-theme-primary-dark`;
    }
    
    // Hide correct/incorrect feedback during mock exams
    if (isMockExam) {
      // During mock exams, only show answered/unanswered status
      if (attempt?.selectedAnswer !== null) {
        return `${baseStyle} bg-gray-500 text-white border border-gray-600`;
      }
      return `${baseStyle} bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300`;
    }
    
    // For practice sessions, show full feedback as before
    if (attempt?.isCorrect === true) {
      return `${baseStyle} bg-green-500 text-white border border-green-600`;
    }
    
    if (attempt?.isCorrect === false) {
      return `${baseStyle} bg-red-500 text-white border border-red-600`;
    }
    
    if (attempt?.selectedAnswer !== null) {
      return `${baseStyle} bg-yellow-500 text-white border border-yellow-600`;
    }
    
    return `${baseStyle} bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300`;
  };

  // 🆕 SAVE SESSION PROGRESS
  const saveSessionProgress = useCallback(() => {
    if (!sessionConfig || isMockExam || questions.length === 0) return;
    
    try {
      const sessionData: ActiveSessionData = {
        id: `session-${user.id}-${Date.now()}`,
        userId: user.id,
        specialty: user.specialty,
        system: sessionConfig.system,
        sessionType: 'practice',
        currentQuestionIndex,
        questions,
        userAnswers: attempts,
        sessionConfig: {
          mcqCount: sessionConfig.mcqCount,
          includeWrongMCQs: sessionConfig.includeWrongMCQs,
          difficulty: sessionConfig.difficulty
        },
        startTime: new Date(sessionStartTime).toISOString(),
        totalTimeSpent: elapsedTime,
        lastActiveTime: new Date().toISOString(),
        isActive: true
      };
      
      const saved = saveActiveSession(sessionData);
      if (!saved) {
        console.warn('⚠️ Failed to save session progress');
      }
    } catch (error) {
      console.error('❌ Error saving session progress:', error);
    }
  }, [user.id, user.specialty, sessionConfig, currentQuestionIndex, questions, attempts, elapsedTime, sessionStartTime, isMockExam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-theme flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-theme-primary-dark">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-theme flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
            <p className="text-gray-600 mb-4">
              No questions found for the selected criteria. Please try a different system or contact support.
            </p>
            <Button onClick={() => onNavigate('dashboard')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-theme">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-theme sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">
                {isMockExam ? 'Mock Exam' : 'Practice Session'}
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-theme-primary-dark font-medium">
                {sessionConfig?.system || user.specialty}
              </span>
            </div>

            {/* Center - Question Counter */}
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              {isMockExam && (
                <div className="flex items-center space-x-2 text-sm text-theme-primary-dark">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="hidden sm:flex"
              >
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('dashboard')}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 lg:px-8 pb-2">
          <Progress 
            value={(stats.answered / questions.length) * 100} 
            className="h-2"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop Two-Column Layout */}
        <div className={`hidden lg:grid lg:gap-8 ${isMockExam ? 'lg:grid-cols-1' : 'lg:grid-cols-5'}`}>
          {/* Left Column - Question */}
          <div className={isMockExam ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <Card className="shadow-lg border-theme">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="bg-theme-badge">
                        {currentQuestion.system}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          currentQuestion.difficulty === 'easy' ? 'text-green-700 border-green-300 bg-green-50' :
                          currentQuestion.difficulty === 'medium' ? 'text-yellow-700 border-yellow-300 bg-yellow-50' :
                          'text-red-700 border-red-300 bg-red-50'
                        }
                      >
                        {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-relaxed text-gray-900">
                      {currentQuestion.question}
                    </CardTitle>
                  </div>
                  {/* ✅ FIXED: BookmarkButton integration with question prop */}
                  {!isMockExam && (
                    <BookmarkButton
                      questionId={currentQuestion.id}
                      specialty={user.specialty}
                      question={currentQuestion}
                      className="ml-4 flex-shrink-0"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestion.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => !hasSubmitted && setSelectedAnswer(index)}
                    disabled={hasSubmitted}
                    className={getOptionButtonStyle(index)}
                  >
                    <div className={getOptionCircleStyle(index)}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {/* Hide answer feedback icons during mock exams */}
                    {hasSubmitted && !isMockExam && index === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {hasSubmitted && !isMockExam && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </button>
                ))}

                <div className="pt-6 space-y-4">
                  {!hasSubmitted ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="w-full bg-theme-primary hover:bg-theme-primary-dark"
                      size="lg"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <div className="flex space-x-3">
                      <Button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                          onClick={handleNext}
                          className="flex-1 bg-theme-primary hover:bg-theme-primary-dark"
                          size="lg"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCompleteSession}
                          className="flex-1 bg-theme-primary hover:bg-theme-primary-dark"
                          size="lg"
                        >
                          Complete Session
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Progress Stats - Hide from mock exams */}
                  {!isMockExam && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-theme-primary">{stats.answered}</div>
                        <div className="text-xs text-gray-600">Answered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.correct}</div>
                        <div className="text-xs text-gray-600">Correct</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{stats.incorrect}</div>
                        <div className="text-xs text-gray-600">Incorrect</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.accuracy}%</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Navigation */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Quick Navigation</h4>
                    <div className="grid grid-cols-8 gap-2">
                      {questions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuestionJump(index)}
                          className={getQuestionNavStyle(index)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Explanation (Only show in practice sessions, not mock exams) */}
          {!isMockExam && (
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-theme h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showExplanation ? (
                    <div className="text-center py-12 text-gray-500">
                      <Circle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg mb-2">Submit your answer</p>
                      <p className="text-sm">to see detailed explanations</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Individual Option Explanations */}
                      <div className="space-y-4">
                        <div className="space-y-4">
                          {currentQuestion.options.map((option, index) => {
                            const optionLetter = String.fromCharCode(65 + index);
                            const isCorrect = index === currentQuestion.correctAnswer;
                            const wasSelected = selectedAnswer === index;
                            
                            return (
                              <div 
                                key={index} 
                                className={`p-4 rounded-lg border-2 ${
                                  isCorrect 
                                    ? 'border-green-400 bg-green-50' 
                                    : wasSelected 
                                      ? 'border-red-400 bg-red-50' 
                                      : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCorrect 
                                      ? 'bg-green-500 text-white' 
                                      : wasSelected 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-gray-400 text-white'
                                  }`}>
                                    {optionLetter}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium mb-2">{option}</p>
                                    <p className="text-xs text-gray-600">
                                      {currentQuestion.optionExplanations?.[index] || 
                                       (isCorrect 
                                         ? 'This is the correct answer based on current medical knowledge.' 
                                         : 'This option is incorrect based on current medical evidence.')}
                                    </p>
                                  </div>
                                  {isCorrect && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                  {wasSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* General Explanation */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Detailed Explanation</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                      
                      {/* Performance Feedback */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-4 h-4 rounded-full ${
                            selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <h5 className="font-medium text-blue-900">
                            {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                          </h5>
                        </div>
                        <p className="text-sm text-blue-800">
                          {selectedAnswer === currentQuestion.correctAnswer 
                            ? 'Well done! You selected the correct answer.' 
                            : `The correct answer was option ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <Card className="shadow-lg border-theme">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" className="bg-theme-badge">
                      {currentQuestion.system}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={
                        currentQuestion.difficulty === 'easy' ? 'text-green-700 border-green-300 bg-green-50' :
                        currentQuestion.difficulty === 'medium' ? 'text-yellow-700 border-yellow-300 bg-yellow-50' :
                        'text-red-700 border-red-300 bg-red-50'
                      }
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-relaxed text-gray-900">
                    {currentQuestion.question}
                  </CardTitle>
                </div>
                {!isMockExam && (
                  <BookmarkButton
                    questionId={currentQuestion.id}
                    specialty={user.specialty}
                    question={currentQuestion}
                    className="ml-4 flex-shrink-0"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => !hasSubmitted && setSelectedAnswer(index)}
                  disabled={hasSubmitted}
                  className={getOptionButtonStyle(index)}
                >
                  <div className={getOptionCircleStyle(index)}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {hasSubmitted && !isMockExam && index === currentQuestion.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {hasSubmitted && !isMockExam && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </button>
              ))}

              <div className="pt-6 space-y-4">
                {!hasSubmitted ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="w-full bg-theme-primary hover:bg-theme-primary-dark"
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <div className="flex space-x-3">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        className="flex-1 bg-theme-primary hover:bg-theme-primary-dark"
                        size="lg"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCompleteSession}
                        className="flex-1 bg-theme-primary hover:bg-theme-primary-dark"
                        size="lg"
                      >
                        Complete Session
                      </Button>
                    )}
                  </div>
                )}

                {/* Mobile Quick Navigation */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Quick Navigation</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionJump(index)}
                        className={getQuestionNavStyle(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Explanation Panel - FULL explanations like desktop */}
{!isMockExam && showExplanation && (
  <div className="mt-6 space-y-4">
    {/* Individual Option Explanations - Same as desktop */}
    <div className="space-y-3">
      {currentQuestion.options.map((option, index) => {
        const optionLetter = String.fromCharCode(65 + index);
        const isCorrect = index === currentQuestion.correctAnswer;
        const wasSelected = selectedAnswer === index;
        
        return (
          <div 
            key={index} 
            className={`p-3 rounded-lg border-2 ${
              isCorrect 
                ? 'border-green-400 bg-green-50' 
                : wasSelected 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isCorrect 
                  ? 'bg-green-500 text-white' 
                  : wasSelected 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-400 text-white'
              }`}>
                {optionLetter}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{option}</p>
                <p className="text-xs text-gray-600">
                  {currentQuestion.optionExplanations?.[index] || 
                   (isCorrect 
                     ? 'This is the correct answer based on current medical knowledge.' 
                     : 'This option is incorrect based on current medical evidence.')}
                </p>
              </div>
              {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
              {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Separator */}
    <div className="border-t border-gray-200"></div>
    
    {/* General Explanation */}
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900 text-sm">Detailed Explanation</h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        {currentQuestion.explanation}
      </p>
    </div>
    
    {/* Performance Feedback */}
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${
          selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <h5 className="font-medium text-blue-900 text-sm">
          {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
        </h5>
      </div>
      <p className="text-xs text-blue-800">
        {selectedAnswer === currentQuestion.correctAnswer 
          ? 'Well done! You selected the correct answer.' 
          : `The correct answer was option ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}
      </p>
    </div>
  </div>
)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MCQInterface;