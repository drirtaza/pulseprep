import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';

import { Progress } from './ui/progress';
import { 
  Activity, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Heart, 
  Scissors, 
  Baby, 
  Loader2,
  CheckCircle,
  Mail,
  User,
  Phone,
  CreditCard,
  Lock,
  Shield,
  Check,
  X,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PageType, SignUpFormData, SpecialtyType, UserData } from '../types';
import { passwordService, PasswordStrengthResult } from '../services/PasswordService';
import { EmailService } from '../services/EmailService';

// Import safe storage utilities
import { safeGetItem } from '../utils/storageUtils';

interface SignUpPageProps {
  onNavigate: (page: PageType) => void;
  onStepComplete: (stepData: Partial<SignUpFormData>, nextPage: PageType) => void;
  onSignUpComplete: (userData: UserData) => void;
  selectedSpecialty: SpecialtyType | null;
  formData: SignUpFormData | null;
}

const specialtyInfo = {
  medicine: {
    title: 'Internal Medicine',
    icon: Heart,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'emerald'
  },
  surgery: {
    title: 'Surgery',
    icon: Scissors,
    gradient: 'from-blue-500 to-indigo-600',
    accent: 'blue'
  },
  'gynae-obs': {
    title: 'Gynecology & Obstetrics',
    icon: Baby,
    gradient: 'from-pink-500 to-rose-600',
    accent: 'pink'
  }
};

const getThemeClasses = (specialty: SpecialtyType | null) => {
  if (!specialty) return {
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
    focus: 'focus:ring-emerald-500 focus:border-emerald-500',
    button: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
  };
  
  const info = specialtyInfo[specialty];
  return {
    gradient: info.gradient,
    accent: info.accent,
    focus: `focus:ring-${info.accent}-500 focus:border-${info.accent}-500`,
    button: `bg-gradient-to-r ${info.gradient} hover:from-${info.accent}-600 hover:to-${info.accent === 'pink' ? 'rose' : info.accent === 'blue' ? 'indigo' : 'teal'}-700`
  };
};

