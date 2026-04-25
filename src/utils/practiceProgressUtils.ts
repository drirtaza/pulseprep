// Real progress tracking utility - replaces demo data with actual user statistics
// 🔒 WARNING: Only modify data calculations, NEVER change UI/styling

interface PracticeQuestionResult {
  questionId: string;
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  system: string;
  difficulty: number | string;
  explanation?: string;
}

interface PracticeSession {
  id: string;
  userId: string;
  specialty: string;
  sessionType: 'practice' | 'mock-exam';
  system?: string;
  startTime: string;
  endTime: string;
  questions: PracticeQuestionResult[];
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number;
  completedAt: string;
  config?: {
    mcqCount: number;
    includeWrongMCQs: boolean;
  };
}

interface SystemPerformance {
  system: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  lastStudied: string;
  progress: number;
}

interface DashboardStats {
  totalQuestions: number;
  accuracy: number;
  hoursStudied: number;
  practiceStreak: number;
  recentSessions: number;
  improvementTrend: number;
  systemsStudied: number;
  averageSessionTime: number;
}

// ✅ NEW: Enhanced system completion tracking interface
interface SystemCompletionStats {
  system: string;
  specialty: string;
  totalAvailableQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  isCompleted: boolean;
  lastStudiedDate?: string;
  sessionsCompleted: number;
  averageAccuracy: number;
}

// Initialize practice progress tracking for a user
export const initializePracticeProgress = (userId: string): void => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const existingProgress = localStorage.getItem(progressKey);
  
  if (!existingProgress) {
    const initialProgress = {
      userId,
      sessions: [],
      totalQuestions: 0,
      totalCorrect: 0,
      totalTime: 0,
      streak: 0,
      lastStudyDate: null,
      systemStats: {},
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(initialProgress));
  }
};

