import { MockExamSet, MockExamQuestion, SpecialtyType } from '../types';

// Import safe storage utilities
import { safeGetItem, safeSetItem } from './storageUtils';

// Generate a unique ID for mock exam sets
const generateId = (): string => {
  return `mock-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get all mock exam sets or filter by specialty
export const getMockExamSets = async (specialty?: SpecialtyType): Promise<MockExamSet[]> => {
  try {
    let allSets: MockExamSet[] = [];
    
    if (specialty) {
      // ✅ FIXED: Use safe storage with array validation
      const rawSpecialtySets = safeGetItem(`pulseprep_mock_exam_sets_${specialty}`, []);
      const specialtySets = Array.isArray(rawSpecialtySets) ? rawSpecialtySets : [];
      allSets = specialtySets;
      
      console.log(`📊 getMockExamSets debug for ${specialty}:`, {
        rawType: typeof rawSpecialtySets,
        isArray: Array.isArray(rawSpecialtySets),
        length: specialtySets.length,
        approved: specialtySets.filter(s => s && s.status === 'approved').length,
        active: specialtySets.filter(s => s && s.isActive).length,
        approvedAndActive: specialtySets.filter(s => s && s.status === 'approved' && s.isActive).length
      });
    } else {
      // ✅ FIXED: Use safe storage with array validation
      const rawAllSetsStored = safeGetItem('pulseprep_mock_exam_sets', []);
      const allSetsStored = Array.isArray(rawAllSetsStored) ? rawAllSetsStored : [];
      
      if (allSetsStored.length > 0) {
        allSets = allSetsStored;
      } else {
        // Fallback: combine all specialty sets
        const specialties: SpecialtyType[] = ['medicine', 'surgery', 'gynae-obs'];
        for (const spec of specialties) {
          const rawSpecialtySets = safeGetItem(`pulseprep_mock_exam_sets_${spec}`, []);
          const specialtySets = Array.isArray(rawSpecialtySets) ? rawSpecialtySets : [];
          allSets.push(...specialtySets);
        }
        
        // Enhanced deduplication: handle both ID-based and name-based duplicates
        const deduplicatedSets = new Map<string, MockExamSet>();
        
        // Step 1: Deduplicate by ID (same mock exam, different timestamps)
        allSets.forEach(set => {
          if (!set || !set.id) return; // Skip invalid sets
          
          const existingSet = deduplicatedSets.get(set.id);
          
          if (!existingSet) {
            // First occurrence of this ID
            deduplicatedSets.set(set.id, set);
          } else {
            // Compare updatedAt timestamps to keep the most recent version
            const currentUpdatedAt = new Date(set.updatedAt || set.createdAt || 0);
            const existingUpdatedAt = new Date(existingSet.updatedAt || existingSet.createdAt || 0);
            
            if (currentUpdatedAt > existingUpdatedAt) {
              // Current set is more recent, replace the existing one
              deduplicatedSets.set(set.id, set);
            }
            // Otherwise, keep the existing set (it's more recent)
          }
        });
        
        // Step 2: Deduplicate by name+specialty (different IDs, same name)
        const finalDeduplicatedSets = new Map<string, MockExamSet>();
        
        Array.from(deduplicatedSets.values()).forEach(set => {
          if (!set || !set.name || !set.specialty) return; // Skip invalid sets
          
          const nameSpecialtyKey = `${set.name}_${set.specialty}`;
          const existingSet = finalDeduplicatedSets.get(nameSpecialtyKey);
          
          if (!existingSet) {
            // First occurrence of this name+specialty combination
            finalDeduplicatedSets.set(nameSpecialtyKey, set);
          } else {
            // Compare updatedAt timestamps to keep the most recent version
            const currentUpdatedAt = new Date(set.updatedAt || set.createdAt || 0);
            const existingUpdatedAt = new Date(existingSet.updatedAt || existingSet.createdAt || 0);
            
            if (currentUpdatedAt > existingUpdatedAt) {
              // Current set is more recent, replace the existing one
              finalDeduplicatedSets.set(nameSpecialtyKey, set);
            }
            // Otherwise, keep the existing set (it's more recent)
          }
        });
        
        // Convert back to array
        allSets = Array.from(finalDeduplicatedSets.values());
      }
    }
    
    // ✅ FIXED: Filter out invalid sets
    const validSets = allSets.filter(set => set && set.id && set.name && set.specialty);
    
    console.log(`📊 getMockExamSets result for ${specialty || 'all'}:`, {
      total: allSets.length,
      valid: validSets.length,
      approved: validSets.filter(s => s.status === 'approved').length,
      active: validSets.filter(s => s.isActive).length,
      approvedAndActive: validSets.filter(s => s.status === 'approved' && s.isActive).length,
      sets: validSets.map(s => ({ 
        name: s.name, 
        status: s.status, 
        isActive: s.isActive, 
        specialty: s.specialty 
      }))
    });
    
    return validSets;
  } catch (error) {
    console.error('❌ Error getting mock exam sets:', error);
    return [];
  }
};

// Add a new mock exam set
export const addMockExamSet = async (setData: Omit<MockExamSet, 'id'>): Promise<MockExamSet> => {
  try {
    const newSet: MockExamSet = {
      ...setData,
      id: generateId(),
      createdAt: setData.createdAt || new Date().toISOString(),
      updatedAt: setData.updatedAt || new Date().toISOString(),
      status: setData.status || 'pending'
    };
    
    console.log(`➕ Adding mock exam set: ${newSet.name} for ${newSet.specialty}`, {
      id: newSet.id,
      status: newSet.status,
      isActive: newSet.isActive
    });
    
    // Get all existing sets
    const allSets = await getMockExamSets();
    allSets.push(newSet);
    
    // ✅ FIXED: Use safe storage
    const mainSuccess = safeSetItem('pulseprep_mock_exam_sets', allSets);
    
    // Also save to specialty-specific storage
    const specialtySets = allSets.filter(set => set && set.specialty === setData.specialty);
    const specialtySuccess = safeSetItem(`pulseprep_mock_exam_sets_${setData.specialty}`, specialtySets);
    
    if (mainSuccess && specialtySuccess) {
      console.log(`✅ Successfully added mock exam set: ${newSet.name} for ${newSet.specialty}`);
    } else {
      console.warn(`⚠️ Mock exam set added but save failed due to storage quota: ${newSet.name}`);
    }
    
    return newSet;
  } catch (error) {
    console.error('❌ Error adding mock exam set:', error);
    throw error;
  }
};

// Update an existing mock exam set
export const updateMockExamSet = async (setId: string, updatedData: Partial<MockExamSet>): Promise<MockExamSet> => {
  try {
    const allSets = await getMockExamSets();
    const setIndex = allSets.findIndex(set => set && set.id === setId);
    
    if (setIndex === -1) {
      throw new Error('Mock exam set not found');
    }
    
    const updatedSet = {
      ...allSets[setIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    allSets[setIndex] = updatedSet;
    
    // ✅ FIXED: Use safe storage
    const mainSuccess = safeSetItem('pulseprep_mock_exam_sets', allSets);
    
    // Also update in specialty-specific storage
    const specialtySets = allSets.filter(set => set && set.specialty === updatedSet.specialty);
    const specialtySuccess = safeSetItem(`pulseprep_mock_exam_sets_${updatedSet.specialty}`, specialtySets);
    
    if (!mainSuccess || !specialtySuccess) {
      console.warn('⚠️ Mock exam set updated but save failed due to storage quota');
    }
    
    return updatedSet;
  } catch (error) {
    console.error('❌ Error updating mock exam set:', error);
    throw error;
  }
};

// Delete a mock exam set
export const deleteMockExamSet = async (setId: string): Promise<void> => {
  try {
    const allSets = await getMockExamSets();
    const setToDelete = allSets.find(set => set && set.id === setId);
    
    if (!setToDelete) {
      throw new Error('Mock exam set not found');
    }
    
    const updatedSets = allSets.filter(set => set && set.id !== setId);
    
    // ✅ FIXED: Use safe storage
    const mainSuccess = safeSetItem('pulseprep_mock_exam_sets', updatedSets);
    
    // Update specialty-specific storage
    const specialtySets = updatedSets.filter(set => set && set.specialty === setToDelete.specialty);
    const specialtySuccess = safeSetItem(`pulseprep_mock_exam_sets_${setToDelete.specialty}`, specialtySets);
    
    if (!mainSuccess || !specialtySuccess) {
      console.warn('⚠️ Mock exam set deleted but save failed due to storage quota');
    }
  } catch (error) {
    console.error('❌ Error deleting mock exam set:', error);
    throw error;
  }
};

// Get mock exam questions for a specific specialty
export const getMockExamQuestions = async (specialty: SpecialtyType): Promise<MockExamQuestion[]> => {
  try {
    // ✅ FIXED: Use safe storage with array validation
    const rawQuestions = safeGetItem(`pulseprep_mock_exam_questions_${specialty}`, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    // Filter out invalid questions
    const validQuestions = questions.filter(q => q && q.id && q.question);
    
    return validQuestions;
  } catch (error) {
    console.error('❌ Error getting mock exam questions:', error);
    return [];
  }
};

// Add a mock exam question
export const addMockExamQuestion = async (questionData: Omit<MockExamQuestion, 'id'>): Promise<MockExamQuestion> => {
  try {
    const newQuestion: MockExamQuestion = {
      ...questionData,
      id: `mock-question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: questionData.createdAt || new Date().toISOString(),
      updatedAt: questionData.updatedAt || new Date().toISOString(),
      status: questionData.status || 'pending'
    };
    
    const existingQuestions = await getMockExamQuestions(questionData.specialty);
    existingQuestions.push(newQuestion);
    
    // ✅ FIXED: Use safe storage
    const success = safeSetItem(
      `pulseprep_mock_exam_questions_${questionData.specialty}`,
      existingQuestions
    );
    
    if (!success) {
      console.warn('⚠️ Mock exam question added but save failed due to storage quota');
    }
    
    return newQuestion;
  } catch (error) {
    console.error('❌ Error adding mock exam question:', error);
    throw error;
  }
};

