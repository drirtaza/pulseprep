/**
 * Security Dashboard Component - Enhanced for Database Migration
 * Handles security monitoring and audit logs with proper type safety
 * 
 * CRITICAL: This component manages security for medical education platform
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from '../utils/storageUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Activity, 
  Users, 
  Database, 
  RefreshCw,
  Search,
  Download,
  Filter,
  Info,
  XCircle
} from 'lucide-react';
import { AdminData } from '../types';

// Define proper severity types - FIXED: Use string literal union instead of enum
type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

interface SecurityEvent {
  id: string;
  timestamp: string;
  userId?: string;
  adminId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: SecuritySeverity; // FIXED: Use proper string literal type
  details?: any;
  resolved?: boolean;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  activeUsers: number;
  failedLogins: number;
  suspiciousActivity: number;
}

interface SecurityDashboardProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  admin
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    warningEvents: 0,
    activeUsers: 0,
    failedLogins: 0,
    suspiciousActivity: 0
  });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<SecuritySeverity | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Load security data
  useEffect(() => {
    loadSecurityData();
  }, []);

  // Filter events when filters change
  useEffect(() => {
    filterEvents();
  }, [events, selectedSeverity, searchTerm, dateRange]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    
    try {
      // Load security events from database or localStorage
      const eventsResult = await StorageService.safeGetItem('security_events', []);
      const securityEvents = Array.isArray(eventsResult) ? eventsResult : [];
      
      // Generate some sample security events if none exist
      if (securityEvents.length === 0) {
        const sampleEvents = generateSampleSecurityEvents();
        await StorageService.safeSetItem('security_events', JSON.stringify(sampleEvents));
        setEvents(sampleEvents);
      } else {
        setEvents(securityEvents);
      }
      
      // Calculate stats
      calculateStats(securityEvents);
      
      console.log('✅ Security data loaded:', {
        eventsCount: securityEvents.length,
        stats
      });
      
    } catch (error) {
      console.error('❌ Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (securityEvents: SecurityEvent[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todaysEvents = securityEvents.filter(event => 
      new Date(event.timestamp) >= today
    );
    
    const newStats: SecurityStats = {
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
      warningEvents: securityEvents.filter(e => e.severity === 'warning').length,
      activeUsers: getUniqueUserCount(todaysEvents),
      failedLogins: securityEvents.filter(e => 
        e.action === 'failed_login' && new Date(e.timestamp) >= today
      ).length,
      suspiciousActivity: securityEvents.filter(e => 
        e.severity === 'critical' && new Date(e.timestamp) >= today
      ).length
    };
    
    setStats(newStats);
  };

  const getUniqueUserCount = (events: SecurityEvent[]): number => {
    const uniqueUsers = new Set();
    events.forEach(event => {
      if (event.userId) uniqueUsers.add(event.userId);
      if (event.adminId) uniqueUsers.add(event.adminId);
    });
    return uniqueUsers.size;
  };

  const filterEvents = () => {
    let filtered = [...events];
    
    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(event => event.severity === selectedSeverity);
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(search) ||
        event.resource.toLowerCase().includes(search) ||
        event.userId?.toLowerCase().includes(search) ||
        event.adminId?.toLowerCase().includes(search) ||
        event.ipAddress?.toLowerCase().includes(search)
      );
    }
    
    // Filter by date range
    const now = new Date();
    let cutoffDate = new Date(0); // Default to beginning of time
    
    switch (dateRange) {
      case 'today':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        // No filtering
        break;
    }
    
    if (dateRange !== 'all') {
      filtered = filtered.filter(event => new Date(event.timestamp) >= cutoffDate);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredEvents(filtered);
  };

  const generateSampleSecurityEvents = (): SecurityEvent[] => {
    const now = new Date();
    const events: SecurityEvent[] = [];
    
    // Sample security events with proper type safety
    const sampleEvents = [
      {
        action: 'admin_login',
        resource: 'admin_dashboard',
        severity: 'info' as SecuritySeverity,
        details: { success: true }
      },
      {
        action: 'failed_login',
        resource: 'user_auth',
        severity: 'warning' as SecuritySeverity,
        details: { attempts: 0, ip: 'IP_UNKNOWN' }
      },
      {
        action: 'multiple_failed_logins',
        resource: 'user_auth',
        severity: 'critical' as SecuritySeverity,
        details: { attempts: 5, blocked: true }
      },
      {
        action: 'data_export',
        resource: 'user_data',
        severity: 'warning' as SecuritySeverity,
        details: { exportType: 'user_list', recordCount: 150 }
      },
      {
        action: 'password_reset',
        resource: 'user_account',
        severity: 'info' as SecuritySeverity,
        details: { method: 'email' }
      },
      {
        action: 'suspicious_activity',
        resource: 'question_access',
        severity: 'error' as SecuritySeverity,
        details: { unusualPatterns: true, flagged: true }
      }
    ];
    
    // Generate events for the past week
    sampleEvents.forEach((eventTemplate, index) => {
      const timestamp = new Date(now.getTime() - index * 2 * 60 * 60 * 1000); // 2 hours apart
      
      events.push({
        id: `security-${Date.now()}-${index}`,
        timestamp: timestamp.toISOString(),
        userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
        adminId: Math.random() > 0.7 ? admin.id : undefined,
        action: eventTemplate.action,
        resource: eventTemplate.resource,
        resourceId: `resource-${Math.floor(Math.random() * 1000)}`,
        ipAddress: 'IP_UNKNOWN',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: eventTemplate.severity,
        details: eventTemplate.details,
        resolved: Math.random() > 0.3
      });
    });
    
    return events;
  };

  const getSeverityColor = (severity: SecuritySeverity): string => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor platform security and audit logs</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSecurityData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {/* Export functionality */}}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-xl font-semibold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-xl font-semibold text-red-600">{stats.criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.warningEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-semibold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Failed Logins</p>
                <p className="text-xl font-semibold text-orange-600">{stats.failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Suspicious</p>
                <p className="text-xl font-semibold text-purple-600">{stats.suspiciousActivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as SecuritySeverity | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as typeof dateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSeverity('all');
                  setDateRange('week');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No security events found matching your criteria</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(event.severity)}
                    <Badge variant={getSeverityColor(event.severity) as any}>
                      {event.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{event.action.replace(/_/g, ' ').toUpperCase()}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Resource: {event.resource} {event.resourceId && `(${event.resourceId})`}
                    </p>
                    
                    {event.ipAddress && (
                      <p className="text-sm text-gray-600">IP Address: {event.ipAddress}</p>
                    )}
                    
                    {event.details && (
                      <p className="text-sm text-gray-600">
                        Details: {JSON.stringify(event.details)}
                      </p>
                    )}
                    
                    {event.userId && (
                      <p className="text-sm text-gray-600">User ID: {event.userId}</p>
                    )}
                    
                    {event.adminId && (
                      <p className="text-sm text-gray-600">Admin ID: {event.adminId}</p>
                    )}
                  </div>
                  
                  {event.resolved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Resolved
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;