// Save a completed practice session
export const savePracticeSession = (session: PracticeSession): void => {
  const progressKey = `pulseprep_practice_progress_${session.userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.sessions) {
    progress.sessions = [];
  }
  
  // Add new session
  progress.sessions.push(session);
  
  // Update totals
  progress.totalQuestions = (progress.totalQuestions || 0) + session.totalQuestions;
  progress.totalCorrect = (progress.totalCorrect || 0) + session.correctAnswers;
  progress.totalTime = (progress.totalTime || 0) + session.timeSpent;
  progress.lastStudyDate = session.completedAt;
  
  // Update system stats
  if (!progress.systemStats) {
    progress.systemStats = {};
  }
  
  if (session.system) {
    const systemKey = session.system;
    if (!progress.systemStats[systemKey]) {
      progress.systemStats[systemKey] = {
        totalQuestions: 0,
        correctAnswers: 0,
        sessions: 0,
        lastStudied: session.completedAt
      };
    }
    
    progress.systemStats[systemKey].totalQuestions += session.totalQuestions;
    progress.systemStats[systemKey].correctAnswers += session.correctAnswers;
    progress.systemStats[systemKey].sessions += 1;
    progress.systemStats[systemKey].lastStudied = session.completedAt;
  }
  
  // Update streak
  progress.streak = calculateStudyStreak(session.userId);
  
  localStorage.setItem(progressKey, JSON.stringify(progress));
};

// ✅ NEW: Get answered question IDs for a specific user, specialty, and optionally system
export const getAnsweredQuestionIds = (userId: string, specialty: string, system?: string): Set<string> => {
  try {
    const progressKey = `pulseprep_practice_progress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const answeredIds = new Set<string>();
    
    if (progress.sessions && Array.isArray(progress.sessions)) {
      progress.sessions.forEach((session: PracticeSession) => {
        // Filter by specialty and system if specified
        if (session.specialty !== specialty) return;
        if (system && session.system !== system) return;
        
        if (session.questions && Array.isArray(session.questions)) {
          session.questions.forEach((question: PracticeQuestionResult) => {
            if (question.questionId) {
              answeredIds.add(question.questionId);
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

// ✅ NEW: Get unanswered questions from a list of all questions
export const getUnansweredQuestions = (
  userId: string, 
  specialty: string, 
  system: string, 
  allQuestions: any[]
): any[] => {
  try {
    const answeredIds = getAnsweredQuestionIds(userId, specialty, system);
    const unansweredQuestions = allQuestions.filter(question => !answeredIds.has(question.id));
    

    return unansweredQuestions;
  } catch (error) {
    console.error('❌ Error getting unanswered questions:', error);
    return allQuestions; // Return all questions if error occurs
  }
};

// ✅ NEW: Check if a system is completed (all questions answered)
export const isSystemCompleted = (
  userId: string, 
  specialty: string, 
  system: string, 
  totalAvailableQuestions: number
): boolean => {
  try {
    const answeredIds = getAnsweredQuestionIds(userId, specialty, system);
    const isCompleted = answeredIds.size >= totalAvailableQuestions;
    

    return isCompleted;
  } catch (error) {
    console.error('❌ Error checking system completion:', error);
    return false;
  }
};

// ✅ NEW: Get detailed system completion statistics
export const getSystemCompletionStats = (
  userId: string, 
  specialty: string, 
  system: string, 
  totalAvailableQuestions: number
): SystemCompletionStats => {
  try {
    const answeredIds = getAnsweredQuestionIds(userId, specialty, system);
    const answeredQuestions = answeredIds.size;
    const completionPercentage = totalAvailableQuestions > 0 ? 
      Math.round((answeredQuestions / totalAvailableQuestions) * 100) : 0;
    
    // Get system stats for additional information
    const progressKey = `pulseprep_practice_progress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const systemStats = progress.systemStats?.[system] || {};
    
    const stats: SystemCompletionStats = {
      system,
      specialty,
      totalAvailableQuestions,
      answeredQuestions,
      completionPercentage,
      isCompleted: answeredQuestions >= totalAvailableQuestions,
      lastStudiedDate: systemStats.lastStudied || null,
      sessionsCompleted: systemStats.sessions || 0,
      averageAccuracy: systemStats.totalQuestions > 0 ? 
        Math.round((systemStats.correctAnswers / systemStats.totalQuestions) * 100) : 0
    };
    

    return stats;
  } catch (error) {
    console.error('❌ Error getting system completion stats:', error);
    return {
      system,
      specialty,
      totalAvailableQuestions,
      answeredQuestions: 0,
      completionPercentage: 0,
      isCompleted: false,
      lastStudiedDate: undefined,
      sessionsCompleted: 0,
      averageAccuracy: 0
    };
  }
};

// ✅ NEW: Get completion stats for all systems in a specialty
export const getAllSystemsCompletionStats = (
  userId: string, 
  specialty: string, 
  systemsWithQuestionCounts: Array<{ name: string; totalQuestions: number }>
): SystemCompletionStats[] => {
  try {
    return systemsWithQuestionCounts.map(systemInfo => 
      getSystemCompletionStats(userId, specialty, systemInfo.name, systemInfo.totalQuestions)
    );
  } catch (error) {
    console.error('❌ Error getting all systems completion stats:', error);
    return [];
  }
};

// ✅ NEW: Get remaining questions count for a system
export const getRemainingQuestionsCount = (
  userId: string, 
  specialty: string, 
  system: string, 
  totalAvailableQuestions: number
): number => {
  try {
    const answeredIds = getAnsweredQuestionIds(userId, specialty, system);
    const remaining = Math.max(0, totalAvailableQuestions - answeredIds.size);
    

    return remaining;
  } catch (error) {
    console.error('❌ Error getting remaining questions count:', error);
    return totalAvailableQuestions;
  }
};

// ✅ ENHANCED: Get system progress with real completion data
export const getSystemProgress = (userId: string, systemName: string): number => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.systemStats || !progress.systemStats[systemName]) {
    return 0;
  }
  
  const systemStats = progress.systemStats[systemName];
  if (systemStats.totalQuestions === 0) return 0;
  
  // Calculate progress based on accuracy and questions answered
  const accuracy = (systemStats.correctAnswers / systemStats.totalQuestions) * 100;
  const questionProgress = Math.min(systemStats.totalQuestions / 50, 1) * 100; // Assume 50 questions = 100% coverage
  
  return Math.round((accuracy * 0.7) + (questionProgress * 0.3)); // Weighted combination
};

// ✅ ENHANCED: Get system progress with completion percentage
export const getSystemProgressWithCompletion = (
  userId: string, 
  systemName: string, 
  totalAvailableQuestions?: number
): { progress: number; completionPercentage: number; isCompleted: boolean } => {
  try {
    const progressKey = `pulseprep_practice_progress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    
    // Get traditional progress
    const traditionalProgress = getSystemProgress(userId, systemName);
    
    // Get completion percentage if total questions provided
    let completionPercentage = 0;
    let isCompleted = false;
    
    if (totalAvailableQuestions && totalAvailableQuestions > 0) {
      const systemStats = progress.systemStats?.[systemName] || {};
      const questionsAnswered = systemStats.totalQuestions || 0;
      completionPercentage = Math.round((questionsAnswered / totalAvailableQuestions) * 100);
      isCompleted = questionsAnswered >= totalAvailableQuestions;
    }
    
    return {
      progress: traditionalProgress,
      completionPercentage: Math.min(completionPercentage, 100),
      isCompleted
    };
  } catch (error) {
    console.error('❌ Error getting system progress with completion:', error);
    return {
      progress: 0,
      completionPercentage: 0,
      isCompleted: false
    };
  }
};

// Calculate user's overall accuracy
export const getUserAccuracy = (userId: string): number => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.totalQuestions || progress.totalQuestions === 0) {
    return 0;
  }
  
  return Math.round((progress.totalCorrect / progress.totalQuestions) * 100);
};

// Get total questions answered by user
export const getQuestionsCount = (userId: string): number => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  return progress.totalQuestions || 0;
};

// Calculate study streak in days
export const getStudyStreak = (userId: string): number => {
  return calculateStudyStreak(userId);
};

const calculateStudyStreak = (userId: string): number => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.sessions || progress.sessions.length === 0) {
    return 0;
  }
  
  // Get unique study dates
  const studyDates = progress.sessions
    .map((session: PracticeSession) => {
      const date = new Date(session.completedAt);
      return date.toDateString();
    })
    .filter((date: string, index: number, arr: string[]) => arr.indexOf(date) === index)
    .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  
  if (studyDates.length === 0) return 0;
  
  // Check if last study was today or yesterday
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  if (studyDates[0] !== today && studyDates[0] !== yesterday) {
    return 0; // Streak broken
  }
  
  // Calculate consecutive days
  let streak = 0;
  let currentDate = new Date();
  
  for (const studyDate of studyDates) {
    const study = new Date(studyDate);
    const dayDiff = Math.floor((currentDate.getTime() - study.getTime()) / (24 * 60 * 60 * 1000));
    
    if (dayDiff === streak || (streak === 0 && dayDiff <= 1)) {
      streak++;
      currentDate = study;
    } else {
      break;
    }
  }
  
  return streak;
};

// Get real timestamp for last study session of a system
export const getSystemLastStudied = (userId: string, systemName: string): string | null => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.systemStats || !progress.systemStats[systemName]) {
    return null;
  }
  
  return progress.systemStats[systemName].lastStudied;
};

// Get hours studied
export const getHoursStudied = (userId: string): number => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  const totalMilliseconds = progress.totalTime || 0;
  return Math.round((totalMilliseconds / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
};

// Get dashboard statistics
export const getDashboardStats = (userId: string): DashboardStats => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  const sessions = progress.sessions || [];
  const recentSessions = sessions.filter((session: PracticeSession) => {
    const sessionDate = new Date(session.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return sessionDate > weekAgo;
  });
  
  // Calculate improvement trend (compare last 5 sessions vs previous 5)
  let improvementTrend = 0;
  if (sessions.length >= 10) {
    const recent5 = sessions.slice(-5);
    const previous5 = sessions.slice(-10, -5);
    
    const recentAvg = recent5.reduce((sum: number, s: PracticeSession) => sum + s.accuracy, 0) / 5;
    const previousAvg = previous5.reduce((sum: number, s: PracticeSession) => sum + s.accuracy, 0) / 5;
    
    improvementTrend = recentAvg - previousAvg;
  }
  
  // Calculate average session time in minutes
  const totalSessionTime = sessions.reduce((sum: number, s: PracticeSession) => sum + s.timeSpent, 0);
  const averageSessionTime = sessions.length > 0 ? totalSessionTime / sessions.length / (1000 * 60) : 0;
  
  return {
    totalQuestions: progress.totalQuestions || 0,
    accuracy: getUserAccuracy(userId),
    hoursStudied: getHoursStudied(userId),
    practiceStreak: getStudyStreak(userId),
    recentSessions: recentSessions.length,
    improvementTrend: Math.round(improvementTrend * 10) / 10,
    systemsStudied: Object.keys(progress.systemStats || {}).length,
    averageSessionTime: Math.round(averageSessionTime)
  };
};

// Get system performance data
export const getSystemPerformance = (userId: string): SystemPerformance[] => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.systemStats) return [];
  
  return Object.entries(progress.systemStats).map(([system, stats]: [string, any]) => ({
    system,
    totalQuestions: stats.totalQuestions,
    correctAnswers: stats.correctAnswers,
    accuracy: stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0,
    lastStudied: stats.lastStudied,
    progress: getSystemProgress(userId, system)
  }));
};

