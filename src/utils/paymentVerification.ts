import { PaymentStatusType, UserData } from '../types';
import { securityService } from '../services/SecurityService';
import { addSubscriptionToUser } from './subscriptionUtils';

// Import safe storage utilities
import { safeGetItem, safeSetItem } from './storageUtils';

/**
 * Check Payment Status
 * Checks localStorage for payment approval status
 */
export const checkPaymentStatus = (userId: string): PaymentStatusType => {
  try {
    // ✅ FIXED: Use safe storage with array validation
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    
    // Check if payment is approved
    if (approvedPayments.includes(userId)) {
      return 'completed';
    }
    
    // Check if payment is rejected
    if (rejectedPayments[userId]) {
      return 'rejected';
    }
    
    // Default to pending
    return 'pending';
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return 'pending';
  }
};

/**
 * 🔧 FIXED: Get actual amount user paid (not current settings)
 */
const getActualUserPaymentAmount = (user: any) => {
  try {
    // 1. Check payment attempts for amount (most reliable)
    if (user.paymentAttempts && Array.isArray(user.paymentAttempts) && user.paymentAttempts.length > 0) {
      const firstAttempt = user.paymentAttempts[0];
      if (firstAttempt && firstAttempt.amount) {
        return {
          amount: firstAttempt.amount,
          currency: firstAttempt.currency || 'PKR'
        };
      }
    }
    
    // 2. Check payment details (old format)
    if (user.paymentDetails && user.paymentDetails.amount) {
      return {
        amount: user.paymentDetails.amount,
        currency: user.paymentDetails.currency || 'PKR'
      };
    }
    
    // 3. Check if already stored
    if (user.actualAmountPaid) {
      return {
        amount: user.actualAmountPaid,
        currency: user.paymentCurrency || 'PKR'
      };
    }
    
    // 4. Fallback to current settings (for very old users)
    const rawSubscriptionSettings = safeGetItem('pulseprep_subscription_settings', {});
    const subscriptionSettings = (rawSubscriptionSettings && typeof rawSubscriptionSettings === 'object') ? rawSubscriptionSettings : {};
    
    let currentPrice = 7000;
    if (subscriptionSettings.plans && Array.isArray(subscriptionSettings.plans)) {
      const currentPlan = subscriptionSettings.plans.find((p: any) => p && p.id === 'plan-3month') || subscriptionSettings.plans[0];
      if (currentPlan && currentPlan.price) {
        currentPrice = currentPlan.price;
      }
    }
    
    return {
      amount: currentPrice,
      currency: 'PKR'
    };
  } catch (error) {
    console.error('❌ Error getting actual user payment amount:', error);
    return {
      amount: 7000,
      currency: 'PKR'
    };
  }
};

/**
 * 🔧 FIXED: Approve Payment (Admin Function)
 * Adds user ID to approved payments list and preserves actual payment amount
 */
