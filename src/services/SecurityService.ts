import { SecurityEvent, LoginAttempt, AdminData, UserData, AdminRole, AdminAccessSettings, EmailVerificationToken } from '../types';
import { 
  PermissionType, 
  AuditActionType, 
  SecurityAlert, 
  AuditLogEntry, 
  SecuritySession,
  ROLE_PERMISSIONS,
  DEFAULT_SECURITY_CONFIG
} from '../types/security';

// Email verification security types
interface EmailVerificationSecurityEvent {
  id: string;
  type: 'email-verification-sent' | 'email-verification-attempted' | 'email-verification-success' | 'email-verification-failed' | 'email-verification-expired' | 'email-verification-rate-limited' | 'email-verification-fraud-detected';
  email: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: {
    tokenId?: string;
    attempts?: number;
    rateLimitExceeded?: boolean;
    fraudScore?: number;
    suspiciousPatterns?: string[];
    sessionId?: string;
    metadata?: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EmailVerificationRateLimit {
  email: string;
  attempts: number;
  lastAttempt: string;
  blockedUntil?: string;
  ipAddress: string;
}

interface EmailVerificationFraudDetection {
  email: string;
  fraudScore: number;
  suspiciousPatterns: string[];
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityService {
  private readonly MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  private readonly SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  private currentSessionId: string | null = null;
  
  // Email verification security settings
  private readonly EMAIL_VERIFICATION_RATE_LIMIT = 5; // Max attempts per hour
  private readonly EMAIL_VERIFICATION_RATE_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly EMAIL_VERIFICATION_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly EMAIL_VERIFICATION_FRAUD_THRESHOLD = 0.7; // 70% fraud score threshold

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string {
    return this.currentSessionId || 'unknown';
  }

  /**
   * Get client IP from server (placeholder for real implementation)
   */
  private getClientIP(): string | null {
    // In real implementation, this would come from server headers
    // For now, return null to indicate no real IP available
    return null;
  }

  /**
   * Check if user/admin has a specific permission
   */
  hasPermission(userRole: string, permission: PermissionType): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions ? rolePermissions.includes(permission) : false;
  }

  /**
   * Check if user/admin has all specified permissions
   */
  hasAllPermissions(userRole: string, permissions: PermissionType[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if user/admin has any of the specified permissions
   */
  hasAnyPermission(userRole: string, permissions: PermissionType[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(
    action: AuditActionType,
    actor: AdminData | UserData,
    details: {
      description: string;
      metadata?: Record<string, any>;
      target?: {
        type: 'user' | 'admin' | 'system' | 'content' | 'report';
        id: string;
        name?: string;
      };
    },
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    status: 'success' | 'failure' | 'warning' = 'success'
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        action,
        actor: {
          id: actor.id,
          name: actor.name,
          role: 'role' in actor ? actor.role : 'user',
          email: actor.email
        },
        target: details.target,
        details: {
          description: details.description,
          metadata: details.metadata,
          ipAddress: this.getClientIP() || 'IP_UNKNOWN',
          userAgent: navigator.userAgent,
          sessionId: this.getCurrentSessionId()
        },
        severity,
        status
      };

      // Store audit entry
      const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      auditLogs.unshift(auditEntry);

      // Keep only last 1000 entries
      if (auditLogs.length > 1000) {
        auditLogs.splice(1000);
      }

      localStorage.setItem('security_audit_logs', JSON.stringify(auditLogs));

      // Check if this action should trigger a security alert
      this.checkForSecurityAlerts(auditEntry);

      console.log('📋 Audit Event Logged:', auditEntry);
    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
    }
  }

  /**
   * Get security alerts with filtering options
   */
  getSecurityAlerts(options: {
    resolved?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    type?: 'failed-login' | 'suspicious-activity' | 'permission-violation' | 'account-lockout' | 'system-anomaly';
    limit?: number;
  } = {}): SecurityAlert[] {
    try {
      const alerts: SecurityAlert[] = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      
      let filteredAlerts = alerts;

      // Apply filters
      if (options.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === options.resolved);
      }

      if (options.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === options.severity);
      }

      if (options.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === options.type);
      }

      // Apply limit
      if (options.limit) {
        filteredAlerts = filteredAlerts.slice(0, options.limit);
      }

      return filteredAlerts;
    } catch (error) {
      console.error('❌ Failed to get security alerts:', error);
      return [];
    }
  }

  /**
   * Create a security alert
   */
  createSecurityAlert(
    type: 'failed-login' | 'suspicious-activity' | 'permission-violation' | 'account-lockout' | 'system-anomaly',
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    actor?: {
      id: string;
      name: string;
      email: string;
      ipAddress: string;
    }
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      title,
      description,
      actor,
      resolved: false
    };

    try {
      const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      alerts.unshift(alert);

      // Keep only last 500 alerts
      if (alerts.length > 500) {
        alerts.splice(500);
      }

      localStorage.setItem('security_alerts', JSON.stringify(alerts));
      console.log('🚨 Security Alert Created:', alert);
    } catch (error) {
      console.error('❌ Failed to create security alert:', error);
    }

    return alert;
  }

  /**
   * Resolve a security alert
   */
  resolveSecurityAlert(alertId: string, resolvedBy: string, notes?: string): boolean {
    try {
      const alerts: SecurityAlert[] = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      const alertIndex = alerts.findIndex(alert => alert.id === alertId);

      if (alertIndex === -1) {
        return false;
      }

      alerts[alertIndex].resolved = true;
      alerts[alertIndex].resolvedBy = resolvedBy;
      alerts[alertIndex].resolvedAt = new Date().toISOString();
      alerts[alertIndex].notes = notes;

      localStorage.setItem('security_alerts', JSON.stringify(alerts));
      console.log('✅ Security Alert Resolved:', alerts[alertIndex]);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to resolve security alert:', error);
      return false;
    }
  }