export default function SignUpPage({ onNavigate, onStepComplete, selectedSpecialty, formData }: SignUpPageProps) {
  const [fullName, setFullName] = useState(formData?.fullName || '');
  const [email, setEmail] = useState(formData?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(formData?.phone || '');
  const [cnic, setCnic] = useState(formData?.cnic || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Email verification states
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'pending' | 'sending' | 'sent' | 'failed'>('pending');
  const [emailVerificationError, setEmailVerificationError] = useState('');
  const [emailVerificationTimeout, setEmailVerificationTimeout] = useState<NodeJS.Timeout | null>(null);

  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult>({
    score: 0,
    isValid: false,
    feedback: [],
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      noCommonWords: false
    }
  });

  // Form validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    cnic?: string;
    terms?: string;
  }>({});

  const theme = getThemeClasses(selectedSpecialty);
  const specialtyData = selectedSpecialty ? specialtyInfo[selectedSpecialty] : null;

  // Real-time password strength checking
  useEffect(() => {
    if (password) {
      const strength = passwordService.checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({
        score: 0,
        isValid: false,
        feedback: [],
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
          noCommonWords: true
        }
      });
    }
  }, [password]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      newErrors.fullName = 'Full name can only contain letters and spaces';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation using our password service
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = 'Password does not meet security requirements';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid Pakistani phone number';
    }

    // CNIC validation
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
    if (!cnic) {
      newErrors.cnic = 'CNIC is required';
    } else if (!cnicRegex.test(cnic)) {
      newErrors.cnic = 'CNIC must be in format: 12345-1234567-1';
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setEmailVerificationError('');
    setEmailVerificationStatus('pending');

    try {
      // ✅ FIXED: Check if email already exists using safe storage
      const rawExistingUsers = safeGetItem('all_users', []);
      const existingUsers = Array.isArray(rawExistingUsers) ? rawExistingUsers : [];
      
      console.log('📧 Email validation debug:', {
        email: email.toLowerCase(),
        existingUsersType: typeof rawExistingUsers,
        existingUsersIsArray: Array.isArray(rawExistingUsers),
        existingUsersLength: existingUsers.length
      });
      
      const emailExists = existingUsers.some((user: any) => 
        user && user.email && user.email.toLowerCase() === email.toLowerCase()
      );

      if (emailExists) {
        setErrors({ email: 'An account with this email already exists' });
        setIsLoading(false);
        return;
      }

      // Hash the password
      const { hash: passwordHash, salt: passwordSalt } = await passwordService.hashPassword(password);

      // Store form data first
      const stepData: Partial<SignUpFormData> = {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash, // Store hashed password
        passwordSalt, // Store salt separately
        phone: phone.trim(),
        cnic: cnic.trim(),
        specialty: selectedSpecialty || 'medicine',
        studyMode: 'regular',
        emailVerified: false,
        paymentVerified: false
      };

      // Persist signup profile in Supabase (primary), fallback to admin-upsert route.
      const payload = {
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        specialty: selectedSpecialty || 'medicine'
      };
      const upsertResp = await fetch('/api/pending-user-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!upsertResp.ok) {
        const fallbackResp = await fetch('/api/admin-update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auth-signup-start',
            ...payload
          })
        });
        if (!fallbackResp.ok) {
          const msg = await fallbackResp.text().catch(() => '');
          throw new Error(msg || 'Failed to save signup data to database');
        }
      }

      // Store in sessionStorage for multi-step signup
      sessionStorage.setItem('signup_step1', JSON.stringify(stepData));

      // Send email verification
      setEmailVerificationStatus('sending');
      
      try {
        // Initialize email service
        EmailService.initialize();
        
        // Send verification email
        const emailResult = await EmailService.sendVerificationEmail(
          email.toLowerCase().trim(),
          fullName.trim().split(' ')[0] || 'User'
        );

        if (emailResult.success) {
          setEmailVerificationStatus('sent');
          try {
            sessionStorage.setItem('pulseprep_signup_otp_sent', email.toLowerCase().trim());
          } catch {
            /* ignore */
          }

          // Set timeout for email verification (15 minutes)
          const timeout = setTimeout(() => {
            setEmailVerificationStatus('failed');
            setEmailVerificationError('Email verification timed out. Please try again.');
          }, 15 * 60 * 1000); // 15 minutes
          
          setEmailVerificationTimeout(timeout);
          
          // Log successful email sending
          try {
            const { AuditService } = await import('../services/AuditService');
            AuditService.logUserAction(
              'Email Verification Sent',
              'System',
              'system',
              email.toLowerCase().trim(),
              true,
              {
                emailId: emailResult.emailId,
                deliveryStatus: emailResult.deliveryStatus,
                specialty: selectedSpecialty || 'medicine',
                registrationStep: 'email-verification'
              }
            );
          } catch (error) {
            console.error('Failed to log email verification event:', error);
          }
          
          // Log user registration event
          try {
            const { AuditService } = await import('../services/AuditService');
            AuditService.logUserAction(
              'User Registration Initiated',
              'System',
              'system',
              email.toLowerCase().trim(),
              true,
              {
                specialty: selectedSpecialty || 'medicine',
                hasPhone: !!phone.trim(),
                hasCNIC: !!cnic.trim(),
                registrationStep: 'email-verification',
                emailVerificationSent: true,
                emailId: emailResult.emailId
              }
            );
          } catch (error) {
            console.error('Failed to log registration event:', error);
          }
          
          // Navigate to email verification page
          onStepComplete(stepData, 'email-verification');
          
        } else {
          setEmailVerificationStatus('failed');
          setEmailVerificationError(`Failed to send verification email: ${emailResult.message}`);
          
          // Log email sending failure
          try {
            const { AuditService } = await import('../services/AuditService');
            AuditService.logSecurityEvent(
              'Email Verification Failed',
              'System',
              'system',
              'high',
              false,
              {
                error: emailResult.message,
                deliveryStatus: emailResult.deliveryStatus,
                specialty: selectedSpecialty || 'medicine'
              },
              emailResult.message
            );
          } catch (error) {
            console.error('Failed to log email failure event:', error);
          }
        }
        
      } catch (emailError) {
        setEmailVerificationStatus('failed');
        const errorMessage = emailError instanceof Error ? emailError.message : 'Failed to send verification email';
        setEmailVerificationError(errorMessage);
        
        // Log email error
        try {
          const { AuditService } = await import('../services/AuditService');
          AuditService.logSecurityEvent(
            'Email Verification Error',
            'System',
            'system',
            'high',
            false,
            {
              error: errorMessage,
              specialty: selectedSpecialty || 'medicine'
            },
            errorMessage
          );
        } catch (error) {
          console.error('Failed to log email error event:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      setErrors({ email: 'An error occurred during signup. Please try again.' });
      
      // Log signup error
      try {
        const { AuditService } = await import('../services/AuditService');
        AuditService.logSecurityEvent(
          'User Registration Error',
          'System',
          'system',
          'high',
          false,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            specialty: selectedSpecialty || 'medicine'
          },
          error instanceof Error ? error.message : 'Unknown error'
        );
      } catch (error) {
        console.error('Failed to log signup error event:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCnic = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 5) {
      return digitsOnly;
    } else if (digitsOnly.length <= 12) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`;
    } else {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 12)}-${digitsOnly.slice(12, 13)}`;
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnic(e.target.value);
    setCnic(formatted);
  };

  const formatPhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.startsWith('92')) {
      return `+${digitsOnly}`;
    } else if (digitsOnly.startsWith('0')) {
      return digitsOnly;
    } else {
      return digitsOnly;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // Get password strength display
  const strengthDisplay = passwordService.getPasswordStrengthDisplay(passwordStrength.score);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailVerificationTimeout) {
        clearTimeout(emailVerificationTimeout);
      }
    };
  }, [emailVerificationTimeout]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Sign Up Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${theme.gradient} rounded-lg flex items-center justify-center`}>
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl text-white">PulsePrep</span>
              </button>
            </div>

            {/* Sign Up Card */}
            <Card className="border-0 bg-white/10 backdrop-blur-md shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white mb-2">Create Your Account</CardTitle>
                <CardDescription className="text-white/80">
                  Join thousands of medical students preparing for FCPS
                </CardDescription>
                
                {/* Selected Specialty Badge */}
                {selectedSpecialty && specialtyData && (
                  <div className="flex items-center justify-center mt-4">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      <specialtyData.icon className="w-4 h-4 mr-2" />
                      {specialtyData.title}
                    </Badge>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white/90">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.fullName ? 'border-red-400' : ''}`}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-300 text-sm">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.email ? 'border-red-400' : ''}`}
                        placeholder="Enter your email"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-300 text-sm">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field with Strength Indicator */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.password ? 'border-red-400' : ''}`}
                        placeholder="Create a strong password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">Password Strength:</span>
                          <span className={`text-sm font-medium ${strengthDisplay.className}`}>
                            {strengthDisplay.label}
                          </span>
                        </div>
                        <Progress 
                          value={(passwordStrength.score / 4) * 100} 
                          className="h-2"
                          style={{ 
                            background: 'rgba(255,255,255,0.2)',
                          }}
                        />
                        
                        {/* Password Requirements */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.minLength ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>8+ characters</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.hasUppercase ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>Uppercase</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.hasLowercase ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>Lowercase</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.hasNumbers ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.hasNumbers ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>Numbers</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.hasSpecialChars ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.hasSpecialChars ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>Special chars</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${passwordStrength.requirements.noCommonWords ? 'text-green-300' : 'text-red-300'}`}>
                            {passwordStrength.requirements.noCommonWords ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>Not common</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {errors.password && (
                      <p className="text-red-300 text-sm">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white/90">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.confirmPassword ? 'border-red-400' : ''}`}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <div className="flex items-center space-x-1 text-red-300 text-sm">
                        <X className="w-3 h-3" />
                        <span>Passwords do not match</span>
                      </div>
                    )}
                    {confirmPassword && password === confirmPassword && password && (
                      <div className="flex items-center space-x-1 text-green-300 text-sm">
                        <Check className="w-3 h-3" />
                        <span>Passwords match</span>
                      </div>
                    )}
                    {errors.confirmPassword && (
                      <p className="text-red-300 text-sm">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        className={`pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.phone ? 'border-red-400' : ''}`}
                        placeholder="0300-1234567 or +92-300-1234567"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-300 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  {/* CNIC Field */}
                  <div className="space-y-2">
                    <Label htmlFor="cnic" className="text-white/90">
                      CNIC Number
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                      <Input
                        id="cnic"
                        type="text"
                        value={cnic}
                        onChange={handleCnicChange}
                        className={`pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.cnic ? 'border-red-400' : ''}`}
                        placeholder="12345-1234567-1"
                        maxLength={15}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.cnic && (
                      <p className="text-red-300 text-sm">{errors.cnic}</p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50 text-[rgba(255,255,255,1)] mt-0.5"
                        disabled={isLoading}
                      />
                      <Label htmlFor="terms" className="text-white/90 text-sm cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <button type="button" className="underline hover:text-white">
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button type="button" className="underline hover:text-white">
                          Privacy Policy
                        </button>
                      </Label>
                    </div>
                    {errors.terms && (
                      <p className="text-red-300 text-sm">{errors.terms}</p>
                    )}
                  </div>

                  {/* Sign Up Button */}
                  <Button
                    type="submit"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm transition-all duration-200"
                    size="lg"
                    disabled={isLoading || !passwordStrength.isValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  {/* Email Verification Status */}
                  {emailVerificationStatus === 'sending' && (
                    <Alert className="border-blue-300 bg-blue-50/10 backdrop-blur-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        Sending verification email...
                      </AlertDescription>
                    </Alert>
                  )}

                  {emailVerificationStatus === 'sent' && (
                    <Alert className="border-green-300 bg-green-50/10 backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200">
                        Verification email sent successfully! Redirecting to verification page...
                      </AlertDescription>
                    </Alert>
                  )}

                  {emailVerificationStatus === 'failed' && (
                    <Alert className="border-red-300 bg-red-50/10 backdrop-blur-sm">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        {emailVerificationError || 'Failed to send verification email. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Email Verification Timeout Warning */}
                  {emailVerificationTimeout && (
                    <Alert className="border-yellow-300 bg-yellow-50/10 backdrop-blur-sm">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-200">
                        Email verification will expire in 15 minutes. Please check your email and verify your account.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>

                {/* Navigation Links */}
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <span className="text-white/80 text-sm">Already have an account? </span>
                    <button
                      onClick={() => onNavigate('login')}
                      className="text-white hover:text-white/80 underline text-sm transition-colors"
                      disabled={isLoading}
                    >
                      Sign in instead
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onNavigate('home')}
                    className="flex items-center justify-center w-full text-white/80 hover:text-white text-sm transition-colors"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Specialty Showcase */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center p-8">
          <div className="max-w-md text-center text-white">
            {selectedSpecialty && specialtyData ? (
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <specialtyData.icon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl mb-4">Begin Your Journey in</h2>
                  <h3 className="text-2xl mb-6">{specialtyData.title}</h3>
                  <p className="text-white/80 leading-relaxed">
                    Join thousands of medical professionals who have successfully prepared for their FCPS exams with our comprehensive platform.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <Shield className="w-6 h-6 mb-2 mx-auto" />
                    <div>Secure Platform</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6 mb-2 mx-auto" />
                    <div>Expert Content</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <Activity className="w-6 h-6 mb-2 mx-auto" />
                    <div>Real-time Analytics</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <User className="w-6 h-6 mb-2 mx-auto" />
                    <div>Personalized Learning</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl mb-4">Welcome to PulsePrep</h2>
                  <p className="text-white/80 leading-relaxed">
                    Your comprehensive medical exam preparation platform with enterprise-grade security and personalized learning paths.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}