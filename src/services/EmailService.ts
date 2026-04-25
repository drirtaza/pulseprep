import { EmailTemplate, EmailVerificationToken, EmailDeliveryStatus, EmailVerificationSettings } from '../types';

function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const b = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (b) return `${b.replace(/\/$/, '')}${p}`;
  return p;
}

interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
  deliveryStatus?: EmailDeliveryStatus;
  retryCount?: number;
}

interface EmailQueueItem {
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
}

interface EmailDeliveryTracking {
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
}

export class EmailService {
  private static readonly TOKEN_EXPIRY_MINUTES = 15;
  private static readonly MAX_RESEND_ATTEMPTS = 3;
  private static readonly RESEND_COOLDOWN_MINUTES = 5;
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MINUTES = 5;
  private static readonly QUEUE_PROCESSING_INTERVAL = 30000; // 30 seconds

  // Email queue for failed sends and retries
  private static emailQueue: EmailQueueItem[] = [];
  private static deliveryTracking: EmailDeliveryTracking[] = [];
  private static isProcessingQueue = false;

  /**
   * Initialize email service
   */
  static async initialize(): Promise<void> {
    // Start queue processing
    this.startQueueProcessing();
    
    // Clean up expired tracking data
    this.cleanupExpiredTrackingData();
  }



  /**
   * Legacy client-side SMTP (Brevo) was removed. Signup / OTP email is sent by the Vercel API using Resend.
   * This stub remains so any old queue entries fail gracefully.
   */
  private static async sendEmailViaSMTP(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<EmailResult> {
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.trackEmailDelivery(
      emailId,
      to,
      subject,
      EmailDeliveryStatus.FAILED,
      'Client SMTP disabled; use /api/auth/request-signup-otp (Resend) for verification',
      'deprecated'
    );
    return {
      success: false,
      message: 'This path is disabled. Use the server API (Resend) for email.',
      emailId,
      deliveryStatus: EmailDeliveryStatus.FAILED
    };
  }

  /**
   * Enhanced email sending with retry mechanism
   */
  static async sendEmailWithRetry(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ): Promise<EmailResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendEmailViaSMTP(to, subject, htmlContent, textContent);
        
        if (result.success) {
          return result;
        } else {
          lastError = new Error(result.message);
          
          // Don't retry for certain error types
          if (result.message.includes('authentication') || result.message.includes('quota')) {
            break;
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry for certain error types
        if (lastError.message.includes('authentication') || lastError.message.includes('quota')) {
          break;
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      message: `Email sending failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      deliveryStatus: EmailDeliveryStatus.FAILED
    };
  }

  /**
   * Track email delivery status
   */
  private static trackEmailDelivery(
    emailId: string,
    to: string,
    subject: string,
    status: EmailDeliveryStatus,
    errorMessage?: string,
    smtpResponse?: string
  ): void {
    const tracking: EmailDeliveryTracking = {
      emailId,
      to,
      subject,
      status,
      sentAt: status === EmailDeliveryStatus.SENT ? new Date().toISOString() : undefined,
      deliveredAt: status === EmailDeliveryStatus.DELIVERED ? new Date().toISOString() : undefined,
      failedAt: status === EmailDeliveryStatus.FAILED ? new Date().toISOString() : undefined,
      errorMessage,
      retryCount: 0,
      smtpResponse: smtpResponse || (status === EmailDeliveryStatus.SENT ? '250 OK' : undefined),
      createdAt: new Date().toISOString()
    };

    this.deliveryTracking.push(tracking);
    
    // Store in localStorage for persistence
    const existingTracking = JSON.parse(localStorage.getItem('email_delivery_tracking') || '[]');
    existingTracking.push(tracking);
    localStorage.setItem('email_delivery_tracking', JSON.stringify(existingTracking));
  }

  /**
   * Add email to retry queue
   */
  private static addToRetryQueue(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    priority: 'high' | 'normal' | 'low'
  ): void {
    const queueItem: EmailQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to,
      subject,
      htmlContent,
      textContent,
      priority,
      retryCount: 0,
      maxRetries: this.MAX_RETRY_ATTEMPTS,
      createdAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + this.RETRY_DELAY_MINUTES * 60 * 1000).toISOString()
    };

    this.emailQueue.push(queueItem);
    
    // Store queue in localStorage
    const existingQueue = JSON.parse(localStorage.getItem('email_queue') || '[]');
    existingQueue.push(queueItem);
    localStorage.setItem('email_queue', JSON.stringify(existingQueue));
    
    console.log(`📧 Email added to retry queue: ${to}`);
  }

  /**
   * Start queue processing
   */
  private static startQueueProcessing(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    const processQueue = async () => {
      try {
        await this.processEmailQueue();
      } catch (error) {
        console.error('❌ Queue processing error:', error);
      }
      
      // Continue processing
      setTimeout(processQueue, this.QUEUE_PROCESSING_INTERVAL);
    };
    
    // Start processing
    setTimeout(processQueue, this.QUEUE_PROCESSING_INTERVAL);
  }

  /**
   * Process email queue
   */
  private static async processEmailQueue(): Promise<void> {
    const now = new Date();
    const queueToProcess = this.emailQueue.filter(item => 
      !item.scheduledFor || new Date(item.scheduledFor) <= now
    );

    for (const item of queueToProcess) {
      try {
        if (item.retryCount >= item.maxRetries) {
          // Mark as permanently failed
          this.trackEmailDelivery(
            item.id,
            item.to,
            item.subject,
            EmailDeliveryStatus.FAILED,
            'Max retry attempts exceeded'
          );
          
          // Remove from queue
          this.removeFromQueue(item.id);
          continue;
        }

        // Attempt to send
        const result = await this.sendEmailViaSMTP(
          item.to,
          item.subject,
          item.htmlContent,
          item.textContent,
          item.priority
        );

        if (result.success) {
          // Remove from queue on success
          this.removeFromQueue(item.id);
        } else {
          // Increment retry count and reschedule
          item.retryCount++;
          item.scheduledFor = new Date(
            Date.now() + (this.RETRY_DELAY_MINUTES * item.retryCount) * 60 * 1000
          ).toISOString();
          
          // Update queue
          this.updateQueueItem(item);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process queue item ${item.id}:`, error);
        item.retryCount++;
        this.updateQueueItem(item);
      }
    }
  }