// Update mock exam question status (for admin approval)
export const updateMockExamQuestionStatus = async (
  questionId: string,
  specialty: SpecialtyType,
  status: 'approved' | 'rejected' | 'pending',
  rejectionReason?: string
): Promise<void> => {
  try {
    const questions = await getMockExamQuestions(specialty);
    const questionIndex = questions.findIndex(q => q && q.id === questionId);
    
    if (questionIndex === -1) {
      throw new Error('Mock exam question not found');
    }
    
    questions[questionIndex].status = status;
    questions[questionIndex].updatedAt = new Date().toISOString();
    
    if (status === 'rejected' && rejectionReason) {
      questions[questionIndex].rejectionReason = rejectionReason;
    }
    
    // ✅ FIXED: Use safe storage
    const success = safeSetItem(
      `pulseprep_mock_exam_questions_${specialty}`,
      questions
    );
    
    if (!success) {
      console.warn('⚠️ Mock exam question status updated but save failed due to storage quota');
    }
  } catch (error) {
    console.error('❌ Error updating mock exam question status:', error);
    throw error;
  }
};

// Update mock exam set status (for admin approval)
export const updateMockExamSetStatus = async (
  setId: string,
  status: 'approved' | 'rejected' | 'pending',
  rejectionReason?: string
): Promise<void> => {
  try {
    const allSets = await getMockExamSets();
    const setIndex = allSets.findIndex(set => set && set.id === setId);
    
    if (setIndex === -1) {
      throw new Error('Mock exam set not found');
    }
    
    allSets[setIndex].status = status;
    allSets[setIndex].updatedAt = new Date().toISOString();
    
    if (status === 'rejected' && rejectionReason) {
      allSets[setIndex].rejectionReason = rejectionReason;
    }
    
    // ✅ FIXED: Use safe storage
    const mainSuccess = safeSetItem('pulseprep_mock_exam_sets', allSets);
    
    // Update specialty-specific storage
    const specialty = allSets[setIndex].specialty;
    const specialtySets = allSets.filter(set => set && set.specialty === specialty);
    const specialtySuccess = safeSetItem(`pulseprep_mock_exam_sets_${specialty}`, specialtySets);
    
    if (!mainSuccess || !specialtySuccess) {
      console.warn('⚠️ Mock exam set status updated but save failed due to storage quota');
    }
  } catch (error) {
    console.error('❌ Error updating mock exam set status:', error);
    throw error;
  }
};