// Get weak areas (systems with low accuracy)
export const getWeakAreas = (userId: string): SystemPerformance[] => {
  const systemPerformance = getSystemPerformance(userId);
  return systemPerformance
    .filter(system => system.totalQuestions >= 5) // Only consider systems with enough data
    .filter(system => system.accuracy < 70) // Below 70% accuracy
    .sort((a, b) => a.accuracy - b.accuracy) // Sort by worst first
    .slice(0, 5); // Top 5 weak areas
};

// Get improvement suggestions based on user data
export const getImprovementSuggestions = (userId: string): string[] => {
  const stats = getDashboardStats(userId);
  const weakAreas = getWeakAreas(userId);
  const suggestions: string[] = [];
  
  if (stats.totalQuestions === 0) {
    suggestions.push("Start with your first practice session to track your progress");
    return suggestions;
  }
  
  if (stats.accuracy < 60) {
    suggestions.push("Focus on understanding concepts before attempting more questions");
  }
  
  if (stats.practiceStreak === 0) {
    suggestions.push("Try to practice daily to build consistency and improve retention");
  }
  
  if (weakAreas.length > 0) {
    suggestions.push(`Spend more time on ${weakAreas[0].system} - your weakest area`);
  }
  
  if (stats.averageSessionTime < 15) {
    suggestions.push("Consider longer practice sessions (20-30 minutes) for better learning");
  }
  
  if (stats.systemsStudied < 3) {
    suggestions.push("Try practicing different medical systems to broaden your knowledge");
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Great progress! Keep practicing consistently to maintain your performance");
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
};

// Save progress for a single question attempt
export const savePracticeProgress = (userId: string, questionResult: {
  questionId: string;
  isCorrect: boolean;
  timeTaken: number;
  system: string;
  difficulty: string;
  specialty: string;
}): void => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  // Initialize if doesn't exist
  if (!progress.userId) {
    progress.userId = userId;
    progress.sessions = [];
    progress.totalQuestions = 0;
    progress.totalCorrect = 0;
    progress.totalTime = 0;
    progress.streak = 0;
    progress.lastStudyDate = null;
    progress.systemStats = {};
    progress.createdAt = new Date().toISOString();
  }
  
  // Update totals
  progress.totalQuestions = (progress.totalQuestions || 0) + 1;
  if (questionResult.isCorrect) {
    progress.totalCorrect = (progress.totalCorrect || 0) + 1;
  }
  progress.totalTime = (progress.totalTime || 0) + questionResult.timeTaken;
  progress.lastStudyDate = new Date().toISOString();
  
  // Update system stats
  if (!progress.systemStats) {
    progress.systemStats = {};
  }
  
  const systemKey = questionResult.system;
  if (!progress.systemStats[systemKey]) {
    progress.systemStats[systemKey] = {
      totalQuestions: 0,
      correctAnswers: 0,
      sessions: 0,
      lastStudied: new Date().toISOString()
    };
  }
  
  progress.systemStats[systemKey].totalQuestions += 1;
  if (questionResult.isCorrect) {
    progress.systemStats[systemKey].correctAnswers += 1;
  }
  progress.systemStats[systemKey].lastStudied = new Date().toISOString();
  
  localStorage.setItem(progressKey, JSON.stringify(progress));
};

