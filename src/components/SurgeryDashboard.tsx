import { useState, useEffect } from 'react';
import { 
  Scissors, 
  Play, 
  Award, 
  Target, 
  Settings,
  LogOut,
  Activity,
  Plus,
  BookOpen,
  Zap,
  Trophy,
  Flame,
  X,
  Bookmark,
  TrendingUp,
  Lock,
  Unlock,
  Star,
  Clock,
  User,
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { getDaysUntilExpiry } from '../utils/subscriptionUtils';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

import { UserData, PageType, PracticeSessionConfig, MockExamConfig } from '../types';
import { getMedicalSystems } from '../utils/cmsUtils';
import { getMockExamSets, MockExamSet, getMockExamQuestionsBySet } from '../utils/mockExamUtils';
import { passwordService } from '../services/PasswordService';
// 🔒 REAL PROGRESS DATA - replaces demo numbers only
import { 
  initializePracticeProgress,
  getUserAccuracy,
  getQuestionsCount,
  getStudyStreak,
  getSystemProgress,
  getSystemLastStudied,
  // ✅ ADD THESE NEW IMPORTS
  initializeMockExamProgress,
  getAllMockExamProgress,
  isMockExamUnlocked,
  getMockExamProgress as getRealProgress,
  getSessionSummary,
  clearActiveSession,
  getSystemCompletionStats,
  getRemainingQuestionsCount
} from '../utils/practiceProgressUtils';

interface SurgeryDashboardProps {
  user: UserData;
  onNavigate: (page: PageType) => void;
  onStartPracticeSession: (config: Omit<PracticeSessionConfig, 'specialty'>) => void;
  onContinuePractice: () => void;
  onStartMockExam: (config: MockExamConfig) => void;
  onLogout: () => void;
}

// Mock Exam Progress Interface
interface MockExamProgress {
  examType: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttemptDate?: string;
}

export default function SurgeryDashboard({ user, onNavigate, onStartPracticeSession, onContinuePractice, onStartMockExam, onLogout }: SurgeryDashboardProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [showSessionConfig, setShowSessionConfig] = useState(false);
  const [sessionLength, setSessionLength] = useState<'quick' | 'standard' | 'intensive' | 'marathon'>('standard');
  const [medicalSystems, setMedicalSystems] = useState<any[]>([]);
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);
  const [mockExamSets, setMockExamSets] = useState<MockExamSet[]>([]);
  const [_mockExamProgress, setMockExamProgress] = useState<MockExamProgress[]>([]);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [showContinueSection, setShowContinueSection] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>('');

  // 🔒 REAL PROGRESS DATA - initialize user progress tracking
  useEffect(() => {
    if (user?.id) {
      initializePracticeProgress(user.id);
      // ✅ ADD THIS LINE
      initializeMockExamProgress(user.id, user.specialty);
    }
  }, [user?.id, user.specialty]); // ✅ ADD user.specialty to dependency array

  // 🔒 REAL PROGRESS DATA - get actual user statistics
  const realUserAccuracy = getUserAccuracy(user.id);
  const realQuestionsCount = getQuestionsCount(user.id);
  const realStudyStreak = getStudyStreak(user.id);

  // 🆕 Load session summary on component mount and user change
  useEffect(() => {
    if (user?.id) {
      try {
        const summary = getSessionSummary(user.id);
        setSessionSummary(summary);
        setShowContinueSection(summary.hasSession);
        
        if (summary.hasSession) {
          // Session found and loaded
        }
      } catch (error) {
        console.error('❌ Error loading session summary:', error);
        setShowContinueSection(false);
        setSessionSummary(null);
      }
    } else {
      setShowContinueSection(false);
      setSessionSummary(null);
    }
  }, [user?.id]);

  // 🆕 Handle clearing session
  const handleClearSession = () => {
    try {
      if (user?.id) {
        clearActiveSession(user.id);
        setSessionSummary(null);
        setShowContinueSection(false);
      }
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  };

  // Session length configurations
  const sessionConfigs = {
    quick: {
      name: 'Quick Session',
      description: 'Perfect for short study breaks',
      questionCount: 15,
      estimatedTime: '15-20 min',
      icon: Zap,
      color: 'blue'
    },
    standard: {
      name: 'Standard Session',
      description: 'Balanced practice session',
      questionCount: 25,
      estimatedTime: '25-35 min',
      icon: BookOpen,
      color: 'blue'
    },
    intensive: {
      name: 'Intensive Session',
      description: 'Deep dive into topics',
      questionCount: 50,
      estimatedTime: '50-70 min',
      icon: Target,
      color: 'orange'
    },
    marathon: {
      name: 'Marathon Session',
      description: 'Exam-style endurance training',
      questionCount: 100,
      estimatedTime: '120-150 min',
      icon: Trophy,
      color: 'purple'
    }
  };

  // Icon mapping for systems
  const systemIconMap: Record<string, any> = {
    'General Surgery': Scissors,
    'Orthopedic Surgery': Plus,
    'Cardiothoracic Surgery': Activity,
    'Neurosurgery': Target,
    'Plastic Surgery': Plus,
    'Vascular Surgery': Activity,
    'Trauma Surgery': Plus,
    'Urology': Target,
    'Surgical Oncology': Plus,
    'Pediatric Surgery': Activity,
    'Emergency Surgery': Target,
    'Anesthesia': Plus,
    'Surgical Anatomy': Activity,
    'Surgical Pathology': Target,
    'Surgical Techniques': Scissors,
    'Post-operative Care': Plus,
    'Surgical Instruments': Activity,
    'Surgical Ethics': Target,
    'Pre-operative Assessment': Plus,
    'Surgical Complications': Activity
  };

  // Mock Exam Progress Functions
  // ✅ FIND the existing loadMockExamProgress function and REPLACE it entirely:
  const loadMockExamProgress = () => {
    try {
      if (!user?.id) return;
      
      // Get real mock exam progress
      const realProgress = getAllMockExamProgress(user.id, user.specialty);
      
      // Convert to dashboard format
      const dashboardProgress = realProgress.map(progress => ({
        examType: progress.examType,
        completed: progress.completed,
        bestScore: progress.bestScore,
        attempts: progress.attempts,
        lastAttemptDate: progress.lastAttemptDate
      }));
      
      setMockExamProgress(dashboardProgress);
    } catch (error) {
      console.error('❌ Error loading mock exam progress:', error);
      setMockExamProgress([]);
    }
  };

  // ✅ FIXED: Replace require() with imported function
  const getMockExamProgress = (examType: string): MockExamProgress | null => {
    if (!user?.id) return null;
    
    // Use the imported function instead of require
    return getRealProgress(user.id, user.specialty, examType);
  };

  // ✅ FIND the existing isExamUnlocked function and REPLACE it entirely:
  const isExamUnlocked = (examName: string): { unlocked: boolean; reason?: string; requiredScore?: number; progress?: number } => {
    if (!user?.id) return { unlocked: false };
    
    // Map exam name to exam type
    const examTypeMapping = {
      'Mock 1': 'mock-1',
      'Mock 2': 'mock-2',
      'Mock 3': 'mock-3',
      'Previous Years': 'previous-years'
    };
    
    const examType = examTypeMapping[examName as keyof typeof examTypeMapping];
    if (!examType) return { unlocked: false };
    
    // Use real unlock logic
    return isMockExamUnlocked(user.id, user.specialty, examType);
  };

  const getExamStatusBadge = (examName: string) => {
    const { unlocked } = isExamUnlocked(examName);
    const progress = getMockExamProgress(getExamTypeFromName(examName));
    
    if (!unlocked) {
      return <Badge variant="secondary" className="text-gray-500 bg-gray-100"><Lock className="w-3 h-3 mr-1" />Locked</Badge>;
    }
    
    if (progress?.completed) {
      return <Badge variant="default" className="text-blue-700 bg-blue-100"><Star className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    
    if (progress?.attempts && progress.attempts > 0) {
      return <Badge variant="outline" className="text-blue-700 bg-blue-50">In Progress</Badge>;
    }
    
    return <Badge variant="outline" className="text-blue-700 bg-blue-50"><Unlock className="w-3 h-3 mr-1" />Available</Badge>;
  };

  const getExamTypeFromName = (examName: string): string => {
    const mapping = {
      'Mock 1': 'mock-1',
      'Mock 2': 'mock-2',
      'Mock 3': 'mock-3',
      'Previous Years': 'previous-years'
    };
    return mapping[examName as keyof typeof mapping] || 'mock-1';
  };

  const getUnlockProgressBar = (examName: string) => {
    const unlockStatus = isExamUnlocked(examName);
    
    if (unlockStatus.unlocked || !unlockStatus.requiredScore || !unlockStatus.progress) {
      return null;
    }
    
    const progressPercentage = Math.min((unlockStatus.progress / unlockStatus.requiredScore) * 100, 100);
    
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Unlock Progress</span>
          <span>{unlockStatus.progress}% / {unlockStatus.requiredScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Load medical systems from CMS and mock exam sets
  useEffect(() => {
    loadMedicalSystems();
    loadMockExamProgress();
    loadMockExamSets();
  }, []);

  const loadMockExamSets = async () => {
    try {
      const sets = await getMockExamSets('surgery');
      const approvedSets = sets.filter(set => set.status === 'approved' && set.isActive);
      setMockExamSets(approvedSets);
    } catch (error) {
      console.error('Error loading mock exam sets:', error);
      setMockExamSets([]);
    }
  };

  const loadMedicalSystems = async () => {
    try {
      setIsLoadingSystems(true);
      
      // Get all medical systems for surgery specialty with error handling
      let allSystems;
      try {
        allSystems = getMedicalSystems('surgery');
        if (!Array.isArray(allSystems)) {
          throw new Error('getMedicalSystems did not return an array');
        }
      } catch (systemError) {
        console.error('❌ Failed to get medical systems from CMS:', systemError);
        // Use fallback systems
        allSystems = [];
      }
      
      // If no systems available, use default systems
      if (allSystems.length === 0) {
        setMedicalSystems(getDefaultSystems());
        return;
      }
      
      // Import the function to get real question counts with error handling
      let getSystemQuestionCount;
      try {
        const cmsUtils = await import('../utils/cmsUtils');
        getSystemQuestionCount = cmsUtils.getSystemQuestionCount;
        if (typeof getSystemQuestionCount !== 'function') {
          throw new Error('getSystemQuestionCount is not a function');
        }
      } catch (importError) {
        console.error('❌ Failed to import getSystemQuestionCount:', importError);
        // Create a fallback function that returns 0
        getSystemQuestionCount = () => Promise.resolve(0);
      }
      
      // Filter only visible systems and convert to dashboard format
      const visibleSystems = [];
      
      for (const system of allSystems) {
        try {
          // Ensure system has required properties
          if (!system || typeof system !== 'object') {
            continue;
          }
          
          // Check if system is visible (default to true if not specified)
          const isVisible = system.isVisible !== undefined ? system.isVisible : true;
          if (!isVisible) {
            continue;
          }
          
          // Get real approved question count for this system with error handling
          let realQuestionCount = 0;
          try {
            realQuestionCount = await getSystemQuestionCount(system.name, 'surgery');
            if (typeof realQuestionCount !== 'number' || realQuestionCount < 0) {
              realQuestionCount = 0;
            }
          } catch (countError) {
            realQuestionCount = 0;
          }
          
          const systemData = {
            name: system.name || 'Unknown System',
            icon: systemIconMap[system.name] || Scissors,
            description: getSystemDescription(system.name),
            progress: getSystemProgress(user.id, system.name),
            totalQuestions: realQuestionCount, // ✅ REAL question count instead of fake
            lastStudied: formatLastStudied(getSystemLastStudied(user.id, system.name)),
            difficulty: getSystemDifficulty(system.name),
            tags: getSystemTags(system.name),
            isCustom: system.isCustom || false,
            createdBy: system.createdBy || null,
            hasQuestions: realQuestionCount > 0 // ✅ Show if system has questions
          };
          
          visibleSystems.push(systemData);
        } catch (systemProcessError) {
          console.error(`❌ Error processing system ${system?.name}:`, systemProcessError);
          // Continue with next system instead of failing completely
        }
      }

      setMedicalSystems(visibleSystems);
      
    } catch (error) {
      console.error('❌ Failed to load medical systems:', error);
      // Always provide fallback systems to prevent UI breaking
      setMedicalSystems(getDefaultSystems());
    } finally {
      setIsLoadingSystems(false);
    }
  };

  // Helper functions for system data
  const getSystemDescription = (systemName: string): string => {
    const descriptions: Record<string, string> = {
      'General Surgery': 'Abdominal surgery, appendectomy, hernia repair, gallbladder surgery',
      'Orthopedic Surgery': 'Fractures, joint replacement, spine surgery, sports injuries',
      'Cardiothoracic Surgery': 'Cardiac surgery, thoracic procedures, heart valve repair',
      'Neurosurgery': 'Brain surgery, spinal procedures, tumor removal, trauma',
      'Plastic Surgery': 'Reconstructive surgery, cosmetic procedures, burn treatment',
      'Vascular Surgery': 'Arterial surgery, venous procedures, angioplasty, stents',
      'Trauma Surgery': 'Emergency surgery, polytrauma, damage control surgery',
      'Urology': 'Kidney surgery, prostate procedures, bladder surgery, stones',
      'Surgical Oncology': 'Cancer surgery, tumor resection, lymph node dissection',
      'Pediatric Surgery': 'Congenital anomalies, pediatric trauma, minimally invasive',
      'Emergency Surgery': 'Acute abdomen, perforations, emergency procedures',
      'Anesthesia': 'General anesthesia, regional blocks, perioperative care',
      'Surgical Anatomy': 'Human anatomy, surgical approaches, anatomical variations',
      'Surgical Pathology': 'Tissue diagnosis, frozen sections, surgical specimens',
      'Surgical Techniques': 'Suturing, minimally invasive surgery, robotic surgery',
      'Post-operative Care': 'Recovery protocols, complications, pain management',
      'Surgical Instruments': 'Operating room equipment, instrument handling',
      'Surgical Ethics': 'Medical ethics, consent, professional conduct',
      'Pre-operative Assessment': 'Risk assessment, patient evaluation, preparation',
      'Surgical Complications': 'Complication management, prevention, treatment'
    };
    
    return descriptions[systemName] || 'Comprehensive surgical system coverage';
  };

  const getSystemDifficulty = (systemName: string): string => {
    const highYield = ['General Surgery', 'Trauma Surgery', 'Emergency Surgery', 'Anesthesia', 'Surgical Techniques', 'Pre-operative Assessment', 'Post-operative Care'];
    const lowYield = ['Surgical Ethics', 'Surgical Instruments'];
    
    if (highYield.includes(systemName)) return 'High Yield';
    if (lowYield.includes(systemName)) return 'Low Yield';
    return 'Medium Yield';
  };

  const getSystemTags = (systemName: string): string[] => {
    const tagMap: Record<string, string[]> = {
      'General Surgery': ['Surgery', 'Emergency', 'Abdomen'],
      'Orthopedic Surgery': ['Orthopedics', 'Trauma', 'Bones'],
      'Cardiothoracic Surgery': ['Cardiac', 'Thoracic', 'Heart'],
      'Neurosurgery': ['Neurosurgery', 'Brain', 'Spine'],
      'Plastic Surgery': ['Plastic', 'Reconstruction'],
      'Vascular Surgery': ['Vascular', 'Arterial', 'Venous'],
      'Trauma Surgery': ['Trauma', 'Emergency'],
      'Urology': ['Urology', 'Kidney', 'Prostate'],
      'Surgical Oncology': ['Oncology', 'Cancer'],
      'Pediatric Surgery': ['Pediatric', 'Children'],
      'Emergency Surgery': ['Emergency', 'Acute'],
      'Anesthesia': ['Anesthesia', 'Perioperative'],
      'Surgical Anatomy': ['Anatomy', 'Basic Sciences'],
      'Surgical Pathology': ['Pathology', 'Diagnosis'],
      'Surgical Techniques': ['Techniques', 'Skills'],
      'Post-operative Care': ['Post-op', 'Recovery'],
      'Surgical Instruments': ['Instruments', 'Equipment'],
      'Surgical Ethics': ['Ethics', 'Professional'],
      'Pre-operative Assessment': ['Pre-op', 'Assessment'],
      'Surgical Complications': ['Complications', 'Management']
    };
    
    return tagMap[systemName] || ['Surgery'];
  };

  // 🔒 REAL PROGRESS DATA - format timestamp function (replaces getRandomLastStudied)
  const formatLastStudied = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const studiedDate = new Date(timestamp);
    const diffMs = now.getTime() - studiedDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Fallback default systems if CMS fails
  const getDefaultSystems = () => [
    {
      name: "General Surgery",
      icon: Scissors,
      description: "Abdominal surgery, appendectomy, hernia repair, gallbladder surgery",
      progress: getSystemProgress(user.id, "General Surgery"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 156,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "General Surgery")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["Surgery", "Emergency", "Abdomen"]
    },
    {
      name: "Orthopedic Surgery", 
      icon: Plus,
      description: "Fractures, joint replacement, spine surgery, sports injuries",
      progress: getSystemProgress(user.id, "Orthopedic Surgery"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 142,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "Orthopedic Surgery")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["Orthopedics", "Trauma", "Bones"]
    },
    {
      name: "Trauma Surgery",
      icon: Plus,
      description: "Emergency surgery, polytrauma, damage control surgery",
      progress: getSystemProgress(user.id, "Trauma Surgery"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 134,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "Trauma Surgery")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["Trauma", "Emergency"]
    }
  ];

  const handleStartPractice = (systemName?: string) => {
    const config = sessionConfigs[sessionLength];
    const system = systemName || selectedSystem || "General Surgery";
    
    onStartPracticeSession({
      system,
      mcqCount: config.questionCount,
      includeWrongMCQs: false,
      sessionType: 'new'
    });
  };

  const handleSystemSelect = (systemName: string) => {
    setSelectedSystem(systemName);
    setShowSessionConfig(true);
  };

  const handleQuickActions = (action: string) => {
    switch (action) {
      case 'bookmarks':
        onNavigate('bookmark-review');
        break;
      case 'wrong-answers':
        setComingSoonFeature('Wrong Answers Review');
        setShowComingSoonModal(true);
        break;
      case 'analytics':
        setComingSoonFeature('Analytics Dashboard');
        setShowComingSoonModal(true);
        break;
      case 'settings':
        setShowSettingsModal(true);
        break;
      case 'logout':
        onLogout();
        break;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'High Yield': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium Yield': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low Yield': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleMockExamClick = async (examName: string, examSet?: MockExamSet) => {
    const unlockStatus = isExamUnlocked(examName);
    
    if (!unlockStatus.unlocked) {
      return;
    }

    // Check mock exam question availability
    try {
      const availableQuestions = await getMockExamQuestionsBySet(user.specialty, examName, false);
      
      if (availableQuestions.length === 0) {
        // ✅ ENHANCED: Better error message with actionable steps
        const allQuestionsIncludingPending = await getMockExamQuestionsBySet(user.specialty, examName, true);
        
        if (allQuestionsIncludingPending.length > 0) {
          alert(`${examName} has ${allQuestionsIncludingPending.length} questions imported but none are approved yet. Please contact administrator to approve questions for this mock exam.`);
        } else {
          alert(`No questions available for ${examName}. Please contact administrator to import questions for this mock exam.`);
        }
        return;
      }

      // Use examSet data if available, otherwise fall back to mapping
      const examConfig = examSet ? {
        duration: examSet.timeLimit,
        questionCount: Math.min(examSet.totalQuestions, availableQuestions.length), // Don't exceed available questions
        passingScore: examSet.passingCriteria,
        examTitle: `${examSet.name} - FCPS Surgery Examination`
      } : {
        // Fallback mapping for backward compatibility
        duration: examName === 'Previous Years' ? 200 : 180,
        questionCount: Math.min(examName === 'Previous Years' ? 200 : 150, availableQuestions.length),
        passingScore: 60,
        examTitle: `${examName} - FCPS Surgery Examination`
      };

      // ✅ ENHANCED: Use correct type mapping for mock exam storage
      const typeMapping = {
        'Mock 1': 'mock-1',
        'Mock 2': 'mock-2', 
        'Mock 3': 'mock-3',
        'Previous Years': 'previous-years'
      };

      const mockExamConfig: MockExamConfig = {
        type: (typeMapping[examName as keyof typeof typeMapping] || examName.toLowerCase().replace(' ', '-')) as any,
        duration: examConfig.duration,
        questionCount: examConfig.questionCount,
        specialty: user.specialty,
        distribution: 'balanced-mix',
        difficulty: 'mixed',
        systems: ['All Systems'],
        includeBookmarked: examName !== 'Mock 1',
        simulateRealExam: true,
        unlockRequirement: 0,
        totalQuestions: examConfig.questionCount,
        passingScore: examConfig.passingScore,
        examType: typeMapping[examName as keyof typeof typeMapping] || examName.toLowerCase().replace(' ', '-'),
        examTitle: examConfig.examTitle,
        instructions: "Please read all questions carefully and select the best answer. This is a timed examination.",
        allowReview: true,
        showResults: true
      };

      onStartMockExam(mockExamConfig);
    } catch (error) {
      console.error('❌ Error starting mock exam:', error);
      alert('Error starting mock exam. Please try again.');
    }
  };

  // ✅ FIXED: Safe name extraction with proper null checking
  const getDisplayName = (user: UserData): string => {
    if (!user || !user.name) {
      return 'Doctor';
    }
    
    // Handle both fullName and name fields
    const fullName = user.fullName || user.name;
    
    if (typeof fullName !== 'string') {
      return 'Doctor';
    }
    
    // Safely split the name and get the last part (surname) or first part if only one name
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length === 0) {
      return 'Doctor';
    }
    
    if (nameParts.length === 1) {
      return nameParts[0];
    }
    
    // Return the last name (surname) if multiple parts exist
    return nameParts[nameParts.length - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                {/* ✅ FIXED: Safe name display with proper null checking */}
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, Dr. {getDisplayName(user)}!</h1>
                <p className="text-gray-600">Surgery Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Scissors className="w-4 h-4 mr-2" />
                FCPS Surgery
              </Badge>

              {/* ✅ NEW: Subscription badge */}
              {user.subscriptionExpiryDate && (
                <Badge variant="outline" className="ml-2 text-gray-600 border-gray-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {getDaysUntilExpiry(user)} days left
                </Badge>
              )}
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleQuickActions('settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleQuickActions('logout')}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview - 🔒 REAL PROGRESS DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Accuracy</p>
                  <p className="text-3xl font-bold text-blue-600">{realUserAccuracy}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Questions Solved</p>
                  <p className="text-3xl font-bold text-blue-600">{realQuestionsCount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                  <p className="text-3xl font-bold text-blue-600">{realStudyStreak} {realStudyStreak === 1 ? 'day' : 'days'}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rank</p>
                  <p className="text-3xl font-bold text-blue-600">#89</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Practice Section - Only show if active session exists */}
        {showContinueSection && sessionSummary?.hasSession && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">Continue Your Practice</h2>
                    <button
                      onClick={handleClearSession}
                      className="text-blue-200 hover:text-white text-sm opacity-75 hover:opacity-100 transition-opacity"
                      title="Clear session and start fresh"
                    >
                      ✕ Clear
                    </button>
                  </div>
                  <p className="text-blue-100 mb-4">
                    Last session: {sessionSummary.system} • {sessionSummary.progress} • {sessionSummary.timeSpent}
                  </p>
                  <div className="w-full bg-blue-400/30 rounded-full h-2 mb-4">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${sessionSummary.progress ? 
                          parseInt(sessionSummary.progress.match(/\((\d+)%\)/)?.[1] || '0') : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-blue-200 text-sm">
                    <span>{sessionSummary.questionsRemaining} questions remaining</span>
                    <span>Tap continue to resume exactly where you left off</span>
                  </div>
                </div>
                <div className="ml-8">
                  <Button
                    onClick={onContinuePractice}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 shadow-lg"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continue Practice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock Exams Section - ✅ DYNAMIC CMS DATA */}
        <Card className="border-blue-200 bg-white mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800 flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Mock Examinations - FCPS Surgery
            </CardTitle>
            <CardDescription>
              Progressive mock exams that unlock based on your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockExamSets.length > 0 ? (
                mockExamSets.map((examSet, _) => {
                  const unlockStatus = isExamUnlocked(examSet.name);
                  const progress = getMockExamProgress(getExamTypeFromName(examSet.name));
                  
                  return (
                    <Card 
                      key={examSet.id}
                      className={`transition-all duration-200 ${
                        unlockStatus.unlocked 
                          ? 'hover:shadow-lg cursor-pointer border-blue-200' 
                          : 'opacity-60 border-gray-200'
                      }`}
                      onClick={() => handleMockExamClick(examSet.name, examSet)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-blue-600" />
                          </div>
                          {getExamStatusBadge(examSet.name)}
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{examSet.name}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Questions:</span>
                            <span className="font-medium">{examSet.totalQuestions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-medium">{examSet.timeLimit} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pass Mark:</span>
                            <span className="font-medium">{examSet.passingCriteria}%</span>
                          </div>
                        </div>
                        
                        {progress?.bestScore !== undefined && progress.bestScore > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Best Score:</span>
                              <span className="font-bold text-blue-600">{progress.bestScore}%</span>
                            </div>
                          </div>
                        )}
                        
                        {!unlockStatus.unlocked && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">{unlockStatus.reason}</p>
                            {getUnlockProgressBar(examSet.name)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                // Fallback to hardcoded mock exams if no CMS data
                ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'].map((examName, _index) => {
                  const unlockStatus = isExamUnlocked(examName);
                  const progress = getMockExamProgress(getExamTypeFromName(examName));
                  
                  const examDetails = {
                    'Mock 1': { questions: 100, duration: 120, passing: 60 },
                    'Mock 2': { questions: 125, duration: 150, passing: 70 },
                    'Mock 3': { questions: 150, duration: 180, passing: 80 },
                    'Previous Years': { questions: 200, duration: 200, passing: 70 }
                  };
                  
                  const details = examDetails[examName as keyof typeof examDetails];
                  
                  return (
                    <Card 
                      key={examName}
                      className={`transition-all duration-200 ${
                        unlockStatus.unlocked 
                          ? 'hover:shadow-lg cursor-pointer border-blue-200' 
                          : 'opacity-60 border-gray-200'
                      }`}
                      onClick={() => handleMockExamClick(examName)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-blue-600" />
                          </div>
                          {getExamStatusBadge(examName)}
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{examName}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Questions:</span>
                            <span className="font-medium">{details.questions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-medium">{details.duration} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pass Mark:</span>
                            <span className="font-medium">{details.passing}%</span>
                          </div>
                        </div>
                        
                        {progress?.bestScore !== undefined && progress.bestScore > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Best Score:</span>
                              <span className="font-bold text-blue-600">{progress.bestScore}%</span>
                            </div>
                          </div>
                        )}
                        
                        {!unlockStatus.unlocked && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">{unlockStatus.reason}</p>
                            {getUnlockProgressBar(examName)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Systems Grid - ✅ DYNAMIC CMS DATA */}
        <Card className="border-blue-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800 flex items-center">
              <BookOpen className="w-6 h-6 mr-2" />
              Surgery Practice Systems {isLoadingSystems && <div className="ml-3 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
            </CardTitle>
            <CardDescription>
              Select a surgical system to start focused practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicalSystems.map((system, _) => {
                const IconComponent = system.icon;

                // Get completion stats for this system
                const completionStats = getSystemCompletionStats(user.id, user.specialty, system.name, system.totalQuestions);
                const isCompleted = completionStats.isCompleted;
                const remainingQuestions = getRemainingQuestionsCount(user.id, user.specialty, system.name, system.totalQuestions);
                
                return (
                  <Card 
                  key={system.name}
                  className={`border-blue-100 bg-white/80 backdrop-blur-sm transition-all group ${
                    isCompleted ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer hover:border-blue-300'
                  }`}
                  onClick={() => !isCompleted && handleSystemSelect(system.name)}
                >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <Badge className={getDifficultyColor(system.difficulty)}>
                          {system.difficulty}
                        </Badge>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2">{system.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{system.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {isCompleted ? '100%' : `${completionStats.completionPercentage}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isCompleted ? 'bg-green-500' : getProgressColor(completionStats.completionPercentage)
                            }`}
                            style={{ width: `${isCompleted ? 100 : completionStats.completionPercentage}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>
                            {isCompleted 
                              ? `✅ ${system.totalQuestions} questions completed` 
                              : `${completionStats.answeredQuestions}/${system.totalQuestions} questions`
                            }
                            {system.isCustom && (
                              <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                Custom
                              </span>
                            )}
                          </span>
                          <span>
                            {isCompleted ? 'Completed' : `${remainingQuestions} remaining`}
                          </span>
                        </div>
                      </div>  
                      
                      <div className="flex flex-wrap gap-1 mt-4">
                        {system.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session Configuration Modal */}
        {showSessionConfig && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Configure Practice Session</CardTitle>
                    <CardDescription>Choose your session length for {selectedSystem}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSessionConfig(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {(Object.keys(sessionConfigs) as Array<keyof typeof sessionConfigs>).map((configKey) => {
                    const config = sessionConfigs[configKey];
                    const IconComponent = config.icon;
                    
                    return (
                      <Card
                        key={configKey}
                        className={`cursor-pointer transition-all duration-200 ${
                          sessionLength === configKey
                            ? 'ring-2 ring-blue-500 border-blue-500'
                            : 'hover:border-blue-300'
                        }`}
                        onClick={() => setSessionLength(configKey)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <IconComponent className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{config.name}</h3>
                              <p className="text-sm text-gray-600">{config.estimatedTime}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Questions: {config.questionCount}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleStartPractice(selectedSystem!)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice Session
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSessionConfig(false)}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-2 border-blue-200 hover:bg-blue-50"
            onClick={() => handleQuickActions('bookmarks')}
          >
            <Bookmark className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Bookmarks</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-2 border-blue-200 hover:bg-blue-50"
            onClick={() => handleQuickActions('wrong-answers')}
          >
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Wrong Answers</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-2 border-blue-200 hover:bg-blue-50"
            onClick={() => handleQuickActions('settings')}
          >
            <Settings className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Settings</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-2 border-blue-200 hover:bg-blue-50"
            onClick={() => handleQuickActions('analytics')}
          >
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">User Settings</CardTitle>
                  <CardDescription>Manage your profile and password</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSettingsModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SettingsModalContent 
                user={user} 
                onClose={() => setShowSettingsModal(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-center">Coming Soon!</CardTitle>
                  <CardDescription className="text-center">
                    We're working hard to bring you this feature
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowComingSoonModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {comingSoonFeature}
              </h3>
              <p className="text-gray-600 mb-6">
                This feature is currently under development and will be available soon. 
                Stay tuned for updates!
              </p>
              <Button 
                onClick={() => setShowComingSoonModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Got it!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Settings Modal Content Component
interface SettingsModalContentProps {
  user: UserData;
  onClose: () => void;
}

function SettingsModalContent({ user, onClose }: SettingsModalContentProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate form
      if (!profileForm.name.trim()) {
        throw new Error('Name is required');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user data in localStorage
      const users = JSON.parse(localStorage.getItem('all_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...profileForm };
        localStorage.setItem('all_users', JSON.stringify(users));
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error('All password fields are required');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (passwordForm.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Get current user data
      const users = JSON.parse(localStorage.getItem('all_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const currentUser = users[userIndex];

      // Verify current password
      let isCurrentPasswordValid = false;
      if (currentUser.passwordSalt && currentUser.password) {
        // New hashed password system
        isCurrentPasswordValid = await passwordService.verifyPassword(passwordForm.currentPassword, currentUser.password, currentUser.passwordSalt);
      } else if (currentUser.password) {
        // Legacy plain text password
        isCurrentPasswordValid = passwordForm.currentPassword === currentUser.password;
      }

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash the new password
      const { hash, salt } = await passwordService.hashPassword(passwordForm.newPassword);

      // Update user with hashed password
      users[userIndex] = {
        ...currentUser,
        password: hash,
        passwordSalt: salt
      };

      localStorage.setItem('all_users', JSON.stringify(users));

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('profile')}
          className="flex-1"
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </Button>
        <Button
          variant={activeTab === 'password' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('password')}
          className="flex-1"
        >
          <Key className="w-4 h-4 mr-2" />
          Password
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>





          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}