// Get mock exam set by ID
export const getMockExamSetById = async (setId: string): Promise<MockExamSet | null> => {
  try {
    const allSets = await getMockExamSets();
    return allSets.find(set => set && set.id === setId) || null;
  } catch (error) {
    console.error('❌ Error getting mock exam set by ID:', error);
    return null;
  }
};

// Get approved mock exam sets for a specialty (used by students)
export const getApprovedMockExamSets = async (specialty: SpecialtyType): Promise<MockExamSet[]> => {
  try {
    const allSets = await getMockExamSets(specialty);
    const approvedSets = allSets.filter(set => set && set.status === 'approved' && set.isActive);
    
    console.log(`📊 getApprovedMockExamSets for ${specialty}:`, {
      total: allSets.length,
      approved: approvedSets.length,
      sets: approvedSets.map(s => ({ name: s.name, status: s.status, isActive: s.isActive }))
    });
    
    return approvedSets;
  } catch (error) {
    console.error('❌ Error getting approved mock exam sets:', error);
    return [];
  }
};

// Get pending mock exam sets (for admin approval)
export const getPendingMockExamSets = async (): Promise<MockExamSet[]> => {
  try {
    const allSets = await getMockExamSets();
    return allSets.filter(set => set && set.status === 'pending');
  } catch (error) {
    console.error('❌ Error getting pending mock exam sets:', error);
    return [];
  }
};

