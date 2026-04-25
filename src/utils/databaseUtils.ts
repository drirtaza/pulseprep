/**
 * Database Conversion Utilities
 * Handles camelCase ↔ snake_case conversion for Supabase integration
 * 
 * CRITICAL: This handles medical education data - any bugs could affect FCPS exam preparation
 */

// Field mapping for consistent conversion
const FIELD_MAPPINGS: Record<string, string> = {
  // User fields
  createdAt: 'created_at',
  createdBy: 'created_by',
  fullName: 'full_name',
  registrationDate: 'registration_date',
  paymentStatus: 'payment_status',
  lastLoginAt: 'last_login_at',
  passwordHash: 'password_hash',
  passwordSalt: 'password_salt',
  subscriptionExpiryDate: 'subscription_expiry_date',
  actualAmountPaid: 'actual_amount_paid',
  paymentDate: 'payment_date',
  subscriptionPlanAtPayment: 'subscription_plan_at_payment',
  
  // Question fields
  correctAnswer: 'correct_answer',
  optionExplanations: 'option_explanations',
  reviewNotes: 'review_notes',
  reviewedAt: 'reviewed_at',
  reviewedBy: 'reviewed_by',
  submittedBy: 'submitted_by',
  
  // System fields
  systemName: 'system_name',
  isActive: 'is_active',
  isVisible: 'is_visible',
  isUniversal: 'is_universal',
  isCustom: 'is_custom',
  questionCount: 'question_count',
  
  // Payment fields
  paymentDetails: 'payment_details',
  bankDetails: 'bank_details',
  
  // Admin fields
  rolePermissions: 'role_permissions',
  
  // Analytics fields
  totalUsers: 'total_users',
  activeUsers: 'active_users',
  totalRevenue: 'total_revenue',
  averageScore: 'average_score',
  completionRate: 'completion_rate',
  studyMode: 'study_mode'
};

// Reverse mapping for snake_case to camelCase
const REVERSE_FIELD_MAPPINGS = Object.fromEntries(
  Object.entries(FIELD_MAPPINGS).map(([camel, snake]) => [snake, camel])
);

/**
 * Convert a single key from camelCase to snake_case
 */
export const camelToSnakeCase = (key: string): string => {
  // Check explicit mappings first
  if (FIELD_MAPPINGS[key]) {
    return FIELD_MAPPINGS[key];
  }
  
  // Default conversion: camelCase -> snake_case
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert a single key from snake_case to camelCase
 */
export const snakeToCamelCase = (key: string): string => {
  // Check explicit mappings first
  if (REVERSE_FIELD_MAPPINGS[key]) {
    return REVERSE_FIELD_MAPPINGS[key];
  }
  
  // Default conversion: snake_case -> camelCase
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Deep convert object keys from camelCase to snake_case
 * Handles nested objects and arrays safely
 */
export const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj === 'object') {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnakeCase(key);
      converted[snakeKey] = toSnakeCase(value);
    }
    
    return converted;
  }
  
  return obj;
};

/**
 * Deep convert object keys from snake_case to camelCase
 * Handles nested objects and arrays safely
 */
export const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (typeof obj === 'object') {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamelCase(key);
      converted[camelKey] = toCamelCase(value);
    }
    
    return converted;
  }
  
  return obj;
};

/**
 * Batch convert multiple objects
 */
export const batchToSnakeCase = (objects: any[]): any[] => {
  return objects.map(obj => toSnakeCase(obj));
};

export const batchToCamelCase = (objects: any[]): any[] => {
  return objects.map(obj => toCamelCase(obj));
};

/**
 * Safe JSON parsing with conversion
 */
export const parseAndConvertToCamel = (jsonString: string): any => {
  try {
    const parsed = JSON.parse(jsonString);
    return toCamelCase(parsed);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
};

/**
 * Safe JSON stringifying with conversion
 */
export const convertAndStringify = (obj: any): string => {
  try {
    const converted = toSnakeCase(obj);
    return JSON.stringify(converted);
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return '{}';
  }
};

/**
 * Validation helper - ensures critical fields are present
 */
export const validateRequiredFields = (obj: any, requiredFields: string[]): boolean => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => {
    const snakeField = camelToSnakeCase(field);
    return obj.hasOwnProperty(field) || obj.hasOwnProperty(snakeField);
  });
};

/**
 * Migration helper - combines camelCase and snake_case data safely
 */
export const mergeWithCaseHandling = (camelObj: any, snakeObj: any): any => {
  const camelConverted = toCamelCase(snakeObj);
  return {
    ...camelObj,
    ...camelConverted
  };
};

