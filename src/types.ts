import React, { ReactNode } from "react";

export type PageType = 
  | 'home' 
  | 'specialty-selection'
  | 'login' 
  | 'sign-in'
  | 'signup' 
  | 'sign-up'
  | 'email-verification'
  | 'payment'
  | 'final-form'
  | 'payment-pending'
  | 'forgot-password'
  | 'dashboard'
  | 'mcq-interface'
  | 'mock-exam-instructions'
  | 'mock-exam-results'
  | 'mock-exam-review'
  | 'bookmark-review'
  | 'about'
  | 'contact'
  | 'admin-login'
  | 'admin-dashboard'
  | 'analytics-dashboard'
  | 'reports'
  | 'advanced-analytics'
  | 'custom-reports'
  | 'content-management';

export type SpecialtyType = 'medicine' | 'surgery' | 'gynae-obs';
export type ContentItemType = 'feature' | 'testimonial' | 'faq' | 'team' | 'milestone' | 'value' | 'contactMethod' | 'supportCategory' | 'pricing-feature';
export type StudyModeType = 'regular' | 'intensive' | 'weekend' | 'guided';

export type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending' | 'rejected';

export type PaymentStatus = 'pending' | 'completed' | 'under-review' | 'rejected' | 'approved';

export interface UserData {
  id: string;
  name: string;
  fullName: string;
  email: string;
  specialty: SpecialtyType;
  studyMode: StudyModeType;
  registrationDate: string;
  phone?: string;
  cnic?: string;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
  subscriptionExpiryDate?: string;
  subscriptionPlanAtPayment?: SubscriptionPlan;
  paymentDate?: string;
  actualAmountPaid?: number;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  status?: UserStatus;
  // Added missing properties
  suspendedAt?: string;
  suspendedBy?: string;
  paymentCurrency?: string;
  subscriptionStartDate?: string;
  paymentAttempts?: PaymentAttempt[];
  // Email verification fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationSentAt?: string;
  emailVerificationExpiresAt?: string;
  emailVerificationAttempts: number;
  emailVerificationLastAttemptAt?: string;
  emailVerificationStatus: 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
  emailVerificationEmailId?: string;
  emailVerificationDeliveryStatus?: EmailDeliveryStatus;
  emailVerificationError?: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cnic: string;
  specialty: SpecialtyType;
  studyMode: StudyModeType;
  emailVerified: boolean;
  paymentVerified: boolean;
  paymentDetails?: PaymentDetails;
  passwordHash?: string;
  passwordSalt?: string;
  // Email verification fields
  emailVerificationToken?: string;
  emailVerificationSentAt?: string;
  emailVerificationExpiresAt?: string;
  emailVerificationAttempts: number;
  emailVerificationLastAttemptAt?: string;
  emailVerificationStatus: 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
  emailVerificationEmailId?: string;
  emailVerificationDeliveryStatus?: EmailDeliveryStatus;
  emailVerificationError?: string;
}

export interface PaymentDetails {
  transactionId?: string;
  amount: number;
  paymentMethod: 'bank-transfer' | 'jazzcash' | 'easypaisa' | 'other';
  bankAccount?: string;
  screenshotUrl?: string;
  uploadedAt: string;
  verificationAttempts?: number;
  lastVerificationAttempt?: string;
  rejectionReason?: string;
  paymentInstructions?: string;
  currency?: string;
  // Added missing properties
  method?: {
    name: string;
    id: string;
  };
  bank?: {
    bankName: string;
    accountNumber: string;
    iban: string;
  };
  notes?: string;
  paymentScreenshot?: string;
  paymentScreenshotName?: string;
  paymentScreenshotType?: string;
  accountTitle?: string;
}

export type AdminRole = 'super-admin' | 'finance-manager' | 'audit-manager' | 'content-manager';

// Admin Access Method Types
export type AccessMethodType = 'keyboard-shortcut' | 'mouse-gesture' | 'scroll-pattern' | 'multi-modifier' | 'custom';

export interface AdminAccessMethod {
  role: AdminRole;
  method: AccessMethodType;
  enabled: boolean;
  config: {
    keyboardShortcut?: {
      firstKey: string;
      secondKey: string;
      timeout: number;
    };
    mouseGesture?: {
      requiredClicks: number;
      timeWindow: number;
      pattern: string;
    };
    scrollPattern?: {
      sequence: string[];
      timeWindow: number;
    };
    multiModifier?: {
      modifiers: string[];
      key: string;
      timeout: number;
    };
    customMethod?: {
      description: string;
      implementation: string;
    };
  };
  lastUpdated: string;
  updatedBy: string;
}

