import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { securityService } from '../services/SecurityService';
import { PermissionType, AuditActionType, SecurityAlert } from '../types/security';
import { AdminData, UserData } from '../types';

interface SecurityContextType {
  // Permission checking
  hasPermission: (permission: PermissionType) => boolean;
  hasAllPermissions: (permissions: PermissionType[]) => boolean;
  hasAnyPermission: (permissions: PermissionType[]) => boolean;
  
  // Audit logging
  logAuditEvent: (
    action: AuditActionType,
    details: {
      description: string;
      metadata?: Record<string, any>;
      target?: {
        type: 'user' | 'admin' | 'system' | 'content' | 'report';
        id: string;
        name?: string;
      };
    },
    severity?: 'low' | 'medium' | 'high' | 'critical',
    status?: 'success' | 'failure' | 'warning'
  ) => Promise<void>;
  
  // Security alerts
  securityAlerts: SecurityAlert[];
  unresolvedAlertsCount: number;
  refreshSecurityAlerts: () => void;
  resolveAlert: (alertId: string, notes?: string) => void;
  
  // Session management
  sessionTimeout: boolean;
  resetSessionTimeout: () => void;
  
  // Current user/admin
  currentUser: AdminData | UserData | null;
  userRole: string | null;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
  currentUser: AdminData | UserData | null;
}

export function SecurityProvider({ children, currentUser }: SecurityProviderProps) {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Update user role when current user changes
  useEffect(() => {
    if (currentUser) {
      setUserRole('role' in currentUser ? currentUser.role : 'user');
    } else {
      setUserRole(null);
    }
  }, [currentUser]);

  // Load security alerts on mount and periodically refresh
  useEffect(() => {
    refreshSecurityAlerts();
    
    const interval = setInterval(refreshSecurityAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for session timeout events
  useEffect(() => {
    const handleSessionTimeout = () => {
      setSessionTimeout(true);
    };

    window.addEventListener('session-timeout', handleSessionTimeout);
    return () => window.removeEventListener('session-timeout', handleSessionTimeout);
  }, []);

  const hasPermission = (permission: PermissionType): boolean => {
    if (!userRole) return false;
    return securityService.hasPermission(userRole, permission);
  };

  const hasAllPermissions = (permissions: PermissionType[]): boolean => {
    if (!userRole) return false;
    return securityService.hasAllPermissions(userRole, permissions);
  };

  const hasAnyPermission = (permissions: PermissionType[]): boolean => {
    if (!userRole) return false;
    return securityService.hasAnyPermission(userRole, permissions);
  };

  const logAuditEvent = async (
    action: AuditActionType,
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
  ): Promise<void> => {
    if (!currentUser) return;
    
    await securityService.logAuditEvent(action, currentUser, details, severity, status);
  };

  const refreshSecurityAlerts = () => {
    const alerts = securityService.getSecurityAlerts({ resolved: false, limit: 50 });
    setSecurityAlerts(alerts);
  };

  const resolveAlert = (alertId: string, notes?: string) => {
    if (currentUser && 'role' in currentUser) {
      securityService.resolveSecurityAlert(alertId, currentUser.name, notes);
      refreshSecurityAlerts();
      
      // Log the alert resolution
      logAuditEvent('security.alert-resolved' as AuditActionType, {
        description: `Security alert ${alertId} resolved`,
        metadata: { alertId, notes },
        target: { type: 'system', id: alertId }
      });
    }
  };

  const resetSessionTimeout = () => {
    setSessionTimeout(false);
  };

  const unresolvedAlertsCount = securityAlerts.filter(alert => !alert.resolved).length;

  const contextValue: SecurityContextType = {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    logAuditEvent,
    securityAlerts,
    unresolvedAlertsCount,
    refreshSecurityAlerts,
    resolveAlert,
    sessionTimeout,
    resetSessionTimeout,
    currentUser,
    userRole
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Permission Guard Component
interface PermissionGuardProps {
  permissions: PermissionType | PermissionType[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permissions, 
  requireAll = true, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasAllPermissions, hasAnyPermission, logAuditEvent } = useSecurity();
  
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissionArray)
    : hasAnyPermission(permissionArray);

  // Log permission denied attempts
  useEffect(() => {
    if (!hasAccess) {
      logAuditEvent('security.permission-denied', {
        description: `Access denied for permissions: ${permissionArray.join(', ')}`,
        metadata: { 
          requiredPermissions: permissionArray,
          requireAll 
        }
      }, 'medium', 'warning');
    }
  }, [hasAccess, permissionArray, requireAll, logAuditEvent]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Session Timeout Modal Component
export function SessionTimeoutModal() {
  const { sessionTimeout, resetSessionTimeout } = useSecurity();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (sessionTimeout) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Auto logout
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionTimeout]);

  if (!sessionTimeout) return null;

  const handleExtendSession = () => {
    resetSessionTimeout();
    setCountdown(60);
    
    // Update session activity
    const currentSessionId = securityService.getCurrentSessionId();
    if (currentSessionId !== 'unknown') {
      securityService.updateSessionActivity(currentSessionId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session About to Expire</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your session will expire in <span className="font-semibold text-red-600">{countdown}</span> seconds due to inactivity.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleExtendSession}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Extend Session
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}