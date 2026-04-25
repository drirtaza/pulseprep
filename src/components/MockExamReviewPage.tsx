import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, CheckCircle, XCircle, 
  AlertCircle, BookOpen, Home, BarChart3, ArrowLeft
} from 'lucide-react';
import { UserData, MockExamResults } from '../types';

interface MockExamReviewPageProps {
  user: UserData;
  results: MockExamResults;
  onNavigate: (page: 'home' | 'dashboard' | 'mock-exam-results') => void;
}

// FIXED: Define ReviewQuestion interface for proper typing
interface ReviewQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  explanation: string;
  system: string;
  difficulty: string;
  isCorrect: boolean;
}

export default function MockExamReviewPage({ user, results, onNavigate }: MockExamReviewPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);

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

  // ✅ FIXED: Use REAL questions from mock exam results instead of generating fake ones
  const questions: ReviewQuestion[] = (() => {
    // Check if results has the questions array (from MCQInterface)
    if (results.questions && Array.isArray(results.questions)) {
      return results.questions.map((q, index) => ({
        id: index,
        question: q.question || 'Question text not available',
        options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        userAnswer: typeof q.selectedAnswer === 'number' ? q.selectedAnswer : -1,
        explanation: q.explanation || 'No explanation available',
        system: q.system || 'General',
        difficulty: q.difficulty || 'Medium',
        isCorrect: q.isCorrect || false
      }));
    }
    
    // Fallback: Use answers array if questions array not available
    if (results.answers && Array.isArray(results.answers)) {
      return results.answers.map((answer, index) => ({
        id: index,
        question: `Question ${index + 1} from ${results.examConfig?.examTitle || 'Mock Exam'}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
        correctAnswer: 0, // We don't have this info in answers array
        userAnswer: answer.selectedOptionId ? parseInt(answer.selectedOptionId) : -1,
        explanation: 'Detailed explanation not available for this question.',
        system: 'General',
        difficulty: 'Medium',
        isCorrect: answer.isCorrect
      }));
    }
    
    // Last resort fallback - show error message instead of fake questions
    return [];
  })();

  // ✅ FIXED: Handle case where no questions are available
  if (questions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${theme.primary}-50 to-${theme.secondary}-50 p-4 md:p-6 flex items-center justify-center`}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">
            The exam questions are not available for review. This might be due to a technical issue.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate('mock-exam-results')}
              className={`bg-${theme.primary}-500 text-white px-6 py-3 rounded-lg hover:bg-${theme.primary}-600 transition-colors font-medium flex items-center`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Add proper type assertion for currentQuestion
  const currentQuestion = questions[currentQuestionIndex] as ReviewQuestion;
  const isCorrect = currentQuestion.userAnswer === currentQuestion.correctAnswer;
  const isAnswered = currentQuestion.userAnswer !== -1;

  const getAnswerIcon = () => {
    if (!isAnswered) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return isCorrect ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getAnswerBadge = () => {
    if (!isAnswered) return { text: 'Not Answered', class: 'bg-yellow-100 text-yellow-800' };
    return isCorrect ? 
      { text: 'Correct', class: 'bg-green-100 text-green-800' } : 
      { text: 'Incorrect', class: 'bg-red-100 text-red-800' };
  };

  const answerBadge = getAnswerBadge();

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getOptionClass = (optionIndex: number) => {
    const baseClass = "p-4 border-2 rounded-lg transition-colors cursor-default";
    
    if (optionIndex === currentQuestion.correctAnswer) {
      return `${baseClass} border-green-500 bg-green-50 text-green-800`;
    }
    
    if (optionIndex === currentQuestion.userAnswer && !isCorrect) {
      return `${baseClass} border-red-500 bg-red-50 text-red-800`;
    }
    
    return `${baseClass} border-gray-200 bg-gray-50 text-gray-700`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${theme.primary}-50 to-${theme.secondary}-50 p-4 md:p-6`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white p-6 rounded-xl mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Answer Review
            </h1>
            <p className="opacity-90">
              {/* FIXED: Add fallback for missing examName property */}
              {results.examConfig?.examTitle || 'Mock Exam'} • Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Overall Score</div>
            <div className="text-2xl font-bold">
              {results.percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `bg-${theme.primary}-100 text-${theme.primary}-600 hover:bg-${theme.primary}-200`
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === questions.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `bg-${theme.primary}-100 text-${theme.primary}-600 hover:bg-${theme.primary}-200`
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${answerBadge.class}`}>
              {answerBadge.text}
            </div>
            {getAnswerIcon()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-${theme.primary}-500 transition-all duration-300`}
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Content */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Question and Options */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Question {currentQuestionIndex + 1}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{currentQuestion.system}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <div className="space-y-3">
              {/* FIXED: Add explicit parameter types */}
              {currentQuestion.options.map((option: string, index: number) => (
                <div key={index} className={getOptionClass(index)}>
                  <div className="flex items-center">
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                    {index === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-4 h-4 ml-auto text-green-600" />
                    )}
                    {index === currentQuestion.userAnswer && !isCorrect && (
                      <XCircle className="w-4 h-4 ml-auto text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Info and Explanation */}
        <div className="space-y-6">
          {/* Question Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className={`w-4 h-4 mr-2 text-${theme.primary}-500`} />
              Question Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Answer:</span>
                <span className="font-medium">
                  {isAnswered ? String.fromCharCode(65 + currentQuestion.userAnswer) : 'Not Answered'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Correct Answer:</span>
                <span className="font-medium text-green-600">
                  {String.fromCharCode(65 + currentQuestion.correctAnswer)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">System:</span>
                <span className="font-medium">{currentQuestion.system}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty:</span>
                <span className="font-medium">{currentQuestion.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className={`w-4 h-4 mr-2 text-${theme.primary}-500`} />
                Explanation
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => onNavigate('mock-exam-results')}
          className={`bg-${theme.primary}-500 text-white px-6 py-3 rounded-lg hover:bg-${theme.primary}-600 transition-colors font-medium flex items-center`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </button>
        
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center"
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </button>
        
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium flex items-center"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {showExplanation ? 'Hide' : 'Show'} Explanations
        </button>
      </div>
    </div>
  );
}