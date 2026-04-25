import { SpecialtyType, MCQQuestion } from '../types';

export interface BookmarkData {
  id: string;
  userId: string;
  questionId: string;
  specialty: SpecialtyType;
  system: string;
  bookmarkedAt: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  // Store question data for offline access
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
}

// ✅ ADDED: SimpleBookmark interface for BookmarkReviewPage compatibility
export interface SimpleBookmark {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  system: string;
  difficulty: string;
  bookmarkedAt: string;
  note?: string;
}

export const BookmarkService = {
  /**
   * Get storage key for specialty bookmarks
   */
  getStorageKey: (specialty: SpecialtyType): string => {
    return `pulseprep_bookmarks_${specialty}`;
  },

  /**
   * Get all bookmarks for a specialty
   */
  getBookmarks: (specialty: SpecialtyType): SimpleBookmark[] => {
    try {
      const storageKey = BookmarkService.getStorageKey(specialty);
      const bookmarksJson = localStorage.getItem(storageKey);
      if (!bookmarksJson) return [];
      
      const bookmarks = JSON.parse(bookmarksJson);
      if (!Array.isArray(bookmarks)) return [];
      
      // Convert BookmarkData to SimpleBookmark format for compatibility
      return bookmarks.map((bookmark: BookmarkData) => ({
        id: bookmark.id,
        question: bookmark.questionText,
        options: bookmark.options,
        correctAnswer: bookmark.correctAnswer,
        explanation: bookmark.explanation,
        system: bookmark.system,
        difficulty: bookmark.difficulty,
        bookmarkedAt: bookmark.bookmarkedAt,
        note: bookmark.notes
      }));
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  /**
   * Save bookmarks for a specialty
   */
  saveBookmarks: (specialty: SpecialtyType, bookmarks: BookmarkData[]): boolean => {
    try {
      const storageKey = BookmarkService.getStorageKey(specialty);
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
      console.log(`✅ Saved ${bookmarks.length} bookmarks for ${specialty}`);
      return true;
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      return false;
    }
  },

  /**
   * Get raw bookmark data (internal format)
   */
  getRawBookmarks: (specialty: SpecialtyType): BookmarkData[] => {
    try {
      const storageKey = BookmarkService.getStorageKey(specialty);
      const bookmarksJson = localStorage.getItem(storageKey);
      if (!bookmarksJson) return [];
      
      const bookmarks = JSON.parse(bookmarksJson);
      return Array.isArray(bookmarks) ? bookmarks : [];
    } catch (error) {
      console.error('Error getting raw bookmarks:', error);
      return [];
    }
  },

  /**
   * ✅ UPDATED: Get all available systems from CMS (not just bookmarked systems)
   * This ensures all 24 systems appear in filters and new systems added by content managers are included
   */
  getAvailableSystems: async (specialty: SpecialtyType): Promise<string[]> => {
    try {
      // Import getMedicalSystems dynamically to avoid circular dependencies
      const { getMedicalSystems } = await import('./cmsUtils');
      
      console.log(`🔖 Getting available systems for ${specialty} specialty from CMS...`);
      
      // Get all medical systems for the specialty from CMS
      const medicalSystems = await getMedicalSystems(specialty);
      
      // Extract system names and sort them alphabetically
      const systemNames = medicalSystems
        .filter(system => system.isVisible !== false) // Only include visible systems
        .map(system => system.name)
        .sort();
      
      console.log(`🔖 Found ${systemNames.length} available systems for ${specialty}:`, systemNames);
      
      return systemNames;
      
    } catch (error) {
      console.error('Error getting available systems from CMS:', error);
      
      // Fallback: get systems from existing bookmarks if CMS fails
      console.log('🔖 Falling back to systems from existing bookmarks...');
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const systemsSet = new Set<string>();
      
      bookmarks.forEach(bookmark => {
        if (bookmark.system) {
          systemsSet.add(bookmark.system);
        }
      });
      
      // Return sorted array of unique system names from bookmarks as fallback
      const fallbackSystems = Array.from(systemsSet).sort();
      console.log(`🔖 Fallback: found ${fallbackSystems.length} systems from bookmarks:`, fallbackSystems);
      
      return fallbackSystems;
    }
  },

  /**
   * ✅ ADDED: Synchronous version for compatibility (returns cached data)
   */
  getAvailableSystemsSync: (specialty: SpecialtyType): string[] => {
    try {
      // Get medical systems from localStorage cache
      const medicalSystems = JSON.parse(localStorage.getItem('pulseprep_medical_systems') || '[]');
      
      // Filter systems for the specialty
      const specialtySystems = medicalSystems.filter((system: any) => {
        return (system.specialty === specialty || system.isUniversal) && system.isVisible !== false;
      });
      
      // Extract and sort system names
      const systemNames = specialtySystems
        .map((system: any) => system.name)
        .sort();
      
      console.log(`🔖 Sync: Found ${systemNames.length} available systems for ${specialty}:`, systemNames);
      
      return systemNames;
      
    } catch (error) {
      console.error('Error getting available systems sync:', error);
      
      // Fallback to bookmarked systems
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const systemsSet = new Set<string>();
      
      bookmarks.forEach(bookmark => {
        if (bookmark.system) {
          systemsSet.add(bookmark.system);
        }
      });
      
      return Array.from(systemsSet).sort();
    }
  },

  /**
   * Check if a question is bookmarked
   */
  isBookmarked: (questionId: string, specialty: SpecialtyType): boolean => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    return bookmarks.some(bookmark => String(bookmark.questionId) === String(questionId));
  },

  /**
   * Add a bookmark
   */
  addBookmark: (question: MCQQuestion, specialty: SpecialtyType, notes?: string): boolean => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      
      // Check if already bookmarked
      if (BookmarkService.isBookmarked(String(question.id), specialty)) {
        console.log('Question already bookmarked');
        return false;
      }

      // Get current user ID (fallback if not available)
      const currentUser = localStorage.getItem('pulseprep_user');
      let userId = 'anonymous';
      
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          userId = userData.id || userData.email || 'anonymous';
        } catch (e) {
          console.warn('Could not parse user data for bookmark');
        }
      }

      const bookmark: BookmarkData = {
        id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        questionId: question.id,
        specialty,
        system: question.system,
        bookmarkedAt: new Date().toISOString(),
        notes: notes || '',
        priority: 'medium',
        tags: question.tags || [],
        // Store question data for offline access
        questionText: question.question,
        options: question.options.map(opt => {
          if (typeof opt === 'string') {
            return opt;
          }
          if (opt && typeof opt === 'object' && 'text' in opt) {
            return (opt as any).text;
          }
          return String(opt);
        }),
        correctAnswer: question.correctAnswer, // ✅ FIXED: Changed from question.correct to question.correctAnswer
        explanation: question.explanation,
        difficulty: question.difficulty || 'medium'
      };

      bookmarks.push(bookmark);
      return BookmarkService.saveBookmarks(specialty, bookmarks);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  },

  /**
   * Remove a bookmark by questionId
   */
  removeBookmark: (questionId: string, specialty: SpecialtyType): boolean => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const filteredBookmarks = bookmarks.filter(
        bookmark => String(bookmark.questionId) !== String(questionId)
      );
      
      if (filteredBookmarks.length === bookmarks.length) {
        console.log('Bookmark not found');
        return false;
      }

      return BookmarkService.saveBookmarks(specialty, filteredBookmarks);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  },

  /**
   * ✅ ADDED: Remove a bookmark by bookmark ID (for UI compatibility)
   */
  removeBookmarkById: (bookmarkId: string, specialty: SpecialtyType): boolean => {
    try {
      console.log(`🔖 Removing bookmark by ID: ${bookmarkId} for ${specialty}`);
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const initialCount = bookmarks.length;
      
      const filteredBookmarks = bookmarks.filter(
        bookmark => String(bookmark.id) !== String(bookmarkId)
      );
      
      if (filteredBookmarks.length === initialCount) {
        console.log(`🔖 Bookmark with ID ${bookmarkId} not found`);
        return false;
      }

      const success = BookmarkService.saveBookmarks(specialty, filteredBookmarks);
      if (success) {
        console.log(`✅ Successfully removed bookmark ${bookmarkId}`);
      }
      return success;
    } catch (error) {
      console.error('Error removing bookmark by ID:', error);
      return false;
    }
  },

  /**
   * Update bookmark notes
   */
  updateBookmarkNotes: (questionId: string, specialty: SpecialtyType, notes: string): boolean => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const bookmarkIndex = bookmarks.findIndex(
        bookmark => String(bookmark.questionId) === String(questionId)
      );
      
      if (bookmarkIndex === -1) {
        console.log('Bookmark not found');
        return false;
      }

      bookmarks[bookmarkIndex].notes = notes;
      return BookmarkService.saveBookmarks(specialty, bookmarks);
    } catch (error) {
      console.error('Error updating bookmark notes:', error);
      return false;
    }
  },

  /**
   * ✅ ADDED: Update bookmark note (alias for compatibility with BookmarkReviewPage)
   */
  updateBookmarkNote: (bookmarkId: string, specialty: SpecialtyType, note: string): boolean => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const bookmarkIndex = bookmarks.findIndex(bookmark => String(bookmark.id) === String(bookmarkId));
      
      if (bookmarkIndex === -1) {
        console.log('Bookmark not found');
        return false;
      }

      bookmarks[bookmarkIndex].notes = note;
      return BookmarkService.saveBookmarks(specialty, bookmarks);
    } catch (error) {
      console.error('Error updating bookmark note:', error);
      return false;
    }
  },

  /**
   * Update bookmark priority
   */
  updateBookmarkPriority: (questionId: string, specialty: SpecialtyType, priority: 'low' | 'medium' | 'high'): boolean => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      const bookmarkIndex = bookmarks.findIndex(
        bookmark => String(bookmark.questionId) === String(questionId)
      );
      
      if (bookmarkIndex === -1) {
        console.log('Bookmark not found');
        return false;
      }

      bookmarks[bookmarkIndex].priority = priority;
      return BookmarkService.saveBookmarks(specialty, bookmarks);
    } catch (error) {
      console.error('Error updating bookmark priority:', error);
      return false;
    }
  },

  /**
   * Get bookmarks by system
   */
  getBookmarksBySystem: (specialty: SpecialtyType, system: string): BookmarkData[] => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    return bookmarks.filter(bookmark => bookmark.system === system);
  },

  /**
   * Get bookmarks by priority
   */
  getBookmarksByPriority: (specialty: SpecialtyType, priority: 'low' | 'medium' | 'high'): BookmarkData[] => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    return bookmarks.filter(bookmark => bookmark.priority === priority);
  },

  /**
   * Search bookmarks
   */
  searchBookmarks: (specialty: SpecialtyType, searchTerm: string): BookmarkData[] => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return bookmarks.filter(bookmark => 
      bookmark.questionText.toLowerCase().includes(lowerSearchTerm) ||
      bookmark.system.toLowerCase().includes(lowerSearchTerm) ||
      bookmark.notes?.toLowerCase().includes(lowerSearchTerm) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  },

  /**
   * Get bookmark statistics
   */
  getBookmarkStats: (specialty: SpecialtyType) => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    
    const systemStats = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.system] = (acc[bookmark.system] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityStats = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.priority] = (acc[bookmark.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: bookmarks.length,
      bySystem: systemStats,
      byPriority: priorityStats,
      recentCount: bookmarks.filter(b => {
        const bookmarkedDate = new Date(b.bookmarkedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return bookmarkedDate > weekAgo;
      }).length
    };
  },

  /**
   * Export bookmarks as JSON
   */
  exportBookmarks: (specialty: SpecialtyType): string => {
    const bookmarks = BookmarkService.getRawBookmarks(specialty);
    return JSON.stringify({
      specialty,
      exportedAt: new Date().toISOString(),
      bookmarks
    }, null, 2);
  },

  /**
   * Import bookmarks from JSON
   */
  importBookmarks: (specialty: SpecialtyType, jsonData: string): boolean => {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        throw new Error('Invalid bookmark data format');
      }

      const existingBookmarks = BookmarkService.getRawBookmarks(specialty);
      const newBookmarks = importData.bookmarks.filter((newBookmark: BookmarkData) => 
        !existingBookmarks.some(existing => existing.questionId === newBookmark.questionId)
      );

      const mergedBookmarks = [...existingBookmarks, ...newBookmarks];
      return BookmarkService.saveBookmarks(specialty, mergedBookmarks);
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      return false;
    }
  },

  /**
   * Clear all bookmarks for a specialty
   */
  clearAllBookmarks: (specialty: SpecialtyType): boolean => {
    try {
      const storageKey = BookmarkService.getStorageKey(specialty);
      localStorage.removeItem(storageKey);
      console.log(`✅ Cleared all bookmarks for ${specialty}`);
      return true;
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      return false;
    }
  },

  /**
   * ✅ ADDED: Get bookmark count for a specific system
   */
  getSystemBookmarkCount: (specialty: SpecialtyType, system: string): number => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      return bookmarks.filter(bookmark => bookmark.system === system).length;
    } catch (error) {
      console.error('Error getting system bookmark count:', error);
      return 0;
    }
  },

  /**
   * ✅ ADDED: Get total bookmark count for a specialty
   */
  getTotalBookmarkCount: (specialty: SpecialtyType): number => {
    try {
      const bookmarks = BookmarkService.getRawBookmarks(specialty);
      return bookmarks.length;
    } catch (error) {
      console.error('Error getting total bookmark count:', error);
      return 0;
    }
  },

  /**
   * ✅ UPDATED: Enhanced sample bookmarks with questions from all available systems
   */
  addSampleBookmarks: (specialty: SpecialtyType): boolean => {
    try {
      console.log(`🔖 Adding comprehensive sample bookmarks for ${specialty}...`);
      
      // Get available systems for the specialty
      const availableSystems = BookmarkService.getAvailableSystemsSync(specialty);
      console.log(`🔖 Available systems for sample bookmarks:`, availableSystems);
      
      // Create sample questions for multiple systems
      const sampleQuestions = [
        {
          id: `sample-${specialty}-1`,
          question: specialty === 'medicine' ? 
            "Which medication is first-line treatment for hypertension in diabetic patients?" :
            specialty === 'surgery' ?
            "What is the most appropriate initial management for acute appendicitis?" :
            "What is the most common cause of postpartum hemorrhage?",
          options: specialty === 'medicine' ? 
            ["ACE inhibitors", "Beta blockers", "Calcium channel blockers", "Diuretics"] :
            specialty === 'surgery' ?
            ["Antibiotics only", "Laparoscopic appendectomy", "Open appendectomy", "Conservative management"] :
            ["Uterine atony", "Retained placenta", "Cervical laceration", "Coagulation disorder"],
          correctAnswer: 0,
          explanation: specialty === 'medicine' ?
            "ACE inhibitors are first-line treatment for hypertension in diabetic patients due to their renoprotective effects." :
            specialty === 'surgery' ?
            "Laparoscopic appendectomy is the gold standard treatment for acute appendicitis when expertise is available." :
            "Uterine atony accounts for approximately 80% of postpartum hemorrhage cases.",
          system: availableSystems[0] || (specialty === 'medicine' ? 'Cardiovascular System' : 
                  specialty === 'surgery' ? 'General Surgery' : 'Obstetrics'),
          specialty: specialty,
          difficulty: "intermediate"
        },
        {
          id: `sample-${specialty}-2`,
          question: specialty === 'medicine' ? 
            "What is the first-line investigation for suspected pulmonary embolism?" :
            specialty === 'surgery' ?
            "Which suture material is most appropriate for bowel anastomosis?" :
            "At what gestational age is fetal viability typically achieved?",
          options: specialty === 'medicine' ? 
            ["CT pulmonary angiogram", "V/Q scan", "D-dimer", "Echocardiogram"] :
            specialty === 'surgery' ?
            ["Silk", "PDS", "Vicryl", "Nylon"] :
            ["20 weeks", "22 weeks", "24 weeks", "26 weeks"],
          correctAnswer: specialty === 'medicine' ? 0 : specialty === 'surgery' ? 1 : 2,
          explanation: specialty === 'medicine' ?
            "CT pulmonary angiogram (CTPA) is the gold standard investigation for suspected PE in stable patients." :
            specialty === 'surgery' ?
            "PDS (polydioxanone) is an absorbable monofilament suture ideal for bowel anastomosis." :
            "Fetal viability is typically achieved at 24 weeks of gestation with modern neonatal care.",
          system: availableSystems[1] || (specialty === 'medicine' ? 'Respiratory System' : 
                  specialty === 'surgery' ? 'Surgical Techniques' : 'Fetal Medicine'),
          specialty: specialty,
          difficulty: "intermediate"
        },
        {
          id: `sample-${specialty}-3`,
          question: specialty === 'medicine' ? 
            "What is the mechanism of action of metformin?" :
            specialty === 'surgery' ?
            "What is the most common complication of laparoscopic cholecystectomy?" :
            "What is the recommended folic acid dose for neural tube defect prevention?",
          options: specialty === 'medicine' ? 
            ["Increases insulin secretion", "Decreases hepatic gluconeogenesis", "Increases glucose uptake", "Inhibits glucose absorption"] :
            specialty === 'surgery' ?
            ["Bile duct injury", "Port site hernia", "Bleeding", "Infection"] :
            ["400 micrograms", "5 milligrams", "10 milligrams", "15 milligrams"],
          correctAnswer: specialty === 'medicine' ? 1 : 0,
          explanation: specialty === 'medicine' ?
            "Metformin primarily works by decreasing hepatic glucose production through inhibition of gluconeogenesis." :
            specialty === 'surgery' ?
            "Bile duct injury is the most serious and common major complication of laparoscopic cholecystectomy." :
            "400 micrograms daily is the recommended dose of folic acid for neural tube defect prevention.",
          system: availableSystems[2] || (specialty === 'medicine' ? 'Endocrine System' : 
                  specialty === 'surgery' ? 'General Surgery' : 'Maternal Medicine'),
          specialty: specialty,
          difficulty: "intermediate"
        }
      ];

      let addedCount = 0;
      sampleQuestions.forEach(question => {
        const success = BookmarkService.addBookmark(question as any, specialty, `Sample bookmark for testing ${question.system}`);
        if (success) {
          addedCount++;
        }
      });
      
      console.log(`✅ Added ${addedCount} comprehensive sample bookmarks for ${specialty}`);
      console.log(`🔖 Systems covered:`, sampleQuestions.map(q => q.system));
      
      return addedCount > 0;
    } catch (error) {
      console.error(`Error adding comprehensive sample bookmarks for ${specialty}:`, error);
      return false;
    }
  }
};

export default BookmarkService;