  /**
   * Remove item from queue
   */
  private static removeFromQueue(itemId: string): void {
    this.emailQueue = this.emailQueue.filter(item => item.id !== itemId);
    
    // Update localStorage
    const existingQueue = JSON.parse(localStorage.getItem('email_queue') || '[]');
    const updatedQueue = existingQueue.filter((item: EmailQueueItem) => item.id !== itemId);
    localStorage.setItem('email_queue', JSON.stringify(updatedQueue));
  }

  /**
   * Update queue item
   */
  private static updateQueueItem(updatedItem: EmailQueueItem): void {
    this.emailQueue = this.emailQueue.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    // Update localStorage
    const existingQueue = JSON.parse(localStorage.getItem('email_queue') || '[]');
    const updatedQueue = existingQueue.map((item: EmailQueueItem) => 
      item.id === updatedItem.id ? updatedItem : item
    );
    localStorage.setItem('email_queue', JSON.stringify(updatedQueue));
  }

  /**
   * Clean up expired tracking data
   */
  private static cleanupExpiredTrackingData(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    this.deliveryTracking = this.deliveryTracking.filter(tracking => 
      new Date(tracking.sentAt || tracking.failedAt || tracking.createdAt) > thirtyDaysAgo
    );
    
    // Update localStorage
    localStorage.setItem('email_delivery_tracking', JSON.stringify(this.deliveryTracking));
  }

  /**
   * Get email delivery statistics
   */
  static getEmailDeliveryStats(): {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const stats = {
      total: this.deliveryTracking.length,
      sent: this.deliveryTracking.filter(t => t.status === EmailDeliveryStatus.SENT).length,
      delivered: this.deliveryTracking.filter(t => t.status === EmailDeliveryStatus.DELIVERED).length,
      failed: this.deliveryTracking.filter(t => t.status === EmailDeliveryStatus.FAILED).length,
      pending: this.deliveryTracking.filter(t => t.status === EmailDeliveryStatus.PENDING).length,
      successRate: 0
    };
    
    if (stats.total > 0) {
      stats.successRate = ((stats.sent + stats.delivered) / stats.total) * 100;
    }
    
    return stats;
  }

  /**
   * Get queue status
   */
  static getQueueStatus(): {
    totalItems: number;
    pendingItems: number;
    retryItems: number;
    highPriorityItems: number;
  } {
    return {
      totalItems: this.emailQueue.length,
      pendingItems: this.emailQueue.filter(item => item.retryCount === 0).length,
      retryItems: this.emailQueue.filter(item => item.retryCount > 0).length,
      highPriorityItems: this.emailQueue.filter(item => item.priority === 'high').length
    };
  }

