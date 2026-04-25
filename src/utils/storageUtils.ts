// Simplified Storage Management System - Essential Functionality Only
// Maintains all workflows and data flows with minimal cleanup strategy

import { UserData, QuestionData, SpecialtyType, EmailVerificationToken, EmailDeliveryStatus } from '../types';

// Single storage threshold - trigger cleanup at 85%
const STORAGE_CLEANUP_THRESHOLD = 0.85;

// Simplified 3-tier priority system
const STORAGE_PRIORITY = {
  // Critical data (never remove)
  'pulseprep_user': 100,
  'pulseprep_admin': 100,
  'pulseprep_auth': 100,
  'pulseprep_admin_auth': 100,
  'all_users': 100,
  'all_admins': 100,
  'pulseprep_active_session': 100,
  
  // Important data (remove only if critical)
  'pulseprep_payment_settings': 50,
  'pulseprep_subscription_settings': 50,
  'pulseprep_branding_settings': 50,
  'pulseprep_content_settings': 50,
  'pulseprep_fcps_questions': 50,
  'pulseprep_medical_systems': 50,
  'pulseprep_mock_exam_sets_medicine': 50,
  'pulseprep_mock_exam_sets_surgery': 50,
  'pulseprep_mock_exam_sets_gynae-obs': 50,
  
  // Email verification data (important but can be cleaned up)
  'email_verification_tokens': 40,
  'email_delivery_tracking': 40,
  'email_queue': 40,
  'email_verification_settings': 40,
  
  // Removable data (remove first during cleanup)
  'pulseprep_practice_progress': 10,
  'pulseprep_mock_exam_history': 10,
  'pulseprep_analytics_cache': 10,
  'pulseprep_bookmarks_medicine': 10,
  'pulseprep_bookmarks_surgery': 10,
  'pulseprep_bookmarks_gynae-obs': 10,
  'pulseprep_user_pending': 10,
  'pulseprep_session_cache': 10,
  'pulseprep_temp_data': 10
};

// Basic storage event logging for errors
let storageErrors: Array<{
  timestamp: number;
  action: string;
  key: string;
  error: string;
}> = [];