  /**
   * Check audit entries for patterns that should trigger alerts
   */
  private checkForSecurityAlerts(auditEntry: AuditLogEntry): void {
    const config = DEFAULT_SECURITY_CONFIG;

    // Check for multiple failed logins
    if (auditEntry.action === 'auth.failed-login' || auditEntry.action === 'auth.admin-login-failed') {
      this.checkFailedLoginPattern(auditEntry, config.alertThresholds.failedLogins);
    }

    // Check for permission violations
    if (auditEntry.action === 'security.permission-denied') {
      this.checkPermissionViolationPattern(auditEntry);
    }

    // Check for suspicious activity patterns
    if (auditEntry.severity === 'high' || auditEntry.severity === 'critical') {
      this.checkSuspiciousActivityPattern(auditEntry);
    }
  }

  /**
   * Check for failed login patterns
   */
  private checkFailedLoginPattern(auditEntry: AuditLogEntry, threshold: number): void {
    try {
      const auditLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentFailedLogins = auditLogs.filter(log => 
        (log.action === 'auth.failed-login' || log.action === 'auth.admin-login-failed') &&
        new Date(log.timestamp) > lastHour &&
        log.actor.email === auditEntry.actor.email
      );

      if (recentFailedLogins.length >= threshold) {
        this.createSecurityAlert(
          'failed-login',
          'medium',
          `Multiple Failed Login Attempts`,
          `${recentFailedLogins.length} failed login attempts detected for ${auditEntry.actor.email} in the last hour`,
          {
            id: auditEntry.actor.id,
            name: auditEntry.actor.name,
            email: auditEntry.actor.email,
            ipAddress: auditEntry.details.ipAddress
          }
        );
      }
    } catch (error) {
      console.error('❌ Failed to check failed login pattern:', error);
    }
  }

