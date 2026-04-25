import { useState, useEffect } from 'react';
import { 
  Baby, 
  Play, 
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

interface GynaeDashboardProps {
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

export default function GynaeDashboard({ user, onNavigate, onStartPracticeSession, onContinuePractice, onStartMockExam, onLogout }: GynaeDashboardProps) {
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
          // Session found - no debug logging needed
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
      color: 'pink'
    },
    standard: {
      name: 'Standard Session',
      description: 'Balanced practice session',
      questionCount: 25,
      estimatedTime: '25-35 min',
      icon: BookOpen,
      color: 'pink'
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
    'Obstetrics': Baby,
    'Gynaecology': Plus,
    'High Risk Pregnancy': Activity,
    'Labour & Delivery': Target,
    'Family Planning': Plus,
    'Reproductive Endocrinology': Activity,
    'Gynae Oncology': Target,
    'Pediatric Gynae': Baby,
    'Maternal Medicine': Plus,
    'Fetal Medicine': Activity,
    'Infertility': Target,
    'Menopause': Plus,
    'Emergency Gynae': Activity,
    'Urogynaecology': Target,
    'Breast Disorders': Plus,
    'Contraception': Activity,
    'Sexual Health': Target,
    'Antenatal Care': Baby,
    'Postnatal Care': Plus,
    'Neonatology': Activity
  };

  // Mock Exam Progress Functions
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

  const getMockExamProgress = (examType: string): MockExamProgress | null => {
    if (!user?.id) return null;
    
    // Get from real progress system
    return getRealProgress(user.id, user.specialty, examType);
  };

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
      return <Badge variant="default" className="text-pink-700 bg-pink-100"><Star className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    
    if (progress?.attempts && progress.attempts > 0) {
      return <Badge variant="outline" className="text-pink-700 bg-pink-50">In Progress</Badge>;
    }
    
    return <Badge variant="outline" className="text-pink-700 bg-pink-50"><Unlock className="w-3 h-3 mr-1" />Available</Badge>;
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
            className="bg-pink-500 h-2 rounded-full transition-all duration-300"
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
      const sets = await getMockExamSets('gynae-obs');
      
      const approvedSets = sets.filter(set => set.status === 'approved' && set.isActive);
      
      setMockExamSets(approvedSets);
    } catch (error) {
      console.error('❌ Error loading mock exam sets:', error);
      setMockExamSets([]);
    }
  };

  const loadMedicalSystems = async () => {
    try {
      setIsLoadingSystems(true);
      
      // Get all medical systems for gynae-obs specialty with error handling
      let allSystems;
      try {
        allSystems = getMedicalSystems('gynae-obs');
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
            realQuestionCount = await getSystemQuestionCount(system.name, 'gynae-obs');
            if (typeof realQuestionCount !== 'number' || realQuestionCount < 0) {
              realQuestionCount = 0;
            }
          } catch (countError) {
            realQuestionCount = 0;
          }
          
          const systemData = {
            name: system.name || 'Unknown System',
            icon: systemIconMap[system.name] || Baby,
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
      'Obstetrics': 'Pregnancy care, antenatal screening, normal delivery, complications',
      'Gynaecology': 'Menstrual disorders, pelvic pain, gynae procedures, examinations',
      'High Risk Pregnancy': 'Maternal complications, fetal abnormalities, multiple pregnancy',
      'Labour & Delivery': 'Normal labor, operative delivery, complications, pain relief',
      'Family Planning': 'Contraception methods, sterilization, counseling, side effects',
      'Reproductive Endocrinology': 'Hormonal disorders, PCOS, puberty, menopause',
      'Gynae Oncology': 'Cervical cancer, ovarian cancer, endometrial cancer, screening',
      'Pediatric Gynae': 'Congenital anomalies, adolescent gynae, child protection',
      'Maternal Medicine': 'Medical disorders in pregnancy, diabetes, hypertension',
      'Fetal Medicine': 'Fetal abnormalities, intrauterine procedures, counseling',
      'Infertility': 'Investigation, treatment, ART, male factor, counseling',
      'Menopause': 'Hormonal changes, HRT, osteoporosis, cardiovascular health',
      'Emergency Gynae': 'Ectopic pregnancy, ovarian torsion, bleeding, infections',
      'Urogynaecology': 'Incontinence, prolapse, bladder disorders, pelvic floor',
      'Breast Disorders': 'Benign conditions, cancer screening, breastfeeding problems',
      'Contraception': 'Combined pill, IUD, implants, emergency contraception',
      'Sexual Health': 'STIs, sexual dysfunction, assault, counseling',
      'Antenatal Care': 'Routine screening, risk assessment, education, monitoring',
      'Postnatal Care': 'Recovery, breastfeeding, mental health, contraception',
      'Neonatology': 'Newborn care, feeding, jaundice, congenital conditions'
    };
    
    return descriptions[systemName] || 'Comprehensive gynae-obs system coverage';
  };

  const getSystemDifficulty = (systemName: string): string => {
    const highYield = ['Obstetrics', 'Gynaecology', 'High Risk Pregnancy', 'Labour & Delivery', 'Emergency Gynae', 'Antenatal Care', 'Postnatal Care'];
    const lowYield = ['Sexual Health', 'Breast Disorders'];
    
    if (highYield.includes(systemName)) return 'High Yield';
    if (lowYield.includes(systemName)) return 'Low Yield';
    return 'Medium Yield';
  };

  const getSystemTags = (systemName: string): string[] => {
    const tagMap: Record<string, string[]> = {
      'Obstetrics': ['Pregnancy', 'Delivery', 'Antenatal'],
      'Gynaecology': ['Gynae', 'Women\'s Health'],
      'High Risk Pregnancy': ['High Risk', 'Complications'],
      'Labour & Delivery': ['Labour', 'Delivery', 'Emergency'],
      'Family Planning': ['Contraception', 'Counseling'],
      'Reproductive Endocrinology': ['Hormones', 'Endocrinology'],
      'Gynae Oncology': ['Cancer', 'Oncology'],
      'Pediatric Gynae': ['Pediatric', 'Adolescent'],
      'Maternal Medicine': ['Medical Disorders', 'Pregnancy'],
      'Fetal Medicine': ['Fetal', 'Abnormalities'],
      'Infertility': ['Infertility', 'ART'],
      'Menopause': ['Menopause', 'HRT'],
      'Emergency Gynae': ['Emergency', 'Acute'],
      'Urogynaecology': ['Urogynae', 'Pelvic Floor'],
      'Breast Disorders': ['Breast', 'Screening'],
      'Contraception': ['Contraception', 'Family Planning'],
      'Sexual Health': ['Sexual Health', 'STI'],
      'Antenatal Care': ['Antenatal', 'Screening'],
      'Postnatal Care': ['Postnatal', 'Recovery'],
      'Neonatology': ['Newborn', 'Neonatal']
    };
    
    return tagMap[systemName] || ['Gynae-Obs'];
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
      name: "Obstetrics",
      icon: Baby,
      description: "Pregnancy care, antenatal screening, normal delivery, complications",
      progress: getSystemProgress(user.id, "Obstetrics"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 156,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "Obstetrics")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["Pregnancy", "Delivery", "Antenatal"]
    },
    {
      name: "Gynaecology", 
      icon: Plus,
      description: "Menstrual disorders, pelvic pain, gynae procedures, examinations",
      progress: getSystemProgress(user.id, "Gynaecology"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 142,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "Gynaecology")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["Gynae", "Women's Health"]
    },
    {
      name: "High Risk Pregnancy",
      icon: Activity,
      description: "Maternal complications, fetal abnormalities, multiple pregnancy",
      progress: getSystemProgress(user.id, "High Risk Pregnancy"), // 🔒 REAL PROGRESS DATA
      totalQuestions: 134,
      lastStudied: formatLastStudied(getSystemLastStudied(user.id, "High Risk Pregnancy")), // 🔒 REAL PROGRESS DATA
      difficulty: "High Yield",
      tags: ["High Risk", "Complications"]
    }
  ];

  const handleStartPractice = (systemName?: string) => {
    const config = sessionConfigs[sessionLength];
    const system = systemName || selectedSystem || "Obstetrics";
    
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
    if (progress >= 70) return 'bg-pink-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleMockExamClick = (examName: string, examSet?: MockExamSet) => {
    const unlockStatus = isExamUnlocked(examName);
    
    if (!unlockStatus.unlocked) {
      return;
    }

    // Check mock exam question availability before starting
    const availableQuestions = getMockExamQuestionsBySet(user.specialty, examName, false);
    
    if (availableQuestions.length === 0) {
      // ✅ ENHANCED: Better error message with actionable steps
      const allQuestionsIncludingPending = getMockExamQuestionsBySet(user.specialty, examName, true);
      
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
      examTitle: `${examSet.name} - FCPS Gynae & Obs Examination`
    } : {
      // Fallback mapping for backward compatibility
      duration: examName === 'Previous Years' ? 150 : 200,
      questionCount: Math.min(examName === 'Previous Years' ? 150 : 200, availableQuestions.length),
      passingScore: 60,
      examTitle: `${examName} - FCPS Gynae & Obs Examination`
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                {/* ✅ FIXED: Safe name display with proper null checking */}
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, Dr. {getDisplayName(user)}!</h1>
                <p className="text-gray-600">Gynaecology & Obstetrics Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                <Baby className="w-4 h-4 mr-2" />
                FCPS Gynae-Obs
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
          <Card className="border-pink-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Accuracy</p>
                  <p className="text-3xl font-bold text-pink-600">{realUserAccuracy}%</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Questions Solved</p>
                  <p className="text-3xl font-bold text-pink-600">{realQuestionsCount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                  <p className="text-3xl font-bold text-pink-600">{realStudyStreak} {realStudyStreak === 1 ? 'day' : 'days'}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rank</p>
                  <p className="text-3xl font-bold text-pink-600">#67</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Practice Section - Only show if active session exists */}
        {showContinueSection && sessionSummary?.hasSession && (
          <Card className="border-pink-200 bg-gradient-to-r from-pink-500 to-rose-600 text-white mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">Continue Your Practice</h2>
                    <button
                      onClick={handleClearSession}
                      className="text-pink-200 hover:text-white text-sm opacity-75 hover:opacity-100 transition-opacity"
                      title="Clear session and start fresh"
                    >
                      ✕ Clear
                    </button>
                  </div>
                  <p className="text-pink-100 mb-4">
                    Last session: {sessionSummary.system} • {sessionSummary.progress} • {sessionSummary.timeSpent}
                  </p>
                  <div className="w-full bg-pink-400/30 rounded-full h-2 mb-4">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${sessionSummary.progress ? 
                          parseInt(sessionSummary.progress.match(/\((\d+)%\)/)?.[1] || '0') : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-pink-200 text-sm">
                    <span>{sessionSummary.questionsRemaining} questions remaining</span>
                    <span>Tap continue to resume exactly where you left off</span>
                  </div>
                </div>
                <div className="ml-8">
                  <Button
                    onClick={onContinuePractice}
                    className="bg-white text-pink-600 hover:bg-pink-50 font-semibold px-8 py-3 shadow-lg"
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

        {/* Session Configuration Modal */}
        {showSessionConfig && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Configure Practice Session</CardTitle>
                    <CardDescription>
                      Choose your session length for {selectedSystem}
                    </CardDescription>
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
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(sessionConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = sessionLength === key;
                    
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all border-2 ${
                          isSelected 
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSessionLength(key as 'quick' | 'standard' | 'intensive' | 'marathon')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-pink-500' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{config.name}</h3>
                              <p className="text-sm text-gray-600">{config.estimatedTime}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{config.description}</p>
                          <p className="text-sm font-medium text-pink-700">{config.questionCount} questions</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSessionConfig(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      handleStartPractice(selectedSystem || undefined);
                      setShowSessionConfig(false);
                    }}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300"
            onClick={() => onNavigate('bookmark-review')}
          >
            <Bookmark className="w-6 h-6 text-pink-600" />
            <span className="text-sm font-medium">My Bookmarks</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300"
            onClick={() => handleQuickActions('wrong-answers')}
          >
            <X className="w-6 h-6 text-red-500" />
            <span className="text-sm font-medium">Wrong Answers</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300"
            onClick={() => handleQuickActions('analytics')}
          >
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Analytics</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300"
            onClick={() => handleQuickActions('settings')}
          >
            <Settings className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium">Settings</span>
          </Button>
        </div>

        {/* Medical Systems Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Medical Systems</h2>
            <p className="text-sm text-gray-600">{medicalSystems.length} systems available</p>
          </div>

          {isLoadingSystems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-pink-200 bg-white/80 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-full h-40 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicalSystems.map((system, index) => {
                const Icon = system.icon;
                
                // Get completion stats for this system
                const completionStats = getSystemCompletionStats(user.id, user.specialty, system.name, system.totalQuestions);
                const isCompleted = completionStats.isCompleted;
                const remainingQuestions = getRemainingQuestionsCount(user.id, user.specialty, system.name, system.totalQuestions);
                
                return (
                  <Card 
                    key={index}
                    className={`border-pink-200 bg-white/80 backdrop-blur-sm transition-all group ${
                      isCompleted ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'
                    }`}
                    onClick={() => !isCompleted && handleSystemSelect(system.name)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                            <Icon className="w-6 h-6 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-pink-700 transition-colors">
                              {system.name}
                            </h3>
                            <Badge className={`text-xs mt-1 ${getDifficultyColor(system.difficulty)}`}>
                              {system.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {system.description}
                      </p>
                      
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
                          </span>
                          <span>
                            {isCompleted ? 'Completed' : `${remainingQuestions} remaining`}
                          </span>
                        </div>    
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{system.totalQuestions} questions</span>
                          <span>Last: {system.lastStudied}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {system.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ✅ FIXED: Mock Exams Section - Using CMS Data */}
        <Card className="border-pink-200 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-pink-700">Mock Examinations</CardTitle>
                <CardDescription>Simulate real exam conditions with timed mock tests</CardDescription>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ FIXED: Use CMS Mock Exam Sets or fallback to hardcoded */}
              {mockExamSets.length > 0 ? (
                mockExamSets.map((examSet) => {
                  const { unlocked, reason } = isExamUnlocked(examSet.name);
                  const progress = getMockExamProgress(getExamTypeFromName(examSet.name));
                  
                  return (
                    <Card 
                      key={examSet.id} 
                      className={`relative border-2 transition-all duration-200 ${
                        unlocked 
                          ? 'border-pink-200 hover:border-pink-300 hover:shadow-lg cursor-pointer' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => unlocked && handleMockExamClick(examSet.name, examSet)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className={`text-xl font-semibold mb-2 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                              {examSet.name}
                            </h3>
                            <p className={`text-sm mb-3 ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                              {examSet.description || 'Comprehensive exam simulation'}
                            </p>
                            <div className={`flex items-center space-x-4 text-sm ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {Math.floor(examSet.timeLimit / 60)} hours {examSet.timeLimit % 60 > 0 ? `${examSet.timeLimit % 60} min` : ''}
                              </div>
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                {examSet.totalQuestions} questions
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getExamStatusBadge(examSet.name)}
                            {progress && progress.attempts > 0 && (
                              <div className="text-right text-xs text-gray-500">
                                <div>Best: {progress.bestScore}%</div>
                                <div>{progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!unlocked && reason && (
                          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">{reason}</p>
                            {getUnlockProgressBar(examSet.name)}
                          </div>
                        )}
                        
                        {unlocked && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Click to start exam
                            </div>
                            <Play className="w-5 h-5 text-pink-600" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                /* Fallback to hardcoded mock exams if CMS data is not available */
                [
                  { name: 'Mock 1', description: 'Foundation level questions', duration: '3 hours', questions: 150 },
                  { name: 'Mock 2', description: 'Intermediate level questions', duration: '3 hours', questions: 150 },
                  { name: 'Mock 3', description: 'Advanced level questions', duration: '3 hours', questions: 150 },
                  { name: 'Previous Years', description: 'Past exam questions', duration: '3.5 hours', questions: 200 }
                ].map((exam) => {
                  const { unlocked, reason } = isExamUnlocked(exam.name);
                  const progress = getMockExamProgress(getExamTypeFromName(exam.name));
                  
                  return (
                    <Card 
                      key={exam.name} 
                      className={`relative border-2 transition-all duration-200 ${
                        unlocked 
                          ? 'border-pink-200 hover:border-pink-300 hover:shadow-lg cursor-pointer' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => unlocked && handleMockExamClick(exam.name)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className={`text-xl font-semibold mb-2 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                              {exam.name}
                            </h3>
                            <p className={`text-sm mb-3 ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                              {exam.description}
                            </p>
                            <div className={`flex items-center space-x-4 text-sm ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {exam.duration}
                              </div>
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                {exam.questions} questions
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getExamStatusBadge(exam.name)}
                            {progress && progress.attempts > 0 && (
                              <div className="text-right text-xs text-gray-500">
                                <div>Best: {progress.bestScore}%</div>
                                <div>{progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!unlocked && reason && (
                          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">{reason}</p>
                            {getUnlockProgressBar(exam.name)}
                          </div>
                        )}
                        
                        {unlocked && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Click to start exam
                            </div>
                            <Play className="w-5 h-5 text-pink-600" />
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
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-pink-600" />
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
                className="w-full bg-pink-600 hover:bg-pink-700"
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