// Update user's overall accuracy
export const updateUserAccuracy = (userId: string): void => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  // Initialize if doesn't exist
  if (!progress.userId) {
    progress.userId = userId;
    progress.sessions = [];
    progress.totalQuestions = 0;
    progress.totalCorrect = 0;
    progress.totalTime = 0;
    progress.streak = 0;
    progress.lastStudyDate = null;
    progress.systemStats = {};
    progress.createdAt = new Date().toISOString();
  }
  
  // Update last study date and streak
  progress.lastStudyDate = new Date().toISOString();
  progress.streak = calculateStudyStreak(userId);
  
  localStorage.setItem(progressKey, JSON.stringify(progress));
};

// Get user progress summary
export const getUserProgressSummary = (userId: string) => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  return {
    totalSessions: progress.sessions?.length || 0,
    totalQuestions: progress.totalQuestions || 0,
    totalCorrect: progress.totalCorrect || 0,
    accuracy: getUserAccuracy(userId),
    hoursStudied: getHoursStudied(userId),
    streak: getStudyStreak(userId),
    systemsStudied: Object.keys(progress.systemStats || {}).length,
    lastStudyDate: progress.lastStudyDate
  };
};

// Get timeline data for progress charts
export const getProgressTimelineData = (userId: string) => {
  const progressKey = `pulseprep_practice_progress_${userId}`;
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  
  if (!progress.sessions) return [];
  
  return progress.sessions.map((session: PracticeSession) => ({
    date: new Date(session.completedAt).toLocaleDateString(),
    accuracy: session.accuracy,
    questions: session.totalQuestions,
    system: session.system || 'Mixed'
  }));
};