export const approvePayment = (userId: string, adminId?: string, adminName?: string): boolean => {
  try {
    // ✅ FIXED: Use safe storage with proper validation
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    const rawAllUsers = safeGetItem('all_users', []);
    
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    
    const targetUser = allUsers.find((user: UserData) => user && user.id === userId);
    
    // Add to approved list if not already there
    if (!approvedPayments.includes(userId)) {
      approvedPayments.push(userId);
      safeSetItem('approved_payments', approvedPayments);
    }
    
    // Remove from rejected list if it was there
    if (rejectedPayments[userId]) {
      delete rejectedPayments[userId];
      safeSetItem('rejected_payments', rejectedPayments);
    }
    
    // Update user's payment status and add subscription
    const userIndex = allUsers.findIndex((user: any) => user && user.id === userId);
    const approvalDate = new Date().toISOString();

    if (userIndex > -1) {
      // 🔧 FIXED: Store actual amount user paid, not current settings
      const actualPayment = getActualUserPaymentAmount(allUsers[userIndex]);
      
      allUsers[userIndex].actualAmountPaid = actualPayment.amount;
      allUsers[userIndex].paymentCurrency = actualPayment.currency;
      allUsers[userIndex].paymentDate = approvalDate;
      
      // Store plan info (current plan they're getting, but preserve payment amount)
      const rawSubscriptionSettings = safeGetItem('pulseprep_subscription_settings', {});
      const subscriptionSettings = (rawSubscriptionSettings && typeof rawSubscriptionSettings === 'object') ? rawSubscriptionSettings : {};
      
      if (subscriptionSettings.plans && Array.isArray(subscriptionSettings.plans)) {
        const currentPlan = subscriptionSettings.plans.find((p: any) => p && p.id === 'plan-3month') || subscriptionSettings.plans[0];
        if (currentPlan) {
          allUsers[userIndex].subscriptionPlanAtPayment = {
            id: currentPlan.id,
            name: currentPlan.name,
            price: currentPlan.price, // This is current plan price
            duration: currentPlan.duration,
            actualAmountPaid: actualPayment.amount // This is what user actually paid
          };
        }
      }
      
      console.log('💰 Payment approved with preserved amount:', {
        userId,
        actualAmountPaid: actualPayment.amount,
        currency: actualPayment.currency,
        currentPlanPrice: allUsers[userIndex].subscriptionPlanAtPayment?.price
      });
      
      // Add 3-month subscription to user
      allUsers[userIndex] = addSubscriptionToUser(allUsers[userIndex], 'plan-3month');
      safeSetItem('all_users', allUsers);
      
      // Update current user data if it matches
      const rawCurrentUser = safeGetItem('pulseprep_user', null);
      if (rawCurrentUser) {
        const userData = rawCurrentUser as UserData;
        if (userData.id === userId) {
          userData.actualAmountPaid = actualPayment.amount;
          userData.paymentCurrency = actualPayment.currency;
          userData.paymentDate = approvalDate;
          if (allUsers[userIndex].subscriptionPlanAtPayment) {
            userData.subscriptionPlanAtPayment = allUsers[userIndex].subscriptionPlanAtPayment;
          }
          
          const updatedUser = addSubscriptionToUser(userData, 'plan-3month');
          safeSetItem('pulseprep_user', updatedUser);
        }
      }
    }

    // Keep the original payment status update
    updateUserPaymentStatus(userId, 'completed');
    
    // Log audit event if admin info is available
    if (adminId && adminName && targetUser) {
      const rawCurrentAdmin = safeGetItem('pulseprep_admin', {});
      const currentAdmin = (rawCurrentAdmin && typeof rawCurrentAdmin === 'object') ? rawCurrentAdmin : {};
      
      if (currentAdmin.id) {
        securityService.logAuditEvent(
          'payment.approved',
          currentAdmin,
          {
            description: `Payment approved for user ${targetUser.name} (${targetUser.email})`,
            metadata: {
              userId,
              userName: targetUser.name,
              userEmail: targetUser.email,
              userSpecialty: targetUser.specialty,
              actionType: 'payment_approval'
            },
            target: {
              type: 'user',
              id: userId,
              name: targetUser.name
            }
          },
          'medium',
          'success'
        );
      }
    }
    
    console.log(`✅ Payment approved for user: ${userId} - 3-month subscription added`);
    return true;
  } catch (error) {
    console.error('❌ Error approving payment:', error);
    return false;
  }
};

/**
 * Reject Payment (Admin Function)
 * Adds user ID to rejected payments with reason
 */
