// Excel Import Utility Functions for PulsePrep FCPS MCQ Import System
// FIXED VERSION - Corrects explanation processing bug

export interface ExcelMCQRow {
  'MCQ Number': string | number;
  'Scenario + Question': string;
  'Option A': string;
  'Option B': string;
  'Option C': string;
  'Option D': string;
  'Option E': string;
  'Correct Option': string;
  'Explanation (Correct Option)': string;
  'Explanation (Incorrect A)': string;
  'Explanation (Incorrect B)': string;
  'Explanation (Incorrect C)': string;
  'Explanation (Incorrect D)': string;
  'Explanation (Incorrect E)': string;
  'System': string;
  'Sub-System': string;
  'Difficulty (1-5)': string | number;
  'Confidence': string;
  'QC Review': string;
}

export interface ProcessedMCQ {
  originalMcqNumber: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  optionExplanations: string[];
  system: string;
  subSystem: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: string;
  qcReview: string;
  excelSystem: string; // Original system name from Excel
}

export interface SystemMapping {
  excelSystem: string;
  appSystem: string;
  mcqCount: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validMcqCount: number;
  totalRows: number;
}

export interface BatchSubmission {
  id: string;
  name: string;
  description: string;
  mcqCount: number;
  systemDistribution: { [systemName: string]: number };
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'partially-approved';
  priority: 'low' | 'medium' | 'high';
  mcqIds: string[];
  originalFileName: string;
  processingStats: {
    totalRows: number;
    validMcqs: number;
    errorCount: number;
    warningCount: number;
  };
}

// Expected column headers for auto-detection
export const EXPECTED_COLUMNS = [
  'MCQ Number',
  'Scenario + Question', 
  'Option A',
  'Option B', 
  'Option C',
  'Option D',
  'Option E',
  'Correct Option',
  'Explanation (Correct Option)',
  'Explanation (Incorrect A)',
  'Explanation (Incorrect B)', 
  'Explanation (Incorrect C)',
  'Explanation (Incorrect D)',
  'Explanation (Incorrect E)',
  'System',
  'Sub-System',
  'Difficulty (1-5)',
  'Confidence',
  'QC Review'
];

/**
 * Auto-detect if Excel file matches expected 19-column format
 */
export const detectExcelFormat = (headers: string[]): { 
  isValid: boolean; 
  confidence: number; 
  missingColumns: string[];
  extraColumns: string[];
} => {
  const normalizedHeaders = headers.map(h => h.trim());
  const normalizedExpected = EXPECTED_COLUMNS.map(h => h.trim());
  
  const missingColumns = normalizedExpected.filter(expected => 
    !normalizedHeaders.some(header => 
      header.toLowerCase() === expected.toLowerCase()
    )
  );
  
  const extraColumns = normalizedHeaders.filter(header => 
    !normalizedExpected.some(expected => 
      header.toLowerCase() === expected.toLowerCase()
    )
  );
  
  const matchCount = normalizedExpected.length - missingColumns.length;
  const confidence = (matchCount / normalizedExpected.length) * 100;
  
  return {
    isValid: confidence >= 80, // 80% match required
    confidence,
    missingColumns,
    extraColumns
  };
};

/**
 * Convert letter answer (A, B, C, D, E) to zero-based index
 */
export const convertLetterToIndex = (letter: string): number => {
  if (!letter || typeof letter !== 'string') return 0;
  
  const upperLetter = letter.trim().toUpperCase();
  const index = upperLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
  
  return Math.max(0, Math.min(4, index)); // Clamp between 0-4
};

/**
 * Convert numeric difficulty (1-5) to text difficulty
 */
export const convertDifficultyLevel = (rating: string | number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  const numRating = typeof rating === 'string' ? parseInt(rating) : rating;
  
  if (isNaN(numRating)) return 'intermediate';
  
  switch (numRating) {
    case 1:
    case 2:
      return 'beginner';
    case 3:
      return 'intermediate';
    case 4:
      return 'advanced';
    case 5:
      return 'expert';
    default:
      return 'intermediate';
  }
};

/**
 * FIXED: Process option explanations correctly
 * The correct answer should ALWAYS get the main explanation, not "N/A"
 */