export interface AdminAccessSettings {
  enabled: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  defaultMethod: AccessMethodType;
  roleAccess: Record<string, {
    enabled: boolean;
    shortcutMode: 'single' | 'multiple';
    shortcuts: string[];
    method: string;
    status: string;
  }>;
  lastUpdated: string;
  updatedBy: string;
}

export interface AdminData {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  createdBy: string;
  password?: string;
  status?: 'active' | 'inactive';
  accessMethod?: AdminAccessMethod;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  specialty: SpecialtyType;
  system: string;
  difficulty: 'easy' | 'medium' | 'hard';
  references?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  status?: 'approved' | 'pending' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  // Added missing properties
  text?: string;
  submittedBy?: string;
  optionExplanations?: string[];
  isBookmarked?: boolean;
  mockExam?: string;
}

export interface PracticeSessionConfig {
  system: string;
  mcqCount: number;
  includeWrongMCQs: boolean;
  specialty: SpecialtyType;
  sessionType: 'new' | 'continue';
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export interface MockExamConfig {
  id?: string;
  name?: string;
  specialty: SpecialtyType;
  totalQuestions: number;
  timeLimit?: number;
  passingCriteria?: number;
  systemDistribution?: SystemDistribution[];
  difficultyDistribution?: DifficultyDistribution;
  createdBy?: string;
  createdAt?: string;
  isActive?: boolean;
  status?: 'approved' | 'pending' | 'rejected';
  // Added missing properties
  type: 'mock-1' | 'mock-2' | 'mock-3' | 'mock-4' | 'previous-years';
  duration: number;
  questionCount: number;
  distribution: 'specialty-focus' | 'balanced-mix' | 'cross-specialty' | 'custom' | 'balanced';
  passingScore: number;
  allowReview: boolean;
  showResults: boolean;
  systems: string[];
  includeBookmarked: boolean;
  simulateRealExam: boolean;
  examType?: string;
  passingGrade?: number;
  selectedSystems?: string[];
  selectedDifficulties?: string[];
  examTitle?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | 'advanced' | 'progressive' | 'foundation';
  unlockRequirement?: number;
  instructions?: string;
}

export interface SystemDistribution {
  system: string;
  questionCount: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface MockExamResults {
  examId: string;
  examName: string;
  userId: string;
  userName: string;
  specialty: SpecialtyType;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  timeSpent: number;
  timeLimit: number;
  score: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  questions: ExamQuestion[];
  systemWiseResults: SystemWiseResult[];
  difficultyWiseResults: DifficultyWiseResult[];
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  accuracy?: number;
  totalTime?: number;
  examConfig?: MockExamConfig;
  examType?: string;
  passingGrade?: number;
  startTime?: string;
  endTime?: string;
}

export interface ExamQuestion extends Question {
  userAnswer?: number;
  isCorrect?: boolean;
  timeSpent?: number;
  isSkipped?: boolean;
  // Added missing properties
  selectedAnswer?: number;
  timeTaken?: number;
}

export interface SystemWiseResult {
  system: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
}

export interface DifficultyWiseResult {
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
}

export interface PaymentSettings {
  bankAccounts: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode: string;
    isActive: boolean;
    isDefault: boolean;
  }[];
  paymentInstructions: string;
  minimumAmount: number;
  maximumAmount: number;
  verificationSettings: {
    autoApproval: boolean;
    requireExactAmount: boolean;
    gracePeriodHours: number;
    allowPartialPayments: boolean;
    requireTransactionId: boolean;
    requireManualVerification?: boolean;
    autoApprovalEnabled?: boolean;
    maxRetries?: number;
  };
}

// 🔥 NEW: Enhanced Payment Settings Interface
export interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchCode: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface ExtendedPaymentSettings {
  bankAccounts: BankAccount[];
  paymentInstructions: string;
  paymentAmount: number;        // 🔥 NEW: Single source of truth for payment amount
  currency: string;             // 🔥 NEW: Currency for payment amount
  minimumAmount?: number;       // Keep existing for validation
  maximumAmount?: number;       // Keep existing for validation
  verificationSettings: {
    autoApproval: boolean;
    requireExactAmount: boolean;
    gracePeriodHours: number;
    allowPartialPayments: boolean;
    requireTransactionId: boolean;
    requireManualVerification?: boolean;
    autoApprovalEnabled?: boolean;
    maxRetries?: number;
  };
  lastUpdated: string;
  updatedBy: string;
  version: number;
  // Added missing properties
  uploadRequirements?: {
    maxFileSize: number;
    allowedFormats: string[];
    requireTransactionId: boolean;
    requireAccountTitle: boolean;
    minAmount: number;
    maxAmount: number;
  };
}

export interface SubscriptionSettings {
  plans: SubscriptionPlan[];
  defaultPlanId: string;
  trialPeriod: number;
  gracePeriod: number;
  lastUpdated: string;
  updatedBy: string;
  version: number;
  // Added missing properties
  expirySettings?: {
    warningDays: number[];
    reminderIntervals: number[];
    gracePeriodDays: number;
    autoSuspendAfterDays: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationType: 'days' | 'months' | 'years';
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  tagline: string;
  footerText: string;
  customCSS: string;
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: 'welcome' | 'payment' | 'verification' | 'notification' | 'system';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EmailTemplateSettings {
  templates: EmailTemplate[];
  smtpSettings: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  fromEmail: string;
  fromName: string;
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

// Email Verification Types
export interface EmailVerificationToken {
  id: string;
  token: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  used: boolean;
  attempts: number;
  lastResendAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export enum EmailDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  SPAM = 'spam'
}

export interface EmailVerificationSettings {
  tokenExpiryMinutes: number;
  maxResendAttempts: number;
  resendCooldownMinutes: number;
  requireEmailVerification: boolean;
  autoVerifyInDevelopment: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface MedicalSystem {
  id: string;
  name: string;
  systemName?: string;
  description: string;
  specialty: SpecialtyType | 'universal';
  isUniversal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Added missing properties
  questionCount?: number;
  isCustom?: boolean;
}

export interface SystemRequest {
  id: string;
  systemName: string;
  description: string;
  specialty: SpecialtyType;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  // Added missing properties
  name?: string;
  submittedBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

export interface AnalyticsData {
  totalUsers: number;
  activeSubscriptions: number;
  revenue: number;
  questionCount: number;
  examAttempts: number;
  systemUsage: SystemUsage[];
  userGrowth: UserGrowthData[];
  revenueGrowth: RevenueGrowthData[];
}

export interface SystemUsage {
  system: string;
  specialty: SpecialtyType;
  usage: number;
  percentage: number;
}

export interface UserGrowthData {
  date: string;
  count: number;
  specialty: SpecialtyType;
}

export interface RevenueGrowthData {
  date: string;
  amount: number;
  count: number;
}

export interface BookmarkData {
  id: string;
  questionId: string;
  userId: string;
  specialty: SpecialtyType;
  system: string;
  addedAt: string;
  question?: Question;
  notes?: string;
  tags?: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'session_timeout' | 'suspicious_activity' | 'password-reset';
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecuritySession {
  id: string;
  userId: string;
  userRole: string;
  startTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  terminatedAt?: string;
  terminationReason?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  context?: string;
  showErrorDetails?: boolean;
}

export interface NavigationErrorBoundaryProps extends ErrorBoundaryProps {
  navigationType: 'header' | 'footer' | 'sidebar';
}

export interface AuthErrorBoundaryProps extends ErrorBoundaryProps {
  authType: 'login' | 'signup' | 'admin-login' | 'verification' | 'password-reset';
}

export interface DashboardErrorBoundaryProps extends ErrorBoundaryProps {
  dashboardType: 'user' | 'admin' | 'super-admin' | 'finance' | 'audit' | 'content';
  userRole?: string;
}

export interface ExamErrorBoundaryProps extends ErrorBoundaryProps {
  examType: 'practice' | 'mock-exam' | 'review';
  hasProgress?: boolean;
}

export interface PaymentErrorBoundaryProps extends ErrorBoundaryProps {
  paymentType: 'upload' | 'pending' | 'verification';
  hasPaymentData?: boolean;
}

// ===============================================
// MISSING TYPE EXPORTS - ADD THESE EXACTLY
// ===============================================

// Question type aliases for different contexts
export type MCQQuestion = Question;

export type FCPSQuestion = Question & {
  optionExplanations?: string[];
  source?: 'manual' | 'excel-import' | 'content-manager';
  rejectionReason?: string;
};

// Union types for question properties
export type QuestionStatusType = 'approved' | 'pending' | 'rejected';
export type DifficultyType = 'easy' | 'medium' | 'hard';

// Question editor form interface
export interface QuestionData {
  id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  specialty: SpecialtyType;
  system: string;
  difficulty: DifficultyType;
  status: QuestionStatusType;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  optionExplanations?: string[];
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ===============================================
// NEW MISSING TYPE DEFINITIONS - MICRO-BATCH 1B
// ===============================================

// MockExamSet interface for exam management
export interface MockExamSet {
  id: string;
  name: string;
  specialty: SpecialtyType;
  totalQuestions: number;
  timeLimit: number;
  passingCriteria: number;
  systemDistribution: SystemDistribution[];
  difficultyDistribution: DifficultyDistribution;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  description?: string;
}

// MockExamQuestion type for content management
export type MockExamQuestion = Question & {
  mockExam?: string;
  rejectionReason?: string;
};

// ===============================================
// NEW MISSING TYPE DEFINITIONS - MICRO-BATCH 1C
// ===============================================

// PaymentAttempt interface for payment history
export interface PaymentAttempt {
  id: string;
  screenshot: string;
  screenshotName: string;
  screenshotType?: string;
  transactionId?: string;
  accountTitle?: string;
  amount?: number;
  currency: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Extended UserData with payment attempts
export interface UserDataWithAttempts extends UserData {
  paymentAttempts: PaymentAttempt[];
}

// LoginAttempt interface for security tracking
export interface LoginAttempt {
  id: string;
  email: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
  ipAddress: string;
  userAgent: string;
}

// Component prop interfaces
export interface FooterProps {
  showLinks?: boolean;
  className?: string;
  onNavigate?: (page: PageType) => void;
  onNavigateToSection?: () => void;
}

export interface LoginPageProps {
  onLogin?: (userData: UserData) => void;
  onNavigate?: (page: PageType) => void;
  className?: string;
  selectedSpecialty?: SpecialtyType | null;
}

export interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onLogoClick?: () => void;
  adminAccessVisible?: boolean;
  onAdminAccess?: () => void;
  isAuthenticated?: boolean;
  user?: UserData;
  admin?: AdminData;
  onLogout?: () => void;
  className?: string;
  onNavigateToSection?: () => void;
  selectedSpecialty?: SpecialtyType | null;
}



export interface SpecialtyData {
  id: SpecialtyType;
  name: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  systems: string[];
  stats: { questions: string; passRate: string; avgScore: string; };
  features?: string[];
  questionCount?: number;
  systemCount?: number;
}





// Additional type aliases for consistency
export type PaymentStatusType = PaymentStatus;

// FormErrors interface for form validation
export interface FormErrors {
  options?: string;
  [key: string]: string | undefined;
}

// Component Props Interfaces
export interface FinalFormPageProps {
  onSignUpComplete: (data: SignUpFormData) => void;
  formData: SignUpFormData | null;
  onNavigate?: (page: string) => void;
  selectedSpecialty?: SpecialtyType | null;
}

export interface MockExamInstructionsPageProps {
  user: UserData;
  mockExamConfig: MockExamConfig | null;
  onNavigate: (page: string) => void;
  onStartMockExam: (config: MockExamConfig) => void;
}

export interface SpecialtySelectionProps {
  onSpecialtySelect: (specialty: SpecialtyType) => void;
  onNavigate: (page: string) => void;
  adminAccessVisible: boolean;
  adminAccessRole?: AdminRole | null;
  onAdminAccess: () => void;
  onLogoClick?: () => void;
}

export interface SystemManagerProps {
  createdBy: string;
  userRole: string;
  onSystemUpdate: () => Promise<void>;
  onBack: () => void;
  specialty?: SpecialtyType;
}

export interface PaymentRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserData;
  onReject?: (user: UserData) => void;
  onConfirm?: (reason: string) => Promise<void>;
  userName?: string;
  userEmail?: string;
  isSubmitting?: boolean;
  onConfirmRejection?: (reason: string) => void;
}

export interface SuperAdminHeaderProps {
  admin: AdminData;
  onRefresh: () => void;
  onLogout: () => void;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarCollapsed: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  totalPendingApprovals: number;
  onNavigateToSettings: () => void;
  onNavigateToProfile: () => void;
  activeTab: string;
}

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string | any) => void;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}