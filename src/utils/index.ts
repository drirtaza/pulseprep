// Re-export all utility functions for easy importing
export * from './paymentSettings';
export * from './brandingSettings';
export * from './emailTemplateSettings';
export * from './subscriptionUtils';
export * from './cmsUtils';
export * from './excelImportUtils';
export * from './practiceProgressUtils';
export * from './paymentVerification';
export * from './paymentAttemptsUtils';
export * from './BookmarkService';
// ✅ REMOVED: export * from './bankAccountSettings'; - Resolved conflict with paymentSettings
export * from './revenueCalculations';
export { 
  initializeStorageManagement,
  getStorageInfo,
  debugStorageUsage,
  optimizeUserData,
  performCleanup as performProgressiveCleanup,
  safeSetItem,
  safeGetItem,
  cleanupStorage
} from './storageUtils';
export * from './databaseUtils';

// Common utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const generateRandomId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${randomPart}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Pakistani phone number format
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

export const validateCNIC = (cnic: string): boolean => {
  // Pakistani CNIC format: 12345-1234567-1
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
  return cnicRegex.test(cnic);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatSpecialtyName = (specialty: string): string => {
  switch (specialty) {
    case 'medicine':
      return 'Medicine';
    case 'surgery':
      return 'Surgery';
    case 'gynae-obs':
      return 'Gynae & Obs';
    default:
      return capitalizeFirst(specialty);
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

// Storage-aware utility functions
export const safeLocalStorageOperation = <T>(
  operation: () => T,
  fallback: T,
  errorContext?: string
): T => {
  try {
    return operation();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded in ${errorContext || 'operation'}`);
      // Import storage utilities dynamically to avoid circular imports
      import('./storageUtils').then(({ cleanupStorage }) => {
        cleanupStorage();
      });
    }
    console.error(`Operation failed in ${errorContext || 'context'}:`, error);
    return fallback;
  }
};