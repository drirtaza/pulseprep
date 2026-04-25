import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
  AlertCircle,
  Mail,
  Lock,
  Shield,
  Check,
  X,
  Key,
  RefreshCw
} from 'lucide-react';
import { PageType, SpecialtyType } from '../types';
import { passwordService, PasswordStrengthResult } from '../services/PasswordService';
import { getSupabaseBrowser, SUPABASE_RECOVERY_FLAG } from '../lib/supabaseClient';

interface ForgotPasswordPageProps {
  onNavigate: (page: PageType) => void;
  selectedSpecialty: SpecialtyType | null;
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

type Step = 'email' | 'reset';

export default function ForgotPasswordPage({ onNavigate, selectedSpecialty }: ForgotPasswordPageProps) {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
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
      noCommonWords: true
    }
  });
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  const [successMessage, setSuccessMessage] = useState('');

  const theme = getThemeClasses(selectedSpecialty);

  // Real-time password strength checking
  useEffect(() => {
    if (newPassword) {
      const strength = passwordService.checkPasswordStrength(newPassword);
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
  }, [newPassword]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Email link: App.tsx applies hash ?access_token=... then sets SUPABASE_RECOVERY_FLAG and navigates here
  useEffect(() => {
    if (sessionStorage.getItem(SUPABASE_RECOVERY_FLAG) === '1') {
      setCurrentStep('reset');
      setSuccessMessage('Set a new password for your account. You are signed in from the reset link.');
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ general: (data as { error?: string })?.error || 'Failed to send reset email.' });
        return;
      }
      setSuccessMessage(
        (data as { message?: string })?.message ||
          'If an account exists for that email, you will receive a reset link shortly.'
      );
      setResendCooldown(60);
    } catch (error) {
      console.error('Password reset email error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!newPassword) {
      setErrors({ password: 'New password is required' });
      return;
    }

    if (!passwordStrength.isValid) {
      setErrors({ password: 'Password does not meet security requirements' });
      return;
    }

    if (!confirmPassword) {
      setErrors({ confirmPassword: 'Please confirm your password' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const supa = getSupabaseBrowser();
      if (!supa) {
        setErrors({
          general: 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
        });
        return;
      }

      const { error: updateErr } = await supa.auth.updateUser({ password: newPassword });
      if (updateErr) {
        setErrors({ general: updateErr.message || 'Could not update password. Request a new reset link.' });
        return;
      }

      await supa.auth.signOut();
      sessionStorage.removeItem(SUPABASE_RECOVERY_FLAG);
      setSuccessMessage('Your password was updated. You can now sign in.');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ general: 'An error occurred while resetting your password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setResendCooldown(60);
    await handleSendResetEmail({ preventDefault: () => {} } as React.FormEvent);
  };

  const renderEmailStep = () => (
    <Card className="border-0 bg-white/10 backdrop-blur-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white mb-2">Reset Your Password</CardTitle>
        <CardDescription className="text-white/80">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {successMessage && (
          <Alert className="border-green-400 bg-green-500/20 backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <AlertDescription className="text-green-100">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errors.general && (
          <Alert className="border-red-300 bg-red-50/10 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSendResetEmail} className="space-y-6">
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

          <Button
            type="submit"
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm transition-all duration-200"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-white/20">
          <span className="text-white/80 text-sm">Remember your password? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-white hover:text-white/80 underline text-sm transition-colors"
            disabled={isLoading}
          >
            Sign in instead
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResetStep = () => {
    const strengthDisplay = passwordService.getPasswordStrengthDisplay(passwordStrength.score);

    return (
      <Card className="border-0 bg-white/10 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white mb-2">Set New Password</CardTitle>
          <CardDescription className="text-white/80">
            Create a strong, secure password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {successMessage && (
            <Alert className="border-green-400 bg-green-500/20 backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <AlertDescription className="text-green-100">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errors.general && (
            <Alert className="border-red-300 bg-red-50/10 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white/90">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {newPassword && (
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
                Confirm New Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/60 ${theme.focus} ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="Confirm your new password"
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
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="flex items-center space-x-1 text-red-300 text-sm">
                  <X className="w-3 h-3" />
                  <span>Passwords do not match</span>
                </div>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword && (
                <div className="flex items-center space-x-1 text-green-300 text-sm">
                  <Check className="w-3 h-3" />
                  <span>Passwords match</span>
                </div>
              )}
              {errors.confirmPassword && (
                <p className="text-red-300 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm transition-all duration-200"
              size="lg"
              disabled={isLoading || !passwordStrength.isValid || newPassword !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Form */}
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

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === 'email' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-8 h-1 rounded transition-colors ${
                    currentStep === 'reset' ? 'bg-white' : 'bg-white/20'
                  }`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === 'reset' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
                  }`}
                >
                  2
                </div>
              </div>
            </div>

            {/* Render current step */}
            {currentStep === 'email' && renderEmailStep()}
            {currentStep === 'reset' && renderResetStep()}

            {/* Back to Home */}
            <div className="text-center mt-6">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center justify-center w-full text-white/80 hover:text-white text-sm transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center p-8">
          <div className="max-w-md text-center text-white">
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl mb-4">Secure Password Reset</h2>
                <p className="text-white/80 leading-relaxed">
                  We take your account security seriously. Our password reset process uses industry-standard encryption and security measures to protect your account.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <Lock className="w-6 h-6 mb-2 mx-auto" />
                  <div className="font-medium mb-1">Encrypted Communication</div>
                  <div className="text-white/70">All data is encrypted in transit</div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <Key className="w-6 h-6 mb-2 mx-auto" />
                  <div className="font-medium mb-1">Secure Tokens</div>
                  <div className="text-white/70">Time-limited reset codes</div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <Shield className="w-6 h-6 mb-2 mx-auto" />
                  <div className="font-medium mb-1">Strong Passwords</div>
                  <div className="text-white/70">Enforced security requirements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}