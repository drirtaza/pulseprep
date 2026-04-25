import { useState } from 'react';
import { 
  Award, 
  Clock, 
  Target, 
  BookOpen, 
  Lock, 
  Play, 
  ArrowLeft,
  CheckCircle,
  BarChart3,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';


// Type definitions (Copy Exactly)
type PageType = 'home' | 'about' | 'contact' | 'login' | 'signup' | 'dashboard' | 'practice-session' | 'mcq-interface' | 'mock-exam' | 'mock-exam-instructions' | 'mock-exam-results' | 'mock-exam-review' | 'admin-login' | 'admin-dashboard';
type SpecialtyType = 'medicine' | 'surgery' | 'gynae-obs';

interface UserData {
  id: string;
  name: string;
  email: string;
  specialty: SpecialtyType;
  studyMode?: 'intensive' | 'regular' | 'flexible';
  registrationDate: string;
}

interface MockExamConfig {
  type: 'mock-1' | 'mock-2' | 'mock-3' | 'mock-4' | 'previous-years';
  duration: number;
  questionCount: number;
  specialty: SpecialtyType;
  distribution: 'specialty-focus' | 'balanced-mix' | 'cross-specialty' | 'custom';
  difficulty: 'progressive' | 'mixed' | 'advanced' | 'foundation';
  systems: string[];
  includeBookmarked: boolean;
  simulateRealExam: boolean;
  examYear?: string;
  unlockRequirement?: number;
}

// Props interface (Copy Exactly)
interface MockExamPageProps {
  user: UserData;
  onNavigate: (page: PageType) => void;
  onStartMockExam: (config: MockExamConfig) => void;
}

// Mock Exam Data (Copy Exactly)
const getAvailableMockExams = (specialty: SpecialtyType, userProgress: number) => {
  const baseExams = [
    {
      type: 'mock-1' as const,
      name: 'Foundation Mock Exam',
      description: 'Test your basic knowledge across all systems',
      duration: 180, // 3 hours
      questionCount: 200,
      difficulty: 'foundation' as const,
      distribution: 'balanced-mix' as const,
      unlockRequirement: 0,
      systems: ['All Systems'],
      includeBookmarked: false,
      simulateRealExam: true,
      difficultyLevel: 'Beginner',
      icon: Target,
      color: 'bg-green-500',
      estimatedScore: '60-75%',
      features: ['Basic concepts', 'Core knowledge', 'Foundation level']
    },
    {
      type: 'mock-2' as const,
      name: 'Intermediate Mock Exam', 
      description: 'Challenge yourself with moderate difficulty questions',
      duration: 180,
      questionCount: 200,
      difficulty: 'mixed' as const,
      distribution: 'specialty-focus' as const,
      unlockRequirement: 40,
      systems: ['All Systems'],
      includeBookmarked: true,
      simulateRealExam: true,
      difficultyLevel: 'Intermediate',
      icon: BarChart3,
      color: 'bg-blue-500',
      estimatedScore: '65-80%',
      features: ['Mixed difficulty', 'Clinical scenarios', 'Problem solving']
    },
    {
      type: 'mock-3' as const,
      name: 'Advanced Mock Exam',
      description: 'High-level questions simulating real exam conditions',
      duration: 240,
      questionCount: 250,
      difficulty: 'advanced' as const,
      distribution: 'cross-specialty' as const,
      unlockRequirement: 65,
      systems: ['All Systems'],
      includeBookmarked: true,
      simulateRealExam: true,
      difficultyLevel: 'Advanced',
      icon: Award,
      color: 'bg-purple-500',
      estimatedScore: '70-85%',
      features: ['Advanced concepts', 'Multi-system integration', 'Complex cases']
    },
    {
      type: 'mock-4' as const,
      name: 'Final Assessment',
      description: 'Comprehensive exam covering all areas at expert level',
      duration: 300,
      questionCount: 300,
      difficulty: 'progressive' as const,
      distribution: 'custom' as const,
      unlockRequirement: 80,
      systems: ['All Systems'],
      includeBookmarked: true,
      simulateRealExam: true,
      difficultyLevel: 'Expert',
      icon: Star,
      color: 'bg-gold-500',
      estimatedScore: '75-90%',
      features: ['Expert level', 'Comprehensive coverage', 'Exam simulation']
    },
    {
      type: 'previous-years' as const,
      name: 'Previous Years Papers',
      description: 'Actual questions from past FCPS examinations',
      duration: 240,
      questionCount: 200,
      difficulty: 'mixed' as const,
      distribution: 'specialty-focus' as const,
      unlockRequirement: 50,
      systems: ['All Systems'],
      includeBookmarked: false,
      simulateRealExam: true,
      difficultyLevel: 'Real Exam',
      icon: BookOpen,
      color: 'bg-red-500',
      estimatedScore: 'Variable',
      features: ['Actual past papers', 'Real exam format', 'Historical questions'],
      examYear: '2020-2024'
    }
  ];

  return baseExams.map(exam => ({
    ...exam,
    specialty,
    isUnlocked: userProgress >= exam.unlockRequirement,
    progressNeeded: Math.max(0, exam.unlockRequirement - userProgress)
  }));
};

// Component Structure (Copy Exactly)
export default function MockExamPage({ user, onNavigate, onStartMockExam }: MockExamPageProps) {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  
  // Calculate user's overall progress (mock implementation)
  const calculateUserProgress = () => {
    // This would be calculated from actual user data
    // For testing purposes, return a high value to unlock more exams
    const daysSinceRegistration = Math.floor(
      (Date.now() - new Date(user.registrationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Ensure at least Foundation Mock (Mock 1) is always available
    // For demo purposes, return at least 50% progress
    const baseProgress = Math.max(50, daysSinceRegistration * 10);
    return Math.min(90, baseProgress); // Mock progression up to 90%
  };

  const userProgress = calculateUserProgress();
  const availableExams = getAvailableMockExams(user.specialty, userProgress);

  // Debug logging
  console.log('👤 User data:', user);
  console.log('💳 Payment status:', (user as any).paymentStatus);
  console.log('📊 User progress:', userProgress);
  console.log('📋 Available exams:', availableExams.map(e => ({ name: e.name, isUnlocked: e.isUnlocked })));

  // Get specialty classes for consistent theming
  const getSpecialtyClasses = () => {
    switch (user.specialty) {
      case 'medicine':
        return {
          bgGradient: 'bg-gradient-to-br from-emerald-50 to-white',
          headerGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          primaryButton: 'bg-emerald-500 hover:bg-emerald-600',
          primaryText: 'text-emerald-500',
          primaryIcon: 'text-emerald-500'
        };
      case 'surgery':
        return {
          bgGradient: 'bg-gradient-to-br from-blue-50 to-white',
          headerGradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          primaryButton: 'bg-blue-500 hover:bg-blue-600',
          primaryText: 'text-blue-500',
          primaryIcon: 'text-blue-500'
        };
      case 'gynae-obs':
        return {
          bgGradient: 'bg-gradient-to-br from-rose-50 to-white',
          headerGradient: 'bg-gradient-to-r from-rose-500 to-pink-600',
          primaryButton: 'bg-rose-500 hover:bg-rose-600',
          primaryText: 'text-rose-500',
          primaryIcon: 'text-rose-500'
        };
      default:
        return {
          bgGradient: 'bg-gradient-to-br from-gray-50 to-white',
          headerGradient: 'bg-gradient-to-r from-gray-500 to-slate-600',
          primaryButton: 'bg-gray-500 hover:bg-gray-600',
          primaryText: 'text-gray-500',
          primaryIcon: 'text-gray-500'
        };
    }
  };

  const specialtyClasses = getSpecialtyClasses();

  const getSpecialtyName = () => {
    switch (user.specialty) {
      case 'medicine': return 'FCPS Medicine';
      case 'surgery': return 'FCPS Surgery';
      case 'gynae-obs': return 'FCPS Gynae & OBS';
      default: return 'FCPS';
    }
  };

  const handleStartExam = (exam: any) => {
    console.log('🚀 Start Exam button clicked for:', exam.name);
    console.log('🔓 Exam is unlocked:', exam.isUnlocked);
    
    if (!exam.isUnlocked) {
      console.log('❌ Exam is locked, cannot start');
      return;
    }

    const config: MockExamConfig = {
      type: exam.type,
      duration: exam.duration,
      questionCount: exam.questionCount,
      specialty: user.specialty,
      distribution: exam.distribution,
      difficulty: exam.difficulty,
      systems: exam.systems,
      includeBookmarked: exam.includeBookmarked,
      simulateRealExam: exam.simulateRealExam,
      examYear: exam.examYear,
      unlockRequirement: exam.unlockRequirement
    };

    console.log('📋 Mock exam config:', config);
    onStartMockExam(config);
  };

  return (
    <div className={`min-h-screen ${specialtyClasses.bgGradient} p-4 md:p-6`}>
      {/* Header */}
      <div className={`${specialtyClasses.headerGradient} text-white p-6 rounded-xl mb-8 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-white/80 hover:text-white transition-colors touch-target"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Mock Examinations</h1>
              <p className="opacity-90">{getSpecialtyName()} • Test Your Knowledge</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Your Progress</div>
            <div className="text-2xl font-bold">{userProgress}%</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className={`w-5 h-5 mr-2 ${specialtyClasses.primaryIcon}`} />
          Your Progress Overview
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${specialtyClasses.primaryText}`}>{userProgress}%</div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {availableExams.filter(exam => exam.isUnlocked).length}
            </div>
            <div className="text-sm text-gray-600">Unlocked Exams</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {availableExams.filter(exam => !exam.isUnlocked).length}
            </div>
            <div className="text-sm text-gray-600">Locked Exams</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${specialtyClasses.primaryText}`}>5</div>
            <div className="text-sm text-gray-600">Total Exams</div>
          </div>
        </div>
      </div>

      {/* Available Mock Exams */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Award className={`w-6 h-6 mr-2 ${specialtyClasses.primaryIcon}`} />
          Available Mock Examinations
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {availableExams.map((exam) => {
            const Icon = exam.icon;
            const isSelected = selectedExam === exam.type;
            
            return (
              <div 
                key={exam.type}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                  exam.isUnlocked
                    ? isSelected
                      ? user.specialty === 'medicine' ? 'border-emerald-500 shadow-xl' :
                        user.specialty === 'surgery' ? 'border-blue-500 shadow-xl' :
                        user.specialty === 'gynae-obs' ? 'border-rose-500 shadow-xl' :
                        'border-gray-500 shadow-xl'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                    : 'border-gray-200 opacity-60'
                }`}
                onClick={() => exam.isUnlocked && setSelectedExam(exam.type)}
              >
                <div className="p-6">
                  {/* Exam Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${exam.color} rounded-lg flex items-center justify-center ${!exam.isUnlocked ? 'opacity-50' : ''}`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{exam.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          exam.difficultyLevel === 'Beginner' ? 'bg-green-100 text-green-800' :
                          exam.difficultyLevel === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                          exam.difficultyLevel === 'Advanced' ? 'bg-purple-100 text-purple-800' :
                          exam.difficultyLevel === 'Expert' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.difficultyLevel}
                        </span>
                      </div>
                    </div>
                    {!exam.isUnlocked && <Lock className="text-gray-400" size={20} />}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 leading-relaxed">{exam.description}</p>

                  {/* Exam Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{exam.questionCount} questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{exam.estimatedScore}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{exam.distribution.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Features:</div>
                    <div className="flex flex-wrap gap-2">
                      {exam.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Unlock Requirement */}
                  {!exam.isUnlocked && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Lock className="text-gray-400" size={16} />
                        <span>Requires {exam.unlockRequirement}% overall progress to unlock</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Progress needed: {exam.progressNeeded}%
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartExam(exam);
                    }}
                    disabled={!exam.isUnlocked}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 touch-target ${
                      exam.isUnlocked
                        ? `${specialtyClasses.primaryButton} text-white hover:shadow-lg`
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {exam.isUnlocked ? (
                      <>
                        <Play className="w-4 h-4 mr-2 inline" />
                        Start Exam
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2 inline" />
                        Locked
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <CheckCircle className={`w-5 h-5 mr-2 ${specialtyClasses.primaryIcon}`} />
          Mock Exam Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Before Starting:</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Ensure stable internet connection</li>
              <li>• Find a quiet, distraction-free environment</li>
              <li>• Have scratch paper and calculator ready</li>
              <li>• Read all instructions carefully</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">During the Exam:</h4>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Manage your time wisely</li>
              <li>• Mark difficult questions for review</li>
              <li>• Don't spend too long on single questions</li>
              <li>• Review answers before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}