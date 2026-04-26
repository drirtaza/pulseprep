import { useState, useEffect, useRef } from "react";
import { PulsePrepNavigation } from "./components/PulsePrepNavigation";
import { SpecialtySelection } from "./components/SpecialtySelection";
import { Footer } from "./components/Footer";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import PaymentPage from "./components/PaymentPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import AdminLoginPage from "./components/AdminLoginPage";
import PaymentPendingPage from "./components/PaymentPendingPage";
import FinalFormPage from "./components/FinalFormPage";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import MedicineDashboard from "./components/MedicineDashboard";
import GynaeDashboard from "./components/GynaeDashboard";
import SurgeryDashboard from "./components/SurgeryDashboard";
import MCQInterface from "./components/MCQInterface";
import MockExamInstructionsPage from "./components/MockExamInstructionsPage";
import MockExamResultsPage from "./components/MockExamResultsPage";
import MockExamReviewPage from "./components/MockExamReviewPage";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import { BookmarkReviewPage } from "./components/BookmarkReviewPage";
import FinanceManagerDashboard from "./components/FinanceManagerDashboard";
import EmailVerificationPage from "./components/EmailVerificationPage";
import AdvancedAnalytics from "./components/AdvancedAnalytics";
import EnterpriseAuditDashboard from "./components/EnterpriseAuditDashboard";
import ContentManagerDashboard from "./components/ContentManagerDashboard";
import CustomReportBuilder from "./components/CustomReportBuilder";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ReportsPage from "./components/ReportsPage";
import { SecurityProvider, SessionTimeoutModal } from "./contexts/SecurityContext";
import { securityService } from "./services/SecurityService";
import { initializePaymentSettings, getPaymentSettings, manualSyncPaymentWithSubscription, subscribeToPaymentSettingsChanges, forceRefreshPaymentSettings } from "./utils/paymentSettings";
import { initializeBrandingOnLoad } from "./utils/brandingSettings";
import { getEmailTemplateSettings } from "./utils/emailTemplateSettings";
import { initializeCMSData, forceRefreshMedicalSystems, getMedicalSystems } from "./utils/cmsUtils";
import { isSubscriptionActive, initializeSubscriptionSettings } from "./utils/subscriptionUtils";

import { fixMissingActualAmounts } from "./utils/revenueCalculations";

import { addMockExamSet, getMockExamSets, debugMockExamStorage, cleanupDuplicateMockExamSets } from "./utils/mockExamUtils";

// 🆕 Import content settings utilities
import { initializeContentSettings, getContentSettings, resetContentSettingsToDefaults, forceRefreshContentSettings } from "./utils/contentSettings";

// Storage utilities
import { 
  initializeStorageManagement, 
  safeSetItem, 
  safeGetItem, 
  getStorageInfo, 
  cleanupStorage, 
  optimizeUserData 
} from "./utils/storageUtils";

// Error Boundary Components
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardErrorBoundary from "./components/DashboardErrorBoundary";
import ExamErrorBoundary from "./components/ExamErrorBoundary";
import AuthErrorBoundary from "./components/AuthErrorBoundary";
import PaymentErrorBoundary from "./components/PaymentErrorBoundary";
import NavigationErrorBoundary from "./components/NavigationErrorBoundary";

import { 
  PageType, 
  SpecialtyType, 
  UserData, 
  AdminData, 
  AdminRole,
  SignUpFormData,
  PracticeSessionConfig,
  MockExamConfig,
  MockExamResults 
} from "./types";
import { loadActiveSession } from "./utils/practiceProgressUtils";
// FinalFormPage is now imported from components

// TypeScript declaration for secure admin access
declare global {
  interface Window {
    adminSecureAccess: {
      step: number;
      timestamp: number;
      timeout: NodeJS.Timeout | null;
    } | null;
  }
}

// 🔧 NEW: Enhanced CMS initialization with comprehensive error handling
const initializeCMSWithErrorHandling = () => {

  
  try {
    // Initialize CMS data with force refresh
    initializeCMSData(true);
  } catch (error) {
    console.error('❌ Error during CMS data initialization:', error);
    // Continue with app initialization even if CMS data fails
  }
  
  try {
    // Force refresh medical systems with error handling
    const refreshedSystems = forceRefreshMedicalSystems();
    
    if (Array.isArray(refreshedSystems) && refreshedSystems.length > 0) {
      // Verify the systems are actually saved to localStorage
      const savedSystems = localStorage.getItem('pulseprep_medical_systems');
      if (!savedSystems) {
        console.error('❌ Medical systems not found in localStorage after initialization');
        initializeFallbackMedicalSystems();
      }
    } else {
      console.warn('⚠️ Medical systems refresh returned invalid data, using fallback');
      // Initialize basic fallback systems
      initializeFallbackMedicalSystems();
    }
  } catch (error) {
    console.error('❌ Error during medical systems refresh:', error);
    // Initialize fallback systems if refresh fails
    initializeFallbackMedicalSystems();
  }
  
  try {
    // Fix question difficulties
    // (removed unused difficultyFixResult)
  } catch (error) {
    console.error('❌ Error fixing question difficulties:', error);
    // Continue even if difficulty fix fails
  }
  
  // Final verification that medical systems are available
  try {
    const finalSystems = getMedicalSystems();
    
    if (finalSystems.length === 0) {
      console.error('❌ No medical systems available after initialization - forcing fallback');
      initializeFallbackMedicalSystems();
    }
  } catch (error) {
    console.error('❌ Error during final medical systems verification:', error);
    initializeFallbackMedicalSystems();
  }
  

};