export const processExplanations = (
  correctIndex: number, 
  explanations: string[], 
  mainExplanation: string
): string[] => {
  // Initialize array with 5 empty explanations
  const processedExplanations = Array(5).fill('');
  
  // Process each option explanation
  explanations.forEach((exp, index) => {
    if (index === correctIndex) {
      // CORRECT OPTION: Always use main explanation
      processedExplanations[index] = mainExplanation.trim();
    } else {
      // INCORRECT OPTIONS: Use their specific explanation, or empty if N/A
      if (exp && exp.trim().toLowerCase() !== 'n/a' && exp.trim() !== '') {
        processedExplanations[index] = exp.trim();
      } else {
        processedExplanations[index] = ''; // Empty for N/A or missing
      }
    }
  });
  
  // Double-check: Ensure correct answer has the main explanation
  processedExplanations[correctIndex] = mainExplanation.trim();
  
  console.log(`🔧 EXPLANATION DEBUG:`, {
    correctIndex,
    mainExplanation: mainExplanation.substring(0, 50) + '...',
    correctOptionExplanation: processedExplanations[correctIndex].substring(0, 50) + '...',
    rawExplanations: explanations.map(e => e.substring(0, 20) + '...'),
  });
  
  return processedExplanations;
};

/**
 * Auto-suggest system mappings based on name similarity
 */
export const autoMapSystems = (excelSystems: string[], appSystems: any[]): SystemMapping[] => {
  return excelSystems.map(excelSystem => {
    let bestMatch = '';
    let highestScore = 0;
    
    // Try exact match first
    const exactMatch = appSystems.find(appSys => 
      appSys.name.toLowerCase() === excelSystem.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        excelSystem,
        appSystem: exactMatch.name,
        mcqCount: 0,
        confidence: 'high' as const
      };
    }
    
    // Try fuzzy matching
    appSystems.forEach(appSys => {
      const score = calculateSimilarity(excelSystem.toLowerCase(), appSys.name.toLowerCase());
      if (score > highestScore) {
        highestScore = score;
        bestMatch = appSys.name;
      }
    });
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (highestScore > 0.8) confidence = 'high';
    else if (highestScore > 0.5) confidence = 'medium';
    
    return {
      excelSystem,
      appSystem: bestMatch || appSystems[0]?.name || 'General',
      mcqCount: 0,
      confidence
    };
  });
};

/**
 * Calculate string similarity for fuzzy matching
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Validate Excel data and identify issues
 */
export const validateExcelData = (data: any[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validMcqCount = 0;
  
  if (!data || data.length === 0) {
    errors.push('No data found in Excel file');
    return { isValid: false, errors, warnings, validMcqCount: 0, totalRows: 0 };
  }
  
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check required fields
    if (!row['Scenario + Question']?.trim()) {
      errors.push(`Row ${rowNumber}: Missing question text`);
      return;
    }
    
    if (!row['Option A']?.trim() || !row['Option B']?.trim()) {
      errors.push(`Row ${rowNumber}: Missing required options A and B`);
      return;
    }
    
    if (!row['Correct Option']?.trim()) {
      errors.push(`Row ${rowNumber}: Missing correct answer`);
      return;
    }
    
    if (!row['Explanation (Correct Option)']?.trim()) {
      errors.push(`Row ${rowNumber}: Missing main explanation`);
      return;
    }
    
    if (!row['System']?.trim()) {
      errors.push(`Row ${rowNumber}: Missing system classification`);
      return;
    }
    
    // Validate correct option
    const correctOption = row['Correct Option']?.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D', 'E'].includes(correctOption)) {
      errors.push(`Row ${rowNumber}: Invalid correct option '${correctOption}'. Must be A, B, C, D, or E`);
      return;
    }
    
    // Check if correct option has corresponding option text
    const optionKey = `Option ${correctOption}` as keyof typeof row;
    if (!row[optionKey]?.trim()) {
      errors.push(`Row ${rowNumber}: Correct option ${correctOption} has no text`);
      return;
    }
    
    // Validate difficulty
    const difficulty = row['Difficulty (1-5)'];
    if (difficulty && (isNaN(Number(difficulty)) || Number(difficulty) < 1 || Number(difficulty) > 5)) {
      warnings.push(`Row ${rowNumber}: Invalid difficulty '${difficulty}'. Using default 'intermediate'`);
    }
    
    // Check for duplicate options
    const options = [
      row['Option A']?.trim(),
      row['Option B']?.trim(), 
      row['Option C']?.trim(),
      row['Option D']?.trim(),
      row['Option E']?.trim()
    ].filter(opt => opt);
    
    const uniqueOptions = new Set(options.map(opt => opt.toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      warnings.push(`Row ${rowNumber}: Duplicate options detected`);
    }
    
    validMcqCount++;
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validMcqCount,
    totalRows: data.length
  };
};

