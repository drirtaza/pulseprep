import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PageType, AdminData, AdminRole } from '../types';
import { securityService } from '../services/SecurityService';
import { analyticsService } from '../services/AnalyticsService';

// Custom SVG icons to replace lucide-react
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface AdminLoginPageProps {
  onNavigate: (page: PageType) => void;
  onAdminLogin: (admin: AdminData) => void;
  adminAccessRole?: AdminRole | null;
}

export default function AdminLoginPage({ onNavigate, onAdminLogin, adminAccessRole }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    isSuspended: boolean;
    adminName: string;
    reason?: string;
  }>({ isSuspended: false, adminName: '' });

  // Default/hardcoded admin credentials for initial access
  const defaultAdmins = [
    {
      id: 'default-super-admin',
      name: 'Super Administrator',
      email: 'admin@pulseprep.com',
      password: 'admin123',
      role: 'super-admin' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      status: 'active' as const
    },
    {
      id: 'default-finance-admin',
      name: 'Finance Manager',
      email: 'finance@pulseprep.com',
      password: 'finance123',
      role: 'finance-manager' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      status: 'active' as const
    },
    {
      id: 'default-content-admin',
      name: 'Content Manager',
      email: 'content@pulseprep.com',
      password: 'content123',
      role: 'content-manager' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      status: 'active' as const
    },
    {
      id: 'default-audit-admin',
      name: 'Audit Manager',
      email: 'audit@pulseprep.com',
      password: 'audit123',
      role: 'audit-manager' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      status: 'active' as const
    }
  ];

  const validateCredentials = (email: string, password: string): { admin: AdminData | null, statusIssue?: string } => {
    // Check dynamically created admins FIRST (they take precedence over defaults)
    try {
      const storedAdmins = JSON.parse(localStorage.getItem('all_admins') || '[]');
      console.log('🔍 Checking stored admins:', storedAdmins.length, 'admins found');
      
      const dynamicAdmin = storedAdmins.find((admin: any) => 
        admin.email.toLowerCase() === email.toLowerCase() && 
        admin.password === password
      );
      
      if (dynamicAdmin) {
        console.log('✅ Found stored admin:', dynamicAdmin.email, dynamicAdmin.role, 'Status:', dynamicAdmin.status);
        
        // Check status for stored admins
        if (dynamicAdmin.status !== 'active') {
          console.log('❌ Admin account is not active:', dynamicAdmin.status);
          return { 
            admin: null, 
            statusIssue: dynamicAdmin.status === 'suspended' ? 'suspended' : 'deleted'
          };
        }
        
        // Return admin data without password
        const { password: _, ...adminData } = dynamicAdmin;
        return { admin: adminData };
      } else {
        console.log('❌ No matching stored admin found for:', email);
        // Debug: Show all stored admin emails for comparison
        storedAdmins.forEach((admin: any, index: number) => {
          console.log(`  ${index + 1}. ${admin.email} (${admin.role}) - ${admin.status}`);
        });
      }
    } catch (error) {
      console.error('Error checking stored admins:', error);
    }

    // Then check default/hardcoded admins (but also check their status from stored data)
    const defaultAdmin = defaultAdmins.find(admin => 
      admin.email.toLowerCase() === email.toLowerCase() && admin.password === password
    );
    
    if (defaultAdmin) {
      console.log('✅ Found default admin:', defaultAdmin.email, defaultAdmin.role);
      
      // Check if this default admin has been modified in stored data
      try {
        const storedAdmins = JSON.parse(localStorage.getItem('all_admins') || '[]');
        const storedVersionOfDefault = storedAdmins.find((admin: any) => 
          admin.email.toLowerCase() === defaultAdmin.email.toLowerCase()
        );
        
        if (storedVersionOfDefault) {
          console.log('🔄 Default admin has stored version with status:', storedVersionOfDefault.status);
          // If the default admin exists in stored admins, use the stored status
          if (storedVersionOfDefault.status !== 'active') {
            console.log('❌ Default admin account is not active:', storedVersionOfDefault.status);
            return { 
              admin: null, 
              statusIssue: storedVersionOfDefault.status === 'suspended' ? 'suspended' : 'deleted'
            };
          }
          
          // Use the stored admin data (which might have updated info)
          const { password: _, ...adminData } = storedVersionOfDefault;
          return { admin: adminData };
        }
      } catch (error) {
        console.error('Error checking default admin status:', error);
      }
      
      // If no stored version exists, use the default admin (always active)
      const { password: _, ...adminData } = defaultAdmin;
      return { admin: adminData as AdminData };
    }

    console.log('❌ No admin found for credentials:', email);
    return { admin: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuspensionInfo({ isSuspended: false, adminName: '' });
    setIsLoading(true);

    try {
      // Check if account is locked
      if (securityService.isAccountLocked(email)) {
        setError('Account temporarily locked due to multiple failed attempts. Please try again later.');
        setIsLoading(false);
        return;
      }

      // Validate credentials
      const { admin: adminData, statusIssue } = validateCredentials(email, password);
      
      // Handle status issues (suspended/deleted admin)
      if (statusIssue && !adminData) {
        console.log('❌ Admin login blocked due to status:', statusIssue);
        
        // Find admin info for display
        try {
          const storedAdmins = JSON.parse(localStorage.getItem('all_admins') || '[]');
          const suspendedAdmin = storedAdmins.find((admin: any) => 
            admin.email.toLowerCase() === email.toLowerCase()
          );
          
          if (suspendedAdmin) {
            setSuspensionInfo({
              isSuspended: true,
              adminName: suspendedAdmin.name,
              reason: statusIssue === 'suspended' 
                ? 'Your administrator account has been suspended.' 
                : 'Your administrator account has been deleted.'
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error getting suspended admin info:', error);
        }
        
        // Fallback error message
        setError(statusIssue === 'suspended' 
          ? 'Your administrator account has been suspended. Contact the Super Administrator for assistance.'
          : 'Your administrator account has been deleted. Contact the Super Administrator for assistance.'
        );
        setIsLoading(false);
        return;
      }
      
      if (adminData) {
        // Successful login
        console.log('✅ Admin login successful:', adminData);
        
        // Record successful login attempt
        securityService.recordLoginAttempt(email, true);
        
        // Log successful admin login
        await securityService.logAuditEvent('auth.admin-login', adminData, {
          description: `Admin ${adminData.name} logged in successfully`,
          metadata: { 
            role: adminData.role,
            email: adminData.email,
            loginMethod: 'credentials'
          }
        });
        
        // Track successful admin login analytics
        analyticsService.trackEvent('auth.admin-login-success', adminData, {
          role: adminData.role,
          email: adminData.email,
          loginMethod: 'credentials',
          attempts: attempts + 1
        });
        
        // Reset attempts on successful login
        setAttempts(0);
        
        // 🔐 NEW: Validate role-specific access before calling login handler
        const storedAccessRole = localStorage.getItem('admin_access_role') as AdminRole | null;
        const currentAccessRole = adminAccessRole || storedAccessRole;
        
        if (currentAccessRole && adminData.role !== currentAccessRole) {
          console.error(`❌ Role access violation: ${adminData.role} trying to access via ${currentAccessRole} shortcut`);
          setError(`Access denied: You can only log in as ${currentAccessRole} using this access method.`);
          setIsLoading(false);
          console.log('🚫 BLOCKING LOGIN - Role validation failed');
          return; // ✅ CRITICAL: This should prevent login
        }
        
        // Only call login handler if role validation passes
        console.log('✅ Role validation passed, calling onAdminLogin');
        onAdminLogin(adminData);
      } else {
        // Failed login
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Record failed login attempt
        securityService.recordLoginAttempt(email, false, 'Invalid credentials');
        
        // Log failed admin login attempt
        await securityService.logAuditEvent('auth.admin-login-failed', {
          id: 'unknown',
          name: 'Unknown Admin',
          fullName: 'Unknown Admin',
          email: email,
          specialty: 'medicine',
          studyMode: 'guided',
          registrationDate: new Date().toISOString(),
          paymentStatus: 'pending',
          phone: 'unknown',
          cnic: 'unknown'
        }, {
          description: `Failed admin login attempt for email: ${email}`,
          metadata: { 
            email,
            reason: 'Invalid credentials',
            attempts: newAttempts
          }
        }, 'high', 'failure');
        
        // Track failed admin login analytics
        analyticsService.trackEvent('auth.admin-login-failed', null, {
          email,
          reason: 'Invalid credentials',
          attempts: newAttempts
        });

        if (newAttempts >= 3) {
          setError('Too many failed attempts. Account will be temporarily locked.');
          // Lock account after 3 failed attempts
          securityService.lockAccount(email);
        } else {
          setError(`Invalid email or password. ${3 - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('An error occurred during login. Please try again.');
      
      // Track login error
      analyticsService.trackEvent('auth.admin-login-error', null, {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          onClick={() => onNavigate('home')}
          className="mb-6 bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShieldIcon className="h-10 w-10 text-red-300" />
              </div>
              <h1 className="text-2xl text-white mb-2">Admin Access</h1>
              <p className="text-slate-300 text-sm">
                Secure administrator login portal
              </p>
              
              {/* Role-Specific Access Indicator */}
              {(adminAccessRole || localStorage.getItem('admin_access_role')) && (
                <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <KeyIcon className="h-4 w-4 text-amber-300" />
                    <span className="text-amber-200 text-sm font-medium">
                      Role-Specific Access: {(adminAccessRole || localStorage.getItem('admin_access_role'))?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-amber-100 text-xs mt-1 text-center">
                    Only {(adminAccessRole || localStorage.getItem('admin_access_role'))?.replace('-', ' ')} accounts can log in via this access method
                  </p>
                </div>
              )}
            </div>

            {/* Admin Suspension Alert */}
            {suspensionInfo.isSuspended && (
              <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-300 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-red-200 font-medium">Account Access Denied</h4>
                    </div>
                    <p className="text-red-100 text-sm">
                      Hello {suspensionInfo.adminName}, your administrator account access has been restricted and you cannot log in at this time.
                    </p>
                    {suspensionInfo.reason && (
                      <p className="text-red-100 text-sm">
                        <strong>Status:</strong> {suspensionInfo.reason}
                      </p>
                    )}
                    <div className="pt-2 border-t border-red-400/30">
                      <p className="text-red-200 text-sm">
                        <strong>Need assistance?</strong> Contact the Super Administrator:
                      </p>
                      <ul className="text-red-100 text-sm mt-1 space-y-1">
                        <li>📧 Email: admin@pulseprep.com</li>
                        <li>📞 Phone: +92-300-PULSE-00</li>
                        <li>💬 Internal Support: Check your internal communication channels</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-slate-200 text-sm mb-2">
                  Admin Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin email"
                  required
                  disabled={isLoading || suspensionInfo.isSuspended}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-slate-200 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                    disabled={isLoading || suspensionInfo.isSuspended}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    disabled={isLoading || suspensionInfo.isSuspended}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || suspensionInfo.isSuspended}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Authenticating...
                  </div>
                ) : suspensionInfo.isSuspended ? (
                  <div className="flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Access Denied
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Admin Login
                  </div>
                )}
              </Button>
            </form>



            {/* Security Notice */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <ShieldIcon className="h-5 w-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-300 text-sm mb-1">Security Notice</h4>
                  <p className="text-yellow-200 text-xs leading-relaxed">
                    This is a secure area. All login attempts are monitored and logged. 
                    Unauthorized access attempts will be reported.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}