// 🔧 FIXED: Get pending mock exam questions (for admin approval) - Updated to check new storage format
export const getPendingMockExamQuestions = async (): Promise<MockExamQuestion[]> => {
  try {
    const specialties: SpecialtyType[] = ['medicine', 'surgery', 'gynae-obs'];
    let allPendingQuestions: MockExamQuestion[] = [];
    
    console.log('🔍 Searching for pending mock exam questions...');
    
    for (const specialty of specialties) {
      console.log(`📋 Checking ${specialty} specialty...`);
      
      // Check old storage format (legacy)
      const legacyQuestions = await getMockExamQuestions(specialty);
      const legacyPending = legacyQuestions.filter(q => q && q.status === 'pending');
      if (legacyPending.length > 0) {
        console.log(`📊 Found ${legacyPending.length} pending questions in legacy storage for ${specialty}`);
        allPendingQuestions.push(...legacyPending);
      }
      
      // Check new storage format (per mock exam)
      const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
      
      for (const mockExam of mockExams) {
        const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
        const rawQuestions = safeGetItem(storageKey, []);
        const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
        
        const pendingQuestions = questions.filter(q => q && q.status === 'pending').map(q => ({
          ...q,
          // Ensure we have the proper format for admin interface
          specialty: specialty,
          mockExam: mockExam,
          id: q.id || `${specialty}-${mockExam}-${Date.now()}`,
          question: q.question || q.questionText || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'Medium',
          system: q.system || q.category || 'General',
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.updatedAt || new Date().toISOString(),
          status: q.status || 'pending'
        }));
        
        if (pendingQuestions.length > 0) {
          console.log(`📊 Found ${pendingQuestions.length} pending questions in ${specialty}/${mockExam}`);
          allPendingQuestions.push(...pendingQuestions);
        }
      }
    }
    
    console.log(`🔍 Total pending mock exam questions found: ${allPendingQuestions.length}`);
    console.log('📊 Breakdown by specialty:', specialties.map(s => ({
      specialty: s,
      count: allPendingQuestions.filter(q => q.specialty === s).length
    })));
    
    return allPendingQuestions;
  } catch (error) {
    console.error('❌ Error getting pending mock exam questions:', error);
    return [];
  }
};

