import { useState } from 'react';
import { UserData, MockExamConfig } from '../types';
import { 
  Clock, 
  Target, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  ArrowLeft,
  Award,
  Users,
  BarChart3,
  Shield,
  Monitor,
  Volume2,
  Wifi
} from 'lucide-react';


interface MockExamInstructionsPageProps {
  user: UserData;
  mockExamConfig: MockExamConfig;
  onNavigate: (page: string) => void;
  onStartMockExam: (config: MockExamConfig) => void;
}

export default function MockExamInstructionsPage({ 
  user, 
  mockExamConfig, 
  onNavigate, 
  onStartMockExam 
}: MockExamInstructionsPageProps) {
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [systemCheckComplete, setSystemCheckComplete] = useState(false);

  // Get specialty colors
  const getSpecialtyColors = () => {
    switch (user.specialty) {
      case 'medicine':
        return {
          primary: 'emerald-500',
          primaryDark: 'emerald-600',
          primaryLight: 'emerald-50',
          gradient: 'from-emerald-500 to-teal-600'
        };
      case 'surgery':
        return {
          primary: 'blue-500',
          primaryDark: 'blue-600',
          primaryLight: 'blue-50',
          gradient: 'from-blue-500 to-indigo-600'
        };
      case 'gynae-obs':
        return {
          primary: 'rose-500',
          primaryDark: 'rose-600',
          primaryLight: 'rose-50',
          gradient: 'from-rose-500 to-pink-600'
        };
      default:
        return {
          primary: 'gray-500',
          primaryDark: 'gray-600',
          primaryLight: 'gray-50',
          gradient: 'from-gray-500 to-slate-600'
        };
    }
  };

  const colors = getSpecialtyColors();

  const getExamName = () => {
    switch (mockExamConfig.type) {
      case 'mock-1': return 'Foundation Mock Exam';
      case 'mock-2': return 'Intermediate Mock Exam';
      case 'mock-3': return 'Advanced Mock Exam';
      case 'mock-4': return 'Final Assessment';
      case 'previous-years': return 'Previous Years Papers';
      default: return 'Mock Examination';
    }
  };

  const getSpecialtyName = () => {
    switch (user.specialty) {
      case 'medicine': return 'FCPS Medicine';
      case 'surgery': return 'FCPS Surgery';
      case 'gynae-obs': return 'FCPS Gynae & OBS';
      default: return 'FCPS';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  const handleStartExam = () => {
    if (!hasReadInstructions) {
      alert('Please read and acknowledge the exam instructions before proceeding.');
      return;
    }
    onStartMockExam(mockExamConfig);
  };

  const performSystemCheck = () => {
    // Mock system check - in real app this would check actual system
    setTimeout(() => {
      setSystemCheckComplete(true);
    }, 1500);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${colors.primaryLight} to-white p-4 md:p-6`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} text-white p-6 rounded-xl mb-8 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('mock-exam')}
              className="text-white/80 hover:text-white transition-colors touch-target"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Exam Instructions</h1>
              <p className="opacity-90">{getExamName()} • {getSpecialtyName()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Time Limit</div>
            <div className="text-2xl font-bold">{formatTime(mockExamConfig.duration)}</div>
          </div>
        </div>
      </div>

      {/* Exam Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Award className={`w-5 h-5 mr-2 text-${colors.primary}`} />
          Examination Overview
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className={`w-8 h-8 text-${colors.primary} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-gray-900">{formatTime(mockExamConfig.duration)}</div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Target className={`w-8 h-8 text-${colors.primary} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-gray-900">{mockExamConfig.questionCount}</div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <BarChart3 className={`w-8 h-8 text-${colors.primary} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-gray-900 capitalize">{mockExamConfig.difficulty}</div>
            <div className="text-sm text-gray-600">Difficulty</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className={`w-8 h-8 text-${colors.primary} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-gray-900 capitalize">{mockExamConfig.distribution.replace('-', ' ')}</div>
            <div className="text-sm text-gray-600">Distribution</div>
          </div>
        </div>
      </div>

      {/* System Check */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Monitor className={`w-5 h-5 mr-2 text-${colors.primary}`} />
          System Check
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-semibold text-green-700">Internet Connection</div>
              <div className="text-sm text-green-600">Stable</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-semibold text-green-700">Browser Compatibility</div>
              <div className="text-sm text-green-600">Supported</div>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            systemCheckComplete ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            {systemCheckComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Monitor className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <div className={`font-semibold ${systemCheckComplete ? 'text-green-700' : 'text-gray-700'}`}>
                System Performance
              </div>
              <div className={`text-sm ${systemCheckComplete ? 'text-green-600' : 'text-gray-600'}`}>
                {systemCheckComplete ? 'Optimal' : 'Checking...'}
              </div>
            </div>
          </div>
        </div>
        
        {!systemCheckComplete && (
          <button
            onClick={performSystemCheck}
            className={`bg-${colors.primary} text-white px-6 py-2 rounded-lg hover:bg-${colors.primaryDark} transition-colors font-medium touch-target`}
          >
            Run System Check
          </button>
        )}
      </div>

      {/* Exam Instructions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <BookOpen className={`w-5 h-5 mr-2 text-${colors.primary}`} />
          Examination Instructions
        </h3>
        
        <div className="space-y-6">
          {/* General Instructions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-500" />
              General Guidelines
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Read each question carefully before selecting your answer</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You have {formatTime(mockExamConfig.duration)} to complete {mockExamConfig.questionCount} questions</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Once you submit an answer, it cannot be changed</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can navigate between questions freely before submission</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use the bookmark feature to mark questions for review</span>
              </li>
            </ul>
          </div>

          {/* Time Management */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-500" />
              Time Management
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Average time per question: {Math.round(mockExamConfig.duration / mockExamConfig.questionCount * 10) / 10} minutes</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Timer will be visible at all times during the exam</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Exam will auto-submit when time expires</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>You can pause the exam if needed (time will still count)</span>
              </li>
            </ul>
          </div>

          {/* Technical Requirements */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-purple-500" />
              Technical Requirements
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <Monitor className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Ensure stable internet connection throughout the exam</span>
              </li>
              <li className="flex items-start space-x-2">
                <Monitor className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Do not refresh the browser or navigate away from the exam</span>
              </li>
              <li className="flex items-start space-x-2">
                <Monitor className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Close unnecessary applications to ensure optimal performance</span>
              </li>
              <li className="flex items-start space-x-2">
                <Monitor className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Have backup power source if using laptop/mobile device</span>
              </li>
            </ul>
          </div>

          {/* Exam Environment */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Volume2 className="w-4 h-4 mr-2 text-red-500" />
              Exam Environment
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Find a quiet, well-lit environment free from distractions</span>
              </li>
              <li className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Keep reference materials and calculator ready if needed</span>
              </li>
              <li className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Inform others not to disturb you during the exam period</span>
              </li>
              <li className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Keep water and snacks nearby for longer exams</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Acknowledgment */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Acknowledgment</h3>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasReadInstructions}
            onChange={(e) => setHasReadInstructions(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-700 leading-relaxed">
            I have read and understood all the examination instructions. I acknowledge that:
            <br />• I will complete this exam within the allocated time limit
            <br />• I understand that answers cannot be changed once submitted
            <br />• I will maintain academic integrity throughout the examination
            <br />• I am ready to begin the mock examination
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => onNavigate('mock-exam')}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium touch-target"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exam Selection
        </button>

        <button
          onClick={handleStartExam}
          disabled={!hasReadInstructions || !systemCheckComplete}
          className={`flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg touch-target ${
            hasReadInstructions && systemCheckComplete
              ? `bg-${colors.primary} text-white hover:bg-${colors.primaryDark} hover:shadow-xl`
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-6 h-6 mr-3" />
          Begin Examination
        </button>
      </div>

      {(!hasReadInstructions || !systemCheckComplete) && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            {!systemCheckComplete && 'Please complete the system check and '}
            {!hasReadInstructions && 'acknowledge the exam instructions'} to begin
          </p>
        </div>
      )}
    </div>
  );
}