export type { PracticeSession, PracticeQuestionResult, SystemPerformance, DashboardStats, SystemCompletionStats };

// 🆕 ADD THESE FUNCTIONS TO THE END OF practiceProgressUtils.ts
// DO NOT REPLACE EXISTING FUNCTIONS - ONLY ADD THESE

interface MockExamProgress {
  examType: string;
  examName: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttemptDate?: string;
  lastAttemptResults?: {
    score: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    passed: boolean;
  };
}

interface MockExamAttempt {
  id: string;
  examType: string;
  examName: string;
  userId: string;
  specialty: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  passed: boolean;
  completedAt: string;
  examConfig?: any;
}

// ✅ CRITICAL: Save mock exam results and update progress
export const saveMockExamResults = (userId: string, results: any): void => {
  try {
    console.log('💾 Saving mock exam results:', { userId, examType: results.examConfig?.examType });
    
    // 1. Save the detailed exam attempt
    const attemptKey = `pulseprep_mock_attempts_${userId}`;
    const existingAttempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
    
    const newAttempt: MockExamAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      examType: results.examConfig?.examType || results.examConfig?.type || 'unknown',
      examName: results.examConfig?.examTitle || 'Mock Exam',
      userId: userId,
      specialty: results.examConfig?.specialty || 'unknown',
      score: results.correctAnswers || results.score || 0,
      percentage: results.percentage || 0,
      totalQuestions: results.totalQuestions || 0,
      correctAnswers: results.correctAnswers || results.score || 0,
      timeSpent: results.timeSpent || results.totalTime || 0,
      passed: results.passed || (results.percentage >= 70),
      completedAt: results.completedAt || new Date().toISOString(),
      examConfig: results.examConfig
    };
    
    existingAttempts.push(newAttempt);
    localStorage.setItem(attemptKey, JSON.stringify(existingAttempts));
    
    // 2. Update mock exam progress summary
    const progressKey = `pulseprep_mock_progress_${results.examConfig?.specialty || 'unknown'}_${userId}`;
    const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '[]');
    
    // Find or create progress entry for this exam type
    const examType = results.examConfig?.examType || results.examConfig?.type;
    let progressEntry = existingProgress.find((p: MockExamProgress) => p.examType === examType);
    
    if (!progressEntry) {
      progressEntry = {
        examType: examType,
        examName: results.examConfig?.examTitle || getExamNameFromType(examType),
        completed: false,
        bestScore: 0,
        attempts: 0,
        lastAttemptDate: undefined,
        lastAttemptResults: undefined
      };
      existingProgress.push(progressEntry);
    }
    
    // Update progress entry
    progressEntry.attempts += 1;
    progressEntry.completed = true;
    progressEntry.lastAttemptDate = newAttempt.completedAt;
    progressEntry.lastAttemptResults = {
      score: newAttempt.score,
      percentage: newAttempt.percentage,
      totalQuestions: newAttempt.totalQuestions,
      correctAnswers: newAttempt.correctAnswers,
      timeSpent: newAttempt.timeSpent,
      passed: newAttempt.passed
    };
    
    // Update best score if this attempt is better
    if (newAttempt.percentage > progressEntry.bestScore) {
      progressEntry.bestScore = newAttempt.percentage;
    }
    
    localStorage.setItem(progressKey, JSON.stringify(existingProgress));
    
    console.log('✅ Mock exam results saved successfully:', {
      examType: newAttempt.examType,
      score: newAttempt.percentage,
      bestScore: progressEntry.bestScore,
      attempts: progressEntry.attempts,
      passed: newAttempt.passed
    });
    
  } catch (error) {
    console.error('❌ Error saving mock exam results:', error);
  }
};

