import { UserData } from '../types';
import { safeGetItem, safeSetItem } from './storageUtils';

// ADD this new function - DO NOT modify existing functions
export const calculateActualRevenue = (users: UserData[]): number => {
  return users
    .filter(u => u.paymentStatus === 'completed')
    .reduce((total, user) => {
      // Use actual amount paid, fallback to 7000 for legacy users without this field
      const amountPaid = user.actualAmountPaid || 7000;
      return total + amountPaid;
    }, 0);
};

// ADD this function for specialty-specific revenue
export const calculateRevenueBySpecialty = (users: UserData[], specialty: string): number => {
  return users
    .filter(u => u.specialty === specialty && u.paymentStatus === 'completed')
    .reduce((total, user) => {
      const amountPaid = user.actualAmountPaid || 7000;
      return total + amountPaid;
    }, 0);
};

// Helper function to get historical revenue data
export const getHistoricalRevenueData = (users: UserData[]) => {
  const paidUsers = users.filter(u => u.paymentStatus === 'completed');
  
  return {
    totalRevenue: calculateActualRevenue(paidUsers),
    userCount: paidUsers.length,
    averageRevenue: paidUsers.length > 0 ? calculateActualRevenue(paidUsers) / paidUsers.length : 0,
    revenueBySpecialty: {
      medicine: calculateRevenueBySpecialty(paidUsers, 'medicine'),
      surgery: calculateRevenueBySpecialty(paidUsers, 'surgery'),
      'gynae-obs': calculateRevenueBySpecialty(paidUsers, 'gynae-obs')
    }
  };
};

// Helper function for monthly revenue calculations
export const calculateMonthlyRevenue = (users: UserData[], year: number, month: number): number => {
  const monthlyUsers = users.filter(user => {
    if (user.paymentStatus !== 'completed') return false;
    
    // Use paymentDate if available, otherwise fall back to registrationDate
    const paymentDate = user.paymentDate || user.registrationDate;
    const date = new Date(paymentDate);
    
    return date.getFullYear() === year && date.getMonth() === month;
  });
  
  return calculateActualRevenue(monthlyUsers);
};

// Helper function for quarterly revenue calculations
export const calculateQuarterlyRevenue = (users: UserData[], year: number, quarter: number): number => {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  
  const quarterlyUsers = users.filter(user => {
    if (user.paymentStatus !== 'completed') return false;
    
    const paymentDate = user.paymentDate || user.registrationDate;
    const date = new Date(paymentDate);
    const month = date.getMonth();
    
    return date.getFullYear() === year && month >= startMonth && month <= endMonth;
  });
  
  return calculateActualRevenue(quarterlyUsers);
};

// Helper function to validate revenue data integrity
export const validateRevenueData = (users: UserData[]): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const paidUsers = users.filter(u => u.paymentStatus === 'completed');
  const usersWithoutActualAmount = paidUsers.filter(u => !u.actualAmountPaid);
  const usersWithoutPaymentDate = paidUsers.filter(u => !u.paymentDate);
  
  if (usersWithoutActualAmount.length > 0) {
    issues.push(`${usersWithoutActualAmount.length} paid users missing actualAmountPaid field`);
    recommendations.push('Run data migration to populate actualAmountPaid for legacy users');
  }
  
  if (usersWithoutPaymentDate.length > 0) {
    issues.push(`${usersWithoutPaymentDate.length} paid users missing paymentDate field`);
    recommendations.push('Run data migration to populate paymentDate for legacy users');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

/**
 * Force fix any users missing actualAmountPaid for historical records
 * This ensures all completed payments show actual amounts instead of current prices
 */
export const fixMissingActualAmounts = (): boolean => {
  try {
    const rawAllUsers = safeGetItem('all_users', []);
    
    // ✅ FIX: Ensure we have a valid array
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    
    if (!Array.isArray(allUsers)) {
      console.warn('⚠️ all_users is not an array in fixMissingActualAmounts, skipping fix');
      return false;
    }
    
    let hasChanges = false;
    
    console.log(`🔧 Checking ${allUsers.length} users for missing actual amounts...`);
    
    allUsers.forEach((user: any, index: number) => {
      // Fix any completed payment users missing actualAmountPaid
      if (user.paymentStatus === 'completed' && 
          (user.actualAmountPaid === undefined || user.actualAmountPaid === null)) {
        
        // Use legacy amount for historical users
        allUsers[index].actualAmountPaid = 7000;
        
        // Set payment date if missing
        if (!allUsers[index].paymentDate) {
          allUsers[index].paymentDate = user.registrationDate || new Date().toISOString();
        }
        
        hasChanges = true;
        console.log(`🔧 Fixed missing actualAmountPaid for user: ${user.name || user.email} - 7000 PKR`);
      }
    });
    
    if (hasChanges) {
      const success = safeSetItem('all_users', allUsers);
      if (success) {
        console.log('✅ Fixed missing actual amounts for all users!');
      } else {
        console.log('⚠️ Missing amounts fix completed but save failed due to storage quota');
      }
      
      // Also update current user if needed
      const currentUser = safeGetItem('pulseprep_user', null);
      if (currentUser && currentUser.paymentStatus === 'completed' && 
          (currentUser.actualAmountPaid === undefined || currentUser.actualAmountPaid === null)) {
        currentUser.actualAmountPaid = 7000;
        currentUser.paymentDate = currentUser.paymentDate || currentUser.registrationDate || new Date().toISOString();
        const userSaveSuccess = safeSetItem('pulseprep_user', currentUser);
        if (userSaveSuccess) {
          console.log('✅ Current user actual amount fixed!');
        } else {
          console.log('⚠️ Current user fix completed but save failed due to storage quota');
        }
      }
      
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error fixing missing actual amounts:', error);
    return false;
  }
};