// 🆕 NEW: Get all mock exam questions from new storage format (for admin interface)
export const getAllMockExamQuestionsFromNewStorage = async (): Promise<any[]> => {
  try {
    const specialties: SpecialtyType[] = ['medicine', 'surgery', 'gynae-obs'];
    const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
    let allQuestions: any[] = [];
    
    console.log('🔍 Loading all mock exam questions from new storage format...');
    
    for (const specialty of specialties) {
      for (const mockExam of mockExams) {
        const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
        const rawQuestions = safeGetItem(storageKey, []);
        const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
        
        const formattedQuestions = questions.map(q => ({
          ...q,
          specialty: specialty,
          mockExam: mockExam,
          id: q.id || `${specialty}-${mockExam}-${Date.now()}`,
          question: q.question || q.questionText || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'Medium',
          system: q.system || q.category || 'General',
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.updatedAt || new Date().toISOString(),
          status: q.status || 'pending'
        }));
        
        if (formattedQuestions.length > 0) {
          console.log(`📊 Loaded ${formattedQuestions.length} questions from ${specialty}/${mockExam}`);
          allQuestions.push(...formattedQuestions);
        }
      }
    }
    
    console.log(`🔍 Total mock exam questions loaded: ${allQuestions.length}`);
    return allQuestions;
  } catch (error) {
    console.error('❌ Error getting all mock exam questions:', error);
    return [];
  }
};

// 🆕 NEW: Update question status in new storage format
export const updateMockExamQuestionStatusInNewStorage = async (
  questionId: string,
  specialty: SpecialtyType,
  mockExam: string,
  status: 'approved' | 'rejected' | 'pending',
  rejectionReason?: string
): Promise<boolean> => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    const questionIndex = questions.findIndex(q => q && q.id === questionId);
    
    if (questionIndex === -1) {
      console.error(`❌ Question with ID ${questionId} not found in ${specialty}/${mockExam}`);
      return false;
    }
    
    // Update the question status
    questions[questionIndex].status = status;
    questions[questionIndex].updatedAt = new Date().toISOString();
    
    if (status === 'rejected' && rejectionReason) {
      questions[questionIndex].rejectionReason = rejectionReason;
    }
    
    const success = safeSetItem(storageKey, questions);
    
    if (success) {
      console.log(`✅ Successfully updated question ${questionId} status to ${status} in ${specialty}/${mockExam}`);
    } else {
      console.warn(`⚠️ Failed to save question status update due to storage quota`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error updating mock exam question status in new storage:', error);
    return false;
  }
};