// ✅ Get mock exam progress for dashboard display
export const getMockExamProgress = (userId: string, specialty: string, examType: string): MockExamProgress | null => {
  try {
    const progressKey = `pulseprep_mock_progress_${specialty}_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '[]');
    return progress.find((p: MockExamProgress) => p.examType === examType) || null;
  } catch (error) {
    console.error('❌ Error getting mock exam progress:', error);
    return null;
  }
};

// ✅ Get all mock exam progress for a user's specialty
export const getAllMockExamProgress = (userId: string, specialty: string): MockExamProgress[] => {
  try {
    const progressKey = `pulseprep_mock_progress_${specialty}_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '[]');
    
    const allExamTypes = ['mock-1', 'mock-2', 'mock-3', 'previous-years'];
    const result: MockExamProgress[] = [];
    
    allExamTypes.forEach(examType => {
      let entry = progress.find((p: MockExamProgress) => p.examType === examType);
      
      if (!entry) {
        entry = {
          examType,
          examName: getExamNameFromType(examType),
          completed: false,
          bestScore: 0,
          attempts: 0
        };
      }
      
      result.push(entry);
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error getting all mock exam progress:', error);
    return [];
  }
};

// ✅ Check if a mock exam is unlocked based on previous exam scores
export const isMockExamUnlocked = (userId: string, specialty: string, examType: string): { 
  unlocked: boolean; 
  reason?: string; 
  requiredScore?: number; 
  progress?: number 
} => {
  try {
    const allProgress = getAllMockExamProgress(userId, specialty);
    
    switch (examType) {
      case 'mock-1':
        return { unlocked: true }; // Always unlocked
      
      case 'mock-2':
        const mock1Progress = allProgress.find(p => p.examType === 'mock-1');
        if (mock1Progress?.completed && mock1Progress.bestScore >= 60) {
          return { unlocked: true };
        }
        return { 
          unlocked: false, 
          reason: 'Complete Mock 1 with 60% or higher score',
          requiredScore: 60,
          progress: mock1Progress?.bestScore || 0
        };
      
      case 'mock-3':
        const mock2Progress = allProgress.find(p => p.examType === 'mock-2');
        if (mock2Progress?.completed && mock2Progress.bestScore >= 70) {
          return { unlocked: true };
        }
        return { 
          unlocked: false, 
          reason: 'Complete Mock 2 with 70% or higher score',
          requiredScore: 70,
          progress: mock2Progress?.bestScore || 0
        };
      
      case 'previous-years':
        const mock3Progress = allProgress.find(p => p.examType === 'mock-3');
        if (mock3Progress?.completed && mock3Progress.bestScore >= 80) {
          return { unlocked: true };
        }
        return { 
          unlocked: false, 
          reason: 'Complete Mock 3 with 80% or higher score',
          requiredScore: 80,
          progress: mock3Progress?.bestScore || 0
        };
      
      default:
        return { unlocked: false };
    }
  } catch (error) {
    console.error('❌ Error checking mock exam unlock status:', error);
    return { unlocked: false };
  }
};

// ✅ Get mock exam statistics for dashboard
export const getMockExamStats = (userId: string, specialty: string) => {
  try {
    const allProgress = getAllMockExamProgress(userId, specialty);
    const attemptKey = `pulseprep_mock_attempts_${userId}`;
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
    
    const stats = {
      totalExamsAvailable: 4,
      examsCompleted: allProgress.filter(p => p.completed).length,
      totalAttempts: attempts.length,
      averageScore: 0,
      bestScore: 0,
      examsUnlocked: 0,
      nextExamToUnlock: null as string | null
    };
    
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((sum: number, attempt: any) => sum + attempt.percentage, 0);
      stats.averageScore = Math.round(totalScore / attempts.length);
      stats.bestScore = Math.max(...attempts.map((a: any) => a.percentage));
    }
    
    const examTypes = ['mock-1', 'mock-2', 'mock-3', 'previous-years'];
    for (const examType of examTypes) {
      const { unlocked } = isMockExamUnlocked(userId, specialty, examType);
      if (unlocked) {
        stats.examsUnlocked++;
      } else {
        if (!stats.nextExamToUnlock) {
          stats.nextExamToUnlock = getExamNameFromType(examType);
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting mock exam stats:', error);
    return {
      totalExamsAvailable: 4,
      examsCompleted: 0,
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      examsUnlocked: 1,
      nextExamToUnlock: 'Mock 2'
    };
  }
};

// ✅ Initialize mock exam progress for a user
export const initializeMockExamProgress = (userId: string, specialty: string): void => {
  try {
    const progressKey = `pulseprep_mock_progress_${specialty}_${userId}`;
    const existingProgress = localStorage.getItem(progressKey);
    
    if (!existingProgress) {
      const initialProgress: MockExamProgress[] = [
        { examType: 'mock-1', examName: 'Mock 1', completed: false, bestScore: 0, attempts: 0 },
        { examType: 'mock-2', examName: 'Mock 2', completed: false, bestScore: 0, attempts: 0 },
        { examType: 'mock-3', examName: 'Mock 3', completed: false, bestScore: 0, attempts: 0 },
        { examType: 'previous-years', examName: 'Previous Years', completed: false, bestScore: 0, attempts: 0 }
      ];
      
      localStorage.setItem(progressKey, JSON.stringify(initialProgress));
      console.log(`✅ Initialized mock exam progress for ${userId} in ${specialty}`);
    }
  } catch (error) {
    console.error('❌ Error initializing mock exam progress:', error);
  }
};

// Helper function to map exam types to display names
const getExamNameFromType = (examType: string): string => {
  const mapping = {
    'mock-1': 'Mock 1',
    'mock-2': 'Mock 2',
    'mock-3': 'Mock 3',
    'previous-years': 'Previous Years'
  };
  return mapping[examType as keyof typeof mapping] || examType;
};

// Export the new types
export type { MockExamProgress, MockExamAttempt };

// ✅ SESSION MANAGEMENT FUNCTIONS - ADD AT END OF FILE AFTER LINE 847

interface ActiveSessionData {
  id: string;
  userId: string;
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  system: string;
  sessionType: 'practice';
  currentQuestionIndex: number;
  questions: any[];
  userAnswers: Array<{
    questionId: string;
    selectedAnswer: number | null;
    isCorrect: boolean | null;
    timeTaken: number;
    isBookmarked: boolean;
  }>;
  sessionConfig: {
    mcqCount: number;
    includeWrongMCQs: boolean;
    difficulty?: string;
  };
  startTime: string;
  totalTimeSpent: number;
  lastActiveTime: string;
  isActive: boolean;
}

// Compress session data to avoid storage quota issues
const compressSessionData = (sessionData: ActiveSessionData): ActiveSessionData => {
  return {
    ...sessionData,
    questions: sessionData.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      optionExplanations: q.optionExplanations, 
      system: q.system,
      difficulty: q.difficulty,
      specialty: q.specialty
    }))
  };
};