  /**
   * Generate a secure verification token
   */
  private static generateSecureToken(): string {
    const tokenBuffer = new Uint8Array(32);
    crypto.getRandomValues(tokenBuffer);
    return Array.from(tokenBuffer, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create email verification token
   */
  static async createEmailVerificationToken(email: string): Promise<EmailVerificationToken> {
    const token = this.generateSecureToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const verificationToken: EmailVerificationToken = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      token,
      email: email.toLowerCase().trim(),
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      used: false,
      attempts: 0,
      ipAddress: '127.0.0.1', // Would be real IP in production
      userAgent: navigator.userAgent
    };

    // Store token in localStorage (in production, this would be server-side)
    const existingTokens = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
    
    // Remove any existing tokens for this email
    const filteredTokens = existingTokens.filter((t: EmailVerificationToken) => 
      t.email !== email.toLowerCase().trim()
    );
    
    filteredTokens.push(verificationToken);
    localStorage.setItem('email_verification_tokens', JSON.stringify(filteredTokens));

    console.log('🔐 Email verification token created:', {
      email: verificationToken.email,
      expiresAt: verificationToken.expiresAt,
      tokenLength: verificationToken.token.length
    });

    return verificationToken;
  }

  /**
   * Validate email verification token
   */
  static validateEmailVerificationToken(token: string): EmailVerificationToken | null {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const verificationToken = tokens.find(t => t.token === token && !t.used);

      if (!verificationToken) {
        return null;
      }

      // Check if token has expired
      if (new Date() > new Date(verificationToken.expiresAt)) {
        console.log('❌ Email verification token expired:', verificationToken.email);
        return null;
      }

      return verificationToken;
    } catch (error) {
      console.error('❌ Error validating email verification token:', error);
      return null;
    }
  }