// Debug function to show mock exam storage state
export const debugMockExamStorage = (): void => {
  console.log('🧪 MOCK EXAM STORAGE DEBUG:');
  console.log('============================');
  
  const specialties: SpecialtyType[] = ['medicine', 'surgery', 'gynae-obs'];
  
  specialties.forEach(specialty => {
    // ✅ FIXED: Use safe storage
    const rawSets = safeGetItem(`pulseprep_mock_exam_sets_${specialty}`, []);
    const rawQuestions = safeGetItem(`pulseprep_mock_exam_questions_${specialty}`, []);
    
    const sets = Array.isArray(rawSets) ? rawSets : [];
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    console.log(`📊 ${specialty.toUpperCase()}:`);
    console.log(`  Sets: ${sets.length} (${sets.filter((s: any) => s && s.status === 'approved').length} approved, ${sets.filter((s: any) => s && s.status === 'pending').length} pending)`);
    console.log(`  Active Sets: ${sets.filter((s: any) => s && s.isActive).length}`);
    console.log(`  Approved & Active Sets: ${sets.filter((s: any) => s && s.status === 'approved' && s.isActive).length}`);
    console.log(`  Set Details:`, sets.map((s: any) => ({ 
      name: s?.name || 'INVALID', 
      status: s?.status || 'MISSING', 
      isActive: s?.isActive !== undefined ? s.isActive : 'MISSING' 
    })));
    console.log(`  Legacy Questions: ${questions.length} (${questions.filter((q: any) => q && q.status === 'approved').length} approved, ${questions.filter((q: any) => q && q.status === 'pending').length} pending)`);
    
    // 🆕 NEW: Debug new storage format
    const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
    let totalNewQuestions = 0;
    let totalNewPending = 0;
    let totalNewApproved = 0;
    
    mockExams.forEach(mockExam => {
      const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
      const rawMockQuestions = safeGetItem(storageKey, []);
      const mockQuestions = Array.isArray(rawMockQuestions) ? rawMockQuestions : [];
      
      if (mockQuestions.length > 0) {
        const pending = mockQuestions.filter(q => q && q.status === 'pending').length;
        const approved = mockQuestions.filter(q => q && q.status === 'approved').length;
        
        totalNewQuestions += mockQuestions.length;
        totalNewPending += pending;
        totalNewApproved += approved;
        
        console.log(`    ${mockExam}: ${mockQuestions.length} questions (${approved} approved, ${pending} pending)`);
      }
    });
    
    console.log(`  New Format Total: ${totalNewQuestions} questions (${totalNewApproved} approved, ${totalNewPending} pending)`);
  });
  
  // ✅ FIXED: Use safe storage for all sets
  const rawAllSets = safeGetItem('pulseprep_mock_exam_sets', []);
  const allSets = Array.isArray(rawAllSets) ? rawAllSets : [];
  console.log(`📊 TOTAL SETS: ${allSets.length}`);
  console.log('============================');
};

// ✅ NEW: Force refresh mock exam sets - useful for debugging
export const forceRefreshMockExamSets = (): void => {
  try {
    console.log('🔄 Force refreshing mock exam sets...');
    
    const specialties: SpecialtyType[] = ['medicine', 'surgery', 'gynae-obs'];
    let allSets: MockExamSet[] = [];
    
    // Collect all sets from specialty-specific storage
    specialties.forEach(specialty => {
      const rawSets = safeGetItem(`pulseprep_mock_exam_sets_${specialty}`, []);
      const sets = Array.isArray(rawSets) ? rawSets : [];
      allSets.push(...sets);
    });
    
    // Save to main storage
    safeSetItem('pulseprep_mock_exam_sets', allSets);
    
    console.log(`✅ Force refresh complete: ${allSets.length} total sets consolidated`);
    
    // Debug the results
    debugMockExamStorage();
  } catch (error) {
    console.error('❌ Error in force refresh mock exam sets:', error);
  }
};

// 🆕 NEW: Function to clean up duplicate mock exam sets
export const cleanupDuplicateMockExamSets = async (specialty: SpecialtyType): Promise<{ cleaned: number; total: number }> => {
  try {
    console.log(`🧹 Cleaning up duplicate mock exam sets for ${specialty}...`);
    
    const sets = await getMockExamSets(specialty);
    const uniqueSets = new Map<string, MockExamSet>();
    let duplicatesRemoved = 0;
    
    // Keep only one version of each mock exam name (preferring system-created ones)
    for (const set of sets) {
      const key = set.name.toLowerCase().trim();
      
      if (uniqueSets.has(key)) {
        const existing = uniqueSets.get(key)!;
        
        // Prefer system-created sets, or newer sets if both are system/user created
        if (set.createdBy === 'System' && existing.createdBy !== 'System') {
          uniqueSets.set(key, set);
          duplicatesRemoved++;
        } else if (set.createdBy !== 'System' && existing.createdBy === 'System') {
          duplicatesRemoved++;
          // Keep existing system set
        } else {
          // Both are same type, keep the newer one
          const setDate = new Date(set.createdAt);
          const existingDate = new Date(existing.createdAt);
          
          if (setDate > existingDate) {
            uniqueSets.set(key, set);
          }
          duplicatesRemoved++;
        }
      } else {
        uniqueSets.set(key, set);
      }
    }
    
    // Save the cleaned sets back to storage
    const cleanedSets = Array.from(uniqueSets.values());
    const key = `pulseprep_mock_exam_sets_${specialty}`;
    safeSetItem(key, cleanedSets);
    
    // Update main storage as well
    const allSets = await getMockExamSets();
    const filteredAllSets = allSets.filter(s => s.specialty !== specialty);
    filteredAllSets.push(...cleanedSets);
    safeSetItem('pulseprep_mock_exam_sets', filteredAllSets);
    
    console.log(`✅ Cleaned up ${duplicatesRemoved} duplicate sets for ${specialty}. ${cleanedSets.length} sets remaining.`);
    
    return {
      cleaned: duplicatesRemoved,
      total: cleanedSets.length
    };
  } catch (error) {
    console.error(`❌ Error cleaning up duplicate mock exam sets for ${specialty}:`, error);
    return { cleaned: 0, total: 0 };
  }
};