/**
 * FIXED: Process raw Excel data into standardized MCQ format
 * Now correctly handles explanations for the correct answer
 */
export const processExcelData = (
  data: ExcelMCQRow[], 
  systemMappings: { [excelSystem: string]: string }
): ProcessedMCQ[] => {
  return data.map((row, index) => {
    // Extract and clean options
    const options = [
      row['Option A']?.toString().trim(),
      row['Option B']?.toString().trim(),
      row['Option C']?.toString().trim(),
      row['Option D']?.toString().trim(),
      row['Option E']?.toString().trim()
    ].filter(opt => opt && opt !== '');
    
    // Convert correct answer
    const correctAnswer = convertLetterToIndex(row['Correct Option']?.toString() || 'A');
    
    // Process explanations - FIXED VERSION
    const rawExplanations = [
      row['Explanation (Incorrect A)']?.toString() || '',
      row['Explanation (Incorrect B)']?.toString() || '',
      row['Explanation (Incorrect C)']?.toString() || '',
      row['Explanation (Incorrect D)']?.toString() || '',
      row['Explanation (Incorrect E)']?.toString() || ''
    ];
    
    const mainExplanation = row['Explanation (Correct Option)']?.toString().trim() || '';
    const optionExplanations = processExplanations(correctAnswer, rawExplanations, mainExplanation);
    
    // Map system
    const excelSystem = row['System']?.toString().trim() || 'General';
    const mappedSystem = systemMappings[excelSystem] || excelSystem;
    
    const processedMCQ = {
      originalMcqNumber: row['MCQ Number']?.toString() || '',
      question: row['Scenario + Question']?.toString().trim() || '',
      options: options.slice(0, options.length), // Keep only non-empty options
      correctAnswer: Math.min(correctAnswer, options.length - 1), // Ensure valid index
      explanation: mainExplanation,
      optionExplanations: optionExplanations.slice(0, options.length), // Match options length
      system: mappedSystem,
      subSystem: row['Sub-System']?.toString().trim() || '',
      difficulty: convertDifficultyLevel(row['Difficulty (1-5)']),
      confidence: row['Confidence']?.toString().trim() || '',
      qcReview: row['QC Review']?.toString().trim() || '',
      excelSystem
    };
    
    // Debug log for first few MCQs to verify explanations
    if (index < 3) {
      console.log(`🔍 MCQ ${index + 1} Processing:`, {
        question: processedMCQ.question.substring(0, 50) + '...',
        correctAnswer: processedMCQ.correctAnswer,
        correctOption: String.fromCharCode(65 + processedMCQ.correctAnswer),
        mainExplanation: mainExplanation.substring(0, 50) + '...',
        correctOptionExplanation: processedMCQ.optionExplanations[processedMCQ.correctAnswer].substring(0, 50) + '...',
      });
    }
    
    return processedMCQ;
  });
};

/**
 * Distribute MCQs by system for statistics
 */
export const distributeMCQsBySystem = (mcqs: ProcessedMCQ[]): { [systemName: string]: number } => {
  return mcqs.reduce((distribution, mcq) => {
    distribution[mcq.system] = (distribution[mcq.system] || 0) + 1;
    return distribution;
  }, {} as { [systemName: string]: number });
};

/**
 * Create batch submission data structure
 */
