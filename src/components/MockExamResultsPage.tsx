import { useEffect } from 'react';
import { 
  BarChart3, Target, TrendingUp, 
  Eye, Home, RotateCcw, ArrowRight, Trophy
} from 'lucide-react';
import { UserData, MockExamResults } from '../types';
// ✅ ADD this import at the top with other imports
import { saveMockExamResults } from '../utils/practiceProgressUtils';

interface MockExamResultsPageProps {
  user: UserData;
  results: MockExamResults;
  onNavigate: (page: 'home' | 'dashboard' | 'mock-exam-review') => void;
  onRetakeExam: () => void;
}

export default function MockExamResultsPage({ user, results, onNavigate, onRetakeExam }: MockExamResultsPageProps) {
  // ✅ ADD this useEffect right after the component declaration
  useEffect(() => {
    // Save mock exam results when component mounts
    if (results && user.id) {
      console.log('💾 Auto-saving mock exam results on results page load');
      saveMockExamResults(user.id, results);
    }
  }, [results, user.id, user.specialty]);

  const getSpecialtyTheme = () => {
    switch (user.specialty) {
      case 'medicine':
        return {
          primary: 'emerald',
          secondary: 'green',
          gradient: 'from-emerald-500 to-green-600'
        };
      case 'surgery':
        return {
          primary: 'blue',
          secondary: 'indigo',
          gradient: 'from-blue-500 to-indigo-600'
        };
      case 'gynae-obs':
        return {
          primary: 'rose',
          secondary: 'pink',
          gradient: 'from-rose-500 to-pink-600'
        };
      default:
        return {
          primary: 'slate',
          secondary: 'gray',
          gradient: 'from-slate-500 to-gray-600'
        };
    }
  };

  const theme = getSpecialtyTheme();
  
  // Safe extraction of values with fallbacks to avoid undefined errors
  const examPercentage = results.percentage ?? results.accuracy ?? 0;
  const totalQuestions = results.totalQuestions ?? 0;
  const correctAnswers = results.correctAnswers ?? 0;
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  // Safe time calculations with fallbacks
  const totalTimeMs = results.totalTime ?? results.timeSpent ?? 0;
  const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSeconds / totalQuestions) : 0;
  
  const getGradeInfo = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGradeInfo(examPercentage);
  const isPassed = examPercentage >= 70;

  // Safe exam name extraction with fallback
  const examName = results.examConfig?.examTitle ?? 'Mock Exam';
  const completedAt = results.completedAt ?? new Date().toISOString();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${theme.primary}-50 to-${theme.secondary}-50 p-4 md:p-6`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white p-6 rounded-xl mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Mock Exam Results
            </h1>
            <p className="opacity-90">
              {examName} • {user.specialty.replace('-', ' & ').toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Completed on</div>
            <div className="text-lg font-medium">
              {new Date(completedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Results Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full ${gradeInfo.bg} flex items-center justify-center mx-auto mb-4`}>
              {isPassed ? (
                <Trophy className={`w-12 h-12 ${gradeInfo.color}`} />
              ) : (
                <Target className={`w-12 h-12 ${gradeInfo.color}`} />
              )}
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {examPercentage.toFixed(1)}%
            </div>
            <div className={`text-2xl font-bold ${gradeInfo.color} mb-4`}>
              Grade {gradeInfo.grade}
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isPassed 
                ? `bg-green-100 text-green-800` 
                : `bg-red-100 text-red-800`
            }`}>
              {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className={`w-5 h-5 mr-2 text-${theme.primary}-500`} />
            Performance Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions Answered</span>
              <span className="font-semibold">{totalQuestions}/{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Correct Answers</span>
              <span className="font-semibold text-green-600">{correctAnswers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Incorrect Answers</span>
              <span className="font-semibold text-red-600">{incorrectAnswers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time Taken</span>
              <span className="font-semibold">
                {Math.floor(totalTimeSeconds / 60)}m {totalTimeSeconds % 60}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Time/Question</span>
              <span className="font-semibold">
                {avgTimePerQuestion}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className={`w-5 h-5 mr-2 text-${theme.primary}-500`} />
          Recommendations
        </h3>
        <div className="space-y-3">
          {isPassed ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>Excellent work!</strong> You've passed this mock exam. Consider attempting more advanced practice questions or focus on areas where you scored below 80%.
                </p>
              </div>
              {results.systemWiseResults && results.systemWiseResults.some(stats => (stats.percentage ?? 0) < 80) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>Areas for improvement:</strong> Consider reviewing systems where you scored below 80% for even better performance.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  <strong>Keep practicing!</strong> Focus on the systems where you scored lowest and review the explanations for incorrect answers.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  <strong>Study suggestion:</strong> Spend more time on practice questions for your weak areas before retaking this exam.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('mock-exam-review')}
          className={`bg-${theme.primary}-500 text-white px-6 py-3 rounded-lg hover:bg-${theme.primary}-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center`}
        >
          <Eye className="w-4 h-4 mr-2" />
          Review Answers
        </button>
        
        <button
          onClick={onRetakeExam}
          className={`bg-white text-${theme.primary}-600 border-2 border-${theme.primary}-200 px-6 py-3 rounded-lg hover:bg-${theme.primary}-50 transition-colors font-medium flex items-center justify-center`}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Exam
        </button>
        
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </button>
        
        <button
          onClick={() => onNavigate('home')}
          className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Browse More
        </button>
      </div>
    </div>
  );
}