// Email verification storage management
export const storeEmailVerificationToken = (token: EmailVerificationToken): boolean => {
  try {
    const existingTokens = safeGetItem('email_verification_tokens', []);
    const updatedTokens = [...existingTokens, token];
    
    // Keep only the last 100 tokens to prevent storage bloat
    const trimmedTokens = updatedTokens.slice(-100);
    
    return safeSetItem('email_verification_tokens', trimmedTokens);
  } catch (error) {
    logStorageError('storeEmailVerificationToken', 'email_verification_tokens', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const getEmailVerificationTokens = (): EmailVerificationToken[] => {
  try {
    return safeGetItem('email_verification_tokens', []);
  } catch (error) {
    logStorageError('getEmailVerificationTokens', 'email_verification_tokens', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

export const updateEmailVerificationToken = (tokenId: string, updates: Partial<EmailVerificationToken>): boolean => {
  try {
    const tokens = getEmailVerificationTokens();
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    
    if (tokenIndex !== -1) {
      tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates };
      return safeSetItem('email_verification_tokens', tokens);
    }
    
    return false;
  } catch (error) {
    logStorageError('updateEmailVerificationToken', 'email_verification_tokens', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const removeEmailVerificationToken = (tokenId: string): boolean => {
  try {
    const tokens = getEmailVerificationTokens();
    const filteredTokens = tokens.filter(t => t.id !== tokenId);
    return safeSetItem('email_verification_tokens', filteredTokens);
  } catch (error) {
    logStorageError('removeEmailVerificationToken', 'email_verification_tokens', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const storeEmailDeliveryTracking = (tracking: {
  emailId: string;
  to: string;
  subject: string;
  status: EmailDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  smtpResponse?: string;
  createdAt: string;
}): boolean => {
  try {
    const existingTracking = safeGetItem('email_delivery_tracking', []);
    const updatedTracking = [...existingTracking, tracking];
    
    // Keep only the last 500 tracking records
    const trimmedTracking = updatedTracking.slice(-500);
    
    return safeSetItem('email_delivery_tracking', trimmedTracking);
  } catch (error) {
    logStorageError('storeEmailDeliveryTracking', 'email_delivery_tracking', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const getEmailDeliveryTracking = (): any[] => {
  try {
    return safeGetItem('email_delivery_tracking', []);
  } catch (error) {
    logStorageError('getEmailDeliveryTracking', 'email_delivery_tracking', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

export const storeEmailQueueItem = (queueItem: {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  scheduledFor?: string;
  metadata?: Record<string, any>;
}): boolean => {
  try {
    const existingQueue = safeGetItem('email_queue', []);
    const updatedQueue = [...existingQueue, queueItem];
    
    // Keep only the last 200 queue items
    const trimmedQueue = updatedQueue.slice(-200);
    
    return safeSetItem('email_queue', trimmedQueue);
  } catch (error) {
    logStorageError('storeEmailQueueItem', 'email_queue', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const getEmailQueue = (): any[] => {
  try {
    return safeGetItem('email_queue', []);
  } catch (error) {
    logStorageError('getEmailQueue', 'email_queue', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

export const removeEmailQueueItem = (itemId: string): boolean => {
  try {
    const queue = getEmailQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    return safeSetItem('email_queue', filteredQueue);
  } catch (error) {
    logStorageError('removeEmailQueueItem', 'email_queue', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const updateEmailQueueItem = (itemId: string, updates: any): boolean => {
  try {
    const queue = getEmailQueue();
    const itemIndex = queue.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates };
      return safeSetItem('email_queue', queue);
    }
    
    return false;
  } catch (error) {
    logStorageError('updateEmailQueueItem', 'email_queue', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Initialize storage management system
export const initializeStorageManagement = (): void => {
  try {
    storageErrors = [];
    const info = getStorageInfo();

    
    if (info.usagePercentage > STORAGE_CLEANUP_THRESHOLD) {

      performCleanup();
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
};

// Get storage usage information
export const getStorageInfo = (): {
  used: number;
  remaining: number;
  total: number;
  usagePercentage: number;
  itemCount: number;
  largestItems: Array<{ key: string; size: number; sizeMB: string }>;
} => {
  try {
    let totalSize = 0;
    let itemCount = 0;
    const itemSizes: Array<{ key: string; size: number; sizeMB: string }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      try {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            itemCount++;
            itemSizes.push({
              key,
              size,
              sizeMB: (size / (1024 * 1024)).toFixed(3) + 'MB'
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error calculating size for key ${i}:`, error);
      }
    }
    
    itemSizes.sort((a, b) => b.size - a.size);
    
    const estimatedTotal = 8 * 1024 * 1024; // 8MB conservative estimate
    const remaining = Math.max(0, estimatedTotal - totalSize);
    const usagePercentage = (totalSize / estimatedTotal) * 100;
    
    return {
      used: totalSize,
      remaining,
      total: estimatedTotal,
      usagePercentage,
      itemCount,
      largestItems: itemSizes.slice(0, 10)
    };
  } catch (error) {
    console.error('❌ Error getting storage info:', error);
    return {
      used: 0,
      remaining: 0,
      total: 0,
      usagePercentage: 0,
      itemCount: 0,
      largestItems: []
    };
  }
};



// Basic user data optimization - keeps ALL user data intact
export const optimizeUserData = (userData: UserData): UserData => {
  // Remove unnecessary fields for storage optimization
  const optimized = { ...userData };
  
  // Remove sensitive data that shouldn't be stored
  delete optimized.password;
  delete optimized.passwordHash;
  delete optimized.passwordSalt;
  
  // Remove email verification tokens from user data (stored separately)
  delete optimized.emailVerificationToken;
  
  return optimized;
};

// Email verification storage optimization
export const optimizeEmailVerificationStorage = (): { optimized: number; freedMB: number } => {
  try {
    let optimized = 0;
    let freedBytes = 0;
    
    // Optimize verification tokens
    const tokens = getEmailVerificationTokens();
    const optimizedTokens = tokens.map(token => ({
      id: token.id,
      token: token.token.substring(0, 32), // Keep only first 32 chars for reference
      email: token.email,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      used: token.used,
      attempts: token.attempts,
      lastResendAt: token.lastResendAt,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent
    }));
    
    if (optimizedTokens.length > 0) {
      safeSetItem('email_verification_tokens', optimizedTokens);
      optimized += tokens.length;
    }
    
    // Optimize delivery tracking
    const tracking = getEmailDeliveryTracking();
    const optimizedTracking = tracking.map(record => ({
      emailId: record.emailId,
      to: record.to,
      subject: record.subject?.substring(0, 100), // Limit subject length
      status: record.status,
      sentAt: record.sentAt,
      deliveredAt: record.deliveredAt,
      failedAt: record.failedAt,
      errorMessage: record.errorMessage?.substring(0, 200), // Limit error message length
      retryCount: record.retryCount,
      smtpResponse: record.smtpResponse,
      createdAt: record.createdAt
    }));
    
    if (optimizedTracking.length > 0) {
      safeSetItem('email_delivery_tracking', optimizedTracking);
      optimized += tracking.length;
    }
    
    // Optimize queue items
    const queue = getEmailQueue();
    const optimizedQueue = queue.map(item => ({
      id: item.id,
      to: item.to,
      subject: item.subject?.substring(0, 100), // Limit subject length
      htmlContent: item.htmlContent?.substring(0, 1000), // Limit content length
      textContent: item.textContent?.substring(0, 500), // Limit text content length
      priority: item.priority,
      retryCount: item.retryCount,
      maxRetries: item.maxRetries,
      createdAt: item.createdAt,
      scheduledFor: item.scheduledFor,
      metadata: item.metadata
    }));
    
    if (optimizedQueue.length > 0) {
      safeSetItem('email_queue', optimizedQueue);
      optimized += queue.length;
    }
    
    const freedMB = freedBytes / (1024 * 1024);
    console.log(`🔧 Email verification storage optimized: ${optimized} items processed`);
    
    return { optimized, freedMB };
  } catch (error) {
    console.error('❌ Error optimizing email verification storage:', error);
    return { optimized: 0, freedMB: 0 };
  }
};

// Email verification data migration
export const migrateEmailVerificationData = (): { migrated: number; errors: number } => {
  try {
    let migrated = 0;
    let errors = 0;
    
    // Migrate old email verification tokens (if they exist in different format)
    const oldTokens = safeGetItem('email_verification_tokens_old', []);
    if (oldTokens.length > 0) {
      try {
        const migratedTokens = oldTokens.map((token: any) => ({
          id: token.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          token: token.token || token.code || '',
          email: token.email,
          expiresAt: token.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          createdAt: token.createdAt || new Date().toISOString(),
          used: token.used || false,
          attempts: token.attempts || 0,
          lastResendAt: token.lastResendAt,
          ipAddress: token.ipAddress || '127.0.0.1',
          userAgent: token.userAgent || navigator.userAgent
        }));
        
        safeSetItem('email_verification_tokens', migratedTokens);
        localStorage.removeItem('email_verification_tokens_old');
        migrated += migratedTokens.length;
      } catch (error) {
        console.error('❌ Error migrating email verification tokens:', error);
        errors++;
      }
    }
    
    // Migrate old delivery tracking
    const oldTracking = safeGetItem('email_delivery_tracking_old', []);
    if (oldTracking.length > 0) {
      try {
        const migratedTracking = oldTracking.map((record: any) => ({
          emailId: record.emailId || `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          to: record.to || record.email || '',
          subject: record.subject || 'Email Verification',
          status: record.status || 'pending',
          sentAt: record.sentAt,
          deliveredAt: record.deliveredAt,
          failedAt: record.failedAt,
          errorMessage: record.errorMessage,
          retryCount: record.retryCount || 0,
          smtpResponse: record.smtpResponse,
          createdAt: record.createdAt || new Date().toISOString()
        }));
        
        safeSetItem('email_delivery_tracking', migratedTracking);
        localStorage.removeItem('email_delivery_tracking_old');
        migrated += migratedTracking.length;
      } catch (error) {
        console.error('❌ Error migrating email delivery tracking:', error);
        errors++;
      }
    }
    
    // Migrate old queue items
    const oldQueue = safeGetItem('email_queue_old', []);
    if (oldQueue.length > 0) {
      try {
        const migratedQueue = oldQueue.map((item: any) => ({
          id: item.id || `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          to: item.to || item.email || '',
          subject: item.subject || 'Email Verification',
          htmlContent: item.htmlContent || '',
          textContent: item.textContent || '',
          priority: item.priority || 'normal',
          retryCount: item.retryCount || 0,
          maxRetries: item.maxRetries || 3,
          createdAt: item.createdAt || new Date().toISOString(),
          scheduledFor: item.scheduledFor,
          metadata: item.metadata || {}
        }));
        
        safeSetItem('email_queue', migratedQueue);
        localStorage.removeItem('email_queue_old');
        migrated += migratedQueue.length;
      } catch (error) {
        console.error('❌ Error migrating email queue:', error);
        errors++;
      }
    }
    
    console.log(`🔄 Email verification data migration completed: ${migrated} items migrated, ${errors} errors`);
    
    return { migrated, errors };
  } catch (error) {
    console.error('❌ Error during email verification data migration:', error);
    return { migrated: 0, errors: 1 };
  }
};

// Email verification storage health check
export const checkEmailVerificationStorageHealth = (): {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  stats: {
    totalTokens: number;
    expiredTokens: number;
    totalTracking: number;
    oldTracking: number;
    totalQueue: number;
    stuckQueue: number;
  };
} => {
  try {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const tokens = getEmailVerificationTokens();
    const tracking = getEmailDeliveryTracking();
    const queue = getEmailQueue();
    
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check for expired tokens
    const expiredTokens = tokens.filter(token => new Date(token.expiresAt) <= now);
    if (expiredTokens.length > 0) {
      issues.push(`${expiredTokens.length} expired verification tokens found`);
      recommendations.push('Run cleanupExpiredEmailTokens() to remove expired tokens');
    }
    
    // Check for old tracking records
    const oldTracking = tracking.filter(record => new Date(record.createdAt) <= sevenDaysAgo);
    if (oldTracking.length > 0) {
      issues.push(`${oldTracking.length} old delivery tracking records found`);
      recommendations.push('Run cleanupOldEmailTracking() to remove old tracking data');
    }
    
    // Check for stuck queue items
    const stuckQueue = queue.filter(item => new Date(item.createdAt) <= oneDayAgo);
    if (stuckQueue.length > 0) {
      issues.push(`${stuckQueue.length} stuck queue items found`);
      recommendations.push('Run cleanupOldEmailQueue() to remove stuck queue items');
    }
    
    // Check storage size
    const storageInfo = getStorageInfo();
    if (storageInfo.usagePercentage > 0.8) {
      issues.push('Storage usage is high (>80%)');
      recommendations.push('Run performCleanup() to free up storage space');
    }
    
    const stats = {
      totalTokens: tokens.length,
      expiredTokens: expiredTokens.length,
      totalTracking: tracking.length,
      oldTracking: oldTracking.length,
      totalQueue: queue.length,
      stuckQueue: stuckQueue.length
    };
    
    const healthy = issues.length === 0;
    
    return {
      healthy,
      issues,
      recommendations,
      stats
    };
  } catch (error) {
    console.error('❌ Error checking email verification storage health:', error);
    return {
      healthy: false,
      issues: ['Error checking storage health'],
      recommendations: ['Check console for detailed error information'],
      stats: {
        totalTokens: 0,
        expiredTokens: 0,
        totalTracking: 0,
        oldTracking: 0,
        totalQueue: 0,
        stuckQueue: 0
      }
    };
  }
};

// Simple cleanup - remove only low priority items
export const performCleanup = (): { cleaned: number; freedMB: number } => {
  try {
    let cleanedItems = 0;
    let freedBytes = 0;
    
    // Clean up email verification data first (older than 30 days)
    const emailCleanupResult = cleanupEmailVerificationData();
    cleanedItems += emailCleanupResult.cleaned;
    freedBytes += emailCleanupResult.freedBytes;
    
    // Clean up expired tokens
    const tokenCleanupResult = cleanupExpiredEmailTokens();
    cleanedItems += tokenCleanupResult.cleaned;
    freedBytes += tokenCleanupResult.freedBytes;
    
    // Clean up old delivery tracking
    const trackingCleanupResult = cleanupOldEmailTracking();
    cleanedItems += trackingCleanupResult.cleaned;
    freedBytes += trackingCleanupResult.freedBytes;
    
    // Clean up old queue items
    const queueCleanupResult = cleanupOldEmailQueue();
    cleanedItems += queueCleanupResult.cleaned;
    freedBytes += queueCleanupResult.freedBytes;
    
    // Continue with existing cleanup logic
    const itemsToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      try {
      const key = localStorage.key(i);
        if (key && (STORAGE_PRIORITY as Record<string, number>)[key] === 10) {
          itemsToRemove.push(key);
        }
      } catch (error) {
        console.warn(`⚠️ Error during cleanup for key ${i}:`, error);
      }
    }
    
    // Remove low priority items
    itemsToRemove.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          freedBytes += new Blob([value]).size;
        }
        localStorage.removeItem(key);
        cleanedItems++;
      } catch (error) {
        console.warn(`⚠️ Error removing key ${key}:`, error);
      }
    });
    
    const freedMB = freedBytes / (1024 * 1024);
    
    console.log(`🧹 Storage cleanup completed: ${cleanedItems} items removed, ${freedMB.toFixed(3)}MB freed`);
    
    return { cleaned: cleanedItems, freedMB };
  } catch (error) {
    console.error('❌ Error during storage cleanup:', error);
    return { cleaned: 0, freedMB: 0 };
  }
};

// Email verification data cleanup functions
export const cleanupEmailVerificationData = (): { cleaned: number; freedBytes: number } => {
  try {
    let cleaned = 0;
    let freedBytes = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Clean up old verification tokens
    const tokens = getEmailVerificationTokens();
    const validTokens = tokens.filter(token => {
      const tokenDate = new Date(token.createdAt);
      return tokenDate > thirtyDaysAgo;
    });
    
    if (validTokens.length < tokens.length) {
      const removedCount = tokens.length - validTokens.length;
      cleaned += removedCount;
      safeSetItem('email_verification_tokens', validTokens);
    }
    
    // Clean up old delivery tracking
    const tracking = getEmailDeliveryTracking();
    const validTracking = tracking.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate > thirtyDaysAgo;
    });
    
    if (validTracking.length < tracking.length) {
      const removedCount = tracking.length - validTracking.length;
      cleaned += removedCount;
      safeSetItem('email_delivery_tracking', validTracking);
    }
    
    // Clean up old queue items
    const queue = getEmailQueue();
    const validQueue = queue.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate > thirtyDaysAgo;
    });
    
    if (validQueue.length < queue.length) {
      const removedCount = queue.length - validQueue.length;
      cleaned += removedCount;
      safeSetItem('email_queue', validQueue);
    }
    
    return { cleaned, freedBytes };
  } catch (error) {
    console.error('❌ Error cleaning up email verification data:', error);
    return { cleaned: 0, freedBytes: 0 };
  }
};

export const cleanupExpiredEmailTokens = (): { cleaned: number; freedBytes: number } => {
  try {
    let cleaned = 0;
    let freedBytes = 0;
    const now = new Date();
    
    const tokens = getEmailVerificationTokens();
    const validTokens = tokens.filter(token => {
      const expiryDate = new Date(token.expiresAt);
      return expiryDate > now;
    });
    
    if (validTokens.length < tokens.length) {
      const removedCount = tokens.length - validTokens.length;
      cleaned += removedCount;
      safeSetItem('email_verification_tokens', validTokens);
    }
    
    return { cleaned, freedBytes };
  } catch (error) {
    console.error('❌ Error cleaning up expired email tokens:', error);
    return { cleaned: 0, freedBytes: 0 };
  }
};

export const cleanupOldEmailTracking = (): { cleaned: number; freedBytes: number } => {
  try {
    let cleaned = 0;
    let freedBytes = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const tracking = getEmailDeliveryTracking();
    const validTracking = tracking.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate > sevenDaysAgo;
    });
    
    if (validTracking.length < tracking.length) {
      const removedCount = tracking.length - validTracking.length;
      cleaned += removedCount;
      safeSetItem('email_delivery_tracking', validTracking);
    }
    
    return { cleaned, freedBytes };
  } catch (error) {
    console.error('❌ Error cleaning up old email tracking:', error);
    return { cleaned: 0, freedBytes: 0 };
  }
};

export const cleanupOldEmailQueue = (): { cleaned: number; freedBytes: number } => {
  try {
    let cleaned = 0;
    let freedBytes = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const queue = getEmailQueue();
    const validQueue = queue.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate > oneDayAgo;
    });
    
    if (validQueue.length < queue.length) {
      const removedCount = queue.length - validQueue.length;
      cleaned += removedCount;
      safeSetItem('email_queue', validQueue);
    }
    
    return { cleaned, freedBytes };
  } catch (error) {
    console.error('❌ Error cleaning up old email queue:', error);
    return { cleaned: 0, freedBytes: 0 };
  }
};

// Safe storage method with simple retry logic
export const safeSetItem = (key: string, value: any, retryCount = 0): boolean => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    const size = new Blob([jsonValue]).size;
    
    // Check if single item is too large (over 2MB)
    if (size > 2 * 1024 * 1024) {
      console.warn(`⚠️ Large item: ${key} (${(size / (1024 * 1024)).toFixed(2)}MB)`);
      // Note: Large items are kept as-is, no optimization performed
    }
    
    // Check storage before saving
    const info = getStorageInfo();
    if (info.usagePercentage > STORAGE_CLEANUP_THRESHOLD) {
      console.log(`🚨 Storage full (${info.usagePercentage.toFixed(1)}%), cleaning up...`);
      performCleanup();
    }
    
    // Attempt to store
    localStorage.setItem(key, jsonValue);
    return true;
    
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(`❌ QuotaExceededError for "${key}"`);
      
      if (retryCount < 2) {
        console.log(`🔄 Retry ${retryCount + 1}/2 for ${key}`);
        
        if (retryCount === 0) {
          // First retry: basic cleanup
          performCleanup();
        } else {
          // Second retry: try to save minimal data for user
          if (key === 'pulseprep_user' && typeof value === 'object' && value.email) {
            console.log('🚨 Saving minimal user data only...');
            const minimal = {
              id: value.id,
              name: value.name,
              email: value.email,
              specialty: value.specialty,
              paymentStatus: value.paymentStatus,
              password: value.password,
              passwordSalt: value.passwordSalt
            };
            
            try {
              localStorage.setItem(key, JSON.stringify(minimal));
              console.log('✅ Minimal user data saved');
              return true;
            } catch (minimalError) {
              console.error('❌ Even minimal data failed:', minimalError);
              logStorageError('SET_MINIMAL', key, minimalError instanceof Error ? minimalError.message : 'Unknown error');
              return false;
            }
          }
        }
        
        return safeSetItem(key, value, retryCount + 1);
      } else {
        console.error(`❌ Failed to save "${key}" after ${retryCount} attempts`);
        logStorageError('SET', key, error.message);
        return false;
      }
    } else {
      console.error(`❌ Storage error for "${key}":`, error);
      logStorageError('SET', key, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
};

// Safe get method
export const safeGetItem = (key: string, defaultValue: any = null): any => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      console.warn(`⚠️ Error parsing JSON for "${key}", returning raw value`);
      return value;
    }
  } catch (error) {
    console.error(`❌ Error getting "${key}":`, error);
    logStorageError('GET', key, error instanceof Error ? error.message : 'Unknown error');
    return defaultValue;
  }
};

// Log storage errors for debugging
const logStorageError = (action: string, key: string, error: string): void => {
  storageErrors.push({
    timestamp: Date.now(),
    action,
    key,
    error
  });
  
  // Keep only last 50 errors
  if (storageErrors.length > 50) {
    storageErrors = storageErrors.slice(-50);
  }
};

// Clean up storage wrapper
export const cleanupStorage = (): { success: boolean; freedMB: number; message: string } => {
  try {
    const result = performCleanup();
    return {
      success: true,
      freedMB: result.freedMB,
      message: `Cleaned ${result.cleaned} items, freed ${result.freedMB.toFixed(2)}MB`
    };
  } catch (error) {
    console.error('❌ Error in cleanupStorage:', error);
    return {
      success: false,
      freedMB: 0,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Question Management Service Methods (maintained exactly as before)
export const getMedicalSystems = async (specialty?: SpecialtyType): Promise<{success: boolean, data?: any[], error?: string}> => {
  try {
    const systems = safeGetItem('pulseprep_medical_systems', []);
    const filteredSystems = Array.isArray(systems) 
      ? systems.filter((system: any) => 
          !specialty || system.specialty === specialty || system.isUniversal
        )
      : [];
    
    return { success: true, data: filteredSystems };
  } catch (error) {
    console.error('Error getting medical systems:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const createQuestion = async (questionData: QuestionData): Promise<{success: boolean, data?: QuestionData, error?: string}> => {
  try {
    const existingQuestions = safeGetItem('pulseprep_fcps_questions', []);
    const updatedQuestions = Array.isArray(existingQuestions) ? [...existingQuestions, questionData] : [questionData];
    
    const success = safeSetItem('pulseprep_fcps_questions', updatedQuestions);
    if (success) {
      return { success: true, data: questionData };
    } else {
      return { success: false, error: 'Failed to save question due to storage constraints' };
    }
  } catch (error) {
    console.error('Error creating question:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateQuestion = async (id: string, questionData: QuestionData): Promise<{success: boolean, data?: QuestionData, error?: string}> => {
  try {
    const existingQuestions = safeGetItem('pulseprep_fcps_questions', []);
    if (!Array.isArray(existingQuestions)) {
      return { success: false, error: 'No questions found' };
    }
    
    const questionIndex = existingQuestions.findIndex((q: any) => q.id === id);
    if (questionIndex === -1) {
      return { success: false, error: 'Question not found' };
    }
    
    const updatedQuestions = [...existingQuestions];
    updatedQuestions[questionIndex] = questionData;
    
    const success = safeSetItem('pulseprep_fcps_questions', updatedQuestions);
    if (success) {
      return { success: true, data: questionData };
    } else {
      return { success: false, error: 'Failed to update question due to storage constraints' };
    }
  } catch (error) {
    console.error('Error updating question:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get storage errors for debugging
export const getStorageErrors = (): typeof storageErrors => {
  return [...storageErrors];
};

// StorageService class for backward compatibility - maintains ALL original methods
export class StorageService {
  static getItem(key: string, defaultValue?: any): any {
    return safeGetItem(key, defaultValue);
  }
  
  static setItem(key: string, value: any): boolean {
    return safeSetItem(key, value);
  }
  
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`❌ Error removing item "${key}":`, error);
      logStorageError('REMOVE', key, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  static clear(): boolean {
    try {
      localStorage.clear();
      storageErrors = [];
      console.log('🧹 Storage cleared completely');
      return true;
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      return false;
    }
  }
  
  static getStorageInfo() {
    return getStorageInfo();
  }
  
  static cleanupStorage() {
    return cleanupStorage();
  }
  

  
  static optimizeUserData(userData: any) {
    return optimizeUserData(userData);
  }
  
  static initializeManagement() {
    return initializeStorageManagement();
  }
  
  static performCleanup() {
    return performCleanup();
  }
  
  static getEventLog() {
    return getStorageErrors();
  }

  // Question Management Service Methods
  static async getMedicalSystems(specialty?: SpecialtyType): Promise<{success: boolean, data?: any[], error?: string}> {
    return getMedicalSystems(specialty);
  }
  
  static async createQuestion(questionData: QuestionData): Promise<{success: boolean, data?: QuestionData, error?: string}> {
    return createQuestion(questionData);
  }
  
  static async updateQuestion(id: string, questionData: QuestionData): Promise<{success: boolean, data?: QuestionData, error?: string}> {
    return updateQuestion(id, questionData);
  }
  
  static safeGetItem(key: string, defaultValue?: any): any {
    return safeGetItem(key, defaultValue);
  }
  
  static safeSetItem(key: string, value: any): boolean {
    return safeSetItem(key, value);
  }

  // Legacy method aliases for backward compatibility
  static forceCleanup(_dataType: 'bookmarks' | 'history' | 'cache' | 'temp') {
    // Simple implementation - just run basic cleanup
    return performCleanup();
  }
}

// Export StorageService as default for backward compatibility
export default StorageService;