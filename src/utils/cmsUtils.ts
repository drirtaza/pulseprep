import { FCPSQuestion, SystemRequest } from '../types';

// Force refresh medical systems to 24 comprehensive systems
export const forceRefreshMedicalSystems = () => {
  console.log('🔄 Force refreshing medical systems to 24 comprehensive systems...');
  
  const medicalSystems = [
    // Core Medical Sciences (1-18)
    {
      id: 'sys1',
      name: 'Calculations',
      description: 'Medical calculations, dosage calculations, and clinical mathematics',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys2',
      name: 'Cell Physiology',
      description: 'Cellular structure, function, and physiological processes',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys3',
      name: 'Cardiovascular',
      description: 'Heart, blood vessels, circulation, and cardiovascular diseases',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys4',
      name: 'Gastroenterology',
      description: 'Digestive system, GI tract, liver, and related disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys5',
      name: 'Pulmonology',
      description: 'Respiratory system, lungs, airways, and breathing disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys6',
      name: 'Nephrology',
      description: 'Kidney function, renal diseases, and urinary system',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys7',
      name: 'Hematology',
      description: 'Blood disorders, hematopoiesis, and blood-related diseases',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys8',
      name: 'Oncology',
      description: 'Cancer biology, tumor pathology, and oncological treatments',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys9',
      name: 'Endocrinology',
      description: 'Hormonal system, endocrine glands, and metabolic disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys10',
      name: 'Neurology (Neuroanatomy and Neurophysiology)',
      description: 'Nervous system anatomy, physiology, and neurological disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys11',
      name: 'Musculoskeletal System',
      description: 'Bones, muscles, joints, and musculoskeletal disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys12',
      name: 'General Pathology',
      description: 'Disease processes, pathological mechanisms, and general pathology principles',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys13',
      name: 'Immunology',
      description: 'Immune system, immunological responses, and immunological disorders',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys14',
      name: 'Microbiology',
      description: 'Bacteria, viruses, fungi, parasites, and infectious diseases',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys15',
      name: 'Histology',
      description: 'Microscopic anatomy, tissue structure, and cellular organization',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys16',
      name: 'Biochemistry',
      description: 'Molecular biology, metabolic pathways, and biochemical processes',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys17',
      name: 'Pharmacology',
      description: 'Drug mechanisms, pharmacokinetics, and therapeutic agents',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys18',
      name: 'Embryology',
      description: 'Embryonic development, fetal growth, and developmental biology',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    // Anatomical Systems (19-24)
    {
      id: 'sys19',
      name: 'Upper Limb',
      description: 'Anatomy, physiology, and pathology of upper extremities',
      specialty: 'surgery',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys20',
      name: 'Lower Limb',
      description: 'Anatomy, physiology, and pathology of lower extremities',
      specialty: 'surgery',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys21',
      name: 'Abdomen, Pelvis & Perineum',
      description: 'Abdominal and pelvic anatomy, organs, and related pathology',
      specialty: 'surgery',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys22',
      name: 'Spinal Cord & Brainstem',
      description: 'Spinal cord anatomy, brainstem structure, and neurological pathways',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys23',
      name: 'Thorax',
      description: 'Thoracic anatomy, chest organs, and thoracic pathology',
      specialty: 'surgery',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    },
    {
      id: 'sys24',
      name: 'Public Health Sciences and General',
      description: 'Public health principles, epidemiology, and general medical topics',
      specialty: 'medicine',
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      questionCount: 0,
      isUniversal: true,
      isCustom: false
    }
  ];

  // Preserve existing custom systems and merge with new default systems
  const existingSystems = localStorage.getItem('pulseprep_medical_systems');
  let existingCustomSystems: any[] = [];
  
  if (existingSystems) {
    try {
      const existing = JSON.parse(existingSystems);
      existingCustomSystems = existing.filter((sys: any) => sys.isCustom === true);
      console.log(`📋 Found ${existingCustomSystems.length} existing custom systems to preserve`);
    } catch (error) {
      console.error('Error parsing existing systems:', error);
    }
  }

  // Combine default systems with preserved custom systems
  const allSystems = [...medicalSystems, ...existingCustomSystems];
  
  localStorage.setItem('pulseprep_medical_systems', JSON.stringify(allSystems));
  console.log(`✅ Medical systems refreshed: ${medicalSystems.length} default + ${existingCustomSystems.length} custom = ${allSystems.length} total systems`);
  console.log('🏥 All 24 comprehensive systems now available for all specialties');
  
  return allSystems;
};

// Initialize CMS data - ENHANCED VERSION
export const initializeCMSData = (forceRefresh: boolean = false) => {
  // Initialize FCPS Questions - Start with empty array, questions will be added via Content Manager
  if (!localStorage.getItem('pulseprep_fcps_questions')) {
    const emptyQuestions: FCPSQuestion[] = [];
    localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(emptyQuestions));
    console.log('📚 CMS Questions initialized - empty array, ready for content manager uploads');
  }

  // Check if medical systems need initialization or refresh
  const needsSystemRefresh = forceRefresh || !localStorage.getItem('pulseprep_medical_systems');
  
  if (needsSystemRefresh) {
    forceRefreshMedicalSystems();
  } else {
    // Check if we have the correct number of systems
    const existingSystems = localStorage.getItem('pulseprep_medical_systems');
    if (existingSystems) {
      try {
        const systems = JSON.parse(existingSystems);
        const defaultSystems = systems.filter((sys: any) => !sys.isCustom);
        
        if (defaultSystems.length !== 24) {
          console.log(`⚠️ Found ${defaultSystems.length} default systems, but should have 24. Refreshing...`);
          forceRefreshMedicalSystems();
        } else {
          console.log(`✅ Medical systems check: ${defaultSystems.length} default systems + ${systems.filter((s: any) => s.isCustom).length} custom systems`);
        }
      } catch (error) {
        console.error('Error checking existing systems:', error);
        forceRefreshMedicalSystems();
      }
    }
  }

  // Initialize System Requests - Start with empty array
  if (!localStorage.getItem('pulseprep_system_requests')) {
    const emptyRequests: SystemRequest[] = [];
    localStorage.setItem('pulseprep_system_requests', JSON.stringify(emptyRequests));
    console.log('📝 System requests initialized - empty array, ready for content manager submissions');
  }

  // Initialize Excel import batches storage
  if (!localStorage.getItem('pulseprep_import_batches')) {
    localStorage.setItem('pulseprep_import_batches', JSON.stringify([]));
    console.log('📁 Excel import batches storage initialized');
  }

  console.log('✅ CMS data initialized successfully - All 24 systems available');
};

