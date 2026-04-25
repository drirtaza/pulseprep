import { PaymentAttempt, UserData, UserDataWithAttempts } from '../types';

/**
 * Convert existing paymentDetails to first attempt
 * This ensures backward compatibility
 * FIXED: Now properly sets status based on actual user payment status
 */
export const migratePaymentDetailsToAttempts = (user: UserData): UserDataWithAttempts => {
  // If user already has attempts, return as-is
  if ((user as any).paymentAttempts) {
    return user as UserDataWithAttempts;
  }

  // If no paymentDetails, return user with empty attempts
  if (!user.paymentDetails) {
    return {
      ...user,
      paymentAttempts: []
    };
  }

  // Convert paymentDetails to first attempt
  const firstAttempt: PaymentAttempt = {
    id: 'attempt-1',
    screenshot: user.paymentDetails.paymentScreenshot || '',
    screenshotName: user.paymentDetails.paymentScreenshotName || 'payment.jpg',
    screenshotType: user.paymentDetails.paymentScreenshotType || 'image/jpeg',
    transactionId: user.paymentDetails.transactionId,
    accountTitle: user.paymentDetails.accountTitle,
    amount: user.paymentDetails.amount,
    currency: user.paymentDetails.currency || 'PKR',
    uploadedAt: user.paymentDetails.uploadedAt || user.registrationDate,
    // FIXED: Use actual user payment status to set attempt status correctly
    status: user.paymentStatus === 'completed' ? 'approved' : 
            user.paymentStatus === 'rejected' ? 'rejected' : 'pending'
  };

  return {
    ...user,
    paymentAttempts: [firstAttempt]
  };
};

/**
 * Get latest payment attempt for a user
 */
export const getLatestPaymentAttempt = (user: UserDataWithAttempts): PaymentAttempt | null => {
  if (!user.paymentAttempts || user.paymentAttempts.length === 0) {
    return null;
  }
  
  // Return the most recent attempt
  return user.paymentAttempts[user.paymentAttempts.length - 1];
};

/**
 * Add new payment attempt to user
 */
export const addPaymentAttempt = (user: UserDataWithAttempts, attempt: Omit<PaymentAttempt, 'id'>): UserDataWithAttempts => {
  const attemptCount = (user.paymentAttempts?.length || 0) + 1;
  const newAttempt: PaymentAttempt = {
    ...attempt,
    id: `attempt-${attemptCount}`
  };

  return {
    ...user,
    paymentAttempts: [...(user.paymentAttempts || []), newAttempt]
  };
};

/**
 * Get payment attempt count for user
 */
export const getPaymentAttemptCount = (user: UserDataWithAttempts): number => {
  return user.paymentAttempts?.length || 0;
};

/**
 * Check if user has payment screenshot (backward compatible)
 */
export const hasPaymentScreenshot = (user: UserData): boolean => {
  // Check new format first
  const userWithAttempts = user as UserDataWithAttempts;
  if (userWithAttempts.paymentAttempts && userWithAttempts.paymentAttempts.length > 0) {
    const latestAttempt = getLatestPaymentAttempt(userWithAttempts);
    return !!(latestAttempt?.screenshot);
  }

  // Fall back to old format for backward compatibility
  return !!(user.paymentDetails?.paymentScreenshot);
};

/**
 * Get payment attempt by ID
 */
export const getPaymentAttemptById = (user: UserDataWithAttempts, attemptId: string): PaymentAttempt | null => {
  if (!user.paymentAttempts) {
    return null;
  }
  
  return user.paymentAttempts.find(attempt => attempt.id === attemptId) || null;
};

/**
 * Update payment attempt status
 */
export const updatePaymentAttemptStatus = (
  user: UserDataWithAttempts, 
  attemptId: string, 
  status: PaymentAttempt['status'],
  reviewedBy?: string,
  rejectionReason?: string
): UserDataWithAttempts => {
  if (!user.paymentAttempts) {
    return user;
  }

  const updatedAttempts = user.paymentAttempts.map(attempt => {
    if (attempt.id === attemptId) {
      return {
        ...attempt,
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        rejectionReason: status === 'rejected' ? rejectionReason : undefined
      };
    }
    return attempt;
  });

  return {
    ...user,
    paymentAttempts: updatedAttempts
  };
};

/**
 * Get all rejected attempts for a user
 */
export const getRejectedAttempts = (user: UserDataWithAttempts): PaymentAttempt[] => {
  if (!user.paymentAttempts) {
    return [];
  }
  
  return user.paymentAttempts.filter(attempt => attempt.status === 'rejected');
};

/**
 * Get all pending attempts for a user
 */
export const getPendingAttempts = (user: UserDataWithAttempts): PaymentAttempt[] => {
  if (!user.paymentAttempts) {
    return [];
  }
  
  return user.paymentAttempts.filter(attempt => attempt.status === 'pending');
};

/**
 * Get approved attempt for a user (should only be one)
 */
export const getApprovedAttempt = (user: UserDataWithAttempts): PaymentAttempt | null => {
  if (!user.paymentAttempts) {
    return null;
  }
  
  return user.paymentAttempts.find(attempt => attempt.status === 'approved') || null;
};

/**
 * Check if user has any approved payment attempt
 */
export const hasApprovedPayment = (user: UserDataWithAttempts): boolean => {
  return getApprovedAttempt(user) !== null;
};

/**
 * Check if user can upload new payment screenshot
 * Rules: Can upload if no approved attempt exists and latest attempt is not pending
 */
