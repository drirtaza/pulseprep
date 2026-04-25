import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
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
  HelpCircle
} from 'lucide-react';
import { LoginPageProps, UserData, SpecialtyType } from '../types';
import { passwordService } from '../services/PasswordService';
import { securityService } from '../services/SecurityService';
import { getSupabaseBrowser } from '../lib/supabaseClient';

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

export default function LoginPage({ onNavigate, onLogin, selectedSpecialty }: LoginPageProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginAttempts, setLoginAttempts] = React.useState(0);
  const [isLockedOut, setIsLockedOut] = React.useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = React.useState(0);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; auth?: string }>({});
  const [suspensionInfo, setSuspensionInfo] = React.useState<{ 
    isSuspended: boolean; 
    userName: string; 
    reason?: string; 
  }>({ isSuspended: false, userName: '' });



  const theme = getThemeClasses(selectedSpecialty ?? null);
  const specialtyData = selectedSpecialty ? specialtyInfo[selectedSpecialty as keyof typeof specialtyInfo] : null;



  // Check for existing lockout on component mount
  React.useEffect(() => {
    const lockoutData = localStorage.getItem('login_lockout');
    if (lockoutData) {
      try {
        const { attempts, lockedUntil } = JSON.parse(lockoutData);
        const now = new Date().getTime();
        
        if (lockedUntil && now < lockedUntil) {
          setIsLockedOut(true);
          setLockoutTimeRemaining(Math.ceil((lockedUntil - now) / 1000));
          
          // Start countdown timer
          const timer = setInterval(() => {
            const remaining = Math.ceil((lockedUntil - new Date().getTime()) / 1000);
            if (remaining <= 0) {
              setIsLockedOut(false);
              setLockoutTimeRemaining(0);
              setLoginAttempts(0);
              localStorage.removeItem('login_lockout');
              clearInterval(timer);
            } else {
              setLockoutTimeRemaining(remaining);
            }
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          // Lockout expired, reset
          setLoginAttempts(attempts || 0);
          if (lockedUntil && now >= lockedUntil) {
            localStorage.removeItem('login_lockout');
            setLoginAttempts(0);
          }
        }
      } catch (error) {
        console.error('Error parsing lockout data:', error);
        localStorage.removeItem('login_lockout');
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; auth?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleFailedLogin = (email: string) => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    // Log security event
    securityService.logSecurityEvent({
      type: 'failed_login',
      userId: email,
      timestamp: new Date().toISOString(),
              ipAddress: 'IP_UNKNOWN', // Would be real IP in production
      userAgent: navigator.userAgent,
      details: {
        email,
        attempt: newAttempts,
        reason: 'Invalid credentials'
      },
      severity: newAttempts >= 3 ? 'high' : 'medium'
    });

    // Implement progressive lockout
    if (newAttempts >= 5) {
      // 15 minute lockout after 5 failed attempts
      const lockoutDuration = 15 * 60 * 1000;
      const lockedUntil = new Date().getTime() + lockoutDuration;
      
      localStorage.setItem('login_lockout', JSON.stringify({
        attempts: newAttempts,
        lockedUntil,
        email
      }));
      
      setIsLockedOut(true);
      setLockoutTimeRemaining(Math.ceil(lockoutDuration / 1000));
      
      // Start countdown timer
      const timer = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - new Date().getTime()) / 1000);
        if (remaining <= 0) {
          setIsLockedOut(false);
          setLockoutTimeRemaining(0);
          setLoginAttempts(0);
          localStorage.removeItem('login_lockout');
          clearInterval(timer);
        } else {
          setLockoutTimeRemaining(remaining);
        }
      }, 1000);

      securityService.logSecurityEvent({
        type: 'login',
        userId: email,
        timestamp: new Date().toISOString(),
        ipAddress: 'IP_UNKNOWN',
        userAgent: navigator.userAgent,
        details: {
          action: 'account_locked',
          email,
          attempts: newAttempts,
          lockoutDuration: '15 minutes'
        },
        severity: 'critical'
      });

    } else if (newAttempts >= 3) {
      // Store failed attempts
      localStorage.setItem('login_lockout', JSON.stringify({
        attempts: newAttempts,
        email
      }));
    }
  };

  const handleSuccessfulLogin = (email: string) => {
    // Reset login attempts on successful login
    setLoginAttempts(0);
    localStorage.removeItem('login_lockout');
    
    // Log successful login
    securityService.logSecurityEvent({
      type: 'login',
      userId: email,
      timestamp: new Date().toISOString(),
              ipAddress: 'IP_UNKNOWN',
      userAgent: navigator.userAgent,
      details: {
        action: 'successful_login',
        email,
        rememberMe
      },
      severity: 'low'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      setErrors({ auth: `Account temporarily locked. Please try again in ${Math.ceil(lockoutTimeRemaining / 60)} minutes.` });
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuspensionInfo({ isSuspended: false, userName: '' });

    try {
      const supa = getSupabaseBrowser();
      if (supa) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          session?: { access_token: string; refresh_token: string; expires_in?: number };
          user?: Record<string, unknown>;
        };

        if (!res.ok || !j.ok || !j.session || !j.user) {
          setIsLoading(false);
          handleFailedLogin(email);
          const attemptsRemaining = Math.max(0, 5 - (loginAttempts + 1));
          let errorMessage = j.error || 'Invalid email or password.';
          if (attemptsRemaining <= 2 && attemptsRemaining > 0) {
            errorMessage += ` ${attemptsRemaining} attempts remaining before account lockout.`;
          } else if (attemptsRemaining === 0) {
            errorMessage = 'Account will be locked due to too many failed attempts.';
          }
          setErrors({ auth: errorMessage });
          return;
        }

        const u = j.user;
        if (u.status === 'suspended') {
          setIsLoading(false);
          setSuspensionInfo({
            isSuspended: true,
            userName: String(u.name || u.fullName || 'User'),
            reason: (u as { suspensionReason?: string }).suspensionReason || 'Your account has been suspended.'
          });
          return;
        }

        const { error: sessionErr } = await supa.auth.setSession({
          access_token: j.session.access_token,
          refresh_token: j.session.refresh_token
        });
        if (sessionErr) {
          console.error('setSession', sessionErr);
        }

        const spec = u.specialty as string;
        const specialty: SpecialtyType =
          spec === 'surgery' || spec === 'gynae-obs' ? spec : 'medicine';
        const userData: UserData = {
          id: String(u.id),
          name: String(u.name || u.fullName || ''),
          fullName: String(u.fullName || u.name || ''),
          email: String(u.email),
          specialty,
          studyMode: (u.studyMode as UserData['studyMode']) || 'regular',
          registrationDate: String(u.registrationDate || new Date().toISOString()),
          paymentStatus: (u.paymentStatus as UserData['paymentStatus']) || 'pending',
          phone: u.phone as string | undefined,
          cnic: u.cnic as string | undefined,
          status: u.status as UserData['status'],
          paymentDetails: u.paymentDetails as UserData['paymentDetails'],
          passwordHash: u.passwordHash as string | undefined,
          passwordSalt: u.passwordSalt as string | undefined,
          emailVerified: Boolean(u.emailVerified),
          emailVerificationToken: u.emailVerificationToken as string | undefined,
          emailVerificationSentAt: u.emailVerificationSentAt as string | undefined,
          emailVerificationExpiresAt: u.emailVerificationExpiresAt as string | undefined,
          emailVerificationAttempts: Number(u.emailVerificationAttempts) || 0,
          emailVerificationLastAttemptAt: u.emailVerificationLastAttemptAt as string | undefined,
          emailVerificationStatus:
            (u.emailVerificationStatus as UserData['emailVerificationStatus']) || 'pending',
          emailVerificationEmailId: u.emailVerificationEmailId as string | undefined,
          emailVerificationDeliveryStatus: u.emailVerificationDeliveryStatus as UserData['emailVerificationDeliveryStatus'],
          emailVerificationError: u.emailVerificationError as string | undefined
        };

        handleSuccessfulLogin(email);
        setTimeout(() => {
          setIsLoading(false);
          onLogin?.(userData);
        }, 300);
        return;
      }

      // Legacy: local all_users (no Supabase env)
      await new Promise(resolve => setTimeout(resolve, 500));

      let user: any = null;
      let isPasswordValid = false;

      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const foundUser = allUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (foundUser) {
        if (foundUser.passwordSalt && foundUser.password) {
          isPasswordValid = await passwordService.verifyPassword(password, foundUser.password, foundUser.passwordSalt);
        } else if (foundUser.password) {
          isPasswordValid = password === foundUser.password;
          if (isPasswordValid) {
            try {
              const { hash, salt } = await passwordService.hashPassword(password);
              foundUser.password = hash;
              foundUser.passwordSalt = salt;
              const userIndex = allUsers.findIndex((x: any) => x.email.toLowerCase() === email.toLowerCase());
              if (userIndex !== -1) {
                allUsers[userIndex] = foundUser;
                localStorage.setItem('all_users', JSON.stringify(allUsers));
              }
            } catch (error) {
              console.error('Failed to upgrade password hash', error);
            }
          }
        } else {
          setIsLoading(false);
          setErrors({
            auth: `Account setup incomplete. Please use "Forgot password" or contact support.`
          });
          return;
        }
        if (isPasswordValid) user = foundUser;
      }

      if (!user) {
        const pendingUser = localStorage.getItem('pulseprep_user_pending');
        if (pendingUser) {
          const pendingData = JSON.parse(pendingUser);
          if (pendingData.email.toLowerCase() === email.toLowerCase()) {
            user = pendingData;
            isPasswordValid = true;
          }
        }
      }

      if (user && isPasswordValid) {
        if (user.status === 'suspended') {
          setIsLoading(false);
          setSuspensionInfo({
            isSuspended: true,
            userName: user.name,
            reason: user.suspensionReason || 'Your account has been suspended.'
          });
          return;
        }

        handleSuccessfulLogin(email);

        const userData: UserData = {
          id: user.id,
          name: user.name,
          fullName: user.name,
          email: user.email,
          specialty: user.specialty,
          studyMode: user.studyMode,
          registrationDate: user.registrationDate,
          paymentStatus: user.paymentStatus || 'pending',
          phone: user.phone,
          cnic: user.cnic,
          passwordHash: user.password,
          passwordSalt: user.passwordSalt,
          emailVerified: user.emailVerified || false,
          emailVerificationToken: user.emailVerificationToken,
          emailVerificationSentAt: user.emailVerificationSentAt,
          emailVerificationExpiresAt: user.emailVerificationExpiresAt,
          emailVerificationAttempts: user.emailVerificationAttempts || 0,
          emailVerificationLastAttemptAt: user.emailVerificationLastAttemptAt,
          emailVerificationStatus: user.emailVerificationStatus || 'pending',
          emailVerificationEmailId: user.emailVerificationEmailId,
          emailVerificationDeliveryStatus: user.emailVerificationDeliveryStatus,
          emailVerificationError: user.emailVerificationError
        };

        setTimeout(() => {
          setIsLoading(false);
          onLogin?.(userData);
        }, 500);
      } else {
        setIsLoading(false);
        handleFailedLogin(email);
        const attemptsRemaining = Math.max(0, 5 - (loginAttempts + 1));
        let errorMessage = 'Invalid email or password.';
        if (attemptsRemaining <= 2 && attemptsRemaining > 0) {
          errorMessage += ` ${attemptsRemaining} attempts remaining before account lockout.`;
        } else if (attemptsRemaining === 0) {
          errorMessage = 'Account will be locked due to too many failed attempts.';
        }
        setErrors({ auth: errorMessage });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      setErrors({ auth: 'An error occurred during login. Please try again.' });
    }
  };

  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <button
                onClick={() => onNavigate?.('home')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${theme.gradient} rounded-lg flex items-center justify-center`}>
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl text-white">PulsePrep</span>
              </button>
            </div>

            {/* Login Card */}
            <Card className="border-0 bg-white/10 backdrop-blur-md shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white mb-2">Welcome Back</CardTitle>
                <CardDescription className="text-white/80">
                  Sign in to continue your medical exam preparation
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
                {/* Account Suspension Alert */}
                {suspensionInfo.isSuspended && (
                  <Alert className="border-red-400 bg-red-500/20 backdrop-blur-sm">
                    <Shield className="h-5 w-5 text-red-300" />
                    <AlertDescription className="text-red-100">
                      <div className="space-y-3">
                        <div>
                          <strong className="text-red-200">Account Suspended</strong>
                        </div>
                        <p>
                          Hello {suspensionInfo.userName}, your account has been temporarily suspended and you cannot access the platform at this time.
                        </p>
                        {suspensionInfo.reason && (
                          <p className="text-sm">
                            <strong>Reason:</strong> {suspensionInfo.reason}
                          </p>
                        )}
                        <div className="pt-2 border-t border-red-300/30">
                          <p className="text-sm">
                            <HelpCircle className="w-4 h-4 inline mr-1" />
                            <strong>Need help?</strong> Contact our support team:
                          </p>
                          <ul className="text-sm mt-1 space-y-1">
                            <li>📧 Email: support@pulseprep.com</li>
                            <li>📞 Phone: +92-300-PULSE-00</li>
                            <li>💬 WhatsApp: +92-300-123-4567</li>
                          </ul>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Lockout Alert */}
                {isLockedOut && (
                  <Alert className="border-orange-400 bg-orange-500/20 backdrop-blur-sm">
                    <Shield className="h-5 w-5 text-orange-300" />
                    <AlertDescription className="text-orange-100">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-orange-200">Account Temporarily Locked</strong>
                        </div>
                        <p>
                          Too many failed login attempts. Please wait {formatLockoutTime(lockoutTimeRemaining)} before trying again.
                        </p>
                        <p className="text-sm">
                          This is a security measure to protect your account. If you've forgotten your password, use the "Forgot password" link below.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Auth Error Alert */}
                {errors.auth && !isLockedOut && (
                  <Alert className="border-red-300 bg-red-50/10 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {errors.auth}
                      {loginAttempts > 0 && loginAttempts < 5 && (
                        <div className="mt-2 text-sm">
                          Failed attempts: {loginAttempts}/5
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}



                <form onSubmit={handleSubmit} className="space-y-6">
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
                        disabled={isLoading || isLockedOut}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-300 text-sm">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
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
                          placeholder="Enter your password"
                        disabled={isLoading || isLockedOut}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        disabled={isLoading || isLockedOut}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-300 text-sm">{errors.password}</p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50 text-[rgba(255,255,255,1)]"
                        disabled={isLoading || isLockedOut}
                      />
                      <Label htmlFor="remember" className="text-white/90 text-sm cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('forgot-password')}
                      className="text-white/80 hover:text-white text-sm underline transition-colors"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm transition-all duration-200"
                    size="lg"
                    disabled={isLoading || suspensionInfo.isSuspended || isLockedOut}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : suspensionInfo.isSuspended ? (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Account Suspended
                      </>
                    ) : isLockedOut ? (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Account Locked ({formatLockoutTime(lockoutTimeRemaining)})
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Navigation Links */}
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <span className="text-white/80 text-sm">Don't have an account? </span>
                    <button
                      onClick={() => onNavigate?.('sign-up')}
                      className="text-white hover:text-white/80 underline text-sm transition-colors"
                      disabled={isLoading}
                    >
                      Sign up instead
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onNavigate?.('home')}
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
                  <h2 className="text-3xl mb-4">Continue Your Journey in</h2>
                  <h3 className="text-2xl mb-6">{specialtyData.title}</h3>
                  <p className="text-white/80 leading-relaxed">
                    Access thousands of practice questions, detailed explanations, and performance analytics tailored specifically for your specialty.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">2,500+</div>
                    <div className="text-white/80">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">94%</div>
                    <div className="text-white/80">Pass Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">87%</div>
                    <div className="text-white/80">Avg Score</div>
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
                    Your comprehensive medical exam preparation platform. Join thousands of successful medical professionals who trust PulsePrep.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <CheckCircle className="w-6 h-6 mb-2 mx-auto" />
                    <div>AI-Powered Learning</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <CheckCircle className="w-6 h-6 mb-2 mx-auto" />
                    <div>Expert Explanations</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <CheckCircle className="w-6 h-6 mb-2 mx-auto" />
                    <div>Performance Analytics</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <CheckCircle className="w-6 h-6 mb-2 mx-auto" />
                    <div>Mobile Access</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}