export const createBatchSubmission = (
  mcqs: ProcessedMCQ[],
  batchInfo: {
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    submittedBy: string;
    originalFileName: string;
  },
  processingStats: {
    totalRows: number;
    validMcqs: number;
    errorCount: number;
    warningCount: number;
  }
): BatchSubmission => {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const systemDistribution = distributeMCQsBySystem(mcqs);
  
  // Generate unique IDs for MCQs
  const mcqIds = mcqs.map((_, index) => `${batchId}_mcq_${index + 1}`);
  
  return {
    id: batchId,
    name: batchInfo.name,
    description: batchInfo.description,
    mcqCount: mcqs.length,
    systemDistribution,
    submittedBy: batchInfo.submittedBy,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    priority: batchInfo.priority,
    mcqIds,
    originalFileName: batchInfo.originalFileName,
    processingStats
  };
};

/**
 * Save processed MCQs to localStorage for review
 */
export const saveToPendingQueue = (
  mcqs: ProcessedMCQ[],
  batchSubmission: BatchSubmission,
  specialty: 'medicine' | 'surgery' | 'gynae-obs'
): void => {
  try {
    // Convert to FCPSQuestion format for consistency with existing system
    const fcpsQuestions = mcqs.map((mcq, index) => ({
      id: batchSubmission.mcqIds[index],
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: mcq.explanation,
      optionExplanations: mcq.optionExplanations,
      specialty,
      system: mcq.system,
      difficulty: mcq.difficulty,
      tags: mcq.subSystem ? [mcq.subSystem] : [],
      references: [],
      createdAt: new Date().toISOString(),
      createdBy: batchSubmission.submittedBy,
      status: 'pending' as const,
      source: 'excel-import',
      batchId: batchSubmission.id,
      // Import metadata
      originalMcqNumber: mcq.originalMcqNumber,
      excelSystem: mcq.excelSystem,
      confidence: mcq.confidence,
      qcReview: mcq.qcReview
    }));
    
    // Add to existing FCPS questions
    const existingQuestions = JSON.parse(localStorage.getItem('pulseprep_fcps_questions') || '[]');
    const updatedQuestions = [...existingQuestions, ...fcpsQuestions];
    localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(updatedQuestions));
    
    // Save batch submission history
    const existingBatches = JSON.parse(localStorage.getItem('pulseprep_import_batches') || '[]');
    existingBatches.unshift(batchSubmission); // Add to beginning for recent-first order
    localStorage.setItem('pulseprep_import_batches', JSON.stringify(existingBatches));
    
    console.log(`✅ Saved ${mcqs.length} MCQs to pending queue for review`);
    console.log(`📊 Batch: ${batchSubmission.name} (${batchSubmission.id})`);
    console.log(`🎯 Systems: ${Object.keys(batchSubmission.systemDistribution).join(', ')}`);
    

    
  } catch (error) {
    console.error('❌ Error saving to pending queue:', error);
    throw new Error('Failed to save imported MCQs. Please try again.');
  }
};

/**
 * Get import history for content manager
 */
export const getImportHistory = (userId?: string): BatchSubmission[] => {
  try {
    const batches = JSON.parse(localStorage.getItem('pulseprep_import_batches') || '[]');
    
    if (userId) {
      return batches.filter((batch: BatchSubmission) => batch.submittedBy === userId);
    }
    
    return batches;
  } catch (error) {
    console.error('❌ Error retrieving import history:', error);
    return [];
  }
};

/**
 * Get import statistics for dashboard
 */
export const getImportStatistics = (userId?: string): {
  totalBatches: number;
  totalMcqs: number;
  pendingMcqs: number;
  approvedMcqs: number;
  rejectedMcqs: number;
  recentBatches: BatchSubmission[];
} => {
  try {
    const batches = getImportHistory(userId);
    const fcpsQuestions = JSON.parse(localStorage.getItem('pulseprep_fcps_questions') || '[]');
    
    // Filter imported questions
    const importedQuestions = fcpsQuestions.filter((q: any) => 
      q.source === 'excel-import' && (!userId || q.createdBy === userId)
    );
    
    return {
      totalBatches: batches.length,
      totalMcqs: batches.reduce((sum, batch) => sum + batch.mcqCount, 0),
      pendingMcqs: importedQuestions.filter((q: any) => q.status === 'pending').length,
      approvedMcqs: importedQuestions.filter((q: any) => q.status === 'approved').length,
      rejectedMcqs: importedQuestions.filter((q: any) => q.status === 'rejected').length,
      recentBatches: batches.slice(0, 5) // Last 5 batches
    };
  } catch (error) {
    console.error('❌ Error calculating import statistics:', error);
    return {
      totalBatches: 0,
      totalMcqs: 0,
      pendingMcqs: 0,
      approvedMcqs: 0,
      rejectedMcqs: 0,
      recentBatches: []
    };
  }
};

