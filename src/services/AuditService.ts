import { safeSetItem, safeGetItem } from '../utils/storageUtils';

export interface AuditLog {
  id: string;
  timestamp: string;
  category: 'security' | 'user' | 'financial' | 'system' | 'compliance' | 'cms' | 'admin';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  affectedUser?: string;
  affectedResource?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'permission_change' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  source: string;
  status: 'active' | 'investigating' | 'resolved';
  assignedTo?: string;
  metadata?: Record<string, any>;
}

class AuditServiceClass {
  private readonly STORAGE_KEY = 'pulseprep_audit_logs';
  private readonly ALERTS_KEY = 'pulseprep_security_alerts';
  private readonly MAX_LOGS = 1000; // Keep only last 1000 logs
  private readonly MAX_ALERTS = 100; // Keep only last 100 alerts

  // Get browser information
  private getBrowserInfo() {
    const userAgent = navigator.userAgent;
    // Get IP from server or use a placeholder that indicates it's not real
    const ip = this.getClientIP() || 'IP_UNKNOWN';
    
    // Get location from server or use a placeholder
    const location = this.getClientLocation() || 'Location Unknown';

    return { userAgent, ip, location };
  }

  // Get client IP from server (placeholder for real implementation)
  private getClientIP(): string | null {
    // In real implementation, this would come from server headers
    // For now, return null to indicate no real IP available
    return null;
  }

  // Get client location from server (placeholder for real implementation)
  private getClientLocation(): string | null {
    // In real implementation, this would come from server geolocation
    // For now, return null to indicate no real location available
    return null;
  }

  // Log user management actions
  logUserAction(
    action: string,
    performedBy: string,
    performedByRole: string,
    affectedUser?: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    const severity = this.determineSeverity(action, success);
    const category = this.determineCategory(action);
    
    this.createAuditLog({
      category,
      severity,
      action,
      description: this.generateDescription(action, affectedUser, success, errorMessage),
      performedBy,
      performedByRole,
      affectedUser,
      success,
      metadata,
      errorMessage
    });

    // Create security alert for critical actions
    if (severity === 'critical' || action.includes('suspend') || action.includes('delete')) {
      this.createSecurityAlert({
        type: 'admin_action',
        severity,
        description: `Critical admin action: ${action} by ${performedBy}`,
        source: this.getBrowserInfo().ip,
        status: 'active',
        metadata: { action, performedBy, affectedUser, ...metadata }
      });
    }
  }

  // Log financial actions
  logFinancialAction(
    action: string,
    performedBy: string,
    performedByRole: string,
    amount?: number,
    affectedUser?: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    this.createAuditLog({
      category: 'financial',
      severity: amount && amount > 5000 ? 'high' : 'medium',
      action,
      description: this.generateFinancialDescription(action, amount, affectedUser, success, errorMessage),
      performedBy,
      performedByRole,
      affectedUser,
      success,
      metadata: { ...metadata, amount },
      errorMessage
    });
  }

  // Log system configuration changes
  logSystemAction(
    action: string,
    performedBy: string,
    performedByRole: string,
    affectedResource?: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    this.createAuditLog({
      category: 'system',
      severity: 'medium',
      action,
      description: this.generateSystemDescription(action, affectedResource, success, errorMessage),
      performedBy,
      performedByRole,
      affectedResource,
      success,
      metadata,
      errorMessage
    });
  }

  // Log CMS actions
  logCMSAction(
    action: string,
    performedBy: string,
    performedByRole: string,
    affectedResource?: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    this.createAuditLog({
      category: 'cms',
      severity: 'low',
      action,
      description: this.generateCMSDescription(action, affectedResource, success, errorMessage),
      performedBy,
      performedByRole,
      affectedResource,
      success,
      metadata,
      errorMessage
    });
  }

  // Log security events
  logSecurityEvent(
    action: string,
    performedBy: string,
    performedByRole: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    this.createAuditLog({
      category: 'security',
      severity,
      action,
      description: this.generateSecurityDescription(action, success, errorMessage),
      performedBy,
      performedByRole,
      success,
      metadata,
      errorMessage
    });

    // Create security alert for failed security events or high/critical events
    if (!success || severity === 'high' || severity === 'critical') {
      this.createSecurityAlert({
        type: success ? 'admin_action' : 'failed_login',
        severity,
        description: this.generateSecurityDescription(action, success, errorMessage),
        source: this.getBrowserInfo().ip,
        status: 'active',
        metadata: { action, performedBy, ...metadata }
      });
    }
  }

