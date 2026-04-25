import { FCPSQuestion } from '../types';
import { SpecialtyType } from '../types';
import { getFCPSQuestions } from './cmsUtils';
import { getMockExamQuestionsBySet } from './mockExamUtils';

// Practice MCQ Loading - loads regular FCPS questions for practice sessions
export const loadPracticeQuestions = async (
  specialty: SpecialtyType, 
  system?: string, 
  count?: number,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<FCPSQuestion[]> => {
  try {
    console.log(`🎯 Loading practice questions for ${specialty}${system ? `/${system}` : ''}${difficulty ? ` (${difficulty})` : ''}`);
    
    const allQuestions = getFCPSQuestions();
    
    // Filter for practice questions only (approved regular FCPS questions)
    let practiceQuestions = allQuestions.filter(q => 
      q.specialty === specialty && 
      q.status === 'approved' &&
      (!system || q.system === system) &&
      (!difficulty || q.difficulty === difficulty)
    );
    
    console.log(`📚 Found ${practiceQuestions.length} practice questions`);
    
    // Shuffle questions for randomness
    const shuffled = [...practiceQuestions].sort(() => Math.random() - 0.5);
    
    // Return requested count or all available
    const result = count ? shuffled.slice(0, count) : shuffled;
    
    console.log(`✅ Returning ${result.length} practice questions`);
    return result;
  } catch (error) {
    console.error('❌ Error loading practice questions:', error);
    return [];
  }
};

// Mock Exam MCQ Loading - loads questions from specific mock exam sets
export const loadMockExamQuestions = async (
  specialty: SpecialtyType,
  mockExamSetId: string,
  shuffleQuestions: boolean = true
): Promise<FCPSQuestion[]> => {
  try {
    console.log(`🎯 Loading mock exam questions for ${specialty} - Mock Set: ${mockExamSetId}`);
    
    // Get questions specifically assigned to this mock exam set
    const mockQuestions = await getMockExamQuestionsBySet(specialty, mockExamSetId);
    
    console.log(`📚 Found ${mockQuestions.length} mock exam questions`);
    
    if (shuffleQuestions) {
      // Shuffle questions for randomness
      const shuffled = [...mockQuestions].sort(() => Math.random() - 0.5);
      console.log(`🔀 Shuffled mock exam questions`);
      return shuffled;
    }
    
    console.log(`✅ Returning ${mockQuestions.length} mock exam questions (original order)`);
    return mockQuestions;
  } catch (error) {
    console.error('❌ Error loading mock exam questions:', error);
    return [];
  }
};

// Combined MCQ Loading - for interfaces that need to handle both types
export const loadQuestionsByType = async (
  type: 'practice' | 'mock',
  specialty: SpecialtyType,
  options: {
    system?: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    mockExamSetId?: string;
    shuffleQuestions?: boolean;
  } = {}
): Promise<FCPSQuestion[]> => {
  try {
    console.log(`🔄 Loading ${type} questions for ${specialty}`);
    
    if (type === 'practice') {
      return await loadPracticeQuestions(
        specialty, 
        options.system, 
        options.count, 
        options.difficulty
      );
    } else if (type === 'mock') {
      if (!options.mockExamSetId) {
        console.error('❌ Mock exam set ID required for mock question loading');
        return [];
      }
      return await loadMockExamQuestions(
        specialty, 
        options.mockExamSetId, 
        options.shuffleQuestions
      );
    }
    
    console.error('❌ Invalid question type:', type);
    return [];
  } catch (error) {
    console.error('❌ Error loading questions by type:', error);
    return [];
  }
};

// Get available question counts for UI display
export const getQuestionCounts = async (specialty: SpecialtyType, system?: string) => {
  try {
    const allQuestions = getFCPSQuestions();
    
    // Count practice questions
    const practiceQuestions = allQuestions.filter(q => 
      q.specialty === specialty && 
      q.status === 'approved' &&
      (!system || q.system === system)
    );
    
    // Count by difficulty
    const difficultyBreakdown = {
      easy: practiceQuestions.filter(q => q.difficulty === 'easy').length,
      medium: practiceQuestions.filter(q => q.difficulty === 'medium').length,
      hard: practiceQuestions.filter(q => q.difficulty === 'hard').length
    };
    
    return {
      total: practiceQuestions.length,
      practice: practiceQuestions.length,
      difficulty: difficultyBreakdown
    };
  } catch (error) {
    console.error('❌ Error getting question counts:', error);
    return {
      total: 0,
      practice: 0,
      difficulty: { easy: 0, medium: 0, hard: 0 }
    };
  }
};

// Validate question loading parameters
export const validateLoadingParameters = (
  type: 'practice' | 'mock',
  specialty: SpecialtyType,
  options: any = {}
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Basic validation
  if (!['practice', 'mock'].includes(type)) {
    errors.push('Invalid question type. Must be "practice" or "mock"');
  }
  
  if (!['medicine', 'surgery', 'gynae-obs'].includes(specialty)) {
    errors.push('Invalid specialty. Must be "medicine", "surgery", or "gynae-obs"');
  }
  
  // Mock exam specific validation
  if (type === 'mock' && !options.mockExamSetId) {
    errors.push('Mock exam set ID is required for mock question loading');
  }
  
  // Count validation
  if (options.count !== undefined) {
    if (typeof options.count !== 'number' || options.count < 1) {
      errors.push('Count must be a positive number');
    }
    if (options.count > 1000) {
      errors.push('Count cannot exceed 1000 questions');
    }
  }
  
  // Difficulty validation
  if (options.difficulty && !['easy', 'medium', 'hard'].includes(options.difficulty)) {
    errors.push('Invalid difficulty. Must be "easy", "medium", or "hard"');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get question source info for debugging
export const getQuestionSourceInfo = (questions: FCPSQuestion[]) => {
  const sourceBreakdown = questions.reduce((acc: Record<string, number>, q) => {
    const source = q.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: questions.length,
    sources: sourceBreakdown,
    hasManualQuestions: sourceBreakdown['content-manager'] > 0,
    hasImportedQuestions: sourceBreakdown['excel-import'] > 0
  };
};