// 🆕 NEW FUNCTIONS - Added for mock exam question import system (SEPARATE from practice sessions)

/**
 * Get mock exam questions for a specific mock exam set
 * SEPARATE STORAGE from practice sessions
 */
export const getMockExamQuestionsBySet = (specialty: SpecialtyType, mockExam: string, includeAllStatuses: boolean = false): any[] => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    let filteredQuestions;
    if (includeAllStatuses) {
      // Return all questions (for management interfaces)
      filteredQuestions = questions.filter(q => q);
    } else {
      // Return only approved questions (for students)
      filteredQuestions = questions.filter(q => q && q.status === 'approved');
    }
    
    console.log(`📚 getMockExamQuestionsBySet for ${specialty}/${mockExam}:`, {
      total: questions.length,
      approved: questions.filter(q => q && q.status === 'approved').length,
      pending: questions.filter(q => q && q.status === 'pending').length,
      returned: filteredQuestions.length,
      includeAllStatuses,
      storageKey
    });
    
    return filteredQuestions;
  } catch (error) {
    console.error('❌ Error loading mock exam questions by set:', error);
    return [];
  }
};

/**
 * Add bulk mock exam questions for a specific mock exam
 * SEPARATE STORAGE from practice sessions
 */
export const addMockExamQuestionsBulk = (specialty: SpecialtyType, mockExam: string, questions: any[]): boolean => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const existingQuestions = safeGetItem(storageKey, []);
    const allQuestions = Array.isArray(existingQuestions) ? [...existingQuestions, ...questions] : questions;
    
    const success = safeSetItem(storageKey, allQuestions);
    
    if (success) {
      console.log(`✅ Successfully added ${questions.length} questions to ${specialty}/${mockExam}`);
    } else {
      console.warn(`⚠️ Failed to save ${questions.length} questions for ${specialty}/${mockExam} due to storage quota`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error saving mock exam questions bulk:', error);
    return false;
  }
};

/**
 * Get question counts for all mock exams in a specialty
 * Returns summary data for dashboard display
 */
export const getMockExamQuestionCounts = (specialty: SpecialtyType): any[] => {
  const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
  
  return mockExams.map(mockExam => {
    try {
      const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
      const rawQuestions = safeGetItem(storageKey, []);
      const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
      
      return {
        name: mockExam,
        total: questions.length,
        approved: questions.filter(q => q && q.status === 'approved').length,
        pending: questions.filter(q => q && q.status === 'pending').length
      };
    } catch (error) {
      console.error(`❌ Error getting question count for ${specialty}/${mockExam}:`, error);
      return {
        name: mockExam,
        total: 0,
        approved: 0,
        pending: 0
      };
    }
  });
};

/**
 * Update a specific mock exam question
 */