  // Log admin authentication events
  logAuthEvent(
    action: string,
    userEmail: string,
    userRole: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): void {
    const severity = this.determineSeverity(action, success);
    
    this.createAuditLog({
      category: 'security',
      severity,
      action,
      description: this.generateAuthDescription(action, userEmail, userRole, success, errorMessage),
      performedBy: userEmail,
      performedByRole: userRole,
      affectedUser: userEmail,
      success,
      metadata,
      errorMessage
    });
  }

  // Email verification audit logging methods
  logEmailVerificationEvent(
    action: 'email-verification-sent' | 'email-verification-attempted' | 'email-verification-success' | 'email-verification-failed' | 'email-verification-expired' | 'email-verification-resend',
    userEmail: string,
    success: boolean = true,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    const severity = this.determineEmailVerificationSeverity(action, success);
    
    this.createAuditLog({
      category: 'security',
      severity,
      action,
      description: this.generateEmailVerificationDescription(action, userEmail, success, errorMessage),
      performedBy: userEmail,
      performedByRole: 'user',
      affectedUser: userEmail,
      success,
      metadata: {
        ...metadata,
        emailVerificationAction: action,
        timestamp: new Date().toISOString()
      },
      errorMessage
    });
  }

  logEmailDeliveryStatus(
    emailId: string,
    userEmail: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'spam',
    metadata?: Record<string, any>,
    errorMessage?: string
  ): void {
    const success = status === 'sent' || status === 'delivered';
    const severity = this.determineEmailDeliverySeverity(status);
    
    this.createAuditLog({
      category: 'system',
      severity,
      action: 'email-delivery-status',
      description: this.generateEmailDeliveryDescription(status, userEmail, emailId, errorMessage),
      performedBy: 'System',
      performedByRole: 'system',
      affectedUser: userEmail,
      success,
      metadata: {
        ...metadata,
        emailId,
        deliveryStatus: status,
        timestamp: new Date().toISOString()
      },
      errorMessage
    });
  }

  logEmailVerificationFailure(
    userEmail: string,
    failureReason: string,
    metadata?: Record<string, any>
  ): void {
    this.createAuditLog({
      category: 'security',
      severity: 'medium',
      action: 'email-verification-failure',
      description: this.generateEmailVerificationFailureDescription(userEmail, failureReason),
      performedBy: userEmail,
      performedByRole: 'user',
      affectedUser: userEmail,
      success: false,
      metadata: {
        ...metadata,
        failureReason,
        timestamp: new Date().toISOString()
      },
      errorMessage: failureReason
    });
  }