  /**
   * Mark email verification token as used
   */
  static useEmailVerificationToken(token: string): boolean {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const tokenIndex = tokens.findIndex(t => t.token === token);

      if (tokenIndex === -1) {
        return false;
      }

      tokens[tokenIndex].used = true;
      localStorage.setItem('email_verification_tokens', JSON.stringify(tokens));

      console.log('✅ Email verification token used:', tokens[tokenIndex].email);
      return true;
    } catch (error) {
      console.error('❌ Error using email verification token:', error);
      return false;
    }
  }

  /**
   * Send signup OTP (Resend via Vercel `/api/auth/request-signup-otp`)
   */
  static async sendVerificationEmail(email: string, name: string): Promise<EmailResult> {
    return EmailService.requestSignupOtpApi(email, name, false);
  }

  /**
   * Resend signup OTP; rate limits enforced on the server.
   */
  static async resendVerificationEmail(email: string, name: string): Promise<EmailResult> {
    return EmailService.requestSignupOtpApi(email, name, true);
  }

  private static async requestSignupOtpApi(
    email: string,
    name: string,
    resend: boolean
  ): Promise<EmailResult> {
    try {
      const r = await fetch(apiPath('/api/auth/request-signup-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name || 'User',
          resend
        })
      });
      const data = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
        retryAfterSec?: number;
      };
      if (!r.ok) {
        const msg = data.error || r.statusText || 'Failed to send verification code';
        return {
          success: false,
          message: msg,
          deliveryStatus: EmailDeliveryStatus.FAILED
        };
      }
      return {
        success: true,
        message: data.message || 'Verification code sent',
        emailId: `otp-${Date.now()}`,
        deliveryStatus: EmailDeliveryStatus.SENT
      };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Network error',
        deliveryStatus: EmailDeliveryStatus.FAILED
      };
    }
  }

  /**
   * Verify 6-digit OTP (server checks hash in Supabase; no secrets on the client)
   */
  static async verifySignupOtp(
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string; verificationToken?: string }> {
    try {
      const r = await fetch(apiPath('/api/auth/verify-signup-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code.replace(/\D/g, '')
        })
      });
      const data = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        verificationToken?: string;
      };
      if (!r.ok) {
        return { success: false, message: data.error || 'Verification failed' };
      }
      if (!data.ok) {
        return { success: false, message: data.error || 'Verification failed' };
      }
      return {
        success: true,
        message: 'Email verified',
        verificationToken: data.verificationToken
      };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Network error' };
    }
  }

  /**
   * Check if user can resend verification email
   */
  static canResendVerificationEmail(_email: string): {
    allowed: boolean;
    reason?: string;
    waitTimeMinutes?: number;
    attemptsRemaining?: number;
  } {
    // Cooldowns and max resends are enforced by `/api/auth/request-signup-otp` (server).
    return { allowed: true, attemptsRemaining: this.MAX_RESEND_ATTEMPTS };
  }

  /**
   * Get resend statistics for an email
   */
  static getResendStatistics(email: string): {
    totalAttempts: number;
    successfulResends: number;
    failedResends: number;
    lastResendAt?: string;
    cooldownActive: boolean;
    remainingAttempts: number;
  } {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const userTokens = tokens.filter(t => t.email === email.toLowerCase().trim());
      
      const totalAttempts = userTokens.reduce((sum, token) => sum + (token.attempts || 0), 0);
      const successfulResends = userTokens.filter(t => t.lastResendAt && !t.used).length;
      const failedResends = totalAttempts - successfulResends;
      
      const latestToken = userTokens
        .filter(t => t.lastResendAt)
        .sort((a, b) => new Date(b.lastResendAt!).getTime() - new Date(a.lastResendAt!).getTime())[0];
      
      const cooldownActive = latestToken?.lastResendAt ? 
        (new Date().getTime() - new Date(latestToken.lastResendAt).getTime()) < (this.RESEND_COOLDOWN_MINUTES * 60 * 1000) : false;
      
      const remainingAttempts = Math.max(0, this.MAX_RESEND_ATTEMPTS - totalAttempts);
      
      return {
        totalAttempts,
        successfulResends,
        failedResends,
        lastResendAt: latestToken?.lastResendAt,
        cooldownActive,
        remainingAttempts
      };
    } catch (error) {
      console.error('❌ Error getting resend statistics:', error);
      return {
        totalAttempts: 0,
        successfulResends: 0,
        failedResends: 0,
        cooldownActive: false,
        remainingAttempts: this.MAX_RESEND_ATTEMPTS
      };
    }
  }

  /**
   * Reset resend attempts for an email (admin function)
   */
  static async resetResendAttempts(email: string): Promise<boolean> {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const userTokens = tokens.filter(t => t.email === email.toLowerCase().trim());
      
      userTokens.forEach(token => {
        token.attempts = 0;
        token.lastResendAt = undefined;
      });
      
      localStorage.setItem('email_verification_tokens', JSON.stringify(tokens));
      
      // Log reset event
      try {
        const { AuditService } = await import('./AuditService');
        AuditService.logEmailVerificationEvent('email-verification-resend', email, true, {
          action: 'reset_attempts',
          previousAttempts: userTokens.reduce((sum, t) => sum + (t.attempts || 0), 0)
        });
      } catch (auditError) {
        console.error('❌ Failed to log reset event:', auditError);
      }
      
      console.log(`✅ Reset resend attempts for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error resetting resend attempts:', error);
      return false;
    }
  }

  /**
   * Clean up expired verification tokens
   */
  static cleanupExpiredVerificationTokens(): void {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const now = new Date();
      
      const validTokens = tokens.filter(token => 
        new Date(token.expiresAt) > now && !token.used
      );

      localStorage.setItem('email_verification_tokens', JSON.stringify(validTokens));
      console.log('🧹 Cleaned up expired email verification tokens');
    } catch (error) {
      console.error('❌ Failed to cleanup expired verification tokens:', error);
    }
  }

  /**
   * Get email verification settings
   */
  static getEmailVerificationSettings(): EmailVerificationSettings {
    try {
      const settings = localStorage.getItem('email_verification_settings');
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Return default settings
      return {
        tokenExpiryMinutes: this.TOKEN_EXPIRY_MINUTES,
        maxResendAttempts: this.MAX_RESEND_ATTEMPTS,
        resendCooldownMinutes: this.RESEND_COOLDOWN_MINUTES,
        requireEmailVerification: true,
        autoVerifyInDevelopment: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
    } catch (error) {
      console.error('❌ Failed to get email verification settings:', error);
      return {
        tokenExpiryMinutes: this.TOKEN_EXPIRY_MINUTES,
        maxResendAttempts: this.MAX_RESEND_ATTEMPTS,
        resendCooldownMinutes: this.RESEND_COOLDOWN_MINUTES,
        requireEmailVerification: true,
        autoVerifyInDevelopment: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(
    email: string, 
    name: string, 
    specialty: string
  ): Promise<EmailResult> {
    try {
      // In production, this would send a real email via SMTP/API
      // For now, we'll simulate email sending and store in localStorage
      
      const emailData = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: email,
        subject: `Welcome to PulsePrep - Your ${specialty} Journey Begins!`,
        type: 'welcome',
        content: `Dear ${name}, welcome to PulsePrep! Your account has been created successfully.`,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };

      // Store sent email (for testing/development)
      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      sentEmails.unshift(emailData);
      localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(0, 100))); // Keep last 100

      console.log('📧 Welcome email sent:', emailData);
      
      return {
        success: true,
        message: 'Welcome email sent successfully',
        emailId: emailData.id
      };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return {
        success: false,
        message: 'Failed to send welcome email'
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<EmailResult> {
    try {

      
      const emailData = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: email,
        subject: 'PulsePrep - Password Reset Request',
        type: 'password-reset',
        content: `Dear ${name}, 
        
We received a request to reset your password. Please use the following code to reset your password:

Reset Code: ${resetToken}

This code will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
PulsePrep Team`,
        sentAt: new Date().toISOString(),
        status: 'sent',
        resetToken: resetToken.substring(0, 8) + '...' // Store partial token for logging
      };

      // Store sent email
      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      sentEmails.unshift(emailData);
      localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(0, 100)));

      console.log('📧 Password reset email sent:', emailData);
      
      // In development, also show the reset code in console
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Reset Code (DEV ONLY):', resetToken);
        
        // Show in alert for easy testing
        alert(`Password Reset Code (Development Mode): ${resetToken}`);
      }
      
      return {
        success: true,
        message: 'Password reset email sent successfully',
        emailId: emailData.id
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return {
        success: false,
        message: 'Failed to send password reset email'
      };
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmationEmail(
    email: string,
    name: string
  ): Promise<EmailResult> {
    try {
      const emailData = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: email,
        subject: 'PulsePrep - Password Reset Successful',
        type: 'password-reset-confirmation',
        content: `Dear ${name},

Your password has been successfully reset. You can now sign in to your PulsePrep account using your new password.

If you didn't reset your password, please contact our support team immediately.

Best regards,
PulsePrep Team`,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };

      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      sentEmails.unshift(emailData);
      localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(0, 100)));

      console.log('📧 Password reset confirmation email sent:', emailData);
      
      return {
        success: true,
        message: 'Password reset confirmation email sent successfully',
        emailId: emailData.id
      };
    } catch (error) {
      console.error('❌ Failed to send password reset confirmation email:', error);
      return {
        success: false,
        message: 'Failed to send password reset confirmation email'
      };
    }
  }

  /**
   * Send account suspension notification
   */
  static async sendAccountSuspensionEmail(
    email: string,
    name: string,
    reason: string
  ): Promise<EmailResult> {
    try {
      const emailData = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: email,
        subject: 'PulsePrep - Account Suspended',
        type: 'account-suspension',
        content: `Dear ${name},

Your PulsePrep account has been temporarily suspended.

Reason: ${reason}

If you believe this is an error or would like to appeal this decision, please contact our support team:
- Email: support@pulseprep.com
- Phone: +92-300-PULSE-00

Best regards,
PulsePrep Team`,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };

      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      sentEmails.unshift(emailData);
      localStorage.setItem('sent_emails', JSON.stringify(sentEmails.slice(0, 100)));

      console.log('📧 Account suspension email sent:', emailData);
      
      return {
        success: true,
        message: 'Account suspension email sent successfully',
        emailId: emailData.id
      };
    } catch (error) {
      console.error('❌ Failed to send account suspension email:', error);
      return {
        success: false,
        message: 'Failed to send account suspension email'
      };
    }
  }

  /**
   * Get sent emails (for testing/admin purposes)
   */
  static getSentEmails(limit: number = 50): any[] {
    try {
      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      return sentEmails.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get sent emails:', error);
      return [];
    }
  }

  /**
   * Validate email template
   */
  static validateEmailTemplate(template: EmailTemplate): boolean {
    if (!template.subject || !template.htmlContent || !template.textContent) {
      return false;
    }

    // Check for required variables
    const requiredVars = ['{{name}}', '{{email}}'];
    const hasRequiredVars = requiredVars.every(v => 
      template.htmlContent.includes(v) || template.textContent.includes(v)
    );

    return hasRequiredVars;
  }
}