/**
 * Generate Excel template for download
 */
export const generateExcelTemplate = (): string => {
  const templateData = [
    EXPECTED_COLUMNS,
    [
      '1',
      'A 45-year-old male presents with chest pain and shortness of breath. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?',
      'Anterior myocardial infarction',
      'Inferior myocardial infarction', 
      'Posterior myocardial infarction',
      'Lateral myocardial infarction',
      'Unstable angina',
      'B',
      'ST elevation in leads II, III, and aVF indicates inferior wall myocardial infarction involving the RCA territory.',
      'Anterior MI would show changes in V1-V4 leads.',
      'N/A - This is the correct answer',
      'Posterior MI would show changes in V7-V9 or reciprocal changes in V1-V3.',
      'Lateral MI would show changes in I, aVL, V5-V6.',
      'Unstable angina typically does not show ST elevation.',
      'Cardiovascular',
      'Acute Coronary Syndrome',
      '3',
      'High',
      '✅ Clear'
    ]
  ];
  
  // Convert to CSV format
  return templateData.map(row => 
    row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};

/**
 * Validate batch before submission
 */
export const validateBatchForSubmission = (
  mcqs: ProcessedMCQ[],
  batchName: string,
  systemMappings: { [key: string]: string }
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Batch validation
  if (!batchName.trim()) {
    errors.push('Batch name is required');
  }
  
  if (mcqs.length === 0) {
    errors.push('No valid MCQs to submit');
  }
  
  if (mcqs.length > 500) {
    warnings.push('Large batch size may take longer to review. Consider splitting into smaller batches.');
  }
  
  // System mapping validation
  const unmappedSystems = Object.keys(systemMappings).filter(excelSys => !systemMappings[excelSys]);
  if (unmappedSystems.length > 0) {
    errors.push(`Unmapped systems: ${unmappedSystems.join(', ')}`);
  }
  
  // MCQ validation
  const systemDistribution = distributeMCQsBySystem(mcqs);
  const systemsWithFewMcqs = Object.entries(systemDistribution)
    .filter(([_, count]) => count < 3)
    .map(([system, _]) => system);
  
  if (systemsWithFewMcqs.length > 0) {
    warnings.push(`Systems with very few MCQs: ${systemsWithFewMcqs.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Helper function to detect specialty from system names
 */
export const detectSpecialtyFromSystems = (
  systems: string[], 
  appSystems: any[]
): 'medicine' | 'surgery' | 'gynae-obs' => {
  const systemCounts = { medicine: 0, surgery: 0, 'gynae-obs': 0 };
  
  systems.forEach(excelSystem => {
    // Try to find matching app system
    const matchedAppSystem = appSystems.find(appSys => 
      appSys.name.toLowerCase() === excelSystem.toLowerCase() ||
      calculateSimilarity(appSys.name.toLowerCase(), excelSystem.toLowerCase()) > 0.7
    );
    
    if (matchedAppSystem) {
      systemCounts[matchedAppSystem.specialty as keyof typeof systemCounts]++;
    } else {
      // Default inference based on system name
      const lowerSystem = excelSystem.toLowerCase();
      if (lowerSystem.includes('surgery') || lowerSystem.includes('surgical') || 
          lowerSystem.includes('orthopedic') || lowerSystem.includes('trauma')) {
        systemCounts.surgery++;
      } else if (lowerSystem.includes('gynae') || lowerSystem.includes('obstetric') || 
                 lowerSystem.includes('reproductive') || lowerSystem.includes('pregnancy')) {
        systemCounts['gynae-obs']++;
      } else {
        systemCounts.medicine++;
      }
    }
  });
  
  // Return specialty with highest count
  const maxCount = Math.max(...Object.values(systemCounts));
  const detectedSpecialty = Object.entries(systemCounts)
    .find(([_, count]) => count === maxCount)?.[0] as keyof typeof systemCounts;
  
  return detectedSpecialty || 'medicine';
};