import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Activity,
  Mail,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react';
import { PageType, SignUpFormData } from '../types';
import { EmailService } from '../services/EmailService';

interface EmailVerificationPageProps {
  onNavigate: (page: PageType) => void;
  onStepComplete: (stepData: any, nextPage: PageType) => void;
  formData: SignUpFormData | null;
}

interface EmailStatus {
  sent: boolean;
  delivered: boolean;
  failed: boolean;
  errorMessage?: string;
  emailId?: string;
}

const EmailVerificationPage = ({ onNavigate, onStepComplete, formData }: EmailVerificationPageProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({
    sent: false,
    delivered: false,
    failed: false
  });
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendEligibility, setResendEligibility] = useState<{
    allowed: boolean;
    reason?: string;
    waitTimeMinutes?: number;
    attemptsRemaining?: number;
  }>({ allowed: true, attemptsRemaining: 3 });
  
  // Error handling and recovery states
  const [errorType, setErrorType] = useState<'network' | 'timeout' | 'rate_limit' | 'token_expired' | 'max_attempts' | 'server_error' | 'unknown'>('unknown');
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [autoRetryEnabled] = useState(true);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load step data
  const step1Data = JSON.parse(sessionStorage.getItem('signup_step1') || '{}');
  const userEmail = formData?.email || step1Data?.email || 'user@example.com';
  const userName = formData?.fullName?.split(' ')[0] || step1Data?.fullName?.split(' ')[0] || 'User';

  const steps = [
    { step: 0, title: 'Choose Specialty', active: false, completed: true },
    { step: 1, title: 'Account Details', active: false, completed: true },
    { step: 2, title: 'Email Verification', active: true, completed: false },
    { step: 3, title: 'Payment', active: false, completed: false },
    { step: 4, title: 'Complete', active: false, completed: false }
  ];

  // Initialize email service
  useEffect(() => {
    EmailService.initialize();
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        if (timeLeft <= 1) {
          setIsTokenExpired(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
      setIsTokenExpired(true);
    }
  }, [timeLeft, canResend]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check resend eligibility periodically
  useEffect(() => {
    const checkEligibility = () => {
      const eligibility = EmailService.canResendVerificationEmail(userEmail);
      setResendEligibility(eligibility);
      
      if (eligibility.waitTimeMinutes) {
        setResendCooldown(eligibility.waitTimeMinutes * 60);
      }
    };

    // Check immediately
    checkEligibility();

    // Check every 30 seconds
    const interval = setInterval(checkEligibility, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Get resend statistics
  useEffect(() => {
    const stats = EmailService.getResendStatistics(userEmail);
    setResendAttempts(stats.totalAttempts);
  }, [userEmail]);

  // Focus first input on mount
  useEffect(() => {
    const firstInput = otpRefs.current[0];
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  // Send initial verification email
  const sendInitialEmail = async () => {
    setIsSendingEmail(true);
    setError('');
    
    try {
      const result = await EmailService.sendVerificationEmail(userEmail, userName);
      
      if (result.success) {
        setEmailStatus({
          sent: true,
          delivered: result.deliveryStatus === 'delivered',
          failed: false,
          emailId: result.emailId
        });
        setSuccess('Verification email sent successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setEmailStatus({
          sent: false,
          delivered: false,
          failed: true,
          errorMessage: result.message
        });
        await handleError(new Error(result.message), 'send_email');
      }
    } catch (err) {
      setEmailStatus({
        sent: false,
        delivered: false,
        failed: true,
        errorMessage: err instanceof Error ? err.message : 'Unknown error'
      });
      await handleError(err as Error, 'send_email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send code only if sign-up did not already request it (avoids double-send)
  useEffect(() => {
    const key = 'pulseprep_signup_otp_sent';
    const norm = (userEmail || '').toLowerCase().trim();
    if (norm && sessionStorage.getItem(key) === norm) {
      setEmailStatus({ sent: true, delivered: true, failed: false });
      return;
    }
    if (!emailStatus.sent && !isSendingEmail) {
      void sendInitialEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when identity changes
  }, [userEmail, userName]);

  // OTP Input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error when user types
    
    // Auto-focus next field
    if (value && index < 5) {
      const nextInput = otpRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Auto-submit when complete
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = otpRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < Math.min(digits.length, 6); i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      
      // Focus next empty field or verify if complete
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        const nextInput = otpRefs.current[nextEmptyIndex];
        if (nextInput) {
          nextInput.focus();
        }
      } else if (newOtp.every(digit => digit !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  // Real OTP Verification
  const handleVerifyOtp = async (otpValue: string) => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    setError('');
    setSuccess('');
    
    try {
      // Check for maximum verification attempts
      if (verificationAttempts >= 5) {
        throw new Error('Too many verification attempts. Please request a new code.');
      }

      // Check if token is expired
      if (isTokenExpired) {
        throw new Error('Verification code has expired. Please request a new one.');
      }

      const result = await EmailService.verifySignupOtp(userEmail, otpValue);
      if (!result.success) {
        setVerificationAttempts((prev) => prev + 1);
        throw new Error(result.message || 'Invalid code');
      }

      if (result.verificationToken) {
        sessionStorage.setItem('pulseprep_email_verification_jwt', result.verificationToken);
        sessionStorage.setItem('pulseprep_signup_email_verified', (userEmail || '').toLowerCase().trim());
      }
      sessionStorage.removeItem('pulseprep_signup_otp_sent');

      // Log successful verification
      try {
        const { AuditService } = await import('../services/AuditService');
        AuditService.logEmailVerificationEvent('email-verification-success', userEmail, true, {
          attempts: verificationAttempts + 1
        });
      } catch (auditError) {
        console.error('❌ Failed to log verification success:', auditError);
      }

      setSuccess('Email verified successfully!');
      
      // Navigate to next step after a short delay
      setTimeout(() => {
        onStepComplete({ emailVerified: true }, 'payment');
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(errorMessage);
      
      // Log verification failure
      try {
        const { AuditService } = await import('../services/AuditService');
        AuditService.logEmailVerificationEvent('email-verification-failed', userEmail, false, {
          error: errorMessage,
          attempts: verificationAttempts + 1
        });
      } catch (auditError) {
        console.error('❌ Failed to log verification failure:', auditError);
      }
      
      await handleError(err as Error, 'verify_otp');
    } finally {
      setIsVerifying(false);
    }
  };

  // Manual verify button
  const handleManualVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      handleVerifyOtp(otpValue);
    } else {
      setError('Please enter all 6 digits');
    }
  };

  // Resend OTP with real email sending
  const handleResendOtp = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      // Check rate limiting using EmailService
      const rateLimitResult = EmailService.canResendVerificationEmail(userEmail);
      if (!rateLimitResult.allowed) {
        const waitMessage = rateLimitResult.waitTimeMinutes 
          ? `Please wait ${rateLimitResult.waitTimeMinutes} minutes.`
          : 'Please try again later.';
        throw new Error(`Too many resend attempts. ${waitMessage}`);
      }

      // Log resend attempt
      try {
        const { AuditService } = await import('../services/AuditService');
        AuditService.logEmailVerificationEvent('email-verification-resend', userEmail, true, {
          action: 'resend_attempted',
          attempts: resendAttempts + 1,
          remainingAttempts: rateLimitResult.attemptsRemaining
        });
      } catch (auditError) {
        console.error('❌ Failed to log resend attempt:', auditError);
      }

      // Send new verification email
      const result = await EmailService.resendVerificationEmail(userEmail, userName);
      
      if (result.success) {
        setTimeLeft(900); // Reset to 15 minutes
        setCanResend(false);
        setIsTokenExpired(false);
        setOtp(['', '', '', '', '', '']);
        setVerificationAttempts(0);
        setEmailStatus({
          sent: true,
          delivered: result.deliveryStatus === 'delivered',
          failed: false,
          emailId: result.emailId
        });
        setSuccess('New verification code sent successfully!');
        
        // Update resend statistics
        const stats = EmailService.getResendStatistics(userEmail);
        setResendAttempts(stats.totalAttempts);
        
        // Log successful resend
        try {
          const { AuditService } = await import('../services/AuditService');
          AuditService.logEmailVerificationEvent('email-verification-resend', userEmail, true, {
            action: 'resend_successful',
            emailId: result.emailId,
            deliveryStatus: result.deliveryStatus,
            attempts: stats.totalAttempts
          });
        } catch (auditError) {
          console.error('❌ Failed to log successful resend:', auditError);
        }
        
        // Clear success message and focus first input
        setTimeout(() => {
          setSuccess('');
          const firstInput = otpRefs.current[0];
          if (firstInput) {
            firstInput.focus();
          }
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to resend verification code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
      setEmailStatus({
        sent: false,
        delivered: false,
        failed: true,
        errorMessage
      });
      
      await handleError(err as Error, 'resend_email');
    } finally {
      setIsResending(false);
    }
  };

  // Mask email for display
  const getMaskedEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    const maskedUsername = username.charAt(0) + '*'.repeat(Math.max(username.length - 2, 0)) + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get email status display
  const getEmailStatusDisplay = () => {
    if (isSendingEmail) {
      return (
        <div className="flex items-center space-x-2 text-white/80 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending verification email...</span>
        </div>
      );
    }
    
    if (emailStatus.failed) {
      return (
        <div className="flex items-center space-x-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to send email</span>
        </div>
      );
    }
    
    if (emailStatus.sent) {
      return (
        <div className="flex items-center space-x-2 text-green-300 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Email sent successfully</span>
        </div>
      );
    }
    
    return null;
  };

  // Get resend button text and state
  const getResendButtonText = () => {
    if (isResending) return 'Sending...';
    if (resendCooldown > 0) {
      const minutes = Math.floor(resendCooldown / 60);
      const seconds = resendCooldown % 60;
      return `Wait ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (!resendEligibility.allowed) {
      if (resendEligibility.reason === 'max_attempts_exceeded') {
        return 'Max attempts reached';
      }
      return 'Resend unavailable';
    }
    return 'Resend Code';
  };

  // Get resend button disabled state
  const isResendDisabled = () => {
    return isResending || resendCooldown > 0 || !resendEligibility.allowed || isSendingEmail;
  };

  // Get resend status display
  const getResendStatusDisplay = () => {
    if (resendAttempts > 0) {
      const remaining = resendEligibility.attemptsRemaining || 0;
      return (
        <div className="flex items-center space-x-2 text-white/70 text-sm">
          <Activity className="w-4 h-4" />
          <span>Resend attempts: {resendAttempts}/3 (${remaining} remaining)</span>
        </div>
      );
    }
    return null;
  };

  // Get resend cooldown display
  const getResendCooldownDisplay = () => {
    if (resendCooldown > 0) {
      const minutes = Math.floor(resendCooldown / 60);
      const seconds = resendCooldown % 60;
      return (
        <div className="flex items-center space-x-2 text-orange-300 text-sm">
          <Clock className="w-4 h-4" />
          <span>Cooldown: {minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
      );
    }
    return null;
  };

  // Error handling and recovery functions
  const handleError = async (error: Error, context: string) => {
    console.error(`❌ Error in ${context}:`, error);
    
    // Determine error type
    let type: typeof errorType = 'unknown';
    if (error.message.includes('timeout') || error.message.includes('expired')) {
      type = 'timeout';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      type = 'network';
    } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
      type = 'rate_limit';
    } else if (error.message.includes('token expired')) {
      type = 'token_expired';
    } else if (error.message.includes('max attempts')) {
      type = 'max_attempts';
    } else if (error.message.includes('server') || error.message.includes('500')) {
      type = 'server_error';
    }
    
    setErrorType(type);
    setError(error.message);
    
    // Log error for audit
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logEmailVerificationEvent('email-verification-failed', userEmail, false, {
        errorType: type,
        context,
        error: error.message
      });
    } catch (auditError) {
      console.error('❌ Failed to log error:', auditError);
    }
    
    // Auto-retry for certain error types
    if (autoRetryEnabled && (type === 'network' || type === 'server_error')) {
      scheduleAutoRetry(context);
    }
    
    // Show fallback options for critical errors
    if (type === 'max_attempts' || type === 'token_expired') {
      setShowFallbackOptions(true);
    }
  };

  const scheduleAutoRetry = (context: string) => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    const retryDelay = Math.min(5000 * Math.pow(2, recoveryAttempts), 30000); // Exponential backoff, max 30s
    
    const timeout = setTimeout(async () => {
      if (recoveryAttempts < 3) {
        setRecoveryAttempts(prev => prev + 1);
        setIsRecovering(true);
        
        try {
          if (context === 'send_email') {
            await sendInitialEmail();
          } else if (context === 'resend_email') {
            await handleResendOtp();
          } else if (context === 'verify_otp') {
            await handleManualVerify();
          }
          
          setError('');
          setErrorType('unknown');
        } catch (retryError) {
          handleError(retryError as Error, `${context}_retry`);
        } finally {
          setIsRecovering(false);
        }
      } else {
        setShowFallbackOptions(true);
      }
    }, retryDelay);
    
    setRetryTimeout(timeout);
  };

  const handleRecovery = async (action: 'retry_send' | 'retry_resend' | 'retry_verify' | 'manual_verify' | 'contact_support') => {
    setIsRecovering(true);
    setError('');
    
    try {
      switch (action) {
        case 'retry_send':
          await sendInitialEmail();
          break;
        case 'retry_resend':
          await handleResendOtp();
          break;
        case 'retry_verify':
          await handleManualVerify();
          break;
        case 'manual_verify':
          // Skip to next step manually (for development/testing)
          onStepComplete({ emailVerified: true }, 'payment');
          break;
        case 'contact_support':
          // Open support contact
          window.open('mailto:support@pulseprep.com?subject=Email Verification Issue', '_blank');
          break;
      }
      
      setRecoveryAttempts(0);
      setShowFallbackOptions(false);
    } catch (error) {
      handleError(error as Error, `recovery_${action}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const getErrorRecoveryMessage = () => {
    switch (errorType) {
      case 'network':
        return 'Network connection issue. We\'ll automatically retry in a few seconds.';
      case 'timeout':
        return 'Request timed out. Please try again or request a new verification code.';
      case 'rate_limit':
        return 'Too many attempts. Please wait before trying again.';
      case 'token_expired':
        return 'Verification code has expired. Please request a new one.';
      case 'max_attempts':
        return 'Maximum attempts reached. Please contact support for assistance.';
      case 'server_error':
        return 'Server error occurred. We\'ll automatically retry in a few seconds.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const getFallbackOptions = () => {
    const options = [];
    
    if (errorType === 'network' || errorType === 'server_error') {
      options.push(
        <Button
          key="retry"
          variant="outline"
          onClick={() => handleRecovery('retry_send')}
          disabled={isRecovering}
          className="w-full mb-2"
        >
          {isRecovering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            'Retry Sending Email'
          )}
        </Button>
      );
    }
    
    if (errorType === 'token_expired' || errorType === 'timeout') {
      options.push(
        <Button
          key="resend"
          variant="outline"
          onClick={() => handleRecovery('retry_resend')}
          disabled={isRecovering}
          className="w-full mb-2"
        >
          {isRecovering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Request New Code'
          )}
        </Button>
      );
    }
    
    if (errorType === 'max_attempts') {
      options.push(
        <Button
          key="support"
          variant="outline"
          onClick={() => handleRecovery('contact_support')}
          className="w-full mb-2"
        >
          Contact Support
        </Button>
      );
    }
    
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      options.push(
        <Button
          key="manual"
          variant="outline"
          onClick={() => handleRecovery('manual_verify')}
          className="w-full mb-2 text-orange-600"
        >
          Skip Verification (Dev Only)
        </Button>
      );
    }
    
    return options;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl text-white">PulsePrep</span>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                {steps.map((step, index) => (
                  <React.Fragment key={step.step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                        step.active 
                          ? 'bg-white text-slate-900' 
                          : step.completed
                          ? 'bg-white/30 text-white'
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step + 1}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 ${step.completed ? 'bg-white/30' : 'bg-white/20'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <Progress value={60} className="max-w-xs mx-auto" />
          </div>

          <Card className="border-0 bg-white/10 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-2">Verify Your Email</CardTitle>
              <CardDescription className="text-white/80">
                We've sent a 6-digit verification code to
              </CardDescription>
              <div className="text-white text-sm mt-2 bg-white/10 rounded-lg px-3 py-2">
                {getMaskedEmail(userEmail)}
              </div>
              
              {/* Email Status Display */}
              {getEmailStatusDisplay()}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="border-red-300 bg-red-50/10 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Recovery Message */}
              {error && errorType !== 'unknown' && (
                <Alert className="border-blue-300 bg-blue-50/10 backdrop-blur-sm">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    {getErrorRecoveryMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Recovery Options */}
              {showFallbackOptions && (
                <div className="space-y-3 p-4 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <p className="text-white/90 text-sm font-medium">Recovery Options</p>
                  </div>
                  <div className="space-y-2">
                    {getFallbackOptions()}
                  </div>
                </div>
              )}

              {/* Auto-Retry Status */}
              {isRecovering && (
                <Alert className="border-yellow-300 bg-yellow-50/10 backdrop-blur-sm">
                  <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                  <AlertDescription className="text-yellow-200">
                    Automatically retrying... (Attempt {recoveryAttempts}/3)
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-300 bg-green-50/10 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Token Expired Warning */}
              {isTokenExpired && !canResend && (
                <Alert className="border-yellow-300 bg-yellow-50/10 backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    Verification code has expired. Please request a new one.
                  </AlertDescription>
                </Alert>
              )}

              {/* OTP Input */}
              <div className="space-y-4">
                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={el => otpRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-12 text-center text-lg bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:ring-white focus:border-white"
                      disabled={isVerifying || isResending || isSendingEmail || isTokenExpired}
                    />
                  ))}
                </div>

                {/* Manual Verify Button */}
                <Button
                  onClick={handleManualVerify}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm transition-all duration-200"
                  size="lg"
                  disabled={isVerifying || isResending || isSendingEmail || otp.join('').length !== 6 || isTokenExpired}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </div>

              {/* Timer and Resend */}
              <div className="text-center space-y-3">
                {!canResend ? (
                  <div className="space-y-2">
                    <p className="text-white/80 text-sm">
                      Code expires in {formatTime(timeLeft)}
                    </p>
                    <p className="text-white/60 text-xs">
                      Attempts: {verificationAttempts}/5
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Resend Status Display */}
                    {getResendStatusDisplay()}
                    
                    {/* Resend Cooldown Display */}
                    {getResendCooldownDisplay()}
                    
                    <Button
                      variant="ghost"
                      onClick={handleResendOtp}
                      className="text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isResendDisabled()}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {getResendButtonText()}
                        </>
                      )}
                    </Button>
                    
                    {/* Resend Help Text */}
                    {!resendEligibility.allowed && resendEligibility.reason === 'max_attempts_exceeded' && (
                      <p className="text-red-300 text-xs">
                        Maximum resend attempts reached. Please contact support.
                      </p>
                    )}
                    
                    {resendEligibility.allowed && resendEligibility.attemptsRemaining !== undefined && resendEligibility.attemptsRemaining <= 1 && (
                      <p className="text-orange-300 text-xs">
                        Last resend attempt remaining. Use it wisely.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="space-y-4 pt-4 border-t border-white/20">
                <button
                  onClick={() => onNavigate('signup')}
                  className="flex items-center justify-center w-full text-white/80 hover:text-white text-sm transition-colors"
                  disabled={isVerifying || isResending || isSendingEmail}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Account Details
                </button>
              </div>

              {/* Security Info */}
              <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-white/80" />
                  <p className="text-white/80 text-sm">Security Features:</p>
                </div>
                <div className="space-y-1 text-xs text-white/70">
                  <p>• 15-minute expiration</p>
                  <p>• Rate limiting protection</p>
                  <p>• One-time use tokens</p>
                  <p>• Attempt tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;