export const canUploadNewPayment = (user: UserDataWithAttempts): boolean => {
  // If user has approved payment, they cannot upload new one
  if (hasApprovedPayment(user)) {
    return false;
  }
  
  // If no attempts, they can upload
  if (!user.paymentAttempts || user.paymentAttempts.length === 0) {
    return true;
  }
  
  // Get latest attempt
  const latestAttempt = getLatestPaymentAttempt(user);
  
  // Can upload if latest attempt is rejected
  return latestAttempt ? latestAttempt.status === 'rejected' : true;
};

/**
 * Get payment attempt summary for user
 */
export const getPaymentAttemptSummary = (user: UserDataWithAttempts): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  canUploadNew: boolean;
  latestStatus: PaymentAttempt['status'] | null;
} => {
  const attempts = user.paymentAttempts || [];
  const latest = getLatestPaymentAttempt(user);
  
  return {
    total: attempts.length,
    pending: attempts.filter(a => a.status === 'pending').length,
    approved: attempts.filter(a => a.status === 'approved').length,
    rejected: attempts.filter(a => a.status === 'rejected').length,
    canUploadNew: canUploadNewPayment(user),
    latestStatus: latest?.status || null
  };
};

/**
 * Migrate all users in a list to have payment attempts
 * Useful for bulk migration of existing data
 */
export const migrateAllUsersToPaymentAttempts = (users: UserData[]): UserDataWithAttempts[] => {
  return users.map(user => migratePaymentDetailsToAttempts(user));
};

/**
 * Validate payment attempt data
 */
export const validatePaymentAttempt = (attempt: Omit<PaymentAttempt, 'id'>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!attempt.screenshot || attempt.screenshot.trim() === '') {
    errors.push('Payment screenshot is required');
  }
  
  if (!attempt.screenshotName || attempt.screenshotName.trim() === '') {
    errors.push('Screenshot filename is required');
  }
  
  if (!attempt.uploadedAt) {
    errors.push('Upload date is required');
  }
  
  if (!['pending', 'approved', 'rejected'].includes(attempt.status)) {
    errors.push('Invalid payment attempt status');
  }
  
  // Validate amount if provided
  if (attempt.amount !== undefined && attempt.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new payment attempt with validation
 */
export const createPaymentAttempt = (
  screenshot: string,
  screenshotName: string,
  screenshotType?: string,
  transactionId?: string,
  accountTitle?: string,
  amount?: number,
  currency: string = 'PKR'
): Omit<PaymentAttempt, 'id'> => {
  const attempt: Omit<PaymentAttempt, 'id'> = {
    screenshot,
    screenshotName,
    screenshotType,
    transactionId,
    accountTitle,
    amount,
    currency,
    uploadedAt: new Date().toISOString(),
    status: 'pending'
  };
  
  const validation = validatePaymentAttempt(attempt);
  if (!validation.isValid) {
    throw new Error(`Invalid payment attempt: ${validation.errors.join(', ')}`);
  }
  
  return attempt;
};

/**
 * Get first payment attempt for a user (original upload)
 */
export const getFirstPaymentAttempt = (user: UserDataWithAttempts): PaymentAttempt | null => {
  if (!user.paymentAttempts || user.paymentAttempts.length === 0) {
    return null;
  }
  
  // Return the first attempt (original upload)
  return user.paymentAttempts[0];
};

/**
 * Get all payment attempts sorted by upload date (oldest first)
 */
export const getAllPaymentAttemptsSorted = (user: UserDataWithAttempts): PaymentAttempt[] => {
  if (!user.paymentAttempts) {
    return [];
  }
  
  // Sort by uploadedAt date (oldest first)
  return [...user.paymentAttempts].sort((a, b) => 
    new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  );
};

/**
 * Get all payment attempts sorted by upload date (newest first)
 */
export const getAllPaymentAttemptsReversed = (user: UserDataWithAttempts): PaymentAttempt[] => {
  if (!user.paymentAttempts) {
    return [];
  }
  
  // Sort by uploadedAt date (newest first)
  return [...user.paymentAttempts].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
};

/**
 * Check if user has multiple payment attempts
 */
export const hasMultipleAttempts = (user: UserDataWithAttempts): boolean => {
  return (user.paymentAttempts?.length || 0) > 1;
};

/**
 * Get payment attempt by status
 */
export const getPaymentAttemptsByStatus = (
  user: UserDataWithAttempts, 
  status: PaymentAttempt['status']
): PaymentAttempt[] => {
  if (!user.paymentAttempts) {
    return [];
  }
  
  return user.paymentAttempts.filter(attempt => attempt.status === status);
};



/**
 * SAFE migration function that only migrates once per user
 * Prevents repeated migration that overwrites existing attempts
 */
export const safelyMigrateUser = (user: UserData): UserDataWithAttempts => {
  // Only migrate if user doesn't already have attempts
  if ((user as any).paymentAttempts) {
    return user as UserDataWithAttempts;
  }
  
  // Perform migration
  const migratedUser = migratePaymentDetailsToAttempts(user);
  
  console.log('🔄 Migrated user to payment attempts:', {
    userId: user.id,
    name: user.name,
    paymentStatus: user.paymentStatus,
    attemptCount: migratedUser.paymentAttempts?.length || 0,
    firstAttemptStatus: migratedUser.paymentAttempts?.[0]?.status
  });
  
  return migratedUser;
};