  /**
   * Check for permission violation patterns
   */
  private checkPermissionViolationPattern(auditEntry: AuditLogEntry): void {
    try {
      const auditLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentViolations = auditLogs.filter(log => 
        log.action === 'security.permission-denied' &&
        new Date(log.timestamp) > lastHour &&
        log.actor.id === auditEntry.actor.id
      );

      if (recentViolations.length >= 3) {
        this.createSecurityAlert(
          'permission-violation',
          'high',
          `Repeated Permission Violations`,
          `${recentViolations.length} permission violations detected for ${auditEntry.actor.name} in the last hour`,
          {
            id: auditEntry.actor.id,
            name: auditEntry.actor.name,
            email: auditEntry.actor.email,
            ipAddress: auditEntry.details.ipAddress
          }
        );
      }
    } catch (error) {
      console.error('❌ Failed to check permission violation pattern:', error);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivityPattern(auditEntry: AuditLogEntry): void {
    try {
      if (auditEntry.severity === 'critical') {
        this.createSecurityAlert(
          'suspicious-activity',
          'critical',
          `Critical Security Event`,
          `Critical security event detected: ${auditEntry.details.description}`,
          {
            id: auditEntry.actor.id,
            name: auditEntry.actor.name,
            email: auditEntry.actor.email,
            ipAddress: auditEntry.details.ipAddress
          }
        );
      }
    } catch (error) {
      console.error('❌ Failed to check suspicious activity pattern:', error);
    }
  }

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id'>): void {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const existingEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      existingEvents.unshift(securityEvent);

      // Keep only last 1000 events
      if (existingEvents.length > 1000) {
        existingEvents.splice(1000);
      }

      localStorage.setItem('security_events', JSON.stringify(existingEvents));
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Security Event:', securityEvent);
      }
    } catch (error) {
      console.error('❌ Failed to log security event:', error);
    }
  }

  /**
   * Create a new security session
   */
  createSession(user: { id: string; email: string; role?: string }): SecuritySession {
    const session: SecuritySession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userType: user.role ? 'admin' : 'user',
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: this.getClientIP() || 'IP_UNKNOWN',
      userAgent: navigator.userAgent,
      active: true
    };

    // Store session
    const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('security_sessions', JSON.stringify(sessions));

    // Set current session
    this.currentSessionId = session.id;

    // Log session creation
    this.logSecurityEvent({
      type: 'login',
      userId: user.id,
      timestamp: new Date().toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      details: {
        action: 'session_created',
        sessionId: session.id,
        userType: session.userType
      },
      severity: 'low'
    });

    return session;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId: string): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const sessionIndex = sessions.findIndex((s: SecuritySession) => s.id === sessionId);

      if (sessionIndex !== -1) {
        sessions[sessionIndex].lastActivity = new Date().toISOString();
        localStorage.setItem('security_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('❌ Failed to update session activity:', error);
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(sessionId: string): boolean {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const session = sessions.find((s: SecuritySession) => s.id === sessionId);

      if (!session) return true;

      const lastActivity = new Date(session.lastActivity).getTime();
      const now = new Date().getTime();

      return (now - lastActivity) > this.MAX_SESSION_DURATION;
    } catch (error) {
      console.error('❌ Failed to check session expiry:', error);
      return true;
    }
  }

  /**
   * Terminate a session
   */
  terminateSession(sessionId: string, reason: string = 'Manual logout'): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const sessionIndex = sessions.findIndex((s: SecuritySession) => s.id === sessionId);

      if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        
        // Log session termination
        this.logSecurityEvent({
          type: 'logout',
          userId: session.userId,
          timestamp: new Date().toISOString(),
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          details: {
            action: 'session_terminated',
            sessionId: session.id,
            reason,
            duration: new Date().getTime() - new Date(session.startTime).getTime()
          },
          severity: 'low'
        });

        // Remove session
        sessions.splice(sessionIndex, 1);
        localStorage.setItem('security_sessions', JSON.stringify(sessions));

        // Clear current session if it matches
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = null;
        }
      }
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
    }
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(attempt: LoginAttempt): void {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      attempts.unshift(attempt);

      // Keep only last 500 attempts
      if (attempts.length > 500) {
        attempts.splice(500);
      }

      localStorage.setItem('login_attempts', JSON.stringify(attempts));
    } catch (error) {
      console.error('❌ Failed to log login attempt:', error);
    }
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    try {
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      return events.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): SecuritySession[] {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const now = new Date().getTime();

      return sessions.filter((session: SecuritySession) => {
        const lastActivity = new Date(session.lastActivity).getTime();
        return (now - lastActivity) <= this.MAX_SESSION_DURATION;
      });
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const now = new Date().getTime();

      const activeSessions = sessions.filter((session: SecuritySession) => {
        const lastActivity = new Date(session.lastActivity).getTime();
        return (now - lastActivity) <= this.MAX_SESSION_DURATION;
      });

      localStorage.setItem('security_sessions', JSON.stringify(activeSessions));
    } catch (error) {
      console.error('❌ Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Get session warning time (when to show warning before expiry)
   */
  getSessionWarningTime(): number {
    return this.SESSION_WARNING_TIME;
  }

  /**
   * Check if session needs warning
   */
  shouldShowSessionWarning(sessionId: string): boolean {
    try {
      const sessions = JSON.parse(localStorage.getItem('security_sessions') || '[]');
      const session = sessions.find((s: SecuritySession) => s.id === sessionId);

      if (!session) return false;

      const lastActivity = new Date(session.lastActivity).getTime();
      const now = new Date().getTime();
      const timeSinceActivity = now - lastActivity;

      return timeSinceActivity > (this.MAX_SESSION_DURATION - this.SESSION_WARNING_TIME);
    } catch (error) {
      console.error('❌ Failed to check session warning:', error);
      return false;
    }
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(options: {
    action?: AuditActionType;
    actorId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'success' | 'failure' | 'warning';
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): AuditLogEntry[] {
    try {
      const auditLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      let filteredLogs = auditLogs;

      // Apply filters
      if (options.action) {
        filteredLogs = filteredLogs.filter(log => log.action === options.action);
      }

      if (options.actorId) {
        filteredLogs = filteredLogs.filter(log => log.actor.id === options.actorId);
      }

      if (options.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === options.severity);
      }

      if (options.status) {
        filteredLogs = filteredLogs.filter(log => log.status === options.status);
      }

      if (options.startDate) {
        const startDate = new Date(options.startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
      }

      if (options.endDate) {
        const endDate = new Date(options.endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
      }

      // Apply limit
      if (options.limit) {
        filteredLogs = filteredLogs.slice(0, options.limit);
      }

      return filteredLogs;
    } catch (error) {
      console.error('❌ Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Check if an account is locked
   */
  isAccountLocked(email: string): boolean {
    try {
      const lockoutData = localStorage.getItem(`account_lockout_${email}`);
      if (!lockoutData) return false;

      const lockout = JSON.parse(lockoutData);
      const now = new Date().getTime();
      
      // Check if lockout has expired
      if (now > lockout.expiresAt) {
        // Remove expired lockout
        localStorage.removeItem(`account_lockout_${email}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to check account lock status:', error);
      return false;
    }
  }

  /**
   * Lock an account
   */
  lockAccount(email: string, duration: number = 30 * 60 * 1000): void {
    try {
      const lockout = {
        email,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date().getTime() + duration, // 30 minutes by default
        reason: 'Multiple failed login attempts'
      };

      localStorage.setItem(`account_lockout_${email}`, JSON.stringify(lockout));

      // Log the lockout event
      this.logSecurityEvent({
        type: 'login',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        details: {
          action: 'account_locked',
          email,
          duration: duration / 60000, // in minutes
          reason: lockout.reason
        },
        severity: 'high'
      });

      console.log('🔒 Account locked:', email, 'for', duration / 60000, 'minutes');
    } catch (error) {
      console.error('❌ Failed to lock account:', error);
    }
  }

  /**
   * Unlock an account
   */
  unlockAccount(email: string): void {
    try {
      localStorage.removeItem(`account_lockout_${email}`);
      
      // Log the unlock event
      this.logSecurityEvent({
        type: 'login',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        details: {
          action: 'account_unlocked',
          email,
          reason: 'Manual unlock or lockout expired'
        },
        severity: 'medium'
      });

      console.log('🔓 Account unlocked:', email);
    } catch (error) {
      console.error('❌ Failed to unlock account:', error);
    }
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(email: string, success: boolean, failureReason?: string): void {
    try {
      const attempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        timestamp: new Date().toISOString(),
        success,
        failureReason,
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent
      };

      // Store login attempt
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      attempts.unshift(attempt);

      // Keep only last 1000 attempts
      if (attempts.length > 1000) {
        attempts.splice(1000);
      }

      localStorage.setItem('login_attempts', JSON.stringify(attempts));

      // Log security event
      this.logSecurityEvent({
        type: success ? 'login' : 'failed_login',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        details: {
          action: success ? 'login_success' : 'login_failed',
          email,
          failureReason: failureReason || 'Unknown'
        },
        severity: success ? 'low' : 'medium'
      });

      console.log('📝 Login attempt recorded:', { email, success, failureReason });
    } catch (error) {
      console.error('❌ Failed to record login attempt:', error);
    }
  }

  /**
   * Get recent login attempts for an email
   */
  getLoginAttempts(email: string, limit: number = 10): any[] {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      return attempts
        .filter((attempt: any) => attempt.email === email)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get login attempts:', error);
      return [];
    }
  }

  /**
   * Get failed login attempts count for an email in a time period
   */
  getFailedLoginCount(email: string, timeWindowMs: number = 60 * 60 * 1000): number {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      const cutoffTime = new Date().getTime() - timeWindowMs;
      
      return attempts.filter((attempt: any) => 
        attempt.email === email && 
        !attempt.success && 
        new Date(attempt.timestamp).getTime() > cutoffTime
      ).length;
    } catch (error) {
      console.error('❌ Failed to get failed login count:', error);
      return 0;
    }
  }

  /**
   * Clear all login attempts for an email (useful after successful login)
   */
  clearLoginAttempts(email: string): void {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      const filteredAttempts = attempts.filter((attempt: any) => attempt.email !== email);
      localStorage.setItem('login_attempts', JSON.stringify(filteredAttempts));
      
      console.log('🧹 Login attempts cleared for:', email);
    } catch (error) {
      console.error('❌ Failed to clear login attempts:', error);
    }
  }

  /**
   * Initialize default security settings
   */
  initializeSecuritySettings(): void {
    try {
      // Set up default security configuration if not exists
      const securityConfig = localStorage.getItem('security_config');
      if (!securityConfig) {
        const defaultConfig = {
          maxFailedAttempts: 5,
          lockoutDuration: 30 * 60 * 1000, // 30 minutes
          sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
          passwordResetExpiry: 15 * 60 * 1000, // 15 minutes
          auditLogRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
          alertThresholds: {
            failedLogins: 3,
            suspiciousActivity: 5,
            concurrentSessions: 3
          }
        };

        localStorage.setItem('security_config', JSON.stringify(defaultConfig));
        console.log('🔒 Security settings initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize security settings:', error);
    }
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): any {
    try {
      return JSON.parse(localStorage.getItem('security_config') || '{}');
    } catch (error) {
      console.error('❌ Failed to get security config:', error);
      return {};
    }
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<any>): void {
    try {
      const currentConfig = this.getSecurityConfig();
      const updatedConfig = { ...currentConfig, ...config };
      localStorage.setItem('security_config', JSON.stringify(updatedConfig));
      
      console.log('🔒 Security config updated:', config);
    } catch (error) {
      console.error('❌ Failed to update security config:', error);
    }
  }

  /**
   * Clean up old security data
   */
  cleanupSecurityData(): void {
    try {
      const now = new Date().getTime();
      const retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days

      // Clean up old security events
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      const validEvents = events.filter((event: any) => 
        (now - new Date(event.timestamp).getTime()) < retentionPeriod
      );
      localStorage.setItem('security_events', JSON.stringify(validEvents));

      // Clean up old audit logs
      const auditLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      const validAuditLogs = auditLogs.filter((log: any) => 
        (now - new Date(log.timestamp).getTime()) < retentionPeriod
      );
      localStorage.setItem('security_audit_logs', JSON.stringify(validAuditLogs));

      // Clean up old login attempts
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      const validAttempts = attempts.filter((attempt: any) => 
        (now - new Date(attempt.timestamp).getTime()) < (7 * 24 * 60 * 60 * 1000) // Keep for 7 days
      );
      localStorage.setItem('login_attempts', JSON.stringify(validAttempts));

      console.log('🧹 Security data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup security data:', error);
    }
  }

  /**
   * Generate a comprehensive security report
   */
  generateSecurityReport(startDate: string, endDate: string): any {
    try {
      const events = this.getSecurityEvents(1000);
      const auditLogs = this.getAuditLogs({ startDate, endDate, limit: 1000 });
      const alerts = this.getSecurityAlerts({ limit: 500 });
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
      
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });
      
      const filteredAttempts = attempts.filter((attempt: any) => {
        const attemptDate = new Date(attempt.timestamp);
        return attemptDate >= new Date(startDate) && attemptDate <= new Date(endDate);
      });
      
      return {
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        summary: {
          totalLogins: auditLogs.filter(log => log.action === 'auth.login' || log.action === 'auth.admin-login').length,
          failedLogins: auditLogs.filter(log => log.action === 'auth.failed-login' || log.action === 'auth.admin-login-failed').length,
          securityAlerts: alerts.length,
          activeUsers: new Set(auditLogs.map(log => log.actor.email)).size,
          totalEvents: filteredEvents.length
        },
        topFailedLogins: Object.entries(
          filteredAttempts.filter((attempt: any) => !attempt.success)
            .reduce((acc: any, attempt: any) => {
              acc[attempt.email] = (acc[attempt.email] || 0) + 1;
              return acc;
            }, {})
        ).map(([email, count]) => ({ email, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10),
        alertsByType: alerts.reduce((acc: any, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {}),
        recommendations: this.generateSecurityRecommendations(filteredEvents, auditLogs)
      };
    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      return {
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        summary: { totalLogins: 0, failedLogins: 0, securityAlerts: 0, activeUsers: 0, totalEvents: 0 },
        topFailedLogins: [],
        alertsByType: {},
        recommendations: []
      };
    }
  }

  /**
   * Generate security recommendations based on events and audit logs
   */
  generateSecurityRecommendations(events: any[], auditLogs: any[]): string[] {
    try {
      const recommendations: string[] = [];
      
      // Check for high number of failed logins
      const failedLogins = auditLogs.filter(log => 
        log.action === 'auth.failed-login' || log.action === 'auth.admin-login-failed'
      ).length;
      
      if (failedLogins > 10) {
        recommendations.push('Consider implementing account lockout policies due to high failed login attempts');
      }
      
      // Check for critical security events
      const criticalEvents = events.filter(event => event.severity === 'critical').length;
      if (criticalEvents > 0) {
        recommendations.push('Review and address critical security events immediately');
      }
      
      // Check for permission violations
      const permissionViolations = auditLogs.filter(log => 
        log.action === 'security.permission-denied'
      ).length;
      
      if (permissionViolations > 5) {
        recommendations.push('Review user permissions as there are multiple access violations');
      }
      
      // Check for unresolved alerts
      const unresolvedAlerts = this.getSecurityAlerts({ resolved: false });
      if (unresolvedAlerts.length > 0) {
        recommendations.push(`Address ${unresolvedAlerts.length} unresolved security alerts`);
      }
      
      // Default recommendation if none triggered
      if (recommendations.length === 0) {
        recommendations.push('Security posture appears healthy. Continue monitoring.');
      }
      
      return recommendations;
    } catch (error) {
      console.error('❌ Failed to generate security recommendations:', error);
      return ['Unable to generate recommendations due to an error'];
    }
  }

  /**
   * Validate role-specific admin access
   */
  validateRoleAccess(role: AdminRole, _accessMethod: string, accessData: any): boolean {
    try {
      // Get settings from localStorage directly to match the new structure
      const settingsData = localStorage.getItem('pulseprep_admin_access_settings');
      if (!settingsData) {
        console.log(`❌ No admin access settings found`);
        return false;
      }

      const settings = JSON.parse(settingsData);
      const roleSettings = settings.roleAccess[role];
      
      if (!roleSettings || !roleSettings.enabled) {
        console.log(`❌ Role ${role} is not enabled or not configured`);
        return false;
      }

      const shortcuts = roleSettings.shortcuts || [];
      const shortcutMode = roleSettings.shortcutMode || 'single';
      
      if (shortcuts.length === 0) {
        console.log(`❌ No shortcuts configured for role: ${role}`);
        return false;
      }

      // Validate based on shortcut mode
      if (shortcutMode === 'single') {
        // Only check the first shortcut
        return this.validateKeyboardShortcut(accessData, { shortcut: shortcuts[0] });
      } else {
        // Check if any shortcut matches
        return shortcuts.some((shortcut: string) => 
          this.validateKeyboardShortcut(accessData, { shortcut })
        );
      }
    } catch (error) {
      console.error('❌ Failed to validate role access:', error);
      return false;
    }
  }

  /**
   * Log role-specific access attempts
   */
  logRoleAccessAttempt(role: AdminRole, method: string, success: boolean, details?: any): void {
    try {
      const accessAttempt = {
        id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        method,
        success,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        details
      };

      const attempts = JSON.parse(localStorage.getItem('admin_access_attempts') || '[]');
      attempts.unshift(accessAttempt);

      // Keep only last 1000 attempts
      if (attempts.length > 1000) {
        attempts.splice(1000);
      }

      localStorage.setItem('admin_access_attempts', JSON.stringify(attempts));

      // Log security event for failed attempts
      if (!success) {
        this.logSecurityEvent({
          type: 'failed_login',
          userId: `role-${role}`,
          timestamp: new Date().toISOString(),
          ipAddress: accessAttempt.ipAddress,
          userAgent: accessAttempt.userAgent,
          details: {
            action: 'admin_access_attempt',
            role,
            method,
            reason: 'Invalid access method'
          },
          severity: 'medium'
        });
      }

      console.log(`🔐 Role access attempt logged: ${role} - ${method} - ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('❌ Failed to log role access attempt:', error);
    }
  }

  /**
   * Get admin access settings
   */
  getAdminAccessSettings(): AdminAccessSettings {
    try {
      const settings = localStorage.getItem('admin_access_settings');
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Return default settings if none exist
      return this.getDefaultAdminAccessSettings();
    } catch (error) {
      console.error('❌ Failed to get admin access settings:', error);
      return this.getDefaultAdminAccessSettings();
    }
  }

  /**
   * Update admin access settings
   */
  updateAdminAccessSettings(settings: Partial<AdminAccessSettings>, updatedBy: string): void {
    try {
      const currentSettings = this.getAdminAccessSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
        updatedBy
      };
      
      localStorage.setItem('admin_access_settings', JSON.stringify(updatedSettings));
      console.log('🔐 Admin access settings updated:', updatedSettings);
    } catch (error) {
      console.error('❌ Failed to update admin access settings:', error);
    }
  }

  /**
   * Get default admin access settings
   */
  private getDefaultAdminAccessSettings(): AdminAccessSettings {
    return {
      enabled: true,
      securityLevel: 'high',
      defaultMethod: 'keyboard-shortcut',
      roleAccess: {
        'super-admin': {
          enabled: true,
          shortcutMode: 'single',
          shortcuts: ['Ctrl+Alt+Shift+A, then D'],
          method: 'keyboard-shortcut',
          status: 'active'
        },
        'finance-manager': {
          enabled: true,
          shortcutMode: 'single',
          shortcuts: ['Ctrl+Alt+F'],
          method: 'keyboard-shortcut',
          status: 'active'
        },
        'content-manager': {
          enabled: true,
          shortcutMode: 'single',
          shortcuts: ['Ctrl+Alt+C'],
          method: 'keyboard-shortcut',
          status: 'active'
        },
        'audit-manager': {
          enabled: true,
          shortcutMode: 'single',
          shortcuts: ['Ctrl+Alt+Shift+E'],
          method: 'keyboard-shortcut',
          status: 'active'
        }
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };
  }

              /**
             * Validate keyboard shortcut access
             */
            private validateKeyboardShortcut(accessData: any, config: any): boolean {
              if (!config || !accessData.keys) return false;

              const { shortcut } = config;
              const { keys, timeSpan, event } = accessData;

              // Handle special case for Super Admin (two-step shortcut)
              if (shortcut.includes(', then ')) {
                const parts = shortcut.split(', then ');
                const firstPart = parts[0];
                const secondPart = parts[1];
                
                // Check if this is the first step
                if (keys.length === 1 && keys[0] === firstPart) {
                  return timeSpan <= 3000; // 3 second timeout for two-step
                }
                
                // Check if this is the second step (D)
                if (keys.length === 1 && keys[0] === secondPart && 
                    window.adminSecureAccess && 
                    window.adminSecureAccess.step === 1 &&
                    (Date.now() - window.adminSecureAccess.timestamp) < 3000) {
                  return true;
                }
                
                return false;
              }

              // Handle regular shortcuts using the event data
              if (keys.length === 1 && event) {
                return this.matchesShortcut(event, shortcut);
              }

              return false;
            }

            /**
             * Check if event matches a shortcut (copied from App.tsx)
             */
            private matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
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
            }

  /**
   * Log email verification security event
   */
  logEmailVerificationSecurityEvent(
    type: EmailVerificationSecurityEvent['type'],
    email: string,
    details: {
      tokenId?: string;
      attempts?: number;
      rateLimitExceeded?: boolean;
      fraudScore?: number;
      suspiciousPatterns?: string[];
      sessionId?: string;
      metadata?: Record<string, any>;
    },
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    try {
      const event: EmailVerificationSecurityEvent = {
        id: `evse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        email: email.toLowerCase(),
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: {
          ...details,
          sessionId: this.getCurrentSessionId()
        },
        severity
      };

      // Store security event
      const securityEvents = JSON.parse(localStorage.getItem('email_verification_security_events') || '[]');
      securityEvents.unshift(event);

      // Keep only last 1000 events
      const trimmedEvents = securityEvents.slice(0, 1000);
      localStorage.setItem('email_verification_security_events', JSON.stringify(trimmedEvents));

      // Check for security alerts
      this.checkEmailVerificationSecurityAlerts(event);

      console.log(`🔐 Email verification security event logged: ${type} for ${email}`);
    } catch (error) {
      console.error('❌ Error logging email verification security event:', error);
    }
  }

  /**
   * Check email verification rate limiting
   */
  checkEmailVerificationRateLimit(email: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: string; reason?: string } {
    try {
      const rateLimits = JSON.parse(localStorage.getItem('email_verification_rate_limits') || '[]');
      const now = new Date();
      const emailRateLimit = rateLimits.find((rl: EmailVerificationRateLimit) => 
        rl.email.toLowerCase() === email.toLowerCase()
      );

      if (!emailRateLimit) {
        return { allowed: true, remainingAttempts: this.EMAIL_VERIFICATION_RATE_LIMIT };
      }

      // Check if blocked
      if (emailRateLimit.blockedUntil) {
        const blockedUntil = new Date(emailRateLimit.blockedUntil);
        if (now < blockedUntil) {
          const remainingBlockTime = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000 / 60);
          return {
            allowed: false,
            remainingAttempts: 0,
            blockedUntil: emailRateLimit.blockedUntil,
            reason: `Rate limit exceeded. Try again in ${remainingBlockTime} minutes.`
          };
        } else {
          // Unblock if time has passed
          emailRateLimit.blockedUntil = undefined;
          emailRateLimit.attempts = 0;
        }
      }

      // Check if within rate limit window
      const lastAttempt = new Date(emailRateLimit.lastAttempt);
      const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();

      if (timeSinceLastAttempt > this.EMAIL_VERIFICATION_RATE_WINDOW) {
        // Reset attempts if outside window
        emailRateLimit.attempts = 0;
      }

      const remainingAttempts = Math.max(0, this.EMAIL_VERIFICATION_RATE_LIMIT - emailRateLimit.attempts);

      return {
        allowed: remainingAttempts > 0,
        remainingAttempts,
        reason: remainingAttempts === 0 ? 'Rate limit exceeded' : undefined
      };
    } catch (error) {
      console.error('❌ Error checking email verification rate limit:', error);
      return { allowed: true, remainingAttempts: this.EMAIL_VERIFICATION_RATE_LIMIT };
    }
  }

  /**
   * Record email verification attempt
   */
  recordEmailVerificationAttempt(email: string, success: boolean): void {
    try {
      const rateLimits = JSON.parse(localStorage.getItem('email_verification_rate_limits') || '[]');
      const now = new Date();
      const emailRateLimit = rateLimits.find((rl: EmailVerificationRateLimit) => 
        rl.email.toLowerCase() === email.toLowerCase()
      );

      if (emailRateLimit) {
        emailRateLimit.attempts++;
        emailRateLimit.lastAttempt = now.toISOString();

        // Block if rate limit exceeded
        if (emailRateLimit.attempts >= this.EMAIL_VERIFICATION_RATE_LIMIT) {
          const blockedUntil = new Date(now.getTime() + this.EMAIL_VERIFICATION_BLOCK_DURATION);
          emailRateLimit.blockedUntil = blockedUntil.toISOString();
        }
      } else {
        // Create new rate limit entry
        rateLimits.push({
          email: email.toLowerCase(),
          attempts: 1,
          lastAttempt: now.toISOString(),
          ipAddress: this.getClientIP() || 'IP_UNKNOWN'
        });
      }

      // Keep only last 1000 rate limit entries
      const trimmedRateLimits = rateLimits.slice(-1000);
      localStorage.setItem('email_verification_rate_limits', JSON.stringify(trimmedRateLimits));

      // Log security event
      this.logEmailVerificationSecurityEvent(
        success ? 'email-verification-success' : 'email-verification-attempted',
        email,
        {
          attempts: emailRateLimit?.attempts || 1,
          rateLimitExceeded: emailRateLimit?.attempts >= this.EMAIL_VERIFICATION_RATE_LIMIT
        },
        success ? 'low' : 'medium'
      );
    } catch (error) {
      console.error('❌ Error recording email verification attempt:', error);
    }
  }

  /**
   * Detect email verification fraud
   */
  detectEmailVerificationFraud(email: string, token: string, userAgent: string): { fraudScore: number; suspiciousPatterns: string[]; riskLevel: 'low' | 'medium' | 'high' | 'critical' } {
    try {
      let fraudScore = 0;
      const suspiciousPatterns: string[] = [];

      // Check for suspicious email patterns
      if (email.includes('temp') || email.includes('test') || email.includes('fake')) {
        fraudScore += 0.2;
        suspiciousPatterns.push('suspicious_email_pattern');
      }

      // Check for disposable email domains
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
      const domain = email.split('@')[1];
      if (disposableDomains.includes(domain)) {
        fraudScore += 0.3;
        suspiciousPatterns.push('disposable_email_domain');
      }

      // Check for suspicious user agent patterns
      if (!userAgent || userAgent.length < 10) {
        fraudScore += 0.1;
        suspiciousPatterns.push('suspicious_user_agent');
      }

      // Check for rapid token generation
      const recentTokens = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const recentTokensForEmail = recentTokens.filter((t: EmailVerificationToken) => 
        t.email.toLowerCase() === email.toLowerCase() && 
        new Date(t.createdAt) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );

      if (recentTokensForEmail.length > 3) {
        fraudScore += 0.2;
        suspiciousPatterns.push('rapid_token_generation');
      }

      // Check for multiple failed attempts
      const failedAttempts = this.getEmailVerificationFailedAttempts(email);
      if (failedAttempts > 5) {
        fraudScore += 0.3;
        suspiciousPatterns.push('multiple_failed_attempts');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (fraudScore >= 0.8) {
        riskLevel = 'critical';
      } else if (fraudScore >= 0.6) {
        riskLevel = 'high';
      } else if (fraudScore >= 0.4) {
        riskLevel = 'medium';
      }

      // Store fraud detection data
      const fraudData: EmailVerificationFraudDetection = {
        email: email.toLowerCase(),
        fraudScore,
        suspiciousPatterns,
        lastUpdated: new Date().toISOString(),
        riskLevel
      };

      const fraudDetections = JSON.parse(localStorage.getItem('email_verification_fraud_detections') || '[]');
      const existingIndex = fraudDetections.findIndex((fd: EmailVerificationFraudDetection) => 
        fd.email.toLowerCase() === email.toLowerCase()
      );

      if (existingIndex !== -1) {
        fraudDetections[existingIndex] = fraudData;
      } else {
        fraudDetections.push(fraudData);
      }

      // Keep only last 500 fraud detections
      const trimmedFraudDetections = fraudDetections.slice(-500);
      localStorage.setItem('email_verification_fraud_detections', JSON.stringify(trimmedFraudDetections));

      // Log security event if fraud detected
      if (fraudScore > this.EMAIL_VERIFICATION_FRAUD_THRESHOLD) {
        this.logEmailVerificationSecurityEvent(
          'email-verification-fraud-detected',
          email,
          {
            fraudScore,
            suspiciousPatterns,
            metadata: { token: token.substring(0, 8) + '...' }
          },
          riskLevel === 'critical' ? 'critical' : 'high'
        );
      }

      return { fraudScore, suspiciousPatterns, riskLevel };
    } catch (error) {
      console.error('❌ Error detecting email verification fraud:', error);
      return { fraudScore: 0, suspiciousPatterns: [], riskLevel: 'low' };
    }
  }

  /**
   * Track email verification session
   */
  trackEmailVerificationSession(email: string, tokenId: string): string {
    try {
      const sessionId = `evs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const session = {
        id: sessionId,
        email: email.toLowerCase(),
        tokenId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: this.getClientIP() || 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        attempts: 0,
        isActive: true
      };

      const sessions = JSON.parse(localStorage.getItem('email_verification_sessions') || '[]');
      sessions.push(session);

      // Keep only last 500 sessions
      const trimmedSessions = sessions.slice(-500);
      localStorage.setItem('email_verification_sessions', JSON.stringify(trimmedSessions));

      return sessionId;
    } catch (error) {
      console.error('❌ Error tracking email verification session:', error);
      return `evs-${Date.now()}`;
    }
  }

  /**
   * Update email verification session activity
   */
  updateEmailVerificationSessionActivity(sessionId: string): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('email_verification_sessions') || '[]');
      const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);

      if (sessionIndex !== -1) {
        sessions[sessionIndex].lastActivity = new Date().toISOString();
        sessions[sessionIndex].attempts++;
        localStorage.setItem('email_verification_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('❌ Error updating email verification session activity:', error);
    }
  }

  /**
   * Get email verification failed attempts
   */
  private getEmailVerificationFailedAttempts(email: string): number {
    try {
      const securityEvents = JSON.parse(localStorage.getItem('email_verification_security_events') || '[]');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return securityEvents.filter((event: EmailVerificationSecurityEvent) => 
        event.email.toLowerCase() === email.toLowerCase() &&
        event.type === 'email-verification-failed' &&
        new Date(event.timestamp) > oneHourAgo
      ).length;
    } catch (error) {
      console.error('❌ Error getting email verification failed attempts:', error);
      return 0;
    }
  }

  /**
   * Check for email verification security alerts
   */
  private checkEmailVerificationSecurityAlerts(event: EmailVerificationSecurityEvent): void {
    try {
      // Check for multiple failed attempts
      const failedAttempts = this.getEmailVerificationFailedAttempts(event.email);
      if (failedAttempts > 10) {
        this.createSecurityAlert(
          'suspicious-activity',
          'high',
          'Multiple Email Verification Failures',
          `User ${event.email} has failed email verification ${failedAttempts} times in the last hour.`,
          {
            id: 'system',
            name: 'Security System',
            email: 'security@pulseprep.com',
            ipAddress: event.ipAddress
          }
        );
      }

      // Check for fraud detection
      if (event.type === 'email-verification-fraud-detected' && event.details.fraudScore && event.details.fraudScore > 0.8) {
        this.createSecurityAlert(
          'suspicious-activity',
          'critical',
          'Email Verification Fraud Detected',
          `High fraud score (${event.details.fraudScore}) detected for email verification: ${event.email}`,
          {
            id: 'system',
            name: 'Security System',
            email: 'security@pulseprep.com',
            ipAddress: event.ipAddress
          }
        );
      }

      // Check for rate limit violations
      if (event.details.rateLimitExceeded) {
        this.createSecurityAlert(
          'suspicious-activity',
          'medium',
          'Email Verification Rate Limit Exceeded',
          `Rate limit exceeded for email verification: ${event.email}`,
          {
            id: 'system',
            name: 'Security System',
            email: 'security@pulseprep.com',
            ipAddress: event.ipAddress
          }
        );
      }
    } catch (error) {
      console.error('❌ Error checking email verification security alerts:', error);
    }
  }

  /**
   * Get email verification security events
   */
  getEmailVerificationSecurityEvents(limit: number = 50): EmailVerificationSecurityEvent[] {
    try {
      const events = JSON.parse(localStorage.getItem('email_verification_security_events') || '[]');
      return events.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting email verification security events:', error);
      return [];
    }
  }

  /**
   * Clean up email verification security data
   */
  cleanupEmailVerificationSecurityData(): { cleaned: number; freedMB: number } {
    try {
      let cleaned = 0;
      let freedBytes = 0;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean up old security events
      const events = JSON.parse(localStorage.getItem('email_verification_security_events') || '[]');
      const validEvents = events.filter((event: EmailVerificationSecurityEvent) => 
        new Date(event.timestamp) > thirtyDaysAgo
      );

      if (validEvents.length < events.length) {
        cleaned += events.length - validEvents.length;
        localStorage.setItem('email_verification_security_events', JSON.stringify(validEvents));
      }

      // Clean up old rate limits
      const rateLimits = JSON.parse(localStorage.getItem('email_verification_rate_limits') || '[]');
      const validRateLimits = rateLimits.filter((rl: EmailVerificationRateLimit) => 
        new Date(rl.lastAttempt) > thirtyDaysAgo
      );

      if (validRateLimits.length < rateLimits.length) {
        cleaned += rateLimits.length - validRateLimits.length;
        localStorage.setItem('email_verification_rate_limits', JSON.stringify(validRateLimits));
      }

      // Clean up old fraud detections
      const fraudDetections = JSON.parse(localStorage.getItem('email_verification_fraud_detections') || '[]');
      const validFraudDetections = fraudDetections.filter((fd: EmailVerificationFraudDetection) => 
        new Date(fd.lastUpdated) > thirtyDaysAgo
      );

      if (validFraudDetections.length < fraudDetections.length) {
        cleaned += fraudDetections.length - validFraudDetections.length;
        localStorage.setItem('email_verification_fraud_detections', JSON.stringify(validFraudDetections));
      }

      // Clean up old sessions
      const sessions = JSON.parse(localStorage.getItem('email_verification_sessions') || '[]');
      const validSessions = sessions.filter((s: any) => 
        new Date(s.lastActivity) > thirtyDaysAgo
      );

      if (validSessions.length < sessions.length) {
        cleaned += sessions.length - validSessions.length;
        localStorage.setItem('email_verification_sessions', JSON.stringify(validSessions));
      }

      const freedMB = freedBytes / (1024 * 1024);
      console.log(`🧹 Email verification security data cleanup: ${cleaned} items removed, ${freedMB.toFixed(3)}MB freed`);

      return { cleaned, freedMB };
    } catch (error) {
      console.error('❌ Error cleaning up email verification security data:', error);
      return { cleaned: 0, freedMB: 0 };
    }
  }

}

export const securityService = new SecurityService();

// Initialize security settings when the service is imported
try {
  securityService.initializeSecuritySettings();
  // Clean up old data periodically
  securityService.cleanupSecurityData();
} catch (error) {
  console.error('❌ Failed to initialize security service:', error);
}