// Validate session data integrity
const validateSessionData = (sessionData: any): sessionData is ActiveSessionData => {
  return sessionData &&
         typeof sessionData.id === 'string' &&
         typeof sessionData.userId === 'string' &&
         typeof sessionData.currentQuestionIndex === 'number' &&
         Array.isArray(sessionData.questions) &&
         Array.isArray(sessionData.userAnswers) &&
         sessionData.questions.length > 0 &&
         sessionData.currentQuestionIndex < sessionData.questions.length;
};

// Save active practice session with compression and validation
export const saveActiveSession = (sessionData: ActiveSessionData): boolean => {
  try {
    if (!validateSessionData(sessionData)) {
      console.error('❌ Invalid session data, cannot save');
      return false;
    }

    const sessionKey = `pulseprep_active_session_${sessionData.userId}`;
    const compressedData = compressSessionData({
      ...sessionData,
      lastActiveTime: new Date().toISOString(),
      isActive: true
    });
    
    // Check storage size before saving
    const dataString = JSON.stringify(compressedData);
    const dataSize = new Blob([dataString]).size;
    
    if (dataSize > 1024 * 1024) { // 1MB limit
      console.warn('⚠️ Session data too large, compressing further...');
      compressedData.questions = compressedData.questions.slice(0, 50); // Limit to 50 questions
    }
    
    localStorage.setItem(sessionKey, JSON.stringify(compressedData));
    
    console.log('💾 Active session saved:', {
      userId: sessionData.userId,
      system: sessionData.system,
      progress: `${sessionData.currentQuestionIndex + 1}/${sessionData.questions.length}`,
      timeSpent: `${Math.floor(sessionData.totalTimeSpent / 60000)} min`,
      dataSize: `${(dataSize / 1024).toFixed(1)}KB`
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error saving active session:', error);
    return false;
  }
};

// Load active practice session with validation and error handling
export const loadActiveSession = (userId: string): ActiveSessionData | null => {
  try {
    const sessionKey = `pulseprep_active_session_${userId}`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (!sessionData) {
      return null;
    }
    
    const parsed = JSON.parse(sessionData);
    
    // Validate session data
    if (!validateSessionData(parsed)) {
      console.error('❌ Invalid session data format, removing corrupted session');
      localStorage.removeItem(sessionKey);
      return null;
    }
    
    // Check if session is less than 24 hours old
    const lastActive = new Date(parsed.lastActiveTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.log('🕐 Session expired (>24h), removing');
      localStorage.removeItem(sessionKey);
      return null;
    }
    
    // Additional validation: check if current index is valid
    if (parsed.currentQuestionIndex >= parsed.questions.length) {
      console.error('❌ Invalid question index, session corrupted');
      localStorage.removeItem(sessionKey);
      return null;
    }
    
    console.log('📂 Active session loaded:', {
      userId: parsed.userId,
      system: parsed.system,
      progress: `${parsed.currentQuestionIndex + 1}/${parsed.questions.length}`,
      hoursAgo: Math.floor(hoursDiff * 10) / 10
    });
    
    return parsed as ActiveSessionData;
  } catch (error) {
    console.error('❌ Error loading active session:', error);
    // Remove corrupted session data
    try {
      localStorage.removeItem(`pulseprep_active_session_${userId}`);
    } catch (cleanupError) {
      console.error('❌ Error cleaning up corrupted session:', cleanupError);
    }
    return null;
  }
};

// Check if user has an active practice session
export const hasActiveSession = (userId: string): boolean => {
  try {
    const session = loadActiveSession(userId);
    return session !== null && session.isActive;
  } catch (error) {
    console.error('❌ Error checking active session:', error);
    return false;
  }
};

// Clear active practice session
export const clearActiveSession = (userId: string): void => {
  try {
    const sessionKey = `pulseprep_active_session_${userId}`;
    localStorage.removeItem(sessionKey);
    console.log('🗑️ Active session cleared for user:', userId);
  } catch (error) {
    console.error('❌ Error clearing active session:', error);
  }
};

// Get session summary for dashboard display
export const getSessionSummary = (userId: string): {
  hasSession: boolean;
  system?: string;
  progress?: string;
  timeSpent?: string;
  questionsRemaining?: number;
} => {
  try {
    const session = loadActiveSession(userId);
    if (!session) {
      return { hasSession: false };
    }
    
    const progressPercent = Math.round(((session.currentQuestionIndex + 1) / session.questions.length) * 100);
    const minutesSpent = Math.floor(session.totalTimeSpent / 60000);
    const questionsRemaining = session.questions.length - (session.currentQuestionIndex + 1);
    
    return {
      hasSession: true,
      system: session.system,
      progress: `Question ${session.currentQuestionIndex + 1} of ${session.questions.length} (${progressPercent}%)`,
      timeSpent: `${minutesSpent} minutes spent`,
      questionsRemaining
    };
  } catch (error) {
    console.error('❌ Error getting session summary:', error);
    return { hasSession: false };
  }
};



// ✅ NEW: Function to manually validate question exclusion logic
export const validateQuestionExclusion = (
  userId: string, 
  specialty: string, 
  system: string, 
  allAvailableQuestions: any[]
): {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  exclusionWorking: boolean;
  duplicateAnswered: string[];
} => {
  try {
    const answeredIds = getAnsweredQuestionIds(userId, specialty, system);
    const unansweredQuestions = getUnansweredQuestions(userId, specialty, system, allAvailableQuestions);
    
    // Check for duplicates in answered questions
    const progressKey = `pulseprep_practice_progress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const allAnsweredInSessions: string[] = [];
    
    if (progress.sessions) {
      progress.sessions
        .filter((session: PracticeSession) => session.system === system && session.specialty === specialty)
        .forEach((session: PracticeSession) => {
          if (session.questions) {
            session.questions.forEach((q: PracticeQuestionResult) => {
              if (q.questionId) {
                allAnsweredInSessions.push(q.questionId);
              }
            });
          }
        });
    }
    
    // Find duplicates
    const duplicates = allAnsweredInSessions.filter((id, index, arr) => arr.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    const validation = {
      totalQuestions: allAvailableQuestions.length,
      answeredQuestions: answeredIds.size,
      unansweredQuestions: unansweredQuestions.length,
      exclusionWorking: (answeredIds.size + unansweredQuestions.length) === allAvailableQuestions.length,
      duplicateAnswered: uniqueDuplicates
    };
    
    console.log('🔍 Question Exclusion Validation:', validation);
    
    if (!validation.exclusionWorking) {
      console.warn('⚠️ Question exclusion logic may have issues!');
    }
    
    if (validation.duplicateAnswered.length > 0) {
      console.warn('⚠️ Found duplicate answered questions:', validation.duplicateAnswered);
    }
    
    return validation;
  } catch (error) {
    console.error('❌ Error validating question exclusion:', error);
    return {
      totalQuestions: allAvailableQuestions.length,
      answeredQuestions: 0,
      unansweredQuestions: allAvailableQuestions.length,
      exclusionWorking: false,
      duplicateAnswered: []
    };
  }
};

// Export the session interface
export type { ActiveSessionData };