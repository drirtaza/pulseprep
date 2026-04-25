// Security and Permission Types
export type PermissionType = 
  // User Management Permissions
  | 'users.view'
  | 'users.create' 
  | 'users.edit'
  | 'users.delete'
  | 'users.suspend'
  | 'users.reset-password'
  | 'users.view-details'
  | 'users.export'
  
  // Admin Management Permissions
  | 'admins.view'
  | 'admins.create'
  | 'admins.edit' 
  | 'admins.delete'
  | 'admins.assign-roles'
  | 'admins.view-credentials'
  
  // System Operations Permissions
  | 'system.backup'
  | 'system.restore'
  | 'system.export-data'
  | 'system.import-data'
  | 'system.maintenance'
  | 'system.settings'
  
  // Financial Permissions
  | 'finance.view-payments'
  | 'finance.approve-payments'
  | 'finance.export-financial'
  | 'finance.refunds'
  | 'finance.view-reports'
  | 'finance.manage-pricing'
  
  // Content Management Permissions
  | 'content.view-mcqs'
  | 'content.create-mcqs'
  | 'content.edit-mcqs'
  | 'content.delete-mcqs'
  | 'content.publish-mcqs'
  | 'content.manage-categories'
  
  // Security and Audit Permissions
  | 'security.view-logs'
  | 'security.view-audit'
  | 'security.manage-permissions'
  | 'security.security-scan'
  | 'security.view-login-analysis'
  | 'security.manage-alerts'
  
  // Reporting Permissions
  | 'reports.user-analytics'
  | 'reports.financial'
  | 'reports.content-metrics'
  | 'reports.system-performance'
  | 'reports.security'
  | 'reports.export-all';

export type AuditActionType =
  // Authentication Actions
  | 'auth.login'
  | 'auth.logout' 
  | 'auth.failed-login'
  | 'auth.password-reset'
  | 'auth.account-locked'
  | 'auth.session-timeout'
  | 'auth.admin-login'
  | 'auth.admin-login-failed'
  
  // User Management Actions
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'user.password-reset'
  | 'user.payment-approved'
  | 'user.payment-rejected'
  
  // Payment Management Actions
  | 'payment.approved'
  | 'payment.rejected'
  | 'payment.bulk-approved'
  | 'payment.bulk-rejected'
  | 'payment.settings-updated'
  | 'payment.verification-viewed'
  
  // Admin Management Actions  
  | 'admin.created'
  | 'admin.updated'
  | 'admin.deleted'
  | 'admin.role-changed'
  | 'admin.permissions-modified'
  | 'admin.email-template-settings-updated'
  | 'admin.payment-settings-updated'
  | 'admin.branding-settings-updated'
  | 'admin.payment-status-changed'
  | 'admin.user-status-changed'
  | 'admin.admin-created'
  | 'admin.admin-status-changed'
  
  // System Actions
  | 'system.backup-created'
  | 'system.data-exported'
  | 'system.data-imported'
  | 'system.maintenance-started'
  | 'system.maintenance-ended'
  | 'system.settings-changed'
  
  // Security Actions
  | 'security.permission-denied'
  | 'security.suspicious-activity'
  | 'security.ip-blocked'
  | 'security.multiple-failed-logins'
  | 'security.scan-performed'
  | 'security.alert-triggered'
  | 'security.account-locked'
  | 'security.view-logs'
  
  // Content Actions
  | 'content.mcq-created'
  | 'content.mcq-updated'
  | 'content.mcq-deleted'
  | 'content.category-created'
  | 'content.published'
  
  // Data Access Actions
  | 'data.viewed'
  | 'data.exported'
  | 'data.search-performed'
  | 'report.generated'
  | 'reports.security'
  
  // Email Actions
  | 'email.welcome-sent'
  | 'email.payment-confirmation-sent'
  | 'email.password-reset-sent'
  
  // Error Events
  | 'error.account-lock-failed'
  | 'error.application-error';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditActionType;
  actor: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  target?: {
    type: 'user' | 'admin' | 'system' | 'content' | 'report';
    id: string;
    name?: string;
  };
  details: {
    description: string;
    metadata?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: 'failed-login' | 'suspicious-activity' | 'permission-violation' | 'account-lockout' | 'system-anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    ipAddress: string;
  };
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface LoginAttempt {
  id: string;
  timestamp: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  accountLocked?: boolean;
}

export interface SecuritySession {
  id: string;
  userId: string;
  userType: 'user' | 'admin';
  startTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  active: boolean;
  timeoutWarningShown?: boolean;
}

export interface PermissionSet {
  [key: string]: PermissionType[];
}

// Role-based permission definitions
export const ROLE_PERMISSIONS: PermissionSet = {
  'super-admin': [
    // All permissions for super admin
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.suspend', 
    'users.reset-password', 'users.view-details', 'users.export',
    'admins.view', 'admins.create', 'admins.edit', 'admins.delete', 
    'admins.assign-roles', 'admins.view-credentials',
    'system.backup', 'system.restore', 'system.export-data', 'system.import-data',
    'system.maintenance', 'system.settings',
    'finance.view-payments', 'finance.approve-payments', 'finance.export-financial',
    'finance.refunds', 'finance.view-reports', 'finance.manage-pricing',
    'content.view-mcqs', 'content.create-mcqs', 'content.edit-mcqs', 
    'content.delete-mcqs', 'content.publish-mcqs', 'content.manage-categories',
    'security.view-logs', 'security.view-audit', 'security.manage-permissions',
    'security.security-scan', 'security.view-login-analysis', 'security.manage-alerts',
    'reports.user-analytics', 'reports.financial', 'reports.content-metrics',
    'reports.system-performance', 'reports.security', 'reports.export-all'
  ],
  
  'finance-manager': [
    'users.view', 'users.view-details', 'users.export',
    'finance.view-payments', 'finance.approve-payments', 'finance.export-financial',
    'finance.refunds', 'finance.view-reports', 'finance.manage-pricing',
    'reports.user-analytics', 'reports.financial',
    'security.view-logs'
  ],
  
  'content-manager': [
    'users.view', 'users.view-details',
    'content.view-mcqs', 'content.create-mcqs', 'content.edit-mcqs',
    'content.delete-mcqs', 'content.publish-mcqs', 'content.manage-categories',
    'reports.content-metrics', 'reports.user-analytics',
    'security.view-logs'
  ],
  
  'audit-manager': [
    'users.view', 'users.view-details',
    'security.view-logs', 'security.view-audit', 'security.manage-alerts',
    'security.view-login-analysis', 'security.security-scan',
    'reports.security', 'reports.system-performance',
    'system.export-data'
  ]
};

export interface SecurityConfig {
  sessionTimeout: number; // minutes
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  passwordResetExpiry: number; // minutes
  auditRetentionDays: number;
  alertThresholds: {
    failedLogins: number;
    suspiciousActivity: number;
    concurrentSessions: number;
  };
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  sessionTimeout: 60, // 1 hour
  maxFailedAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  passwordResetExpiry: 60, // 1 hour
  auditRetentionDays: 90,
  alertThresholds: {
    failedLogins: 3,
    suspiciousActivity: 5,
    concurrentSessions: 3
  }
};