export const rejectPayment = (userId: string, reason: string, adminId?: string, adminName?: string): boolean => {
  try {
    // ✅ FIXED: Use safe storage with proper validation
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    const rawAllUsers = safeGetItem('all_users', []);
    
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    
    const targetUser = allUsers.find((user: UserData) => user && user.id === userId);
    
    // Add to rejected list
    rejectedPayments[userId] = {
      reason,
      rejectedAt: new Date().toISOString()
    };
    safeSetItem('rejected_payments', rejectedPayments);
    
    // Remove from approved list if it was there
    const approvedIndex = approvedPayments.indexOf(userId);
    if (approvedIndex > -1) {
      approvedPayments.splice(approvedIndex, 1);
      safeSetItem('approved_payments', approvedPayments);
    }
    
    // Update user's payment status
    updateUserPaymentStatus(userId, 'rejected');
    
    // Log audit event if admin info is available
    if (adminId && adminName && targetUser) {
      const rawCurrentAdmin = safeGetItem('pulseprep_admin', {});
      const currentAdmin = (rawCurrentAdmin && typeof rawCurrentAdmin === 'object') ? rawCurrentAdmin : {};
      
      if (currentAdmin.id) {
        securityService.logAuditEvent(
          'payment.rejected',
          currentAdmin,
          {
            description: `Payment rejected for user ${targetUser.name} (${targetUser.email}). Reason: ${reason}`,
            metadata: {
              userId,
              userName: targetUser.name,
              userEmail: targetUser.email,
              userSpecialty: targetUser.specialty,
              rejectionReason: reason,
              actionType: 'payment_rejection'
            },
            target: {
              type: 'user',
              id: userId,
              name: targetUser.name
            }
          },
          'medium',
          'success'
        );
      }
    }
    
    console.log(`❌ Payment rejected for user: ${userId}, reason: ${reason}`);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting payment:', error);
    return false;
  }
};

/**
 * Get All Pending Payments (Admin Function)
 * Returns list of users with pending payments
 * FIXED: Now checks actual paymentStatus instead of old approval lists
 */
export const getPendingPayments = (): UserData[] => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    

    
    // ✅ FIXED: Filter users with pending payment status with safe array operations
    const pendingUsers = allUsers.filter((user: UserData) => {
      if (!user || !user.id) return false; // Skip invalid users
      
      const isPending = user.paymentStatus === 'pending';
      if (isPending) {

      }
      return isPending;
    });
    

    return pendingUsers;
  } catch (error) {
    console.error('❌ Error getting pending payments:', error);
    return [];
  }
};

/**
 * Get All Users with Payment Status
 * Returns all users with their current payment status
 */
export const getAllUsersWithPaymentStatus = (): (UserData & { currentPaymentStatus: PaymentStatusType })[] => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    
    return allUsers
      .filter((user: UserData) => user && user.id) // Filter out invalid users
      .map((user: UserData) => ({
        ...user,
        currentPaymentStatus: checkPaymentStatus(user.id)
      }));
  } catch (error) {
    console.error('❌ Error getting all users with payment status:', error);
    return [];
  }
};

/**
 * Update User Payment Status
 * Updates the user's payment status in localStorage
 */
export const updateUserPaymentStatus = (userId: string, status: PaymentStatusType): void => {
  try {
    // Update current user if it matches
    const rawCurrentUser = safeGetItem('pulseprep_user', null);
    if (rawCurrentUser) {
      const userData = rawCurrentUser as UserData;
      if (userData.id === userId) {
        userData.paymentStatus = status;
        safeSetItem('pulseprep_user', userData);
      }
    }
    
    // Update pending user if it matches
    const rawPendingUser = safeGetItem('pulseprep_user_pending', null);
    if (rawPendingUser) {
      const userData = rawPendingUser as UserData;
      if (userData.id === userId) {
        userData.paymentStatus = status;
        safeSetItem('pulseprep_user_pending', userData);
        
        // If approved, move to active user
        if (status === 'completed') {
          safeSetItem('pulseprep_user', userData);
          localStorage.setItem('pulseprep_auth', 'true');
          localStorage.removeItem('pulseprep_user_pending');
        }
      }
    }
    
    // Update in all users list
    const rawAllUsers = safeGetItem('all_users', []);
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    const userIndex = allUsers.findIndex((user: UserData) => user && user.id === userId);
    
    if (userIndex > -1) {
      allUsers[userIndex].paymentStatus = status;
      safeSetItem('all_users', allUsers);
    } else {
      // If user not in all users list, try to add them from current/pending user
      const userData = rawCurrentUser ? rawCurrentUser as UserData : 
                     rawPendingUser ? rawPendingUser as UserData : null;
      if (userData && userData.id === userId) {
        userData.paymentStatus = status;
        allUsers.push(userData);
        safeSetItem('all_users', allUsers);
      }
    }
    
    console.log(`📊 Payment status updated for user ${userId}: ${status}`);
  } catch (error) {
    console.error('❌ Error updating user payment status:', error);
  }
};