  logEmailResendEvent(
    userEmail: string,
    resendCount: number,
    metadata?: Record<string, any>
  ): void {
    const severity = resendCount > 3 ? 'high' : 'medium';
    
    this.createAuditLog({
      category: 'security',
      severity,
      action: 'email-verification-resend',
      description: this.generateEmailResendDescription(userEmail, resendCount),
      performedBy: userEmail,
      performedByRole: 'user',
      affectedUser: userEmail,
      success: true,
      metadata: {
        ...metadata,
        resendCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  logEmailVerificationAuditTrail(
    userEmail: string,
    action: string,
    details: {
      tokenId?: string;
      attempts?: number;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      verificationStatus?: string;
      deliveryStatus?: string;
      fraudScore?: number;
      suspiciousPatterns?: string[];
    }
  ): void {
    this.createAuditLog({
      category: 'security',
      severity: 'low',
      action: 'email-verification-audit-trail',
      description: `Email verification audit trail: ${action} for ${userEmail}`,
      performedBy: userEmail,
      performedByRole: 'user',
      affectedUser: userEmail,
      success: true,
      metadata: {
        ...details,
        auditAction: action,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Create audit log entry
  private createAuditLog(logData: Partial<AuditLog>): void {
    try {
      const browserInfo = this.getBrowserInfo();
      const sessionId = sessionStorage.getItem('pulseprep_session_id') || 'unknown';
      
      const auditLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ipAddress: browserInfo.ip,
        userAgent: browserInfo.userAgent,
        location: browserInfo.location,
        sessionId,
        ...logData
      } as AuditLog;

      const existingLogs = this.getAuditLogs();
      const updatedLogs = [auditLog, ...existingLogs].slice(0, this.MAX_LOGS);
      
      const success = safeSetItem(this.STORAGE_KEY, JSON.stringify(updatedLogs));
      
      if (!success) {
        console.warn('Failed to save audit log due to storage quota');
      }

      // Log to console for development
      console.log('🔍 AUDIT LOG:', auditLog);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  // Create security alert
  private createSecurityAlert(alertData: Partial<SecurityAlert>): void {
    try {
      const alert: SecurityAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'active',
        ...alertData
      } as SecurityAlert;

      const existingAlerts = this.getSecurityAlerts();
      const updatedAlerts = [alert, ...existingAlerts].slice(0, this.MAX_ALERTS);
      
      const success = safeSetItem(this.ALERTS_KEY, JSON.stringify(updatedAlerts));
      
      if (!success) {
        console.warn('Failed to save security alert due to storage quota');
      }

      // Log to console for development
      console.log('🚨 SECURITY ALERT:', alert);
    } catch (error) {
      console.error('Error creating security alert:', error);
    }
  }

  // Get all audit logs
  getAuditLogs(): AuditLog[] {
    try {
      return safeGetItem(this.STORAGE_KEY, []);
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return [];
    }
  }

  // Get filtered audit logs
  getFilteredAuditLogs(filters: {
    category?: string;
    severity?: string;
    dateRange?: string;
    searchQuery?: string;
    performedBy?: string;
  }): AuditLog[] {
    const logs = this.getAuditLogs();
    
    return logs.filter(log => {
      const categoryMatch = !filters.category || filters.category === 'all' || log.category === filters.category;
      const severityMatch = !filters.severity || filters.severity === 'all' || log.severity === filters.severity;
      const performedByMatch = !filters.performedBy || log.performedBy.toLowerCase().includes(filters.performedBy.toLowerCase());
      const searchMatch = !filters.searchQuery || 
        log.action.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      // Date range filtering
      let dateMatch = true;
      if (filters.dateRange && filters.dateRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        switch (filters.dateRange) {
          case '24h':
            dateMatch = now.getTime() - logDate.getTime() < 24 * 60 * 60 * 1000;
            break;
          case '7d':
            dateMatch = now.getTime() - logDate.getTime() < 7 * 24 * 60 * 60 * 1000;
            break;
          case '30d':
            dateMatch = now.getTime() - logDate.getTime() < 30 * 24 * 60 * 60 * 1000;
            break;
        }
      }
      
      return categoryMatch && severityMatch && performedByMatch && searchMatch && dateMatch;
    });
  }

  // Get security alerts
  getSecurityAlerts(): SecurityAlert[] {
    try {
      return safeGetItem(this.ALERTS_KEY, []);
    } catch (error) {
      console.error('Error retrieving security alerts:', error);
      return [];
    }
  }

  // Get active security alerts
  getActiveSecurityAlerts(): SecurityAlert[] {
    return this.getSecurityAlerts().filter(alert => alert.status === 'active');
  }

  // Resolve security alert
  resolveSecurityAlert(alertId: string, resolvedBy: string): void {
    try {
      const alerts = this.getSecurityAlerts();
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const, assignedTo: resolvedBy }
          : alert
      );
      
      safeSetItem(this.ALERTS_KEY, JSON.stringify(updatedAlerts));
      
      // Log the resolution
      this.logSecurityEvent(
        'Security Alert Resolved',
        resolvedBy,
        'audit-manager', // Assuming audit manager resolves alerts
        'low',
        true,
        { alertId }
      );
    } catch (error) {
      console.error('Error resolving security alert:', error);
    }
  }

  // Get audit statistics
  getAuditStatistics(): {
    totalLogs: number;
    logsToday: number;
    criticalLogs: number;
    failedActions: number;
    activeAlerts: number;
    logsByCategory: Record<string, number>;
    logsBySeverity: Record<string, number>;
  } {
    const logs = this.getAuditLogs();
    const alerts = this.getActiveSecurityAlerts();
    const today = new Date().toDateString();
    
    const stats = {
      totalLogs: logs.length,
      logsToday: logs.filter(log => new Date(log.timestamp).toDateString() === today).length,
      criticalLogs: logs.filter(log => log.severity === 'critical').length,
      failedActions: logs.filter(log => !log.success).length,
      activeAlerts: alerts.length,
      logsByCategory: {} as Record<string, number>,
      logsBySeverity: {} as Record<string, number>
    };
    
    // Calculate category distribution
    logs.forEach(log => {
      stats.logsByCategory[log.category] = (stats.logsByCategory[log.category] || 0) + 1;
      stats.logsBySeverity[log.severity] = (stats.logsBySeverity[log.severity] || 0) + 1;
    });
    
    return stats;
  }

  // Clear old logs (keep only recent ones)
  cleanupOldLogs(daysToKeep: number = 90): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const logs = this.getAuditLogs();
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      
      safeSetItem(this.STORAGE_KEY, JSON.stringify(recentLogs));
      
      const alerts = this.getSecurityAlerts();
      const recentAlerts = alerts.filter(alert => new Date(alert.timestamp) > cutoffDate);
      
      safeSetItem(this.ALERTS_KEY, JSON.stringify(recentAlerts));
      
      console.log(`🧹 Cleaned up audit logs: Kept ${recentLogs.length}/${logs.length} logs, ${recentAlerts.length}/${alerts.length} alerts`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  // Helper methods for generating descriptions
  private generateDescription(action: string, affectedUser?: string, success?: boolean, errorMessage?: string): string {
    const target = affectedUser ? ` for user ${affectedUser}` : '';
    const status = success ? 'successfully executed' : 'failed';
    const error = errorMessage ? ` - Error: ${errorMessage}` : '';
    return `${action}${target} ${status}${error}`;
  }

  private generateFinancialDescription(action: string, amount?: number, affectedUser?: string, success?: boolean, errorMessage?: string): string {
    const amountText = amount ? ` (Amount: ${amount.toLocaleString()} PKR)` : '';
    const target = affectedUser ? ` for user ${affectedUser}` : '';
    const status = success ? 'processed successfully' : 'failed';
    const error = errorMessage ? ` - Error: ${errorMessage}` : '';
    return `${action}${amountText}${target} ${status}${error}`;
  }

  private generateSystemDescription(action: string, resource?: string, success?: boolean, errorMessage?: string): string {
    const resourceText = resource ? ` (Resource: ${resource})` : '';
    const status = success ? 'completed successfully' : 'failed';
    const error = errorMessage ? ` - Error: ${errorMessage}` : '';
    return `${action}${resourceText} ${status}${error}`;
  }

  private generateCMSDescription(action: string, resource?: string, success?: boolean, errorMessage?: string): string {
    const resourceText = resource ? ` (${resource})` : '';
    const status = success ? 'completed' : 'failed';
    const error = errorMessage ? ` - Error: ${errorMessage}` : '';
    return `${action}${resourceText} ${status}${error}`;
  }

  private generateSecurityDescription(action: string, success?: boolean, errorMessage?: string): string {
    const status = success ? 'successful' : 'failed';
    const error = errorMessage ? ` - ${errorMessage}` : '';
    return `${action} - ${status}${error}`;
  }

  private generateAuthDescription(action: string, userEmail: string, userRole: string, success: boolean, errorMessage?: string): string {
    const status = success ? 'successful' : 'failed';
    const error = errorMessage ? ` - ${errorMessage}` : '';
    return `${action} attempt by ${userEmail} (${userRole}) - ${status}${error}`;
  }

  private generateEmailVerificationDescription(action: string, userEmail: string, success: boolean, errorMessage?: string): string {
    const status = success ? 'successful' : 'failed';
    const error = errorMessage ? ` - ${errorMessage}` : '';
    return `${action} for ${userEmail} - ${status}${error}`;
  }

  private generateEmailDeliveryDescription(status: string, userEmail: string, emailId: string, errorMessage?: string): string {
    const statusText = status === 'sent' || status === 'delivered' ? 'delivered' : status;
    const error = errorMessage ? ` - Error: ${errorMessage}` : '';
    return `Email delivery status for ${userEmail} (ID: ${emailId}) - ${statusText}${error}`;
  }

  private generateEmailVerificationFailureDescription(userEmail: string, failureReason: string): string {
    return `Email verification failed for ${userEmail} - Reason: ${failureReason}`;
  }

  private generateEmailResendDescription(userEmail: string, resendCount: number): string {
    return `Email verification resend event for ${userEmail} (Resend Count: ${resendCount})`;
  }

  private determineSeverity(action: string, success: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (!success) return 'medium';
    
    if (action.toLowerCase().includes('delete') || 
        action.toLowerCase().includes('suspend') ||
        action.toLowerCase().includes('ban')) {
      return 'critical';
    }
    
    if (action.toLowerCase().includes('approve payment') ||
        action.toLowerCase().includes('reject payment') ||
        action.toLowerCase().includes('admin created')) {
      return 'high';
    }
    
    if (action.toLowerCase().includes('login') ||
        action.toLowerCase().includes('logout') ||
        action.toLowerCase().includes('view')) {
      return 'low';
    }
    
    return 'medium';
  }

  private determineEmailVerificationSeverity(action: string, success: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (!success) return 'medium';
    if (action.includes('failed')) return 'critical';
    return 'low';
  }

  private determineEmailDeliverySeverity(status: string): 'low' | 'medium' | 'high' | 'critical' {
    if (status === 'failed' || status === 'bounced' || status === 'spam') return 'critical';
    if (status === 'pending' || status === 'sent') return 'low';
    return 'medium';
  }

  private determineCategory(action: string): AuditLog['category'] {
    if (action.toLowerCase().includes('payment') || 
        action.toLowerCase().includes('revenue') ||
        action.toLowerCase().includes('financial')) {
      return 'financial';
    }
    
    if (action.toLowerCase().includes('login') || 
        action.toLowerCase().includes('logout') ||
        action.toLowerCase().includes('security') ||
        action.toLowerCase().includes('password')) {
      return 'security';
    }
    
    if (action.toLowerCase().includes('question') ||
        action.toLowerCase().includes('cms') ||
        action.toLowerCase().includes('content')) {
      return 'cms';
    }
    
    if (action.toLowerCase().includes('user') ||
        action.toLowerCase().includes('suspend') ||
        action.toLowerCase().includes('activate')) {
      return 'user';
    }
    
    if (action.toLowerCase().includes('settings') ||
        action.toLowerCase().includes('configuration') ||
        action.toLowerCase().includes('system')) {
      return 'system';
    }
    
    return 'admin';
  }

  // Get audit logs with email verification filtering
  getEmailVerificationAuditLogs(options: {
    userEmail?: string;
    action?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): AuditLog[] {
    try {
      const allLogs = this.getAuditLogs();
      let filteredLogs = allLogs.filter(log => 
        log.action.includes('email-verification') || 
        log.action.includes('email-delivery') ||
        log.action.includes('email-resend')
      );

      // Filter by user email
      if (options.userEmail) {
        filteredLogs = filteredLogs.filter(log => 
          log.performedBy?.toLowerCase() === options.userEmail?.toLowerCase() ||
          log.affectedUser?.toLowerCase() === options.userEmail?.toLowerCase()
        );
      }

      // Filter by action
      if (options.action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.includes(options.action!)
        );
      }

      // Filter by severity
      if (options.severity) {
        filteredLogs = filteredLogs.filter(log => 
          log.severity === options.severity
        );
      }

      // Filter by date range
      if (options.startDate || options.endDate) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          const startDate = options.startDate ? new Date(options.startDate) : null;
          const endDate = options.endDate ? new Date(options.endDate) : null;

          if (startDate && logDate < startDate) return false;
          if (endDate && logDate > endDate) return false;
          return true;
        });
      }

      // Apply limit
      const limit = options.limit || 50;
      return filteredLogs.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting email verification audit logs:', error);
      return [];
    }
  }

  // Get email verification statistics
  getEmailVerificationAuditStatistics(): {
    totalEvents: number;
    eventsToday: number;
    successfulEvents: number;
    failedEvents: number;
    resendEvents: number;
    deliveryEvents: number;
    eventsByAction: Record<string, number>;
    eventsBySeverity: Record<string, number>;
  } {
    try {
      const logs = this.getEmailVerificationAuditLogs({ limit: 1000 });
      const today = new Date().toDateString();

      const eventsToday = logs.filter(log => 
        new Date(log.timestamp).toDateString() === today
      ).length;

      const successfulEvents = logs.filter(log => log.success).length;
      const failedEvents = logs.filter(log => !log.success).length;
      const resendEvents = logs.filter(log => log.action.includes('resend')).length;
      const deliveryEvents = logs.filter(log => log.action.includes('delivery')).length;

      const eventsByAction: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};

      logs.forEach(log => {
        eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
        eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
      });

      return {
        totalEvents: logs.length,
        eventsToday,
        successfulEvents,
        failedEvents,
        resendEvents,
        deliveryEvents,
        eventsByAction,
        eventsBySeverity
      };
    } catch (error) {
      console.error('❌ Error getting email verification audit statistics:', error);
      return {
        totalEvents: 0,
        eventsToday: 0,
        successfulEvents: 0,
        failedEvents: 0,
        resendEvents: 0,
        deliveryEvents: 0,
        eventsByAction: {},
        eventsBySeverity: {}
      };
    }
  }

  // Create comprehensive email verification audit trail
  createEmailVerificationAuditTrail(
    userEmail: string,
    sessionId: string,
    actions: Array<{
      action: string;
      timestamp: string;
      details: Record<string, any>;
      success: boolean;
    }>
  ): void {
    try {
      actions.forEach(action => {
        this.logEmailVerificationAuditTrail(userEmail, action.action, {
          sessionId,
          ...action.details
        });
      });

      console.log(`📋 Email verification audit trail created for ${userEmail} with ${actions.length} actions`);
    } catch (error) {
      console.error('❌ Error creating email verification audit trail:', error);
    }
  }

  // Log email verification security events
  logEmailVerificationSecurityEvent(
    eventType: 'rate-limit-exceeded' | 'fraud-detected' | 'multiple-failures' | 'suspicious-activity',
    userEmail: string,
    details: Record<string, any>
  ): void {
    const severity = eventType === 'fraud-detected' ? 'critical' : 
                    eventType === 'rate-limit-exceeded' ? 'high' : 'medium';

    this.createAuditLog({
      category: 'security',
      severity,
      action: `email-verification-${eventType}`,
      description: this.generateEmailVerificationSecurityDescription(eventType, userEmail, details),
      performedBy: userEmail,
      performedByRole: 'user',
      affectedUser: userEmail,
      success: false,
      metadata: {
        ...details,
        eventType,
        timestamp: new Date().toISOString()
      }
    });

    // Create security alert for critical events
    if (severity === 'critical' || severity === 'high') {
      this.createSecurityAlert({
        type: 'suspicious_activity',
        severity,
        description: `Email verification security event: ${eventType} for ${userEmail}`,
        source: this.getBrowserInfo().ip,
        status: 'active',
        metadata: { userEmail, eventType, ...details }
      });
    }
  }

  // Enhanced audit log cleanup with email verification data
  cleanupEmailVerificationAuditData(daysToKeep: number = 30): { cleaned: number; freedMB: number } {
    try {
      let cleaned = 0;
      let freedBytes = 0;
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Clean up email verification specific audit logs
      const allLogs = this.getAuditLogs();
      const validLogs = allLogs.filter(log => {
        const isEmailVerificationLog = log.action.includes('email-verification') || 
                                     log.action.includes('email-delivery') ||
                                     log.action.includes('email-resend');
        
        if (isEmailVerificationLog) {
          const logDate = new Date(log.timestamp);
          return logDate > cutoffDate;
        }
        
        return true; // Keep non-email verification logs
      });

      if (validLogs.length < allLogs.length) {
        cleaned += allLogs.length - validLogs.length;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validLogs));
      }

      const freedMB = freedBytes / (1024 * 1024);
      console.log(`🧹 Email verification audit data cleanup: ${cleaned} logs removed, ${freedMB.toFixed(3)}MB freed`);

      return { cleaned, freedMB };
    } catch (error) {
      console.error('❌ Error cleaning up email verification audit data:', error);
      return { cleaned: 0, freedMB: 0 };
    }
  }

  private generateEmailVerificationSecurityDescription(eventType: string, userEmail: string, details: Record<string, any>): string {
    switch (eventType) {
      case 'rate-limit-exceeded':
        return `Rate limit exceeded for email verification: ${userEmail}`;
      case 'fraud-detected':
        return `Fraud detected for email verification: ${userEmail} (Score: ${details.fraudScore || 'unknown'})`;
      case 'multiple-failures':
        return `Multiple verification failures for: ${userEmail} (${details.attempts || 0} attempts)`;
      case 'suspicious-activity':
        return `Suspicious activity detected for email verification: ${userEmail}`;
      default:
        return `Email verification security event: ${eventType} for ${userEmail}`;
    }
  }
}

export const AuditService = new AuditServiceClass();