// CMS Activity Logging
interface CMSActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userId: string;
  userRole: string;
  category: 'question' | 'system' | 'import' | 'export' | 'approval' | 'rejection' | 'creation' | 'deletion';
  metadata?: Record<string, any>;
}

export const logCMSActivity = async (
  action: string,
  details: string,
  userId: string,
  userRole: string,
  category: CMSActivityLog['category'],
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const activities = await getCMSActivityLogs();
    const newActivity: CMSActivityLog = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId,
      userRole,
      category,
      metadata
    };

    activities.unshift(newActivity); // Add to beginning
    
    // Keep only last 1000 activities to prevent localStorage bloat
    const trimmedActivities = activities.slice(0, 1000);
    
    localStorage.setItem('pulseprep_cms_activity_logs', JSON.stringify(trimmedActivities));
    
    console.log(`📝 CMS Activity Logged: ${action} by ${userRole} (${userId})`);
  } catch (error) {
    console.error('❌ Error logging CMS activity:', error);
  }
};

export const getCMSActivityLogs = async (): Promise<CMSActivityLog[]> => {
  try {
    const logs = localStorage.getItem('pulseprep_cms_activity_logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('❌ Error retrieving CMS activity logs:', error);
    return [];
  }
};

export const clearCMSActivityLogs = async (): Promise<void> => {
  localStorage.removeItem('pulseprep_cms_activity_logs');
};

export const getFilteredCMSActivityLogs = async (filters: {
  category?: CMSActivityLog['category'];
  userId?: string;
  userRole?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<CMSActivityLog[]> => {
  const allLogs = await getCMSActivityLogs();
  
  let filteredLogs = allLogs.filter((log: CMSActivityLog) => {
    if (filters.category && log.category !== filters.category) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.userRole && log.userRole !== filters.userRole) return false;
    
    if (filters.dateFrom) {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(filters.dateFrom);
      if (logDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const logDate = new Date(log.timestamp);
      const toDate = new Date(filters.dateTo);
      if (logDate > toDate) return false;
    }
    
    return true;
  });
  
  if (filters.limit && filters.limit > 0) {
    filteredLogs = filteredLogs.slice(0, filters.limit);
  }
  
  return filteredLogs;
};

// Medical Systems functions - ENHANCED with better error handling and logging
export const getMedicalSystems = (specialty?: 'medicine' | 'surgery' | 'gynae-obs'): any[] => {
  try {
    console.log(`🔍 Getting medical systems for specialty: ${specialty || 'all'}`);
    
    const systems = localStorage.getItem('pulseprep_medical_systems');
    if (!systems) {
      console.warn('⚠️ No medical systems found in localStorage, attempting to initialize...');
      
      // Try to force refresh medical systems
      try {
        const refreshedSystems = forceRefreshMedicalSystems();
        if (Array.isArray(refreshedSystems) && refreshedSystems.length > 0) {
          console.log(`✅ Force refresh successful: ${refreshedSystems.length} systems`);
          if (specialty) {
            return refreshedSystems.filter((sys: any) => 
              sys.isUniversal || sys.specialty === specialty
            );
          }
          return refreshedSystems;
        }
      } catch (refreshError) {
        console.error('❌ Force refresh failed:', refreshError);
      }
      
      console.error('❌ No medical systems available and refresh failed');
      return [];
    }
    
    const parsedSystems = JSON.parse(systems);
    console.log(`📊 Parsed ${parsedSystems.length} systems from localStorage`);
    
    // Ensure we always return an array
    if (!Array.isArray(parsedSystems)) {
      console.error('❌ Medical systems data is not an array:', typeof parsedSystems);
      // Force refresh with 24 systems if data is corrupted
      try {
        const refreshedSystems = forceRefreshMedicalSystems();
        if (Array.isArray(refreshedSystems)) {
          console.log(`✅ Data corruption fixed: ${refreshedSystems.length} systems restored`);
          if (specialty) {
            return refreshedSystems.filter((sys: any) => 
              sys.isUniversal || sys.specialty === specialty
            );
          }
          return refreshedSystems;
        }
      } catch (refreshError) {
        console.error('❌ Failed to fix corrupted data:', refreshError);
      }
      return [];
    }
    
    if (specialty) {
      // ✅ SURGICAL FIX: Include custom systems in the filter
      const filteredSystems = parsedSystems.filter((sys: any) => 
        sys.isUniversal || 
        sys.specialty === specialty ||
        (sys.isCustom && sys.specialty === specialty)
      );
      console.log(`🎯 Filtered to ${filteredSystems.length} systems for ${specialty}`);
      // 🔥 ENHANCED DEBUGGING - ADDED
      console.log('📋 Systems found:', filteredSystems.map((s: any) => ({
        id: s.id,
        name: s.name,
        specialty: s.specialty,
        isUniversal: s.isUniversal,
        isCustom: s.isCustom
      })));
      return filteredSystems;
    }
    
    console.log(`📋 Returning all ${parsedSystems.length} systems`);
    return parsedSystems;
  } catch (error) {
    console.error('❌ Error parsing medical systems:', error);
    
    // Try to force refresh with 24 systems if parsing fails
    try {
      console.log('🔄 Attempting recovery with force refresh...');
      const refreshedSystems = forceRefreshMedicalSystems();
      if (Array.isArray(refreshedSystems) && refreshedSystems.length > 0) {
        console.log(`✅ Recovery successful: ${refreshedSystems.length} systems`);
        if (specialty) {
          return refreshedSystems.filter((sys: any) => 
            sys.isUniversal || 
            sys.specialty === specialty ||
            (sys.isCustom && sys.specialty === specialty)
          );
        }
        return refreshedSystems;
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
    }
    
    console.error('❌ All medical systems loading attempts failed');
    return [];
  }
};

// Get medical systems with real-time question counts - ENHANCED with better error handling
export const getMedicalSystemsWithQuestionCounts = (specialty?: 'medicine' | 'surgery' | 'gynae-obs'): any[] => {
  try {
    console.log(`📊 Getting systems with question counts for specialty: ${specialty || 'all'}`);
    
    const systems = getMedicalSystems(specialty);
    console.log(`🏥 Retrieved ${systems.length} medical systems`);
    
    if (!Array.isArray(systems) || systems.length === 0) {
      console.warn('⚠️ No medical systems available for question count calculation');
      return [];
    }
    
    const questions = getFCPSQuestions();
    console.log(`📚 Retrieved ${questions.length} FCPS questions`);
    
    // Calculate real-time question counts for each system
    const systemsWithCounts = systems.map(system => {
      if (!system || !system.name) {
        console.warn('⚠️ Invalid system object:', system);
        return system;
      }
      
      const questionCount = questions.filter(q => 
        q && q.system === system.name && 
        q.status === 'approved' &&
        (specialty ? q.specialty === specialty : true)
      ).length;
      
      return {
        ...system,
        questionCount // Override static questionCount with real count
      };
    });
    
    console.log(`✅ Successfully calculated question counts for ${systemsWithCounts.length} systems`);
    return systemsWithCounts;
  } catch (error) {
    console.error('❌ Error getting systems with question counts:', error);
    
    // Fallback to basic systems without question counts
    try {
      console.log('🔄 Falling back to basic medical systems...');
      const fallbackSystems = getMedicalSystems(specialty);
      return fallbackSystems.map(system => ({
        ...system,
        questionCount: 0 // Set to 0 if we can't calculate real counts
      }));
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return [];
    }
  }
};

// Get question count for a specific system
export const getSystemQuestionCount = (systemName: string, specialty: 'medicine' | 'surgery' | 'gynae-obs'): number => {
  try {
    const questions = getFCPSQuestions();
    
    const count = questions.filter(q => 
      q.system === systemName && 
      q.status === 'approved' &&
      q.specialty === specialty
    ).length;
    
    return count;
  } catch (error) {
    console.error(`❌ Error getting question count for system ${systemName}:`, error);
    return 0;
  }
};

// FCPS Questions functions - ENHANCED to include imported MCQs
export const getFCPSQuestions = (): FCPSQuestion[] => {
  try {
    const questions = localStorage.getItem('pulseprep_fcps_questions');
    if (!questions) return [];
    
    const parsedQuestions = JSON.parse(questions);
    
    // Ensure we always return an array
    if (!Array.isArray(parsedQuestions)) {
      console.error('❌ FCPS questions data is not an array:', typeof parsedQuestions);
      // Initialize with empty array if data is corrupted
      localStorage.setItem('pulseprep_fcps_questions', JSON.stringify([]));
      return [];
    }
    
    return parsedQuestions;
  } catch (error) {
    console.error('❌ Error parsing FCPS questions:', error);
    // Initialize with empty array if parsing fails
    localStorage.setItem('pulseprep_fcps_questions', JSON.stringify([]));
    return [];
  }
};

export const getFCPSQuestionsBySpecialty = (specialty: 'medicine' | 'surgery' | 'gynae-obs'): FCPSQuestion[] => {
  const allQuestions = getFCPSQuestions();
  return allQuestions.filter((q: FCPSQuestion) => q.specialty === specialty && q.status === 'approved');
};

// ENHANCED: Now includes both manually created and imported MCQs
export const getFCPSQuestionsBySystem = (
  specialty: 'medicine' | 'surgery' | 'gynae-obs', 
  system: string, 
  count?: number,
  includeWrongAnswers: boolean = false,
  userId?: string
): FCPSQuestion[] => {
  const allQuestions = getFCPSQuestions();
  
  // Filter questions: include both manually created and imported (approved) questions
  let filteredQuestions = allQuestions.filter((q: FCPSQuestion) => 
    q.specialty === specialty && 
    q.system === system && 
    q.status === 'approved' // Only approved questions (both manual and imported)
  );

  console.log(`📚 Found ${filteredQuestions.length} approved questions for ${specialty}/${system}:`);
  const manualCount = filteredQuestions.filter((q: FCPSQuestion) => !q.source || q.source !== 'excel-import').length;
  const importedCount = filteredQuestions.filter((q: FCPSQuestion) => q.source === 'excel-import').length;
  console.log(`  - Manual: ${manualCount}, Imported: ${importedCount}`);

  // If including wrong answers and userId provided, get user's wrong answers for this system
  if (includeWrongAnswers && userId) {
    const userWrongAnswers = getUserWrongAnswers(userId, specialty, system);
    const wrongQuestionIds = userWrongAnswers.map((wa: UserWrongAnswer) => wa.questionId);
    
    // Filter to only include questions that user got wrong
    filteredQuestions = filteredQuestions.filter((q: FCPSQuestion) => wrongQuestionIds.includes(q.id));
  }

  // Shuffle questions to ensure randomness
  const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
  
  // Return requested count or all available
  return count ? shuffled.slice(0, count) : shuffled;
};

export const getRandomFCPSQuestions = (
  specialty: 'medicine' | 'surgery' | 'gynae-obs', 
  count: number,
  excludeQuestionIds: string[] = []
): FCPSQuestion[] => {
  const allQuestions = getFCPSQuestions();
  const availableQuestions = allQuestions.filter((q: FCPSQuestion) => 
    q.specialty === specialty && 
    q.status === 'approved' &&
    !excludeQuestionIds.includes(q.id)
  );

  // Shuffle and return requested count
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// User wrong answers tracking
interface UserWrongAnswer {
  questionId: string;
  userAnswer: number;
  timestamp: string;
  system: string;
}

export const getUserWrongAnswers = (
  userId: string, 
  specialty: 'medicine' | 'surgery' | 'gynae-obs', 
  system?: string
): UserWrongAnswer[] => {
  try {
    const key = `pulseprep_wrong_answers_${userId}_${specialty}`;
    const wrongAnswers = localStorage.getItem(key);
    if (!wrongAnswers) return [];
    
    const parsed = JSON.parse(wrongAnswers) as UserWrongAnswer[];
    return system ? parsed.filter((wa: UserWrongAnswer) => wa.system === system) : parsed;
  } catch (error) {
    console.error('Error getting user wrong answers:', error);
    return [];
  }
};

export const saveUserWrongAnswer = (
  userId: string,
  specialty: 'medicine' | 'surgery' | 'gynae-obs',
  questionId: string,
  userAnswer: number,
  system: string
): void => {
  try {
    const key = `pulseprep_wrong_answers_${userId}_${specialty}`;
    const existing = getUserWrongAnswers(userId, specialty);
    
    // Remove any existing wrong answer for this question to avoid duplicates
    const filtered = existing.filter((wa: UserWrongAnswer) => wa.questionId !== questionId);
    
    // Add new wrong answer
    const newWrongAnswer: UserWrongAnswer = {
      questionId,
      userAnswer,
      timestamp: new Date().toISOString(),
      system
    };
    
    filtered.push(newWrongAnswer);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error saving user wrong answer:', error);
  }
};

// Map difficulty to standard format
const mapDifficultyToStandard = (difficulty: string): 'easy' | 'medium' | 'hard' => {
  const normalized = difficulty.toLowerCase().trim();
  
  switch (normalized) {
    case 'easy':
    case 'beginner':
    case 'basic':
      return 'easy';
    case 'hard':
    case 'difficult':
    case 'advanced':
    case 'expert':
      return 'hard';
    case 'medium':
    case 'intermediate':
    case 'moderate':
    default:
      return 'medium';
  }
};

// FIXED: Enhanced createFCPSQuestion to automatically set 'pending' status for Content Manager submissions
export const createFCPSQuestion = async (questionData: Omit<FCPSQuestion, 'id' | 'createdAt'>): Promise<FCPSQuestion> => {
  const questions = getFCPSQuestions();
  
  // Map difficulty to standard format during creation
  const originalDifficulty = questionData.difficulty;
  const difficulty = mapDifficultyToStandard(originalDifficulty);
  
  if (originalDifficulty !== difficulty) {
    console.log(`🔧 Mapped difficulty "${originalDifficulty}" to "${difficulty}" during question creation`);
  }
  
  // ENHANCED: Automatically set status to 'pending' and source to 'content-manager' for manual submissions
  const newQuestion: FCPSQuestion = {
    ...questionData,
    id: `q${Date.now()}`,
    createdAt: new Date().toISOString(),
    // FIXED: Ensure status is always 'pending' for Content Manager submissions unless explicitly set
    status: questionData.status || 'pending',
    // FIXED: Set source to 'content-manager' unless explicitly provided (for Excel imports)
    source: questionData.source || 'content-manager',
    // Set submittedBy for tracking who submitted the question
    submittedBy: questionData.createdBy || 'system',
    // Ensure optionExplanations array exists and matches options length
    optionExplanations: questionData.optionExplanations || Array(questionData.options?.length || 0).fill(''),
    // Use mapped difficulty
    difficulty: difficulty
  };
  
  questions.push(newQuestion);
  localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(questions));
  
  console.log(`📋 NEW QUESTION CREATED:`, {
    id: newQuestion.id,
    status: newQuestion.status,
    source: newQuestion.source,
    submittedBy: newQuestion.submittedBy,
    specialty: newQuestion.specialty,
    system: newQuestion.system
  });
  
  // Log the activity
  await logCMSActivity(
    'Question Created',
    `New question created: "${newQuestion.question.substring(0, 50)}..."`,
    questionData.createdBy || 'system',
    'content-manager',
    'creation',
    {
      questionId: newQuestion.id,
      system: newQuestion.system,
      specialty: newQuestion.specialty,
      difficulty: newQuestion.difficulty,
      status: newQuestion.status,
      source: newQuestion.source,
      hasOptionExplanations: !!(newQuestion.optionExplanations && newQuestion.optionExplanations.some((exp: string) => exp.trim()))
    }
  );
  
  return newQuestion;
};



// Fix question difficulties
export const fixQuestionDifficulties = (): { fixed: number; total: number } => {
  try {
    const questions = getFCPSQuestions();
    let fixedCount = 0;
    
    const updatedQuestions = questions.map(question => {
      const originalDifficulty = question.difficulty;
      const standardDifficulty = mapDifficultyToStandard(originalDifficulty);
      
      if (originalDifficulty !== standardDifficulty) {
        fixedCount++;
        return { ...question, difficulty: standardDifficulty };
      }
      
      return question;
    });
    
    if (fixedCount > 0) {
      localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(updatedQuestions));
      console.log(`🔧 Fixed ${fixedCount} questions with invalid difficulties`);
    }
    
    return { fixed: fixedCount, total: questions.length };
  } catch (error) {
    console.error('❌ Error fixing question difficulties:', error);
    return { fixed: 0, total: 0 };
  }
};

// System Requests functions
export const getSystemRequests = (): SystemRequest[] => {
  try {
    const requests = localStorage.getItem('pulseprep_system_requests');
    if (!requests) return [];
    
    const parsedRequests = JSON.parse(requests);
    
    if (!Array.isArray(parsedRequests)) {
      console.error('❌ System requests data is not an array:', typeof parsedRequests);
      localStorage.setItem('pulseprep_system_requests', JSON.stringify([]));
      return [];
    }
    
    return parsedRequests;
  } catch (error) {
    console.error('❌ Error parsing system requests:', error);
    localStorage.setItem('pulseprep_system_requests', JSON.stringify([]));
    return [];
  }
};

export const createSystemRequest = async (requestData: Omit<SystemRequest, 'id' | 'createdAt'>): Promise<SystemRequest> => {
  try {
    const requests = getSystemRequests();
    
    const newRequest: SystemRequest = {
      ...requestData,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    requests.push(newRequest);
    localStorage.setItem('pulseprep_system_requests', JSON.stringify(requests));
    
    console.log(`📝 New system request created: ${newRequest.systemName} (${newRequest.specialty})`);
    
    // Log the activity
    await logCMSActivity(
      'System Request Created',
      `New system request: "${newRequest.systemName}" for ${newRequest.specialty}`,
      requestData.submittedBy || 'system',
      'content-manager',
      'creation',
      {
        requestId: newRequest.id,
        systemName: newRequest.systemName,
        specialty: newRequest.specialty
      }
    );
    
    return newRequest;
  } catch (error) {
    console.error('❌ Error creating system request:', error);
    throw error;
  }
};

export const approveSystemRequest = async (
  requestId: string, 
  adminId: string, 
  adminRole: string
): Promise<boolean> => {
  try {
    const requests = getSystemRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      console.error('❌ System request not found:', requestId);
      return false;
    }
    
    const request = requests[requestIndex];
    
    // Update request status
    requests[requestIndex] = {
      ...request,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date().toISOString()
    };
    
    // Create new medical system
    const systems = getMedicalSystems();
    const newSystem = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // ✅ SURGICAL FIX 1: CORRECTED FIELD MAPPING - Use systemName instead of name
      name: request.systemName || 'Unnamed System',
      
      description: request.description || 'No description provided',
      specialty: request.specialty,
      isActive: true,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminId,
      questionCount: 0,
      isUniversal: false,
      isCustom: true
    };
    
    systems.push(newSystem);
    
    // Save both updates
    localStorage.setItem('pulseprep_system_requests', JSON.stringify(requests));
    localStorage.setItem('pulseprep_medical_systems', JSON.stringify(systems));
    
    // 🔥 FIX 2: TRIGGER CROSS-COMPONENT REFRESH
    window.dispatchEvent(new CustomEvent('medicalSystemsUpdated', {
      detail: { 
        action: 'approved',
        systemId: newSystem.id,
        systemName: newSystem.name,
        specialty: newSystem.specialty,
        adminId: adminId
      }
    }));
    
    console.log(`✅ System request approved and system created: ${newSystem.name}`);
    console.log('🔔 Triggered medicalSystemsUpdated event for other components');
    
    // Log the activity
    await logCMSActivity(
      'System Request Approved',
      `System request approved: "${newSystem.name}" for ${request.specialty}`,
      adminId,
      adminRole,
      'approval',
      {
        requestId: requestId,
        systemName: newSystem.name,
        specialty: request.specialty,
        newSystemId: newSystem.id
      }
    );
    
    return true;
  } catch (error) {
    console.error('❌ Error approving system request:', error);
    return false;
  }
};

export const rejectSystemRequest = async (
  requestId: string, 
  adminId: string, 
  adminRole: string, 
  rejectionReason?: string
): Promise<boolean> => {
  try {
    const requests = getSystemRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      console.error('❌ System request not found:', requestId);
      return false;
    }
    
    const request = requests[requestIndex];
    
    // Update request status
    requests[requestIndex] = {
      ...request,
      status: 'rejected',
      rejectedBy: adminId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionReason || undefined
    };
    
    localStorage.setItem('pulseprep_system_requests', JSON.stringify(requests));
    
    console.log(`❌ System request rejected: ${request.systemName}`);
    
    // Log the activity
    await logCMSActivity(
      'System Request Rejected',
      `System request rejected: "${request.systemName}" for ${request.specialty}`,
      adminId,
      adminRole,
      'rejection',
      {
        requestId: requestId,
        systemName: request.systemName,
        specialty: request.specialty,
        rejectionReason: rejectionReason
      }
    );
    
    return true;
  } catch (error) {
    console.error('❌ Error rejecting system request:', error);
    return false;
  }
};

// Get system question counts by status
export const getSystemQuestionCountsByStatus = (
  systemName: string, 
  specialty: 'medicine' | 'surgery' | 'gynae-obs'
): { total: number; approved: number; pending: number; rejected: number } => {
  try {
    const questions = getFCPSQuestions();
    
    const systemQuestions = questions.filter(q => 
      q.system === systemName && 
      q.specialty === specialty
    );
    
    const counts = {
      total: systemQuestions.length,
      approved: systemQuestions.filter(q => q.status === 'approved').length,
      pending: systemQuestions.filter(q => q.status === 'pending').length,
      rejected: systemQuestions.filter(q => q.status === 'rejected').length
    };
    
    return counts;
  } catch (error) {
    console.error(`❌ Error getting question counts for system ${systemName}:`, error);
    return { total: 0, approved: 0, pending: 0, rejected: 0 };
  }
};

// Get system questions with status filter
export const getSystemQuestions = (
  systemName: string, 
  specialty: 'medicine' | 'surgery' | 'gynae-obs', 
  statusFilter: 'all' | 'approved' | 'pending' | 'rejected' = 'all'
): FCPSQuestion[] => {
  try {
    const questions = getFCPSQuestions();
    
    let filteredQuestions = questions.filter(q => 
      q.system === systemName && 
      q.specialty === specialty
    );
    
    if (statusFilter !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.status === statusFilter);
    }
    
    return filteredQuestions;
  } catch (error) {
    console.error(`❌ Error getting questions for system ${systemName}:`, error);
    return [];
  }
};