/**
 * Get Payment Rejection Reason
 * Returns the rejection reason for a specific user
 */
export const getPaymentRejectionReason = (userId: string): { reason: string; rejectedAt: string } | null => {
  try {
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    return rejectedPayments[userId] || null;
  } catch (error) {
    console.error('❌ Error getting payment rejection reason:', error);
    return null;
  }
};

/**
 * Clear All Payment Data (Admin Function)
 * Clears all payment verification data - use with caution
 */
export const clearAllPaymentData = (): void => {
  try {
    localStorage.removeItem('approved_payments');
    localStorage.removeItem('rejected_payments');
    console.log('🗑️ All payment data cleared');
  } catch (error) {
    console.error('❌ Error clearing payment data:', error);
  }
};

/**
 * Get Payment Statistics (Admin Function)
 * Returns statistics about payments
 */
export const getPaymentStatistics = (): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number;
} => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    
    const total = allUsers.length;
    const approved = approvedPayments.length;
    const rejected = Object.keys(rejectedPayments).length;
    const pending = total - approved - rejected;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate
    };
  } catch (error) {
    console.error('❌ Error getting payment statistics:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      approvalRate: 0
    };
  }
};

/**
 * Simulate Payment Processing (Development Function)
 * Simulates the payment verification process with delays
 */
