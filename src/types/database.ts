/**
 * Database Types for Supabase Migration
 * Supports both camelCase (frontend) and snake_case (database) formats
 * 
 * CRITICAL: These types handle medical education data structures
 */

// Base interfaces that support both naming conventions
export interface BaseTimestamps {
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// User Data Types
export interface UserDataDB extends BaseTimestamps {
  id: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  studyMode?: 'regular' | 'intensive';
  study_mode?: 'regular' | 'intensive';
  registrationDate?: string;
  registration_date?: string;
  paymentStatus?: 'pending' | 'completed' | 'rejected';
  payment_status?: 'pending' | 'completed' | 'rejected';
  phone?: string;
  cnic?: string;
  status?: 'active' | 'suspended' | 'pending';
  password?: string;
  passwordHash?: string;
  password_hash?: string;
  passwordSalt?: string;
  password_salt?: string;
  paymentDetails?: any;
  payment_details?: any;
  subscriptionExpiryDate?: string;
  subscription_expiry_date?: string;
  actualAmountPaid?: number;
  actual_amount_paid?: number;
  paymentDate?: string;
  payment_date?: string;
  subscriptionPlanAtPayment?: any;
  subscription_plan_at_payment?: any;
  lastLoginAt?: string;
  last_login_at?: string;
  createdBy?: string;
  created_by?: string;
}

// Question Data Types
export interface QuestionDataDB extends BaseTimestamps {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  correct_answer?: number;
  explanation?: string;
  specialty?: 'medicine' | 'surgery' | 'gynae-obs';
  system?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submitted_by?: string;
  reviewedBy?: string;
  reviewed_by?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  reviewNotes?: string;
  review_notes?: string;
  optionExplanations?: string[];
  option_explanations?: string[];
  tags?: string[];
  isActive?: boolean;
  is_active?: boolean;
  questionCount?: number;
  question_count?: number;
}

// Admin Data Types
export interface AdminDataDB extends BaseTimestamps {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'finance-manager' | 'audit-manager' | 'content-manager';
  password: string;
  passwordHash?: string;
  password_hash?: string;
  passwordSalt?: string;
  password_salt?: string;
  status: 'active' | 'suspended';
  rolePermissions?: string[];
  role_permissions?: string[];
  lastLoginAt?: string;
  last_login_at?: string;
  createdBy?: string;
  created_by?: string;
}

// Medical System Types
export interface MedicalSystemDB extends BaseTimestamps {
  id: string;
  name: string;
  systemName?: string;
  system_name?: string;
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  isVisible?: boolean;
  is_visible?: boolean;
  isUniversal?: boolean;
  is_universal?: boolean;
  isCustom?: boolean;
  is_custom?: boolean;
  questionCount?: number;
  question_count?: number;
  order?: number;
}

// Payment Data Types
export interface PaymentDataDB extends BaseTimestamps {
  id: string;
  userId: string;
  user_id?: string;
  amount: number;
  actualAmountPaid?: number;
  actual_amount_paid?: number;
  paymentDate?: string;
  payment_date?: string;
  paymentStatus: 'pending' | 'completed' | 'rejected';
  payment_status?: 'pending' | 'completed' | 'rejected';
  paymentDetails?: any;
  payment_details?: any;
  bankDetails?: any;
  bank_details?: any;
  verificationNotes?: string;
  verification_notes?: string;
  processedBy?: string;
  processed_by?: string;
  processedAt?: string;
  processed_at?: string;
}

// Bookmark Data Types
export interface BookmarkDataDB extends BaseTimestamps {
  id: string;
  userId: string;
  user_id?: string;
  questionId: string;
  question_id?: string;
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  system?: string;
  notes?: string;
  isActive?: boolean;
  is_active?: boolean;
}

// Analytics Data Types
export interface AnalyticsDataDB extends BaseTimestamps {
  id: string;
  userId?: string;
  user_id?: string;
  specialty?: 'medicine' | 'surgery' | 'gynae-obs';
  system?: string;
  questionId?: string;
  question_id?: string;
  isCorrect?: boolean;
  is_correct?: boolean;
  timeSpent?: number;
  time_spent?: number;
  sessionId?: string;
  session_id?: string;
  sessionType?: 'practice' | 'mock-exam';
  session_type?: 'practice' | 'mock-exam';
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Settings Data Types
export interface SettingsDataDB extends BaseTimestamps {
  id: string;
  type: 'payment' | 'branding' | 'email' | 'subscription';
  name: string;
  value: any;
  isActive?: boolean;
  is_active?: boolean;
  createdBy?: string;
  created_by?: string;
  updatedBy?: string;
  updated_by?: string;
}

// Audit Log Types
export interface AuditLogDB extends BaseTimestamps {
  id: string;
  userId?: string;
  user_id?: string;
  adminId?: string;
  admin_id?: string;
  action: string;
  resource: string;
  resourceId?: string;
  resource_id?: string;
  oldData?: any;
  old_data?: any;
  newData?: any;
  new_data?: any;
  ipAddress?: string;
  ip_address?: string;
  userAgent?: string;
  user_agent?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

// System Request Types
export interface SystemRequestDB extends BaseTimestamps {
  id: string;
  systemName: string;
  system_name?: string;
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  description?: string;
  requestedBy?: string;
  requested_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewed_by?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  reviewNotes?: string;
  review_notes?: string;
}

// Database Table Names (snake_case)
export const DB_TABLES = {
  USERS: 'users',
  QUESTIONS: 'questions',
  ADMINS: 'admins',
  MEDICAL_SYSTEMS: 'medical_systems',
  PAYMENTS: 'payments',
  BOOKMARKS: 'bookmarks',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_REQUESTS: 'system_requests'
} as const;

// Migration helpers
export interface MigrationMapping {
  localStorageKey: string;
  tableName: string;
  transform?: (data: any) => any;
  validate?: (data: any) => boolean;
}

export const MIGRATION_MAPPINGS: Record<string, MigrationMapping> = {
  users: {
    localStorageKey: 'all_users',
    tableName: DB_TABLES.USERS,
    validate: (data) => Boolean(data.email && data.name)
  },
  currentUser: {
    localStorageKey: 'pulseprep_user',
    tableName: DB_TABLES.USERS,
    validate: (data) => Boolean(data.email && data.name)
  },
  pendingUser: {
    localStorageKey: 'pulseprep_user_pending',
    tableName: DB_TABLES.USERS,
    validate: (data) => Boolean(data.email && data.name)
  },
  admins: {
    localStorageKey: 'all_admins',
    tableName: DB_TABLES.ADMINS,
    validate: (data) => Boolean(data.email && data.role)
  },
  questions: {
    localStorageKey: 'pulseprep_fcps_questions',
    tableName: DB_TABLES.QUESTIONS,
    validate: (data) => Boolean(data.text && data.options && Array.isArray(data.options))
  },
  medicalSystems: {
    localStorageKey: 'pulseprep_medical_systems',
    tableName: DB_TABLES.MEDICAL_SYSTEMS,
    validate: (data) => Boolean(data.name && data.specialty)
  },
  systemRequests: {
    localStorageKey: 'pulseprep_system_requests',
    tableName: DB_TABLES.SYSTEM_REQUESTS,
    validate: (data) => Boolean(data.systemName && data.specialty)
  },
  bookmarksMedicine: {
    localStorageKey: 'pulseprep_bookmarks_medicine',
    tableName: DB_TABLES.BOOKMARKS,
    transform: (data) => ({ ...data, specialty: 'medicine' }),
    validate: (data) => Boolean(data.questionId)
  },
  bookmarksSurgery: {
    localStorageKey: 'pulseprep_bookmarks_surgery',
    tableName: DB_TABLES.BOOKMARKS,
    transform: (data) => ({ ...data, specialty: 'surgery' }),
    validate: (data) => Boolean(data.questionId)
  },
  bookmarksGynae: {
    localStorageKey: 'pulseprep_bookmarks_gynae-obs',
    tableName: DB_TABLES.BOOKMARKS,
    transform: (data) => ({ ...data, specialty: 'gynae-obs' }),
    validate: (data) => Boolean(data.questionId)
  }
};

// Field validation schemas
export const REQUIRED_FIELDS = {
  [DB_TABLES.USERS]: ['email', 'name', 'specialty'],
  [DB_TABLES.QUESTIONS]: ['text', 'options', 'correctAnswer', 'specialty'],
  [DB_TABLES.ADMINS]: ['email', 'name', 'role', 'password'],
  [DB_TABLES.MEDICAL_SYSTEMS]: ['name', 'specialty'],
  [DB_TABLES.PAYMENTS]: ['userId', 'amount', 'paymentStatus'],
  [DB_TABLES.BOOKMARKS]: ['userId', 'questionId', 'specialty'],
  [DB_TABLES.ANALYTICS]: ['userId', 'questionId', 'isCorrect'],
  [DB_TABLES.SETTINGS]: ['type', 'name', 'value'],
  [DB_TABLES.AUDIT_LOGS]: ['action', 'resource'],
  [DB_TABLES.SYSTEM_REQUESTS]: ['systemName', 'specialty', 'status']
} as const;

// Type guards for runtime validation
export const isUserData = (data: any): data is UserDataDB => {
  return data && typeof data === 'object' && 
         typeof data.email === 'string' && 
         (typeof data.name === 'string' || typeof data.fullName === 'string' || typeof data.full_name === 'string');
};

export const isQuestionData = (data: any): data is QuestionDataDB => {
  return data && typeof data === 'object' && 
         typeof data.text === 'string' && 
         Array.isArray(data.options) && 
         (typeof data.correctAnswer === 'number' || typeof data.correct_answer === 'number');
};

export const isAdminData = (data: any): data is AdminDataDB => {
  return data && typeof data === 'object' && 
         typeof data.email === 'string' && 
         typeof data.name === 'string' && 
         typeof data.role === 'string';
};

// Export commonly used types for backward compatibility
export type { UserDataDB as DatabaseUser };
export type { QuestionDataDB as DatabaseQuestion };
export type { AdminDataDB as DatabaseAdmin };
export type { MedicalSystemDB as DatabaseMedicalSystem };
export type { PaymentDataDB as DatabasePayment };
export type { BookmarkDataDB as DatabaseBookmark };