// 🔧 NEW: Enhanced fallback medical systems initialization
const initializeFallbackMedicalSystems = () => {

  
  try {
    const fallbackSystems = [
      // Medicine Systems
      {
        id: 'fallback-med-1',
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
        id: 'fallback-med-2',
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
        id: 'fallback-med-3',
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
        id: 'fallback-med-4',
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
        id: 'fallback-med-5',
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
      // Surgery Systems
      {
        id: 'fallback-surg-1',
        name: 'General Surgery',
        description: 'Abdominal surgery, appendectomy, hernia repair, gallbladder surgery',
        specialty: 'surgery',
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        questionCount: 0,
        isUniversal: true,
        isCustom: false
      },
      {
        id: 'fallback-surg-2',
        name: 'Orthopedic Surgery',
        description: 'Bone and joint surgery, fractures, joint replacement',
        specialty: 'surgery',
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        questionCount: 0,
        isUniversal: true,
        isCustom: false
      },
      {
        id: 'fallback-surg-3',
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
        id: 'fallback-surg-4',
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
      // Gynae-Obs Systems
      {
        id: 'fallback-gynae-1',
        name: 'Obstetrics',
        description: 'Pregnancy care, antenatal screening, normal delivery, complications',
        specialty: 'gynae-obs',
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        questionCount: 0,
        isUniversal: true,
        isCustom: false
      },
      {
        id: 'fallback-gynae-2',
        name: 'Gynecology',
        description: 'Female reproductive system disorders and treatments',
        specialty: 'gynae-obs',
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        questionCount: 0,
        isUniversal: true,
        isCustom: false
      },
      {
        id: 'fallback-gynae-3',
        name: 'Reproductive Endocrinology',
        description: 'Hormonal disorders affecting female reproduction',
        specialty: 'gynae-obs',
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        questionCount: 0,
        isUniversal: true,
        isCustom: false
      }
    ];
    
    // Clear any existing systems first
    localStorage.removeItem('pulseprep_medical_systems');
    
    // Save fallback systems
    const success = safeSetItem('pulseprep_medical_systems', fallbackSystems);
    if (success) {
      console.log(`✅ Enhanced fallback medical systems initialized: ${fallbackSystems.length} systems created`);
      
      // Verify the save was successful
      const verification = localStorage.getItem('pulseprep_medical_systems');
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log(`🔍 Fallback verification: ${parsed.length} systems confirmed in localStorage`);
      }
    } else {
      console.error('❌ Failed to save fallback medical systems due to storage quota');
      // Try to clear some space and retry
      cleanupStorage();
      const retrySuccess = safeSetItem('pulseprep_medical_systems', fallbackSystems);
      if (retrySuccess) {
        console.log('✅ Fallback systems saved after storage cleanup');
      } else {
        console.error('❌ Failed to save fallback systems even after cleanup');
      }
    }
    
    return fallbackSystems;
  } catch (error) {
    console.error('❌ Error initializing fallback medical systems:', error);
    
    // Last resort: try to save minimal systems directly to localStorage
    try {
      const minimalSystems = [
        {
          id: 'minimal-1',
          name: 'General Medicine',
          description: 'General medical topics',
          specialty: 'medicine',
          isActive: true,
          isVisible: true,
          createdAt: new Date().toISOString(),
          questionCount: 0,
          isUniversal: true,
          isCustom: false
        }
      ];
      
      localStorage.setItem('pulseprep_medical_systems', JSON.stringify(minimalSystems));
      console.log('🚨 Saved minimal fallback system as last resort');
      return minimalSystems;
    } catch (lastResortError) {
      console.error('❌ Even minimal fallback failed:', lastResortError);
      return [];
    }
  }
};

// Initialize default Mock Exam Sets for all specialties with duplicate cleanup
const initializeDefaultMockExamSets = async () => {
  const specialties = ['medicine', 'surgery', 'gynae-obs'] as const;
  
  console.log('🏗️ Initializing default mock exam sets with duplicate cleanup...');
  
  for (const specialty of specialties) {
    try {
      // 🆕 FIXED: First clean up any duplicates
      const cleanupResult = await cleanupDuplicateMockExamSets(specialty);
      if (cleanupResult.cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleanupResult.cleaned} duplicate sets for ${specialty}`);
      }
      
      const existingSets = await getMockExamSets(specialty);
      console.log(`📊 Existing sets for ${specialty} after cleanup:`, {
        count: existingSets.length,
        approved: existingSets.filter(s => s.status === 'approved').length,
        active: existingSets.filter(s => s.isActive).length,
        approvedAndActive: existingSets.filter(s => s.status === 'approved' && s.isActive).length,
        sets: existingSets.map(s => ({ name: s.name, status: s.status, isActive: s.isActive }))
      });
      
      // Check if we're missing required mock exam sets
      const hasMock1 = existingSets.some(set => set.name === 'Mock 1' && set.status === 'approved' && set.isActive);
      const hasMock2 = existingSets.some(set => set.name === 'Mock 2' && set.status === 'approved' && set.isActive);
      const hasMock3 = existingSets.some(set => set.name === 'Mock 3' && set.status === 'approved' && set.isActive);
      const hasPreviousYears = existingSets.some(set => set.name === 'Previous Years' && set.status === 'approved' && set.isActive);
      
      console.log(`🔍 Mock exam status check for ${specialty}:`, {
        hasMock1,
        hasMock2,
        hasMock3,
        hasPreviousYears
      });
      
      if (!hasMock1 || !hasMock2 || !hasMock3 || !hasPreviousYears || existingSets.length === 0) {
        console.log(`🏗️ Creating/fixing missing mock exam sets for ${specialty}`);
        
        const defaultSets = [];
        
        // Only add Mock 1 if it's missing
        if (!hasMock1) {
          defaultSets.push({
            name: 'Mock 1',
            totalQuestions: 100,
            timeLimit: 120,
            passingCriteria: 60,
            specialty,
            systemDistribution: [],
            difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
            isActive: true,
            createdBy: 'System',
            status: 'approved' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Only add Mock 2 if it's missing
        if (!hasMock2) {
          defaultSets.push({
            name: 'Mock 2', 
            totalQuestions: 125,
            timeLimit: 150,
            passingCriteria: 70,
            specialty,
            systemDistribution: [],
            difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
            isActive: true,
            createdBy: 'System',
            status: 'approved' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Only add Mock 3 if it's missing
        if (!hasMock3) {
          defaultSets.push({
            name: 'Mock 3',
            totalQuestions: 150,
            timeLimit: 180,
            passingCriteria: 80,
            specialty,
            systemDistribution: [],
            difficultyDistribution: { easy: 10, medium: 40, hard: 50 },
            isActive: true,
            createdBy: 'System',
            status: 'approved' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Only add Previous Years if it's missing
        if (!hasPreviousYears) {
          defaultSets.push({
            name: 'Previous Years',
            totalQuestions: 200,
            timeLimit: 200,
            passingCriteria: 70,
            specialty,
            systemDistribution: [],
            difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
            isActive: true,
            createdBy: 'System',
            status: 'approved' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        if (defaultSets.length > 0) {
          console.log(`🚀 Creating ${defaultSets.length} missing mock exam sets for ${specialty}:`, defaultSets.map(s => s.name));
          
          for (const setData of defaultSets) {
            try {
              await addMockExamSet(setData);
              console.log(`✅ Created mock exam set: ${setData.name} for ${specialty}`);
            } catch (error) {
              console.error(`❌ Error creating mock exam set ${setData.name} for ${specialty}:`, error);
            }
          }
          
          console.log(`✅ Missing mock exam sets creation completed for ${specialty}`);
          
          // Verify creation and cleanup any duplicates that might have been created
          await cleanupDuplicateMockExamSets(specialty);
          const finalSets = await getMockExamSets(specialty);
          console.log(`🔍 Final verification - sets for ${specialty}:`, {
            count: finalSets.length,
            approved: finalSets.filter(s => s.status === 'approved').length,
            active: finalSets.filter(s => s.isActive).length,
            approvedAndActive: finalSets.filter(s => s.status === 'approved' && s.isActive).length,
            sets: finalSets.map(s => ({ name: s.name, status: s.status, isActive: s.isActive }))
          });
        } else {
          console.log(`✅ All required mock exam sets already exist for ${specialty}, no action needed`);
        }
      } else {
        console.log(`📊 Mock exam sets already exist for ${specialty}, skipping creation check`);
      }
    } catch (error) {
      console.error(`❌ Error initializing mock exam sets for ${specialty}:`, error);
    }
  }
  
  // Debug final state
  console.log('🧪 Final mock exam storage state after initialization:');
  debugMockExamStorage();
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType | null>(null);
  const [practiceSessionConfig, setPracticeSessionConfig] = useState<PracticeSessionConfig | null>(null);
  const [mockExamConfig, setMockExamConfig] = useState<MockExamConfig | null>(null);
  const [mockExamResults, setMockExamResults] = useState<MockExamResults | null>(null);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [adminAccessVisible, setAdminAccessVisible] = useState(false);
  const [adminAccessRole, setAdminAccessRole] = useState<AdminRole | null>(null);
  const [signUpFormData, setSignUpFormData] = useState<SignUpFormData | null>(null);
  const [currentSecuritySession, setCurrentSecuritySession] = useState<string | null>(null);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  
  // Payment settings sync state
  const [paymentSettingsRefreshTrigger, setPaymentSettingsRefreshTrigger] = useState(0);

  // 🆕 Content settings refresh state
  const [contentSettingsRefreshTrigger, setContentSettingsRefreshTrigger] = useState(0);

  // Enhanced syncUserWithAdminChanges with storage quota handling
  const syncUserWithAdminChanges = (userData: UserData): UserData => {
    try {
      console.log('🔄 Syncing user data with admin changes...');
      
      const allUsers = safeGetItem('all_users', []);
      const updatedUser = allUsers.find((u: any) => u.email === userData.email);
      
      if (updatedUser) {
        const syncedUser = {
          ...(updatedUser as UserData),
          id: userData?.id || (updatedUser as UserData).id,
          name: (updatedUser as UserData).name || userData?.name || userData?.fullName || '',
          fullName: (updatedUser as UserData).fullName || userData?.fullName || userData?.name || '',
          email: userData?.email || (updatedUser as UserData).email,
          // FIXED: Prioritize userData specialty if it's different from stored specialty (specialty change)
          specialty: userData?.specialty || (updatedUser as UserData).specialty,
          studyMode: userData?.studyMode || (updatedUser as UserData).studyMode,
          registrationDate: userData?.registrationDate || (updatedUser as UserData).registrationDate,
          paymentStatus: (updatedUser as UserData).paymentStatus,
          phone: (updatedUser as UserData).phone || userData?.phone,
          cnic: (updatedUser as UserData).cnic || userData?.cnic,
          status: (updatedUser as UserData).status || userData?.status,
          paymentDetails: (updatedUser as UserData).paymentDetails || userData?.paymentDetails || undefined
        };
        
        // Optimize user data before storing
        const optimizedUser = optimizeUserData(syncedUser);
        
        // Use safe storage method
        const success = safeSetItem('pulseprep_user', optimizedUser);
        
        if (!success) {
          console.error('❌ Failed to save synced user data due to storage quota');
          // Show user-friendly error message
          const storageInfo = getStorageInfo();
          console.log(`📊 Storage usage: ${storageInfo.usagePercentage.toFixed(1)}%`);
          
          // Try to show a helpful message to the user
          setTimeout(() => {
            if (window.confirm('Storage space is full. Would you like to clear some data to continue? This will remove non-essential data but keep your account and progress.')) {
              cleanupStorage();
              // Retry saving
              const retrySuccess = safeSetItem('pulseprep_user', optimizedUser);
              if (retrySuccess) {
                console.log('✅ Successfully saved user data after cleanup');
              } else {
                alert('Unable to save user data. Please clear your browser storage or contact support.');
              }
            }
          }, 100);
          
          // Return the synced user even if save failed, so the session continues
          return syncedUser;
        }
        
        console.log('✅ User data synced and saved successfully');
        return optimizedUser;
      }
    } catch (error) {
      console.error('❌ Error syncing user data with admin changes:', error);
      
      // If it's a storage error, handle it gracefully
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('💾 Storage quota exceeded during sync, attempting cleanup...');
        cleanupStorage();
      }
    }
    
    return userData;
  };



  // 🔧 FIXED: Enhanced payment sync function with better error handling
  const fixPaymentDetailsSync = () => {
    try {
      const rawAllUsers = safeGetItem('all_users', []);
      const currentUser = safeGetItem('pulseprep_user', null);
      const pendingUser = safeGetItem('pulseprep_user_pending', null);
      
      // Ensure we have a valid array
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      
      if (!Array.isArray(allUsers)) {
        console.warn('⚠️ all_users is not an array in fixPaymentDetailsSync, initializing as empty array');
      }
      
      let hasChanges = false;
      
      if (currentUser) {
        const typedCurrentUser = currentUser as UserData;
        const userInAllUsers = allUsers.find((u: any) => u.email === typedCurrentUser.email);
        
        if (userInAllUsers && typedCurrentUser?.paymentDetails && !(userInAllUsers as any).paymentDetails) {
          (userInAllUsers as any).paymentDetails = typedCurrentUser.paymentDetails;
          hasChanges = true;
        }
      }
      
      if (pendingUser) {
        const typedPendingUser = pendingUser as UserData;
        const userInAllUsers = allUsers.find((u: any) => u.email === typedPendingUser.email);
        
        if (userInAllUsers && typedPendingUser?.paymentDetails && !(userInAllUsers as any).paymentDetails) {
          (userInAllUsers as any).paymentDetails = typedPendingUser.paymentDetails;
          hasChanges = true;
        } else if (!userInAllUsers && typedPendingUser?.paymentDetails) {
          allUsers.push(pendingUser);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        const success = safeSetItem('all_users', allUsers);
        if (success) {
          console.log('✅ Payment details synchronization fixed!');
          return true;
        } else {
          console.log('⚠️ Payment details sync completed but save failed due to storage quota');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error fixing payment details sync:', error);
      alert(`Payment Sync Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Revenue calculation fix for legacy users
  const migrateRevenueData = () => {
    try {
      const rawAllUsers = safeGetItem('all_users', []);
      const rawApprovedPayments = safeGetItem('approved_payments', []);
      
      // Ensure we have valid arrays
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
      
      if (!Array.isArray(allUsers)) {
        console.warn('⚠️ all_users is not an array in migrateRevenueData, skipping migration');
        return false;
      }
      
      let hasChanges = false;
      
      // Get historical subscription settings to determine legacy price
      const legacyPrice = 7000; // This was the original price before the subscription system
      
      console.log(`🔧 Migrating revenue data for ${allUsers.length} users...`);
      
      // Additional safety check: ensure allUsers is still an array and has forEach method
      if (!allUsers || typeof allUsers.forEach !== 'function') {
        console.error('❌ allUsers is not a valid array with forEach method');
        return false;
      }
      
      allUsers.forEach((user: any, index: number) => {
        // Only migrate users who:
        // 1. Have completed payment status 
        // 2. Are in the approved payments list
        // 3. Don't already have actualAmountPaid set
        if (user.paymentStatus === 'completed' && 
            approvedPayments.includes(user.id) && 
            !user.actualAmountPaid) {
          
          // For legacy users, assume they paid the old price of 7000
          allUsers[index].actualAmountPaid = legacyPrice;
          
          // Use registration date as payment date if not set
          if (!allUsers[index].paymentDate) {
            allUsers[index].paymentDate = user.registrationDate;
          }
          
          // Set legacy plan info if not already set
          if (!allUsers[index].subscriptionPlanAtPayment) {
            allUsers[index].subscriptionPlanAtPayment = {
              id: 'plan-3month',
              name: '3-Month FCPS Preparation',
              price: legacyPrice,
              duration: 3
            };
          }
          
          hasChanges = true;
          console.log(`💰 Migrated revenue data for user: ${user.name} (${user.email}) - ${legacyPrice} PKR`);
        }
      });
      
      if (hasChanges) {
        const success = safeSetItem('all_users', allUsers);
        if (success) {
          console.log('✅ Revenue data migration completed!');
          
          // Also update current user if needed
          const currentUser = safeGetItem('pulseprep_user', null);
          if (currentUser && currentUser.paymentStatus === 'completed' && !currentUser.actualAmountPaid) {
            currentUser.actualAmountPaid = legacyPrice;
            currentUser.paymentDate = currentUser.paymentDate || currentUser.registrationDate;
            currentUser.subscriptionPlanAtPayment = currentUser.subscriptionPlanAtPayment || {
              id: 'plan-3month',
              name: '3-Month FCPS Preparation',
              price: legacyPrice,
              duration: 3
            };
            safeSetItem('pulseprep_user', currentUser);
            console.log('✅ Current user revenue data migrated!');
          }
        } else {
          console.log('⚠️ Revenue migration completed but save failed due to storage quota');
        }
        
        return success;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error migrating revenue data:', error);
      return false;
    }
  };

  // Enhanced user cleanup - clean up incomplete user records and password issues
  const fixUsersWithoutPasswords = () => {
    try {
      const rawAllUsers = safeGetItem('all_users', []);
      
      // Ensure we have a valid array
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      
      if (!Array.isArray(allUsers)) {
        console.warn('⚠️ all_users is not an array in fixUsersWithoutPasswords, skipping cleanup');
        return { removed: 0, fixed: 0, success: false };
      }
      
      let hasChanges = false;
      let fixedCount = 0;
      let removedCount = 0;
      
      console.log('🔧 ENHANCED USER CLEANUP STARTING...');
      console.log(`📊 Total users to check: ${allUsers.length}`);
      
      // Additional safety check: ensure allUsers has filter method
      if (!allUsers || typeof allUsers.filter !== 'function') {
        console.error('❌ allUsers is not a valid array with filter method');
        return { removed: 0, fixed: 0, success: false };
      }
      
      const filteredUsers = allUsers.filter((user: any) => {
        // Check for completely invalid user records
        if (!user.email || !user.name) {
          console.log(`🗑️ Removing invalid user record (missing email/name): ${user.email || 'NO EMAIL'}`);
          removedCount++;
          hasChanges = true;
          return false;
        }
        
        // Check if user has no password at all
        const hasPassword = user.password || user.passwordHash;
        const hasSalt = user.passwordSalt;
        
        if (!hasPassword && !hasSalt) {
          console.log(`🔍 Found user without password: ${user.email} (${user.name})`);
          
          // Be more aggressive - remove users without passwords regardless of payment status
          // They can always re-register if needed
          console.log(`🗑️ Removing user without password: ${user.email} (Payment: ${user.paymentStatus || 'N/A'})`);
          removedCount++;
          hasChanges = true;
          return false; // Remove this user
        }
        
        // Check for users with passwordHash but no password field (signup flow inconsistency)
        if (user.passwordHash && !user.password) {
          console.log(`🔧 Fixing user with passwordHash but no password field: ${user.email}`);
          user.password = user.passwordHash; // Move passwordHash to password field
          fixedCount++;
          hasChanges = true;
        }
        
        // If user has password but no salt (legacy), they'll be upgraded during login
        if (hasPassword && !hasSalt) {
          console.log(`📋 Legacy user ${user.email} will be upgraded to hashed password on next login`);
        }
        
        return true; // Keep this user
      });
      
      if (hasChanges) {
        const success = safeSetItem('all_users', filteredUsers);
        if (success) {
          console.log(`✅ Enhanced user cleanup completed! Removed ${removedCount} incomplete users, ${fixedCount} users fixed`);
        } else {
          console.log(`⚠️ User cleanup completed but save failed due to storage quota. Removed ${removedCount}, fixed ${fixedCount}`);
        }
        
        // Also clean up any orphaned pending users
        const pendingUser = safeGetItem('pulseprep_user_pending', null);
        if (pendingUser && (!pendingUser.password && !pendingUser.passwordHash && !pendingUser.passwordSalt)) {
          console.log(`🗑️ Removing incomplete pending user: ${pendingUser.email}`);
          localStorage.removeItem('pulseprep_user_pending');
        }
        
        // Clean up any current user session if they don't have proper password data
        const currentUser = safeGetItem('pulseprep_user', null);
        if (currentUser && (!currentUser.password && !currentUser.passwordHash && !currentUser.passwordSalt)) {
          console.log(`🗑️ Clearing current user session due to missing password: ${currentUser.email}`);
          localStorage.removeItem('pulseprep_user');
          localStorage.removeItem('pulseprep_auth');
        }
        
        return { removed: removedCount, fixed: fixedCount, success };
      }
      
      return { removed: 0, fixed: 0, success: true };
    } catch (error) {
      console.error('❌ Error fixing users without passwords:', error);
      return { removed: 0, fixed: 0, success: false };
    }
  };

  // Improved access check function
  const hasValidAccess = (user: UserData | null): boolean => {
    if (!user) return false;
    
    // If user is suspended, deny access
    if (user.status === 'suspended') return false;
    

    
    // Primary check: payment status must be completed
    if (user.paymentStatus !== 'completed') return false;
    
    // Secondary check: subscription status (but be lenient for existing users)
    try {
      const subscriptionActive = isSubscriptionActive(user);
      
      // If subscription check fails, but user has completed payment, 
      // allow access (this helps with legacy users)
      if (!subscriptionActive) {
        console.log('⚠️ Subscription check failed, but allowing access due to completed payment status');
        
        // Auto-fix subscription data for legacy users
        if (!user.subscriptionExpiryDate) {
          // Set a default subscription end date (3 months from registration)
          const registrationDate = new Date(user.registrationDate);
          const endDate = new Date(registrationDate);
          endDate.setMonth(endDate.getMonth() + 3);
          
          user.subscriptionExpiryDate = endDate.toISOString();
          
          // Update localStorage using safe method
          safeSetItem('pulseprep_user', user);
          
          // Also update in all_users
          const rawAllUsers = safeGetItem('all_users', []);
          const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
          const userIndex = allUsers.findIndex((u: any) => u.email === user.email);
          if (userIndex !== -1) {
            allUsers[userIndex].subscriptionExpiryDate = user.subscriptionExpiryDate;
            safeSetItem('all_users', allUsers);
          }
          
          console.log('✅ Auto-fixed subscription data for legacy user');
          return true;
        }
      }
      
      return true; // Allow access if payment is completed
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      // If subscription check fails, but payment is completed, allow access
      return true;
    }
  };

  // Initialize app - UPDATED with enhanced CMS error handling
  useEffect(() => {
    console.log('🚀 PulsePrep starting - initializing systems...');
    
    try {
      // Initialize storage management first
      initializeStorageManagement();
      
      const paymentSettings = initializePaymentSettings();
      console.log('💰 Payment settings initialized with bank accounts:', {
        totalBankAccounts: paymentSettings.bankAccounts.length,
        activeBankAccounts: paymentSettings.bankAccounts.filter(b => b.isActive).length,
        defaultAccount: paymentSettings.bankAccounts.find(b => b.isDefault)?.bankName
      });
      
      // Subscribe to payment settings changes for automatic synchronization
      const unsubscribePayment = subscribeToPaymentSettingsChanges((updatedSettings) => {
        console.log('🔄 Payment settings changed, triggering component updates...');
        setPaymentSettingsRefreshTrigger(prev => prev + 1);
        
        // Force refresh all components that depend on payment settings
        window.dispatchEvent(new CustomEvent('forcePaymentSettingsRefresh', {
          detail: { settings: updatedSettings }
        }));
      });

      // 🆕 Initialize content settings system
      const contentSettings = initializeContentSettings();
      console.log('📝 Content settings initialized:', {
        version: contentSettings.version,
        homePageSections: Object.keys(contentSettings.homePage).length,
        aboutPageSections: Object.keys(contentSettings.aboutPage).length,
        contactPageSections: Object.keys(contentSettings.contactPage).length
      });
      
      initializeBrandingOnLoad();
      console.log('🎨 Branding settings initialized');
      
      const emailSettings = getEmailTemplateSettings();
      console.log('📧 Email template settings initialized:', emailSettings);
      
      // 🔧 ENHANCED: Initialize CMS data with comprehensive error handling
      initializeCMSWithErrorHandling();
      
      // Initialize subscription settings with error suppression for cleaner logs
      try {
        initializeSubscriptionSettings();
        console.log('🔄 Subscription settings initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize subscription settings:', error);
      }
      
      // Manually sync payment settings with subscription settings (prevents infinite loop)
      manualSyncPaymentWithSubscription();
      
      // Initialize default mock exam sets WITH DUPLICATE CLEANUP
      initializeDefaultMockExamSets();
      
      fixPaymentDetailsSync();
      
      // Migrate revenue data for legacy users with error handling
      try {
        const revenueResult = migrateRevenueData();
        if (revenueResult) {
          console.log('✅ Revenue data migration completed successfully');
        } else {
          console.log('ℹ️ No revenue data migration needed');
        }
      } catch (error) {
        console.error('❌ Error running revenue data migration:', error);
        // Don't let this error break the app initialization
      }
      
      // Fix users without passwords with error handling
      try {
        const passwordFixResult = fixUsersWithoutPasswords();
        if (passwordFixResult.removed > 0 || passwordFixResult.fixed > 0) {
          console.log(`🔧 Password fix results: ${passwordFixResult.removed} users removed, ${passwordFixResult.fixed} users fixed`);
        }
      } catch (error) {
        console.error('❌ Error running password fix:', error);
        // Don't let this error break the app initialization
      }
      
      // Fix missing actual amounts with proper error handling
      try {
        const actualAmountsResult = fixMissingActualAmounts();
        if (actualAmountsResult) {
          console.log('✅ Missing actual amounts fix completed successfully');
        } else {
          console.log('ℹ️ No missing actual amounts to fix');
        }
      } catch (error) {
        console.error('❌ Error running missing actual amounts fix:', error);
        // Don't let this error break the app initialization
      }
      
      const savedUser = safeGetItem('pulseprep_user', null);
      const savedAuth = safeGetItem('pulseprep_auth', null);
      
      if (savedUser && savedAuth === 'true') {
        try {
          let localUserData = savedUser as UserData;
          if (localUserData) {
            const syncedUser = syncUserWithAdminChanges(localUserData);
            setUserData(syncedUser);
          }
          
          if (localUserData?.status === 'suspended') {
            localStorage.removeItem('pulseprep_user');
            localStorage.removeItem('pulseprep_auth');
            localStorage.removeItem('pulseprep_user_pending');
            return;
          }
          
          if (localUserData && (!localUserData.paymentStatus || localUserData.paymentStatus === 'pending')) {
            localUserData.paymentStatus = 'completed';
            safeSetItem('pulseprep_user', localUserData);
          }
          
          if (localUserData) {
            setUserData(localUserData);
            setIsAuthenticated(true);
            setCurrentPage('dashboard');
            
            const session = securityService.createSession(localUserData);
            setCurrentSecuritySession(session.id);
          }
          
        } catch (error) {
          console.error('Error loading saved user:', error);
          localStorage.removeItem('pulseprep_user');
          localStorage.removeItem('pulseprep_auth');
        }
      }

      const pendingUser = safeGetItem('pulseprep_user_pending', null);
      if (pendingUser && !savedUser) {
        try {
          let localUserData = pendingUser as UserData;
          if (localUserData) {
            const syncedUser = syncUserWithAdminChanges(localUserData);
            setUserData(syncedUser);
          }
          
          if (localUserData?.paymentStatus === 'completed') {
            safeSetItem('pulseprep_user', localUserData);
            localStorage.setItem('pulseprep_auth', 'true');
            localStorage.removeItem('pulseprep_user_pending');
            
            setUserData(localUserData);
            setIsAuthenticated(true);
            setCurrentPage('dashboard');
          } else if (localUserData) {
            setUserData(localUserData);
            setIsAuthenticated(false);
            setCurrentPage('payment-pending');
          }
        } catch (error) {
          console.error('Error loading pending user:', error);
          localStorage.removeItem('pulseprep_user_pending');
        }
      }

      const savedAdmin = safeGetItem('pulseprep_admin', null);
      const savedAdminAuth = safeGetItem('pulseprep_admin_auth', null);
      
      if (savedAdmin && savedAdminAuth === 'true') {
        try {
          const adminData = savedAdmin as AdminData;
          if (adminData) {
            setAdmin(adminData);
            setIsAdminAuthenticated(true);
            
            // Route content managers to their specific dashboard
            if (adminData.role === 'content-manager') {
              setCurrentPage('content-management');
            } else {
              setCurrentPage('admin-dashboard');
            }
            
            const session = securityService.createSession(adminData);
            setCurrentSecuritySession(session.id);
          }
          
          console.log('🔐 Admin loaded from localStorage:', adminData);
        } catch (error) {
          console.error('Error loading saved admin:', error);
          localStorage.removeItem('pulseprep_admin');
          localStorage.removeItem('pulseprep_admin_auth');
        }
      }

      const devMode = localStorage.getItem('pulseprep_dev_mode') === 'true';
      setIsDevelopmentMode(devMode);

      // Load temporary specialty selection from sessionStorage
      const tempSpecialty = sessionStorage.getItem('temp_specialty') as SpecialtyType | null;
      if (tempSpecialty && (tempSpecialty === 'medicine' || tempSpecialty === 'surgery' || tempSpecialty === 'gynae-obs')) {
        console.log(`🎯 Restored specialty selection from session: ${tempSpecialty}`);
        setSelectedSpecialty(tempSpecialty);
      }

      initializeRequiredAdmins();
      
      // Cleanup subscriptions - remove listeners when component unmounts
      return () => {
        unsubscribePayment();
      };
    } catch (error) {
      console.error('❌ Critical error during app initialization:', error);
      alert(`App initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Effect to handle payment settings refresh triggers
  useEffect(() => {
    console.log(`🔄 Payment settings refresh trigger: ${paymentSettingsRefreshTrigger}`);
    
    if (paymentSettingsRefreshTrigger > 0) {
      console.log('💰 Refreshing payment settings cache...');
      getPaymentSettings(true); // Just refresh, don't notify
    }
  }, [paymentSettingsRefreshTrigger]);

  // 🆕 Effect to handle content settings refresh triggers
  useEffect(() => {
    console.log(`📝 Content settings refresh trigger: ${contentSettingsRefreshTrigger}`);
    
    if (contentSettingsRefreshTrigger > 0) {
      console.log('📝 Refreshing content settings cache...');
      getContentSettings(true); // Just refresh, don't notify
    }
  }, [contentSettingsRefreshTrigger]);

  // Apply specialty theme to document body
  useEffect(() => {
    if (admin?.role) {
      document.body.className = `theme-admin-${admin.role}`;
    } else if (userData?.specialty) {
      document.body.className = `theme-${userData.specialty === 'gynae-obs' ? 'gynae' : userData.specialty}`;
    } else if (selectedSpecialty) {
      document.body.className = `theme-${selectedSpecialty === 'gynae-obs' ? 'gynae' : selectedSpecialty}`;
    } else {
      document.body.className = '';
    }
  }, [userData?.specialty, selectedSpecialty, admin?.role]);

  // Cleanup admin access role on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('admin_access_role');
      localStorage.removeItem('admin_access_timeout');
    };
  }, []);

  // Admin access detection with enhanced mock exam management shortcuts
  useEffect(() => {
    // Helper function to check if event matches a shortcut
  const matchesShortcut = (event: KeyboardEvent, shortcut: string): boolean => {
    // Handle special case for Super Admin (two-step shortcut)
    if (shortcut.includes(', then ')) {
      const parts = shortcut.split(', then ');
      const firstPart = parts[0];
      const secondPart = parts[1];
      
      // Check if this is the first step
      if (firstPart === 'Ctrl+Alt+Shift+A' && 
          event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        return true;
      }
      
      // Check if this is the second step (D)
      if (secondPart === 'D' && 
          window.adminSecureAccess && 
          window.adminSecureAccess.step === 1 &&
          event.key.toLowerCase() === 'd' &&
          (Date.now() - window.adminSecureAccess.timestamp) < 3000) {
        return true;
      }
      
      return false;
    }
    
    // Handle regular shortcuts
    const parts = shortcut.split('+');
    const hasCtrl = parts.includes('Ctrl') === event.ctrlKey;
    const hasAlt = parts.includes('Alt') === event.altKey;
    const hasShift = parts.includes('Shift') === event.shiftKey;
    const key = parts[parts.length - 1].toLowerCase();
    
    return hasCtrl && hasAlt && hasShift && event.key.toLowerCase() === key;
  };

  const handleKeyDown = async (event: KeyboardEvent) => {
      try {
        // Secure admin access: Ctrl+Alt+Shift+A, then D
        if (event.ctrlKey && event.altKey && event.shiftKey && 
            (event.key.toLowerCase() === 'a' || event.code === 'KeyA')) {
          event.preventDefault();
          
          if (!window.adminSecureAccess) {
            window.adminSecureAccess = { 
              step: 1, 
              timestamp: Date.now(),
              timeout: null
            };
            
            window.adminSecureAccess.timeout = setTimeout(() => {
              window.adminSecureAccess = null;
            }, 3000);
            
            return;
          }
        }
        
        if (window.adminSecureAccess && 
            window.adminSecureAccess.step === 1 &&
            event.key.toLowerCase() === 'd' &&
            (Date.now() - window.adminSecureAccess.timestamp) < 3000) {
          
          event.preventDefault();
          
          // Check if admin access is enabled and super-admin role is enabled
          const adminAccessSettings = localStorage.getItem('pulseprep_admin_access_settings');
          if (adminAccessSettings) {
            const settings = JSON.parse(adminAccessSettings);
            if (!settings.enabled || !settings.roleAccess['super-admin']?.enabled) {
              console.log('❌ Super admin access disabled in settings');
              alert('Super Admin access is currently disabled by SuperAdmin settings.');
              if (window.adminSecureAccess.timeout) {
                clearTimeout(window.adminSecureAccess.timeout);
              }
              window.adminSecureAccess = null;
              return;
            }
          }
          
          if (window.adminSecureAccess.timeout) {
            clearTimeout(window.adminSecureAccess.timeout);
          }
          window.adminSecureAccess = null;
          
          setAdminAccessRole('super-admin');
          localStorage.setItem('admin_access_role', 'super-admin');
          setAdminAccessVisible(true);
          setTimeout(() => {
            setAdminAccessVisible(false);
            setAdminAccessRole(null);
            // DON'T clear localStorage on timeout - keep role restriction active
            // localStorage.removeItem('admin_access_role');
          }, 15000);
        }

        // Development mode toggle: Ctrl+Alt+D
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'd') {
          event.preventDefault();
          const newDevMode = !isDevelopmentMode;
          setIsDevelopmentMode(newDevMode);
          localStorage.setItem('pulseprep_dev_mode', newDevMode.toString());
        }

        // Role-specific admin access methods (Dynamic shortcuts)
        // Check all roles for matching shortcuts
        const adminAccessSettings = localStorage.getItem('pulseprep_admin_access_settings');
        if (adminAccessSettings) {
          try {
            const settings = JSON.parse(adminAccessSettings);
            
            // Check each role for matching shortcuts
            for (const [role, roleSettings] of Object.entries(settings.roleAccess)) {
              const typedRoleSettings = roleSettings as {
                enabled: boolean;
                shortcutMode: 'single' | 'multiple';
                shortcuts: string[];
                method: string;
                status: string;
              };
              
              if (!typedRoleSettings.enabled) continue;
              
              const shortcuts = typedRoleSettings.shortcuts || [];
              const shortcutMode = typedRoleSettings.shortcutMode || 'single';
              
              let shortcutMatched = false;
              
              if (shortcutMode === 'single') {
                // Only check the first shortcut
                if (shortcuts.length > 0 && matchesShortcut(event, shortcuts[0])) {
                  shortcutMatched = true;
                }
              } else {
                // Check all shortcuts
                shortcutMatched = shortcuts.some((shortcut: string) => matchesShortcut(event, shortcut));
              }
              
              if (shortcutMatched) {
                event.preventDefault();
                
                const { securityService } = await import('./services/SecurityService');
                const accessData = {
                  keys: [event.key.toLowerCase()],
                  timeSpan: 1000,
                  event: event // Pass the full event for proper validation
                };
                const isValid = securityService.validateRoleAccess(role as AdminRole, 'keyboard-shortcut', accessData);
                securityService.logRoleAccessAttempt(role as AdminRole, 'keyboard-shortcut', isValid);
                
                if (isValid) {
                  setAdminAccessRole(role as AdminRole);
                  localStorage.setItem('admin_access_role', role);
                  setAdminAccessVisible(true);
                  setTimeout(() => {
                    setAdminAccessVisible(false);
                    setAdminAccessRole(null);
                    // DON'T clear localStorage on timeout - keep role restriction active
                    // localStorage.removeItem('admin_access_role');
                  }, 15000);
                }
                break; // Found matching role, stop checking
              }
            }
          } catch (error) {
            console.error('❌ Admin access error:', error);
          }
        }

        // Content Manager: Ctrl+Alt+C
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c') {
          event.preventDefault();
          try {
            // Check if admin access is enabled and content-manager role is enabled
            const adminAccessSettings = localStorage.getItem('pulseprep_admin_access_settings');
            if (adminAccessSettings) {
              const settings = JSON.parse(adminAccessSettings);
              if (!settings.enabled || !settings.roleAccess['content-manager']?.enabled) {
                console.log('❌ Content manager access disabled in settings');
                alert('Content Manager access is currently disabled by SuperAdmin settings.');
                return;
              }
            }

            const { securityService } = await import('./services/SecurityService');
            const accessData = {
              keys: ['Ctrl+Alt+C'],
              timeSpan: 1000
            };
            const isValid = securityService.validateRoleAccess('content-manager', 'keyboard-shortcut', accessData);
            securityService.logRoleAccessAttempt('content-manager', 'keyboard-shortcut', isValid);
            
            if (isValid) {
              setAdminAccessRole('content-manager');
              localStorage.setItem('admin_access_role', 'content-manager');
              setAdminAccessVisible(true);
              setTimeout(() => {
                setAdminAccessVisible(false);
                setAdminAccessRole(null);
                // DON'T clear localStorage on timeout - keep role restriction active
                // localStorage.removeItem('admin_access_role');
              }, 15000);
            }
          } catch (error) {
            console.error('❌ Content manager access error:', error);
          }
        }

        // Audit Manager: Ctrl+Alt+Shift+E
        if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'e') {
          event.preventDefault();
          try {
            // Check if admin access is enabled and audit-manager role is enabled
            const adminAccessSettings = localStorage.getItem('pulseprep_admin_access_settings');
            if (adminAccessSettings) {
              const settings = JSON.parse(adminAccessSettings);
              if (!settings.enabled || !settings.roleAccess['audit-manager']?.enabled) {
                console.log('❌ Audit manager access disabled in settings');
                alert('Audit Manager access is currently disabled by SuperAdmin settings.');
                return;
              }
            }

            const { securityService } = await import('./services/SecurityService');
            const accessData = {
              keys: ['Ctrl+Alt+Shift+E'],
              timeSpan: 1000
            };
            const isValid = securityService.validateRoleAccess('audit-manager', 'keyboard-shortcut', accessData);
            securityService.logRoleAccessAttempt('audit-manager', 'keyboard-shortcut', isValid);
            
            if (isValid) {
              setAdminAccessRole('audit-manager');
              localStorage.setItem('admin_access_role', 'audit-manager');
              setAdminAccessVisible(true);
              setTimeout(() => {
                setAdminAccessVisible(false);
                setAdminAccessRole(null);
                // DON'T clear localStorage on timeout - keep role restriction active
                // localStorage.removeItem('admin_access_role');
              }, 15000);
            }
          } catch (error) {
            console.error('❌ Audit manager access error:', error);
          }
        }



        // 🆕 Content settings management shortcuts
        // Reset content to defaults: Ctrl+Alt+R
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'r') {
          event.preventDefault();
          try {
            const result = resetContentSettingsToDefaults('Dev Admin');
            console.log('📝 Content reset result:', result);
            alert(result ? 'Content reset to defaults successfully!' : 'Content reset failed');
          } catch (error) {
            console.error('❌ Error resetting content:', error);
            alert(`Content reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Force refresh content settings: Ctrl+Alt+T (changed from F to avoid conflict)
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') {
          event.preventDefault();
          try {
            console.log('📝 Manually forcing content settings refresh...');
            const refreshedSettings = forceRefreshContentSettings();
            setContentSettingsRefreshTrigger(prev => prev + 1);
            alert(`Content settings refreshed!\nVersion: ${refreshedSettings.version}\nHome sections: ${Object.keys(refreshedSettings.homePage).length}\nAbout sections: ${Object.keys(refreshedSettings.aboutPage).length}\nContact sections: ${Object.keys(refreshedSettings.contactPage).length}`);
          } catch (error) {
            console.error('❌ Error refreshing content:', error);
            alert(`Content refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Force refresh payment settings: Ctrl+Alt+Y
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'y') {
          event.preventDefault();
          try {
            console.log('🔄 Manually forcing payment settings refresh...');
            const refreshedSettings = forceRefreshPaymentSettings();
            setPaymentSettingsRefreshTrigger(prev => prev + 1);
            alert(`Payment settings refreshed!\nVersion: ${refreshedSettings.version}\nBank accounts: ${refreshedSettings.bankAccounts.length}\nActive accounts: ${refreshedSettings.bankAccounts.filter(b => b.isActive).length}`);
          } catch (error) {
            console.error('❌ Error refreshing payment settings:', error);
            alert(`Payment refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Force refresh subscription settings: Ctrl+Alt+U
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'u') {
          event.preventDefault();
          // 🔧 FIXED: Wrap async operation in self-executing async function
          (async () => {
            try {
              console.log('🔄 Manually forcing subscription settings refresh...');
              const { forceRefreshSubscriptionSettings } = await import('./utils/subscriptionUtils');
              const refreshedSettings = forceRefreshSubscriptionSettings();
              alert(`Subscription settings refreshed!\nVersion: ${refreshedSettings.version}\nPlans: ${refreshedSettings.plans.length}\nDefault plan: ${refreshedSettings.plans.find(p => p.isDefault)?.name || 'None'}`);
            } catch (error) {
              console.error('❌ Error refreshing subscription settings:', error);
              alert(`Subscription refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          })();
        }


      } catch (error) {
        console.error('❌ Error in keyboard shortcut handler:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDevelopmentMode]);

  // Initialize only required admin accounts (NO SAMPLE USERS)
  const initializeRequiredAdmins = () => {
    try {
      const existingUsers = safeGetItem('all_users', []);
      const existingAdmins = safeGetItem('all_admins', []);

      console.log('✅ User storage initialized - clean start (no sample users)');
      console.log('📊 Current user count:', existingUsers.length);

      // Initialize required admin accounts only
      const requiredAdminRoles = [
        { role: 'super-admin', name: 'Super Admin', email: 'admin@pulseprep.com', password: 'admin123' },
        { role: 'finance-manager', name: 'Finance Manager', email: 'finance@pulseprep.com', password: 'finance123' },
        { role: 'audit-manager', name: 'Audit Manager', email: 'audit@pulseprep.com', password: 'audit123' },
        { role: 'content-manager', name: 'Content Manager', email: 'content@pulseprep.com', password: 'content123' }
      ];

      let adminChanges = false;
      const updatedAdmins = [...existingAdmins];

      requiredAdminRoles.forEach((requiredAdmin, index) => {
        const existingAdmin = existingAdmins.find((admin: any) => 
          admin.role === requiredAdmin.role || admin.email === requiredAdmin.email
        );

        if (!existingAdmin) {
          const newAdmin = {
            id: `admin-${requiredAdmin.role}-${Date.now()}-${index}`,
            name: requiredAdmin.name,
            email: requiredAdmin.email,
            role: requiredAdmin.role,
            password: requiredAdmin.password,
            createdAt: new Date(Date.now() - (30 - index * 5) * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'System',
            status: 'active'
          };

          (updatedAdmins as any[]).push(newAdmin);
          adminChanges = true;
          console.log(`🔐 Created admin account: ${requiredAdmin.role} (${requiredAdmin.email})`);
        }
      });

      if (adminChanges) {
        const success = safeSetItem('all_admins', updatedAdmins);
        if (success) {
          console.log('✅ Required admin accounts initialized');
        } else {
          console.log('⚠️ Admin accounts created but save failed due to storage quota');
        }
      }

      console.log('📋 Admin initialization complete - only system accounts created');
    } catch (error) {
      console.error('❌ Error initializing admins:', error);
    }
  };

  // Navigation and authentication handlers
  const navigateToPage = (page: PageType | string) => {
    if (page === 'login' || page === 'sign-in') {
      console.log('🔐 Navigating to login - clearing temporary specialty selection');
      setSelectedSpecialty(null);
      sessionStorage.removeItem('temp_specialty');
    }
    
    setCurrentPage(page as PageType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPageRef = useRef(navigateToPage);
  navigateToPageRef.current = navigateToPage;

  // Supabase password recovery: #access_token=...&refresh_token=...&type=recovery
  useEffect(() => {
    (async () => {
      const { getSupabaseBrowser, SUPABASE_RECOVERY_FLAG } = await import('./lib/supabaseClient');
      const client = getSupabaseBrowser();
      if (!client) return;
      const h = window.location.hash;
      if (!h || !h.includes('access_token')) return;
      const q = new URLSearchParams(h.replace(/^#/, ''));
      const at = q.get('access_token');
      const rt = q.get('refresh_token');
      if (!at || !rt) return;
      const { error } = await client.auth.setSession({ access_token: at, refresh_token: rt });
      if (error) {
        console.error('Supabase recovery setSession', error);
        return;
      }
      sessionStorage.setItem(SUPABASE_RECOVERY_FLAG, '1');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      navigateToPageRef.current('forgot-password');
    })();
  }, []);

  const handleSpecialtySelection = (specialty: SpecialtyType) => {
    console.log(`🎯 User selected specialty: ${specialty}`);
    setSelectedSpecialty(specialty);
    sessionStorage.setItem('temp_specialty', specialty);
    navigateToPage('signup');
  };

  // Login handler with complete specialty routing fix
  const handleLogin = (userData: UserData) => {
    try {
      console.log('🔍 LOGIN DEBUG:', {
        email: userData.email,
        hasPassword: !!userData.password,
        emailVerified: userData.emailVerified,
        emailVerificationStatus: userData.emailVerificationStatus,
        paymentStatus: userData.paymentStatus
      });



      const syncedUserData = syncUserWithAdminChanges(userData);
      
      if (!syncedUserData || syncedUserData.status === 'suspended') {
        return;
      }
      
      setSelectedSpecialty(null);
      setIsAuthenticated(true);
      setUserData(syncedUserData);
      
      sessionStorage.removeItem('temp_specialty');
      sessionStorage.removeItem('signup_step1');
      sessionStorage.removeItem('signup_step2');
      sessionStorage.removeItem('signup_step3');
      
      safeSetItem('pulseprep_user', syncedUserData);
      localStorage.setItem('pulseprep_auth', 'true');
      localStorage.removeItem('pulseprep_user_pending');
      
      if (syncedUserData) {
        const session = securityService.createSession(syncedUserData);
        setCurrentSecuritySession(session.id);
      }
      
      console.log(`🔐 User ${syncedUserData.email} logged in with specialty: ${syncedUserData.specialty}`);
      
      // Enhanced audit logging for email verification
      try {
        const { AuditService } = require('./services/AuditService');
        AuditService.logUserAction(
          'User Login',
          'System',
          'system',
          userData.email,
          true,
          {
            specialty: userData.specialty,
            emailVerified: userData.emailVerified,
            emailVerificationStatus: userData.emailVerificationStatus,
            emailVerificationLastAttemptAt: userData.emailVerificationLastAttemptAt,
            emailVerificationAttempts: userData.emailVerificationAttempts,
            paymentStatus: userData.paymentStatus
          }
        );
        
        // Log email verification completion if this is the first login after verification
        if (userData.emailVerified && userData.emailVerificationStatus === 'verified') {
          AuditService.logEmailVerificationEvent(
            'email-verification-completed',
            userData.email,
            'user',
            true,
            {
              emailId: userData.emailVerificationEmailId,
              deliveryStatus: userData.emailVerificationDeliveryStatus,
              attempts: userData.emailVerificationAttempts
            }
          );
        }
      } catch (error) {
        console.error('Failed to log login event:', error);
      }
      
      if (syncedUserData.paymentStatus === 'completed') {
        navigateToPage('dashboard');
      } else {
        navigateToPage('payment-pending');
      }
    } catch (error) {
      console.error('❌ Error in handleLogin:', error);
      alert(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSignUpStepComplete = (stepData: Partial<SignUpFormData>, nextPage: PageType) => {
    setSignUpFormData(prev => ({
      ...prev,
      ...stepData,
      specialty: selectedSpecialty || stepData.specialty || 'medicine'
    }) as SignUpFormData);
    
    // Enhanced email verification completion handling
    if (nextPage === 'payment' && stepData.emailVerified) {
      console.log('✅ Email verification completed for:', stepData.email);
      
      // Update email verification status in session storage
      const updatedFormData = {
        ...signUpFormData,
        ...stepData,
        emailVerified: true,
        emailVerificationStatus: 'verified',
        emailVerificationLastAttemptAt: new Date().toISOString()
      } as SignUpFormData;
      
      setSignUpFormData(updatedFormData);
      sessionStorage.setItem('signup_step3', JSON.stringify(updatedFormData));
      
      // Log email verification completion
      try {
        const { AuditService } = require('./services/AuditService');
        AuditService.logEmailVerificationEvent(
          'email-verification-completed',
          stepData.email || '',
          'user',
          true,
          {
            emailId: stepData.emailVerificationEmailId,
            deliveryStatus: stepData.emailVerificationDeliveryStatus,
            attempts: stepData.emailVerificationAttempts || 0,
            completionTime: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error('Failed to log email verification completion:', error);
      }
    }
    
    // Handle email verification errors
    if (stepData.emailVerificationStatus === 'failed' || stepData.emailVerificationStatus === 'expired') {
      console.log('❌ Email verification failed/expired for:', stepData.email);
      
      // Log email verification failure
      try {
        const { AuditService } = require('./services/AuditService');
        AuditService.logEmailVerificationEvent(
          'email-verification-failed',
          stepData.email || '',
          'user',
          false,
          {
            status: stepData.emailVerificationStatus,
            error: stepData.emailVerificationError,
            attempts: stepData.emailVerificationAttempts || 0,
            lastAttempt: stepData.emailVerificationLastAttemptAt
          }
        );
      } catch (error) {
        console.error('Failed to log email verification failure:', error);
      }
    }
    
    navigateToPage(nextPage);
  };





  const handleSignUpComplete = async (finalData: SignUpFormData) => {
    try {
      console.log('🔍 SIGNUP COMPLETION DEBUG:', {
        email: finalData.email,
        hasPassword: !!finalData.password,
        hasPasswordHash: !!finalData.passwordHash,
        hasPasswordSalt: !!finalData.passwordSalt,
        passwordLength: finalData.password?.length || 0,
        passwordHashLength: finalData.passwordHash?.length || 0,
        emailVerified: finalData.emailVerified,
        emailVerificationStatus: finalData.emailVerificationStatus,
        emailVerificationAttempts: finalData.emailVerificationAttempts,
        emailVerificationLastAttemptAt: finalData.emailVerificationLastAttemptAt,
        fullData: finalData
      });

      const hasValidPassword = typeof finalData.password === 'string' && finalData.password.length >= 8;
      
      if (!hasValidPassword) {
        console.error('❌ Cannot create user without password data:', finalData.email);
        alert('Error: Account creation failed because signup password was not captured. Please restart signup and try again.');
        return;
      }

      // Enhanced email verification requirement enforcement
      if (!finalData.emailVerified) {
        console.error('❌ Cannot create user without email verification:', finalData.email);
        
        // Provide specific guidance based on verification status
        if (finalData.emailVerificationStatus === 'pending' || finalData.emailVerificationStatus === 'sent') {
          alert('Error: Please check your email and click the verification link to complete your registration. If you didn\'t receive the email, please check your spam folder or request a new verification email.');
          navigateToPage('email-verification');
        } else if (finalData.emailVerificationStatus === 'expired') {
          alert('Error: Your email verification has expired. Please request a new verification email to complete your registration.');
          navigateToPage('email-verification');
        } else if (finalData.emailVerificationStatus === 'failed') {
          alert('Error: Email verification failed. Please try again or contact support if the problem persists.');
          navigateToPage('email-verification');
        } else {
          alert('Error: Email verification is required to complete account creation. Please verify your email first.');
          navigateToPage('email-verification');
        }
        return;
      }

      // Additional verification status checks
      if (finalData.emailVerificationStatus !== 'verified') {
        console.error('❌ Cannot create user with invalid email verification status:', finalData.email, 'Status:', finalData.emailVerificationStatus);
        alert('Error: Email verification status is invalid. Please complete the verification process before creating your account.');
        navigateToPage('email-verification');
        return;
      }

      const userWithSpecialty: UserData = {
        id: `user-${Date.now()}`,
        name: finalData.fullName,
        fullName: finalData.fullName,
        email: finalData.email,
        specialty: selectedSpecialty || finalData.specialty,
        studyMode: finalData.studyMode,
        registrationDate: new Date().toISOString(),
        phone: finalData.phone,
        cnic: finalData.cnic,
        paymentStatus: 'pending',
        paymentDetails: finalData.paymentDetails,
        password: finalData.passwordHash || finalData.password,
        passwordSalt: finalData.passwordSalt,
        // Enhanced email verification fields
        emailVerified: finalData.emailVerified,
        emailVerificationToken: finalData.emailVerificationToken,
        emailVerificationSentAt: finalData.emailVerificationSentAt,
        emailVerificationExpiresAt: finalData.emailVerificationExpiresAt,
        emailVerificationAttempts: finalData.emailVerificationAttempts || 0,
        emailVerificationLastAttemptAt: finalData.emailVerificationLastAttemptAt,
        emailVerificationStatus: finalData.emailVerificationStatus || 'verified',
        emailVerificationEmailId: finalData.emailVerificationEmailId,
        emailVerificationDeliveryStatus: finalData.emailVerificationDeliveryStatus,
        emailVerificationError: finalData.emailVerificationError
      };
      
      console.log('✅ Creating user with email verification:', {
        email: userWithSpecialty.email,
        hasPassword: !!userWithSpecialty.password,
        hasPasswordSalt: !!userWithSpecialty.passwordSalt,
        passwordLength: userWithSpecialty.password?.length || 0,
        emailVerified: userWithSpecialty.emailVerified,
        emailVerificationStatus: userWithSpecialty.emailVerificationStatus
      });

      const dbSyncResponse = await fetch('/api/admin-update-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userWithSpecialty.email,
          status: 'pending',
          paymentStatus: 'pending',
          emailVerified: userWithSpecialty.emailVerified,
          paymentDetails: userWithSpecialty.paymentDetails || {}
        })
      });
      if (!dbSyncResponse.ok) {
        const errText = await dbSyncResponse.text().catch(() => '');
        throw new Error(errText || 'Failed to sync signup data to Supabase');
      }

      const regRes = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userWithSpecialty.email,
          password: finalData.password,
          fullName: userWithSpecialty.fullName
        })
      });
      if (!regRes.ok) {
        const t = await regRes.text().catch(() => '');
        throw new Error(t || 'Failed to create login credentials. Please try again.');
      }
      
      setUserData(userWithSpecialty);
      setIsAuthenticated(false);
      setSelectedSpecialty(null);
      setSignUpFormData(null);
      
      safeSetItem('pulseprep_user_pending', userWithSpecialty);
      sessionStorage.removeItem('temp_specialty');
      
      const rawAllUsers = safeGetItem('all_users', []);
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      allUsers.push(userWithSpecialty);
      safeSetItem('all_users', allUsers);
      
      navigateToPage('payment-pending');
    } catch (error) {
      console.error('❌ Error in handleSignUpComplete:', error);
      alert(`Signup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAdminLogin = (adminData: AdminData) => {
    try {
      if (!adminData || adminData.status !== 'active') {
        return;
      }
      
      setIsAdminAuthenticated(true);
      setAdmin(adminData);
      setAdminAccessVisible(false);
      setAdminAccessRole(null); // Clear the role access
      localStorage.removeItem('admin_access_role'); // Clear stored role access
      
      // Also clear any existing timeouts
      const existingTimeout = localStorage.getItem('admin_access_timeout');
      if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout));
        localStorage.removeItem('admin_access_timeout');
      }
      
      safeSetItem('pulseprep_admin', adminData);
      localStorage.setItem('pulseprep_admin_auth', 'true');
      
      if (adminData) {
        const session = securityService.createSession(adminData);
        setCurrentSecuritySession(session.id);
      }
      
      if (adminData.role === 'content-manager') {
        navigateToPage('content-management');
      } else {
        navigateToPage('admin-dashboard');
      }
    } catch (error) {
      console.error('❌ Error in handleAdminLogin:', error);
      alert(`Admin login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = () => {
    try {
      if (currentSecuritySession) {
        securityService.terminateSession(currentSecuritySession, 'Manual logout');
        setCurrentSecuritySession(null);
      }
      
      setIsAuthenticated(false);
      setUserData(null);
      setSelectedSpecialty(null);
      setPracticeSessionConfig(null);
      setMockExamConfig(null);
      setMockExamResults(null);
      setSignUpFormData(null);
      
      localStorage.removeItem('pulseprep_user');
      localStorage.removeItem('pulseprep_auth');
      localStorage.removeItem('pulseprep_user_pending');
      sessionStorage.removeItem('temp_specialty');
      
      document.body.className = '';
      navigateToPage('home');
    } catch (error) {
      console.error('❌ Error in handleLogout:', error);
    }
  };

  const handleAdminLogout = () => {
    try {
      if (currentSecuritySession) {
        securityService.terminateSession(currentSecuritySession, 'Manual logout');
        setCurrentSecuritySession(null);
      }
      
      setIsAdminAuthenticated(false);
      setAdmin(null);
      setAdminAccessVisible(false);
      
      localStorage.removeItem('pulseprep_admin');
      localStorage.removeItem('pulseprep_admin_auth');
      
      document.body.className = '';
      navigateToPage('home');
    } catch (error) {
      console.error('❌ Error in handleAdminLogout:', error);
    }
  };

  // Practice session handler uses CMS questions
  const handleStartPracticeSession = (config: Omit<PracticeSessionConfig, 'specialty'>) => {
    console.log('🎯 Starting practice session:', config);
    
    if (!hasValidAccess(userData)) {
      console.log('❌ Access denied - redirecting to payment pending');
      navigateToPage('payment-pending');
      return;
    }
    
    console.log('✅ Access granted - starting practice session with CMS questions');
    setMockExamConfig(null);
    const sessionConfig: PracticeSessionConfig = {
      ...config,
      specialty: userData!.specialty,
      sessionType: config.sessionType || 'new'
    };
    setPracticeSessionConfig(sessionConfig);
    navigateToPage('mcq-interface');
  };

  // Mock exam handler uses CMS questions
  const handleStartMockExam = (config: MockExamConfig) => {
    console.log('🎯 Starting mock exam:', config);
    
    if (!hasValidAccess(userData)) {
      console.log('❌ Access denied - redirecting to payment pending');
      navigateToPage('payment-pending');
      return;
    }
    
    console.log('✅ Access granted - starting mock exam with CMS questions');
    setPracticeSessionConfig(null);
    setMockExamConfig(config);
    navigateToPage('mock-exam-instructions');
  };

  const handleMockExamComplete = (results: MockExamResults) => {
    setMockExamResults(results);
    navigateToPage('mock-exam-results');
  };

  const handleLogoClick = () => {
    const currentTime = Date.now();
    localStorage.setItem('logo_last_click_time', currentTime.toString());
  };

  // Render specialty dashboard with debugging
  const renderSpecialtyDashboard = () => {
    if (!userData) return null;
    
    if (!hasValidAccess(userData)) {
      return (
        <PaymentErrorBoundary paymentType="pending" hasPaymentData={!!userData.paymentDetails}>
          <PaymentPendingPage 
            onNavigate={navigateToPage}
            user={userData}
            onReUploadPayment={() => navigateToPage('payment')}
          />
        </PaymentErrorBoundary>
      );
    }
    
    const dashboardProps = {
      user: userData,
      onNavigate: navigateToPage,
      onStartPracticeSession: handleStartPracticeSession,
      onContinuePractice: () => {
        const savedSession = userData?.id ? loadActiveSession(userData.id) : null;
        if (savedSession) {
          handleStartPracticeSession({
            system: savedSession.system,  // ✅ Use actual saved system
            mcqCount: savedSession.sessionConfig.mcqCount,
            includeWrongMCQs: savedSession.sessionConfig.includeWrongMCQs,
            sessionType: 'continue'
          });
        }
      },
      onStartMockExam: handleStartMockExam,
      onLogout: handleLogout
    };

    const userSpecialty = userData.specialty;
    console.log(`🎯 Rendering dashboard for specialty: ${userSpecialty} (selectedSpecialty: ${selectedSpecialty})`);

    return (
      <DashboardErrorBoundary dashboardType="user" userRole={`${userData.specialty} Student`}>
        {(() => {
          switch (userSpecialty) {
            case 'medicine':
              return <MedicineDashboard {...dashboardProps} />;
            case 'surgery':
              return <SurgeryDashboard {...dashboardProps} />;
            case 'gynae-obs':
              return <GynaeDashboard {...dashboardProps} />;
            default:
              console.warn(`⚠️ Unknown specialty: ${userSpecialty}, defaulting to medicine`);
              return <MedicineDashboard {...dashboardProps} />;
          }
        })()}
      </DashboardErrorBoundary>
    );
  };

  // Render admin dashboard
  const renderAdminDashboard = () => {
    if (!isAdminAuthenticated || !admin) {
      return (
        <AuthErrorBoundary authType="admin-login">
          <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} />
        </AuthErrorBoundary>
      );
    }

    return (
      <DashboardErrorBoundary dashboardType={admin.role === 'super-admin' ? 'super-admin' : 'admin'} userRole={admin.role}>
        {(() => {
          switch (admin.role) {
            case 'finance-manager':
              return <FinanceManagerDashboard admin={admin} onLogout={handleAdminLogout} />;
            case 'super-admin':
              return <SuperAdminDashboard admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />;
            case 'audit-manager':
              return <EnterpriseAuditDashboard admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />;
            case 'content-manager':
              return <ContentManagerDashboard admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />;
            default:
              return <SuperAdminDashboard admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />;
          }
        })()}
      </DashboardErrorBoundary>
    );
  };

  // Main render function with refresh keys for content
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
      case 'sign-in':
        return (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'signup':
      case 'sign-up':
        return (
          <AuthErrorBoundary authType="signup">
            <SignUpPage onNavigate={navigateToPage} onStepComplete={handleSignUpStepComplete} onSignUpComplete={(userData: UserData) => handleSignUpComplete(userData as any)} selectedSpecialty={selectedSpecialty} formData={signUpFormData} />
          </AuthErrorBoundary>
        );
      case 'email-verification':
        return (
          <AuthErrorBoundary authType="verification">
            <EmailVerificationPage onNavigate={navigateToPage} onStepComplete={handleSignUpStepComplete} formData={signUpFormData} />
          </AuthErrorBoundary>
        );
      case 'payment':
        return (
          <PaymentErrorBoundary paymentType="upload" hasPaymentData={!!signUpFormData?.paymentDetails}>
            <PaymentPage 
              key={`payment-${paymentSettingsRefreshTrigger}`}
              onNavigate={navigateToPage} 
              onStepComplete={handleSignUpStepComplete} 
              formData={signUpFormData} 
            />
          </PaymentErrorBoundary>
        );
      case 'final-form':
        return (
          <AuthErrorBoundary authType="signup">
            <FinalFormPage 
              onNavigate={navigateToPage} 
              onSignUpComplete={handleSignUpComplete} 
              selectedSpecialty={userData?.specialty || selectedSpecialty} 
              formData={signUpFormData} 
            />
          </AuthErrorBoundary>
        );
      case 'payment-pending':
        return userData ? (
          <PaymentErrorBoundary paymentType="pending" hasPaymentData={!!userData.paymentDetails}>
            <PaymentPendingPage 
              key={`payment-pending-${paymentSettingsRefreshTrigger}`}
              onNavigate={navigateToPage} 
              user={userData} 
              onReUploadPayment={() => navigateToPage('payment')} 
            />
          </PaymentErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'forgot-password':
        return (
          <AuthErrorBoundary authType="password-reset">
            <ForgotPasswordPage onNavigate={navigateToPage} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'admin-login':
        return (
          <AuthErrorBoundary authType="admin-login">
            <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} adminAccessRole={adminAccessRole} />
          </AuthErrorBoundary>
        );
      case 'admin-dashboard':
      case 'content-management':
        return renderAdminDashboard();
      case 'bookmark-review':
        return isAuthenticated && userData && hasValidAccess(userData) ? (
          <DashboardErrorBoundary dashboardType="user" userRole="Bookmark Review">
            <BookmarkReviewPage 
              user={userData}
              onNavigate={navigateToPage}
              onLogout={handleLogout}
            />
          </DashboardErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'analytics-dashboard':
        return isAdminAuthenticated && admin ? (
          <DashboardErrorBoundary dashboardType="admin" userRole="Analytics">
            <AnalyticsDashboard admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />
          </DashboardErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="admin-login">
            <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} adminAccessRole={adminAccessRole} />
          </AuthErrorBoundary>
        );
      case 'reports':
        return isAdminAuthenticated && admin ? (
          <DashboardErrorBoundary dashboardType="admin" userRole="Reports">
            <ReportsPage admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />
          </DashboardErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="admin-login">
            <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} adminAccessRole={adminAccessRole} />
          </AuthErrorBoundary>
        );
      case 'advanced-analytics':
        return isAdminAuthenticated && admin ? (
          <DashboardErrorBoundary dashboardType="admin" userRole="Advanced Analytics">
            <AdvancedAnalytics admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />
          </DashboardErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="admin-login">
            <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} adminAccessRole={adminAccessRole} />
          </AuthErrorBoundary>
        );
      case 'custom-reports':
        return isAdminAuthenticated && admin ? (
          <DashboardErrorBoundary dashboardType="admin" userRole="Custom Reports">
            <CustomReportBuilder admin={admin} onNavigate={navigateToPage} onLogout={handleAdminLogout} />
          </DashboardErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="admin-login">
            <AdminLoginPage onNavigate={navigateToPage} onAdminLogin={handleAdminLogin} />
          </AuthErrorBoundary>
        );
      case 'dashboard':
        return isAuthenticated && userData ? renderSpecialtyDashboard() : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'mcq-interface':
        return isAuthenticated && userData && hasValidAccess(userData) ? (
          <ExamErrorBoundary examType={mockExamConfig ? 'mock-exam' : 'practice'} hasProgress={true}>
            <MCQInterface onNavigate={navigateToPage} user={userData} sessionConfig={practiceSessionConfig} mockExamConfig={mockExamConfig} onMockExamComplete={handleMockExamComplete} />
          </ExamErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'mock-exam-instructions':
        return isAuthenticated && userData && hasValidAccess(userData) && mockExamConfig ? (
          <ExamErrorBoundary examType="mock-exam">
            <MockExamInstructionsPage user={userData} mockExamConfig={mockExamConfig!} onNavigate={navigateToPage} onStartMockExam={(config) => { setMockExamConfig(config); navigateToPage('mcq-interface'); }} />
          </ExamErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'mock-exam-results':
        return isAuthenticated && userData && hasValidAccess(userData) && mockExamResults ? (
          <ExamErrorBoundary examType="review">
            <MockExamResultsPage user={userData} results={mockExamResults} onNavigate={navigateToPage} onRetakeExam={() => { setMockExamResults(null); navigateToPage('mock-exam-instructions'); }} />
          </ExamErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'mock-exam-review':
        return isAuthenticated && userData && hasValidAccess(userData) && mockExamResults ? (
          <ExamErrorBoundary examType="review">
            <MockExamReviewPage 
              user={userData} 
              results={mockExamResults} 
              onNavigate={navigateToPage} 
            />
          </ExamErrorBoundary>
        ) : (
          <AuthErrorBoundary authType="login">
            <LoginPage onNavigate={navigateToPage} onLogin={handleLogin} selectedSpecialty={selectedSpecialty} />
          </AuthErrorBoundary>
        );
      case 'about':
        return (
          <ErrorBoundary context="about-page">
            <AboutPage 
              key={`about-${contentSettingsRefreshTrigger}`}
              onNavigate={navigateToPage} 
            />
          </ErrorBoundary>
        );
      case 'contact':
        return (
          <ErrorBoundary context="contact-page">
            <ContactPage 
              key={`contact-${contentSettingsRefreshTrigger}`}
              onNavigate={navigateToPage} 
            />
          </ErrorBoundary>
        );
      default:
      case 'home':
      case 'specialty-selection':
        return (
          <ErrorBoundary context="home-page">
            <SpecialtySelection 
              key={`home-${contentSettingsRefreshTrigger}`}
              onSpecialtySelect={handleSpecialtySelection} 
              onNavigate={navigateToPage} 
              onLogoClick={handleLogoClick} 
              adminAccessVisible={adminAccessVisible} 
              adminAccessRole={adminAccessRole}
              onAdminAccess={() => navigateToPage('admin-login')} 
            />
          </ErrorBoundary>
        );
    }
  };

  const pagesWithoutNavigation = ['dashboard', 'mcq-interface', 'mock-exam-instructions', 'mock-exam-results', 'mock-exam-review', 'final-form', 'signup', 'sign-up', 'email-verification', 'payment', 'payment-pending', 'forgot-password', 'login', 'sign-in', 'admin-login', 'admin-dashboard', 'analytics-dashboard', 'reports', 'advanced-analytics', 'custom-reports', 'content-management', 'bookmark-review'];
  const showNavigation = !isAdminAuthenticated && !pagesWithoutNavigation.includes(currentPage);
  const showFooter = !isAdminAuthenticated && (currentPage === 'home' || currentPage === 'specialty-selection' || currentPage === 'about' || currentPage === 'contact');
  const currentSecurityUser = isAdminAuthenticated ? admin : (isAuthenticated ? userData : null);

  return (
    <ErrorBoundary context="app-root" showErrorDetails={process.env.NODE_ENV === 'development'}>
      <SecurityProvider currentUser={currentSecurityUser}>
        <div className="min-h-screen relative">
          {/* 🔧 FIXED: Enhanced Development Tools with better error handling and mock exam management */}
          {isDevelopmentMode && (
            <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-xs max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">🧪 PulsePrep Dev Tools</h4>
              <div className="space-y-2 text-xs">

                
                {/* 🆕 Content Management Tools */}

                
                <button 
                  onClick={() => {
                    try {
                      const result = resetContentSettingsToDefaults('Dev Admin');
                      console.log('📝 Content reset result:', result);

                      alert(result ? 'Content reset to defaults successfully!' : 'Content reset failed');
                    } catch (error) {
                      console.error('❌ Content reset error:', error);
                      alert(`Content reset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-orange-500 hover:bg-orange-400 px-2 py-1 rounded"
                >
                  🔄 Reset Content
                </button>
                
                {/* 🆕 Medical Systems Tools */}
                <button 
                  onClick={() => {
                    try {
                      console.log('🏥 Debugging medical systems...');
                      
                      // Also check systems for each specialty
                      const specialties = ['medicine', 'surgery', 'gynae-obs'] as const;
                      specialties.forEach(specialty => {
                        const systems = getMedicalSystems(specialty);
                        console.log(`🔍 ${specialty} systems:`, {
                          count: systems.length,
                          visible: systems.filter(s => s.isVisible).length,
                          active: systems.filter(s => s.isActive).length,
                          universal: systems.filter(s => s.isUniversal).length,
                          systems: systems.map(s => ({ name: s.name, visible: s.isVisible, active: s.isActive }))
                        });
                      });
                      
                      alert('Medical systems debug completed! Check console for details.');
                    } catch (error) {
                      console.error('❌ Medical systems debug error:', error);
                      alert(`Medical systems debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded"
                >
                  🏥 Debug Medical Systems
                </button>

                <button 
                  onClick={() => {
                    try {
                      console.log('🏥 Manually forcing medical systems refresh...');
                      const refreshedSystems = forceRefreshMedicalSystems();
                      alert(`Medical systems refreshed!\nSystems: ${refreshedSystems.length}\nCheck console for details.`);
                    } catch (error) {
                      console.error('❌ Medical systems refresh error:', error);
                      alert(`Medical systems refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded"
                >
                  🔄 Refresh Medical Systems
                </button>
                
                {/* 🆕 Mock Exam Management Tools */}
                <button 
                  onClick={() => {
                    try {
                      console.log('🧪 Debug mock exam storage state...');
                      debugMockExamStorage();
                    } catch (error) {
                      console.error('❌ Mock exam debug error:', error);
                      alert(`Mock exam debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded"
                >
                  📊 Debug Mock Exams
                </button>

                <button 
                  onClick={() => {
                    try {
                      console.log('🧹 Cleaning up duplicate mock exams...');
                      const specialties = ['medicine', 'surgery', 'gynae-obs'] as const;
                      let totalCleaned = 0;
                      
                      Promise.all(specialties.map(async (specialty) => {
                        const result = await cleanupDuplicateMockExamSets(specialty);
                        totalCleaned += result.cleaned;
                        return result;
                      })).then(() => {
                        debugMockExamStorage();
                        alert(`Cleanup completed!\nDuplicates removed: ${totalCleaned}\nCheck console for details.`);
                      });
                    } catch (error) {
                      console.error('❌ Mock exam cleanup error:', error);
                      alert(`Mock exam cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-red-600 hover:bg-red-500 px-2 py-1 rounded"
                >
                  🧹 Clean Duplicates
                </button>

                <button 
                  onClick={() => {
                    try {
                      console.log('🏗️ Re-initializing mock exam sets...');
                      initializeDefaultMockExamSets().then(() => {
                        debugMockExamStorage();
                        alert('Mock exam sets re-initialized! Check console for details.');
                      });
                    } catch (error) {
                      console.error('❌ Mock exam init error:', error);
                      alert(`Mock exam init error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded"
                >
                  🏗️ Re-init Mock Exams
                </button>
                
                {/* 🆕 Subscription Management Tools */}
                <button 
                  onClick={() => {
                    // 🔧 FIXED: Use the same pattern as the keyboard shortcut
                    (async () => {
                      try {
                        console.log('🔄 Refreshing subscription settings...');
                        const { forceRefreshSubscriptionSettings } = await import('./utils/subscriptionUtils');
                        const refreshedSettings = forceRefreshSubscriptionSettings();
                        alert(`Subscription settings refreshed!\nVersion: ${refreshedSettings.version}\nPlans: ${refreshedSettings.plans.length}\nDefault plan: ${refreshedSettings.plans.find(p => p.isDefault)?.name || 'None'}`);
                      } catch (error) {
                        console.error('❌ Subscription refresh error:', error);
                        alert(`Subscription refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    })();
                  }} 
                  className="block w-full text-left bg-indigo-500 hover:bg-indigo-400 px-2 py-1 rounded"
                >
                  🔄 Refresh Subscriptions
                </button>

                {/* Existing tools */}
                <button 
                  onClick={() => {
                    try {
                      const result = fixPaymentDetailsSync();
                      alert(result ? 'Payment sync completed successfully!' : 'Payment sync completed (no changes needed)');
                    } catch (error) {
                      console.error('❌ Payment sync error:', error);
                      alert(`Payment sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }} 
                  className="block w-full text-left bg-orange-500 hover:bg-orange-400 px-2 py-1 rounded"
                >
                  💰 Fix Payment Sync
                </button>
                
                <button 
                  onClick={() => {
                    try {
                      setIsDevelopmentMode(false);
                      localStorage.setItem('pulseprep_dev_mode', 'false');
                    } catch (error) {
                      console.error('❌ Error hiding dev tools:', error);
                    }
                  }} 
                  className="block w-full text-left bg-gray-500 hover:bg-gray-400 px-2 py-1 rounded"
                >
                  ❌ Hide Dev Tools
                </button>
              </div>
            </div>
          )}
          
          <SessionTimeoutModal />
          
          {showNavigation && (
            <NavigationErrorBoundary navigationType="header">
              <PulsePrepNavigation 
                currentPage={currentPage} 
                onNavigate={navigateToPage}
                onNavigateToSection={() => {}}
                isAuthenticated={isAuthenticated}
                user={userData || undefined}
                onLogout={handleLogout}
                selectedSpecialty={selectedSpecialty}
                onLogoClick={handleLogoClick}
                adminAccessVisible={adminAccessVisible}
                onAdminAccess={() => navigateToPage('admin-login')}
              />
            </NavigationErrorBoundary>
          )}
          
          <main className="flex-1 relative z-10">
            {renderPage()}
          </main>
          
          {showFooter && (
            <NavigationErrorBoundary navigationType="footer">
              <Footer onNavigate={navigateToPage} onNavigateToSection={() => {}} />
            </NavigationErrorBoundary>
          )}
        </div>
      </SecurityProvider>
    </ErrorBoundary>
  );
}