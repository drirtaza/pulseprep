import { securityService } from './SecurityService';
import { EmailVerificationToken } from '../types';

export interface PasswordStrengthResult {
  score: number; // 0-4 (0=very weak, 4=very strong)
  isValid: boolean;
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonWords: boolean;
  };
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  used: boolean;
}

class PasswordService {
  private readonly SALT_LENGTH = 16;
  private readonly HASH_ITERATIONS = 100000;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MAX_PASSWORD_LENGTH = 128;
  
  // Email verification token settings
  private readonly EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;
  private readonly EMAIL_VERIFICATION_MAX_ATTEMPTS = 3;
  private readonly EMAIL_VERIFICATION_RESEND_COOLDOWN_MINUTES = 5;
  private readonly EMAIL_VERIFICATION_RATE_LIMIT_WINDOW_MINUTES = 60;
  private readonly EMAIL_VERIFICATION_MAX_TOKENS_PER_WINDOW = 5;
  
  // Common weak passwords to check against
  private readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou',
    'princess', 'dragon', 'sunshine', 'master', 'shadow', 'lovely',
    'football', 'baseball', 'freedom', 'whatever', 'jordan', 'superman'
  ];

  /**
   * Generate a cryptographically secure salt
   */
  private async generateSalt(): Promise<string> {
    const saltBuffer = new Uint8Array(this.SALT_LENGTH);
    crypto.getRandomValues(saltBuffer);
    return Array.from(saltBuffer, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash a password using PBKDF2 with salt
   */
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    try {
      const salt = await this.generateSalt();
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = encoder.encode(salt);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Derive hash using PBKDF2
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: this.HASH_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 32 bytes
      );

      const hashArray = new Uint8Array(hashBuffer);
      const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');

      return { hash, salt };
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify a password against its hash and salt
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = encoder.encode(salt);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Derive hash using same parameters
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: this.HASH_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const newHashArray = new Uint8Array(hashBuffer);
      const newHash = Array.from(newHashArray, byte => byte.toString(16).padStart(2, '0')).join('');

      return newHash === hash;
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      return false;
    }
  }

  /**
   * Check password strength and requirements
   */
  checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Check requirements
    const requirements = {
      minLength: password.length >= this.MIN_PASSWORD_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{}|;':".,<>?]/.test(password),
      noCommonWords: !this.COMMON_PASSWORDS.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      )
    };

    // Length check
    if (!requirements.minLength) {
      feedback.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    } else if (password.length >= 12) {
      score += 1;
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      feedback.push(`Password must be no more than ${this.MAX_PASSWORD_LENGTH} characters long`);
      return {
        score: 0,
        isValid: false,
        feedback,
        requirements
      };
    }

    // Character type checks
    if (!requirements.hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!requirements.hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!requirements.hasNumbers) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!requirements.hasSpecialChars) {
      feedback.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;\':".,<>?)');
    } else {
      score += 1;
    }

    // Common password check
    if (!requirements.noCommonWords) {
      feedback.push('Password contains common words that are easily guessed');
      score = Math.max(0, score - 2);
    }

    // Additional strength checks
    if (password.length >= 16) {
      score += 1;
    }

    // Check for patterns
    if (this.hasRepeatingPatterns(password)) {
      feedback.push('Password contains repeating patterns');
      score = Math.max(0, score - 1);
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      feedback.push('Password contains sequential characters');
      score = Math.max(0, score - 1);
    }

    // Cap score at 4
    score = Math.min(4, score);

    const isValid = Object.values(requirements).every(req => req) && score >= 2;

    if (isValid && feedback.length === 0) {
      feedback.push('Password meets all security requirements');
    }

    return {
      score,
      isValid,
      feedback,
      requirements
    };
  }

  /**
   * Check for repeating patterns in password
   */
  private hasRepeatingPatterns(password: string): boolean {
    // Check for repeated characters (more than 2 in a row)
    if (/(.)\1{2,}/.test(password)) {
      return true;
    }

    // Check for repeated substrings
    for (let i = 0; i < password.length - 2; i++) {
      for (let len = 2; len <= Math.floor(password.length / 2); len++) {
        const substring = password.substring(i, i + len);
        const regex = new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = password.match(regex);
        if (matches && matches.length > 1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for sequential characters in password
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        if (password.includes(substr) || password.includes(substr.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate a secure password reset token
   */
  async generateResetToken(email: string): Promise<PasswordResetToken> {
    try {
      // Generate cryptographically secure token
      const tokenBuffer = new Uint8Array(32);
      crypto.getRandomValues(tokenBuffer);
      const token = Array.from(tokenBuffer, byte => byte.toString(16).padStart(2, '0')).join('');

      const resetToken: PasswordResetToken = {
        token,
        email: email.toLowerCase().trim(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        createdAt: new Date().toISOString(),
        used: false
      };

      // Store token in localStorage (in production, this would be server-side)
      const existingTokens = JSON.parse(localStorage.getItem('password_reset_tokens') || '[]');
      
      // Remove any existing tokens for this email
      const filteredTokens = existingTokens.filter((t: PasswordResetToken) => 
        t.email !== email.toLowerCase().trim()
      );
      
      filteredTokens.push(resetToken);
      localStorage.setItem('password_reset_tokens', JSON.stringify(filteredTokens));

      // Log security event
      securityService.logSecurityEvent({
        type: 'password-reset',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1', // Would be real IP in production
        userAgent: navigator.userAgent,
        details: {
          action: 'password_reset_requested',
          email: email,
          tokenGenerated: true
        },
        severity: 'medium'
      });

      return resetToken;
    } catch (error) {
      console.error('❌ Reset token generation failed:', error);
      throw new Error('Failed to generate reset token');
    }
  }

  /**
   * Verify and use a password reset token
   */
  verifyResetToken(token: string): PasswordResetToken | null {
    try {
      const tokens: PasswordResetToken[] = JSON.parse(localStorage.getItem('password_reset_tokens') || '[]');
      const resetToken = tokens.find(t => t.token === token && !t.used);

      if (!resetToken) {
        return null;
      }

      // Check if token has expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return null;
      }

      return resetToken;
    } catch (error) {
      console.error('❌ Reset token verification failed:', error);
      return null;
    }
  }

  /**
   * Mark a reset token as used
   */
  useResetToken(token: string): boolean {
    try {
      const tokens: PasswordResetToken[] = JSON.parse(localStorage.getItem('password_reset_tokens') || '[]');
      const tokenIndex = tokens.findIndex(t => t.token === token);

      if (tokenIndex === -1) {
        return false;
      }

      tokens[tokenIndex].used = true;
      localStorage.setItem('password_reset_tokens', JSON.stringify(tokens));

      // Log security event
      securityService.logSecurityEvent({
        type: 'password-reset',
        userId: tokens[tokenIndex].email,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        details: {
          action: 'password_reset_completed',
          email: tokens[tokenIndex].email,
          tokenUsed: token.substring(0, 8) + '...'
        },
        severity: 'medium'
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to mark reset token as used:', error);
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    try {
      const tokens: PasswordResetToken[] = JSON.parse(localStorage.getItem('password_reset_tokens') || '[]');
      const now = new Date();
      
      const validTokens = tokens.filter(token => 
        new Date(token.expiresAt) > now && !token.used
      );

      localStorage.setItem('password_reset_tokens', JSON.stringify(validTokens));
    } catch (error) {
      console.error('❌ Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Generate email verification token with rate limiting
   */
  async generateEmailVerificationToken(email: string): Promise<EmailVerificationToken> {
    try {
      // Check rate limiting
      const rateLimitResult = this.checkEmailVerificationRateLimit(email);
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Please wait ${rateLimitResult.waitMinutes} minutes before requesting another verification email.`);
      }

      // Generate cryptographically secure token
      const tokenBuffer = new Uint8Array(32);
      crypto.getRandomValues(tokenBuffer);
      const token = Array.from(tokenBuffer, byte => byte.toString(16).padStart(2, '0')).join('');

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);

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

      // Log security event
      securityService.logSecurityEvent({
        type: 'login',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1', // Would be real IP in production
        userAgent: navigator.userAgent,
        details: {
          action: 'email_verification_token_generated',
          email: email,
          tokenGenerated: true,
          expiresAt: expiresAt.toISOString()
        },
        severity: 'low'
      });

      console.log('🔐 Email verification token generated:', {
        email: verificationToken.email,
        expiresAt: verificationToken.expiresAt,
        tokenLength: verificationToken.token.length
      });

      return verificationToken;
    } catch (error) {
      console.error('❌ Failed to generate email verification token:', error);
      throw error;
    }
  }

  /**
   * Validate email verification token
   */
  validateEmailVerificationToken(token: string): EmailVerificationToken | null {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const verificationToken = tokens.find(t => t.token === token && !t.used);

      if (!verificationToken) {
        console.log('❌ Email verification token not found or already used');
        return null;
      }

      // Check if token has expired
      if (new Date() > new Date(verificationToken.expiresAt)) {
        console.log('❌ Email verification token expired:', verificationToken.email);
        return null;
      }

      // Update attempts count
      verificationToken.attempts += 1;
      const tokenIndex = tokens.findIndex(t => t.id === verificationToken.id);
      if (tokenIndex !== -1) {
        tokens[tokenIndex] = verificationToken;
        localStorage.setItem('email_verification_tokens', JSON.stringify(tokens));
      }

      console.log('✅ Email verification token validated:', {
        email: verificationToken.email,
        attempts: verificationToken.attempts
      });

      return verificationToken;
    } catch (error) {
      console.error('❌ Error validating email verification token:', error);
      return null;
    }
  }

  /**
   * Mark email verification token as used
   */
  useEmailVerificationToken(token: string): boolean {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const tokenIndex = tokens.findIndex(t => t.token === token);

      if (tokenIndex === -1) {
        return false;
      }

      tokens[tokenIndex].used = true;
      localStorage.setItem('email_verification_tokens', JSON.stringify(tokens));

      // Log security event
      securityService.logSecurityEvent({
        type: 'login',
        userId: tokens[tokenIndex].email,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1', // Would be real IP in production
        userAgent: navigator.userAgent,
        details: {
          action: 'email_verification_completed',
          email: tokens[tokenIndex].email,
          tokenUsed: token.substring(0, 8) + '...'
        },
        severity: 'low'
      });

      console.log('✅ Email verification token used:', tokens[tokenIndex].email);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark email verification token as used:', error);
      return false;
    }
  }

  /**
   * Clean up expired email verification tokens
   */
  cleanupExpiredVerificationTokens(): void {
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
   * Check rate limiting for email verification tokens
   */
  private checkEmailVerificationRateLimit(email: string): { allowed: boolean; waitMinutes?: number } {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.EMAIL_VERIFICATION_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

      // Count tokens generated for this email in the rate limit window
      const recentTokens = tokens.filter(token => 
        token.email === email.toLowerCase().trim() &&
        new Date(token.createdAt) > windowStart
      );

      if (recentTokens.length >= this.EMAIL_VERIFICATION_MAX_TOKENS_PER_WINDOW) {
        const oldestToken = recentTokens.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        
        const waitTime = this.EMAIL_VERIFICATION_RATE_LIMIT_WINDOW_MINUTES - 
          Math.floor((now.getTime() - new Date(oldestToken.createdAt).getTime()) / (60 * 1000));
        
        return {
          allowed: false,
          waitMinutes: Math.max(1, waitTime)
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('❌ Error checking email verification rate limit:', error);
      return { allowed: true }; // Allow if error occurs
    }
  }

  /**
   * Check if email verification token can be resent
   */
  canResendEmailVerificationToken(email: string): { allowed: boolean; waitMinutes?: number; reason?: string } {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const existingToken = tokens.find(t => t.email === email.toLowerCase().trim() && !t.used);

      if (!existingToken) {
        return { allowed: true }; // No existing token, can generate new one
      }

      // Check if token has expired
      if (new Date() > new Date(existingToken.expiresAt)) {
        return { allowed: true }; // Token expired, can generate new one
      }

      // Check if within cooldown period
      if (existingToken.lastResendAt) {
        const lastResend = new Date(existingToken.lastResendAt);
        const now = new Date();
        const cooldownMs = this.EMAIL_VERIFICATION_RESEND_COOLDOWN_MINUTES * 60 * 1000;
        
        if (now.getTime() - lastResend.getTime() < cooldownMs) {
          const waitMinutes = Math.ceil((cooldownMs - (now.getTime() - lastResend.getTime())) / 60000);
          return {
            allowed: false,
            waitMinutes,
            reason: 'Resend cooldown period'
          };
        }
      }

      // Check if exceeded max attempts
      if (existingToken.attempts >= this.EMAIL_VERIFICATION_MAX_ATTEMPTS) {
        return {
          allowed: false,
          reason: 'Maximum resend attempts exceeded'
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('❌ Error checking email verification resend:', error);
      return { allowed: true }; // Allow if error occurs
    }
  }

  /**
   * Get email verification token statistics
   */
  getEmailVerificationTokenStats(): {
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    usedTokens: number;
    rateLimitedEmails: number;
  } {
    try {
      const tokens: EmailVerificationToken[] = JSON.parse(localStorage.getItem('email_verification_tokens') || '[]');
      const now = new Date();

      const stats = {
        totalTokens: tokens.length,
        activeTokens: tokens.filter(t => !t.used && new Date(t.expiresAt) > now).length,
        expiredTokens: tokens.filter(t => new Date(t.expiresAt) <= now).length,
        usedTokens: tokens.filter(t => t.used).length,
        rateLimitedEmails: 0
      };

      // Count rate limited emails
      const emailCounts = tokens.reduce((acc, token) => {
        acc[token.email] = (acc[token.email] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.rateLimitedEmails = Object.values(emailCounts).filter(count => count >= this.EMAIL_VERIFICATION_MAX_TOKENS_PER_WINDOW).length;

      return stats;
    } catch (error) {
      console.error('❌ Error getting email verification token stats:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        usedTokens: 0,
        rateLimitedEmails: 0
      };
    }
  }

  /**
   * Get password strength color and label
   */
  getPasswordStrengthDisplay(score: number): { color: string; label: string; className: string } {
    switch (score) {
      case 0:
        return { color: '#dc2626', label: 'Very Weak', className: 'text-red-600' };
      case 1:
        return { color: '#ea580c', label: 'Weak', className: 'text-orange-600' };
      case 2:
        return { color: '#ca8a04', label: 'Fair', className: 'text-yellow-600' };
      case 3:
        return { color: '#16a34a', label: 'Good', className: 'text-green-600' };
      case 4:
        return { color: '#059669', label: 'Excellent', className: 'text-emerald-600' };
      default:
        return { color: '#6b7280', label: 'Unknown', className: 'text-gray-500' };
    }
  }

  /**
   * Add password to user's password history (for preventing reuse)
   */
  async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      const historyKey = `password_history_${userId}`;
      const history: string[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Keep last 5 passwords
      history.unshift(passwordHash);
      if (history.length > 5) {
        history.splice(5);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('❌ Failed to add password to history:', error);
    }
  }

  /**
   * Check if password was used recently
   */
  async checkPasswordHistory(userId: string, password: string): Promise<boolean> {
    try {
      const historyKey = `password_history_${userId}`;
      const history: string[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Check against recent passwords
      for (const oldHash of history) {
        // In a real implementation, you'd need to store salt with hash
        // For now, we'll do a simple check
        const hashedPassword = await this.hashPassword(password);
        if (hashedPassword.hash === oldHash) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check password history:', error);
      return false;
    }
  }
}

export const passwordService = new PasswordService();