export const simulatePaymentProcessing = async (
  userId: string, 
  shouldApprove: boolean = true,
  processingTimeMs: number = 2000
): Promise<PaymentStatusType> => {
  try {
    console.log(`🔄 Simulating payment processing for user: ${userId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, processingTimeMs));
    
    if (shouldApprove) {
      approvePayment(userId);
      return 'completed';
    } else {
      rejectPayment(userId, 'Insufficient payment amount or invalid transaction');
      return 'rejected';
    }
  } catch (error) {
    console.error('❌ Error simulating payment processing:', error);
    return 'pending';
  }
};

/**
 * Get Approved Payments (Admin Function)
 * Returns list of users with approved payments
 */
export const getApprovedPayments = (): UserData[] => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    
    console.log('📊 getApprovedPayments debug:', {
      allUsersType: typeof rawAllUsers,
      allUsersIsArray: Array.isArray(rawAllUsers),
      allUsersLength: allUsers.length,
      approvedPaymentsLength: approvedPayments.length
    });
    
    // ✅ FIXED: Filter users with approved payments with safe array operations
    const approvedUsers = allUsers.filter((user: UserData) => {
      if (!user || !user.id) return false; // Skip invalid users
      return approvedPayments.includes(user.id);
    });
    
    console.log(`📊 Found ${approvedUsers.length} approved users`);
    return approvedUsers;
  } catch (error) {
    console.error('❌ Error getting approved payments:', error);
    return [];
  }
};

/**
 * Get Rejected Payments (Admin Function)
 * Returns list of users with rejected payments
 */
export const getRejectedPayments = (): UserData[] => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    
    // ✅ FIXED: Filter users with rejected payments with safe array operations
    const rejectedUsers = allUsers.filter((user: UserData) => {
      if (!user || !user.id) return false; // Skip invalid users
      return rejectedPayments[user.id];
    });
    
    return rejectedUsers;
  } catch (error) {
    console.error('❌ Error getting rejected payments:', error);
    return [];
  }
};

/**
 * 🔧 FIXED: Get Payment History (Admin Function)
 * Returns complete payment history with status and processing details including actual amounts paid
 */
export const getPaymentHistory = (): Array<{
  userId: string;
  userName: string;
  userEmail: string;
  specialty: string;
  status: PaymentStatusType;
  processedAt: string;
  amount?: number;
  actualAmount?: number;
  currency?: string;
  reason?: string;
  processedBy?: string;
}> => {
  try {
    // ✅ FIXED: Use safe storage with proper array validation
    const rawAllUsers = safeGetItem('all_users', []);
    const rawApprovedPayments = safeGetItem('approved_payments', []);
    const rawRejectedPayments = safeGetItem('rejected_payments', {});
    
    const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
    const approvedPayments = Array.isArray(rawApprovedPayments) ? rawApprovedPayments : [];
    const rejectedPayments = (rawRejectedPayments && typeof rawRejectedPayments === 'object') ? rawRejectedPayments : {};
    
    const history: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      specialty: string;
      status: PaymentStatusType;
      processedAt: string;
      amount?: number;
      actualAmount?: number;
      currency?: string;
      reason?: string;
      processedBy?: string;
    }> = [];
    
    // ✅ FIXED: Add all users to history with their current status with safe operations
    allUsers.forEach((user: UserData) => {
      if (!user || !user.id || !user.name || !user.email) {
        return; // Skip invalid users
      }

      let status: PaymentStatusType = 'pending';
      let processedAt = user.registrationDate;
      let reason: string | undefined;
      let processedBy: string | undefined;
      
      // 🔧 FIXED: Get actual payment amount from user data using our helper function
      const actualPaymentData = getActualUserPaymentAmount(user);
      const actualAmount = actualPaymentData.amount;
      const currency = actualPaymentData.currency;
      
      const paymentDate = (user as any).paymentDate;
      
      if (approvedPayments.includes(user.id)) {
        status = 'completed';
        // Use actual payment date if available, otherwise use current time
        processedAt = paymentDate || new Date().toISOString();
        processedBy = 'Finance Manager'; // Default processed by
      } else if (rejectedPayments[user.id]) {
        status = 'rejected';
        processedAt = rejectedPayments[user.id].rejectedAt;
        reason = rejectedPayments[user.id].reason;
        processedBy = 'Finance Manager'; // Default processed by
      }
      
      history.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        specialty: user.specialty,
        status,
        processedAt,
        amount: actualAmount, // Use actual amount paid
        actualAmount: actualAmount, // Also include as actualAmount for compatibility
        currency: currency,
        reason,
        processedBy
      });
    });
    
    // Sort by processed date (most recent first)
    history.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
    
    return history;
  } catch (error) {
    console.error('❌ Error getting payment history:', error);
    return [];
  }
};

/**
 * Auto-approve Demo Payments (Development Function)
 * Automatically approves payments after a delay for demo purposes
 */
export const enableAutoApproval = (delayMinutes: number = 1): void => {
  try {
    const autoApprovalDelay = delayMinutes * 60 * 1000; // Convert to milliseconds
    
    // Check for pending payments periodically
    const checkPendingPayments = () => {
      const pendingUsers = getPendingPayments();
      pendingUsers.forEach(user => {
        if (!user || !user.registrationDate) return; // Skip invalid users
        
        const registrationTime = new Date(user.registrationDate).getTime();
        const currentTime = Date.now();
        
        // Auto-approve if enough time has passed
        if (currentTime - registrationTime >= autoApprovalDelay) {
          approvePayment(user.id);
          console.log(`🤖 Auto-approved payment for user: ${user.name}`);
        }
      });
    };
    
    // Check every minute
    setInterval(checkPendingPayments, 60 * 1000);
    console.log(`🤖 Auto-approval enabled with ${delayMinutes} minute delay`);
  } catch (error) {
    console.error('❌ Error enabling auto-approval:', error);
  }
};