export const updateMockExamQuestion = (
  specialty: SpecialtyType, 
  mockExam: string, 
  questionId: string, 
  updatedQuestion: any
): boolean => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    const questionIndex = questions.findIndex(q => q && q.id === questionId);
    
    if (questionIndex === -1) {
      console.error(`❌ Question with ID ${questionId} not found`);
      return false;
    }
    
    // Update the question
    questions[questionIndex] = {
      ...questions[questionIndex],
      ...updatedQuestion,
      updatedAt: new Date().toISOString(),
      // Reset status to pending when edited by content manager
      status: 'pending'
    };
    
    const success = safeSetItem(storageKey, questions);
    
    if (success) {
      console.log(`✅ Successfully updated question ${questionId} in ${specialty}/${mockExam}`);
    } else {
      console.warn(`⚠️ Failed to save updated question ${questionId} due to storage quota`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error updating mock exam question:', error);
    return false;
  }
};

/**
 * Delete a specific mock exam question
 */
export const deleteMockExamQuestion = (
  specialty: SpecialtyType, 
  mockExam: string, 
  questionId: string
): boolean => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    const questionIndex = questions.findIndex(q => q && q.id === questionId);
    
    if (questionIndex === -1) {
      console.error(`❌ Question with ID ${questionId} not found`);
      return false;
    }
    
    // Remove the question
    questions.splice(questionIndex, 1);
    
    const success = safeSetItem(storageKey, questions);
    
    if (success) {
      console.log(`✅ Successfully deleted question ${questionId} from ${specialty}/${mockExam}`);
    } else {
      console.warn(`⚠️ Failed to save after deleting question ${questionId} due to storage quota`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error deleting mock exam question:', error);
    return false;
  }
};

/**
 * Update question status (for admin approval)
 */
export const updateMockExamQuestionStatusBySet = (
  specialty: SpecialtyType,
  mockExam: string,
  questionId: string,
  status: 'approved' | 'rejected' | 'pending',
  rejectionReason?: string
): boolean => {
  try {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    const questionIndex = questions.findIndex(q => q && q.id === questionId);
    
    if (questionIndex === -1) {
      console.error(`❌ Question with ID ${questionId} not found`);
      return false;
    }
    
    // Update the question status
    questions[questionIndex].status = status;
    questions[questionIndex].updatedAt = new Date().toISOString();
    
    if (status === 'rejected' && rejectionReason) {
      questions[questionIndex].rejectionReason = rejectionReason;
    }
    
    const success = safeSetItem(storageKey, questions);
    
    if (success) {
      console.log(`✅ Successfully updated question ${questionId} status to ${status} in ${specialty}/${mockExam}`);
    } else {
      console.warn(`⚠️ Failed to save question status update due to storage quota`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error updating mock exam question status:', error);
    return false;
  }
};

/**
 * Debug function to check what questions are stored for each mock exam
 */
export const debugMockExamQuestions = (specialty: SpecialtyType): void => {
  console.log('🔍 DEBUG: Mock Exam Questions Storage');
  console.log('=====================================');
  
  const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
  
  mockExams.forEach(mockExam => {
    const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
    const rawQuestions = safeGetItem(storageKey, []);
    const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
    
    console.log(`📋 ${mockExam}:`);
    console.log(`  Storage Key: ${storageKey}`);
    console.log(`  Total Questions: ${questions.length}`);
    
    if (questions.length > 0) {
      const approved = questions.filter(q => q && q.status === 'approved').length;
      const pending = questions.filter(q => q && q.status === 'pending').length;
      const rejected = questions.filter(q => q && q.status === 'rejected').length;
      
      console.log(`  Approved: ${approved}`);
      console.log(`  Pending: ${pending}`);
      console.log(`  Rejected: ${rejected}`);
      
      // Show first question as sample
      const firstQuestion = questions[0];
      console.log(`  Sample Question:`, {
        id: firstQuestion?.id,
        question: firstQuestion?.question?.substring(0, 50) + '...',
        status: firstQuestion?.status,
        specialty: firstQuestion?.specialty,
        mockExam: firstQuestion?.mockExam,
        createdAt: firstQuestion?.createdAt
      });
    }
    console.log('');
  });
  
  console.log('=====================================');
};

// Export additional functions with aliases (only generateId alias to avoid duplicates)
export {
  generateId as generateMockExamSetId
};

export type { MockExamSet } from '../types';