// Update FCPS Question
export const updateFCPSQuestion = async (questionId: string, updatedQuestion: FCPSQuestion): Promise<void> => {
  try {
    const questions = getFCPSQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      throw new Error(`Question with ID ${questionId} not found`);
    }
    
    // Update the question
    questions[questionIndex] = {
      ...updatedQuestion,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(questions));
    
    console.log(`✅ Question updated: ${questionId}`);
    
    // Log the activity
    await logCMSActivity(
      'Question Updated',
      `Question updated: "${updatedQuestion.question.substring(0, 50)}..."`,
      updatedQuestion.createdBy || 'system',
      'content-manager',
      'question',
      {
        questionId: questionId,
        system: updatedQuestion.system,
        specialty: updatedQuestion.specialty,
        difficulty: updatedQuestion.difficulty,
        status: updatedQuestion.status
      }
    );
    
  } catch (error) {
    console.error('❌ Error updating FCPS question:', error);
    throw error;
  }
};

// Delete FCPS Question
export const deleteFCPSQuestion = async (questionId: string): Promise<void> => {
  try {
    const questions = getFCPSQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      throw new Error(`Question with ID ${questionId} not found`);
    }
    
    const deletedQuestion = questions[questionIndex];
    
    // Remove the question
    questions.splice(questionIndex, 1);
    
    localStorage.setItem('pulseprep_fcps_questions', JSON.stringify(questions));
    
    console.log(`🗑️ Question deleted: ${questionId}`);
    
    // Log the activity
    await logCMSActivity(
      'Question Deleted',
      `Question deleted: "${deletedQuestion.question.substring(0, 50)}..."`,
      'system',
      'content-manager',
      'deletion',
      {
        questionId: questionId,
        system: deletedQuestion.system,
        specialty: deletedQuestion.specialty,
        difficulty: deletedQuestion.difficulty,
        status: deletedQuestion.status
      }
    );
    
  } catch (error) {
    console.error('❌ Error deleting FCPS question:', error);
    throw error;
  }
};