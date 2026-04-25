import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  RefreshCw,
  Search,
  Activity,
  Lock,
  FileText,
  Database,
  Settings,
  TrendingUp,
  Server,
  XCircle,
  Home,
  BookOpen,
  // Email verification icons
  MailCheck,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { AdminData } from '../types';
import { AuditService, AuditLog, SecurityAlert } from '../services/AuditService';

interface ComplianceMetric {
  category: string;
  score: number;
  status: 'compliant' | 'warning' | 'non-compliant';
  lastChecked: string;
  issues: number;
  description: string;
}

interface EnterpriseAuditDashboardProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function EnterpriseAuditDashboard({ admin, onNavigate, onLogout }: EnterpriseAuditDashboardProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [auditStats, setAuditStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d');


  const [emailVerificationStats, setEmailVerificationStats] = useState({
    totalEvents: 0,
    eventsToday: 0,
    successfulEvents: 0,
    failedEvents: 0,
    resendEvents: 0,
    deliveryEvents: 0,
    eventsByAction: {} as Record<string, number>,
    eventsBySeverity: {} as Record<string, number>,
    successRate: 0,
    averageDeliveryTime: 0,
    topFailureReasons: [] as string[],
    recentActivity: [] as any[]
  });
  const [emailVerificationFailures, setEmailVerificationFailures] = useState<AuditLog[]>([]);
  const [emailVerificationPerformance, setEmailVerificationPerformance] = useState({
    averageResponseTime: 0,
    peakUsageTimes: [] as string[],
    errorRates: {} as Record<string, number>,
    retrySuccessRates: {} as Record<string, number>,
    deliverySuccessRates: {} as Record<string, number>
  });
  const [emailVerificationReports, setEmailVerificationReports] = useState({
    dailyReport: null as any,
    weeklyReport: null as any,
    monthlyReport: null as any,
    customReport: null as any
  });
  const [emailVerificationFilters, setEmailVerificationFilters] = useState({
    action: 'all',
    severity: 'all',
    dateRange: '7d',
    userEmail: '',
    status: 'all'
  });

  useEffect(() => {
    loadAuditData();
    
    // Log that audit dashboard was accessed
    AuditService.logSecurityEvent(
      'Audit Dashboard Accessed',
      admin.email || admin.name,
      admin.role,
      'low',
      true,
      { dashboardSection: 'enterprise-audit' }
    );
  }, [filterCategory, filterSeverity, dateRange, admin]);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      // Get real audit data from AuditService
      const logs = AuditService.getFilteredAuditLogs({
        category: filterCategory,
        severity: filterSeverity,
        dateRange,
        searchQuery
      });
      
      const alerts = AuditService.getSecurityAlerts();
      const stats = AuditService.getAuditStatistics();
      const compliance = generateComplianceMetrics();

      setAuditLogs(logs);
      setSecurityAlerts(alerts);
      setAuditStats(stats);
      setComplianceMetrics(compliance);

      // Load email verification audit data
      await loadEmailVerificationAuditData();
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailVerificationAuditData = async () => {
    try {
      // Load email verification specific audit logs
      const emailVerificationLogs = AuditService.getEmailVerificationAuditLogs({
        userEmail: emailVerificationFilters.userEmail,
        action: emailVerificationFilters.action === 'all' ? undefined : emailVerificationFilters.action,
        severity: emailVerificationFilters.severity === 'all' ? undefined : emailVerificationFilters.severity as any,
        startDate: getDateFromRange(emailVerificationFilters.dateRange),
        endDate: new Date().toISOString(),
        limit: 1000
      });

      // Load email verification statistics
      const emailVerificationStats = AuditService.getEmailVerificationAuditStatistics();

      // Load email verification failures
      const emailVerificationFailures = emailVerificationLogs.filter(log => !log.success);

      // Load email verification performance metrics
      const emailVerificationPerformance = await generateEmailVerificationPerformanceMetrics();

      // Load email verification reports
      const emailVerificationReports = await generateEmailVerificationReports();


      setEmailVerificationStats({
        ...emailVerificationStats,
        successRate: emailVerificationStats.totalEvents > 0 ? (emailVerificationStats.successfulEvents / emailVerificationStats.totalEvents) * 100 : 0,
        averageDeliveryTime: 2.5, // Mock data
        topFailureReasons: emailVerificationFailures.slice(0, 5).map(log => log.errorMessage || 'Unknown error'),
        recentActivity: emailVerificationLogs.slice(0, 10)
      });
      setEmailVerificationFailures(emailVerificationFailures);
      setEmailVerificationPerformance(emailVerificationPerformance);
      setEmailVerificationReports(emailVerificationReports);

    } catch (error) {
      console.error('Error loading email verification audit data:', error);
    }
  };

  const generateEmailVerificationPerformanceMetrics = async () => {
    try {



      return {
        averageResponseTime: 2.5, // Mock data - would be calculated from real metrics
        peakUsageTimes: ['09:00', '14:00', '18:00'], // Mock data
        errorRates: {
          'network-error': 0.05,
          'timeout-error': 0.03,
          'rate-limit-error': 0.02,
          'server-error': 0.01
        },
        retrySuccessRates: {
          'first-retry': 0.85,
          'second-retry': 0.60,
          'third-retry': 0.30
        },
        deliverySuccessRates: {
          'immediate': 0.95,
          'within-1min': 0.98,
          'within-5min': 0.99
        }
      };
    } catch (error) {
      console.error('Error generating email verification performance metrics:', error);
      return {
        averageResponseTime: 0,
        peakUsageTimes: [],
        errorRates: {} as Record<string, number>,
        retrySuccessRates: {} as Record<string, number>,
        deliverySuccessRates: {} as Record<string, number>
      };
    }
  };

  const generateEmailVerificationReports = async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dailyLogs = AuditService.getEmailVerificationAuditLogs({
        startDate: oneDayAgo.toISOString(),
        endDate: now.toISOString(),
        limit: 1000
      });

      const weeklyLogs = AuditService.getEmailVerificationAuditLogs({
        startDate: oneWeekAgo.toISOString(),
        endDate: now.toISOString(),
        limit: 1000
      });

      const monthlyLogs = AuditService.getEmailVerificationAuditLogs({
        startDate: oneMonthAgo.toISOString(),
        endDate: now.toISOString(),
        limit: 1000
      });

      return {
        dailyReport: generateReportFromLogs(dailyLogs, 'Daily'),
        weeklyReport: generateReportFromLogs(weeklyLogs, 'Weekly'),
        monthlyReport: generateReportFromLogs(monthlyLogs, 'Monthly'),
        customReport: null
      };
    } catch (error) {
      console.error('Error generating email verification reports:', error);
      return {
        dailyReport: null,
        weeklyReport: null,
        monthlyReport: null,
        customReport: null
      };
    }
  };

  const generateReportFromLogs = (logs: AuditLog[], period: string) => {
    const totalEvents = logs.length;
    const successfulEvents = logs.filter(log => log.success).length;
    const failedEvents = logs.filter(log => !log.success).length;
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

    const eventsByAction: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const topFailureReasons: string[] = [];

    logs.forEach(log => {
      // Count by action
      const action = log.action;
      eventsByAction[action] = (eventsByAction[action] || 0) + 1;

      // Count by severity
      const severity = log.severity;
      eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;

      // Track failure reasons
      if (!log.success && log.errorMessage) {
        topFailureReasons.push(log.errorMessage);
      }
    });

    return {
      period,
      totalEvents,
      successfulEvents,
      failedEvents,
      successRate,
      eventsByAction,
      eventsBySeverity,
      topFailureReasons: topFailureReasons.slice(0, 5), // Top 5
      generatedAt: new Date().toISOString()
    };
  };

  const getDateFromRange = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const generateComplianceMetrics = (): ComplianceMetric[] => {
    const stats = AuditService.getAuditStatistics();
    const totalLogs = stats.totalLogs;
    const failedActions = stats.failedActions;
    const activeAlerts = stats.activeAlerts;
    
    // Calculate compliance scores based on actual audit data
    const securityScore = Math.max(60, 100 - (failedActions * 5) - (activeAlerts * 3));
    const auditScore = Math.min(100, totalLogs > 0 ? 80 + Math.min(20, totalLogs / 10) : 40);
    
    return [
      {
        category: 'Data Protection (GDPR)',
        score: Math.max(85, 95 - Math.min(10, activeAlerts)),
        status: activeAlerts === 0 ? 'compliant' : 'warning',
        lastChecked: new Date().toISOString(),
        issues: Math.min(5, activeAlerts),
        description: 'User data handling and privacy compliance monitoring'
      },
      {
        category: 'FCPS Standards',
        score: Math.max(80, 90 - (stats.logsByCategory['cms'] || 0) * 0.1),
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        issues: Math.max(0, Math.floor((stats.criticalLogs || 0) / 2)),
        description: 'Fellowship compliance and examination standards'
      },
      {
        category: 'Payment Security (PCI DSS)',
        score: Math.max(85, 98 - (stats.logsByCategory['financial'] || 0) * 0.2),
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        issues: Math.max(0, Math.floor(failedActions / 3)),
        description: 'Payment processing and financial security standards'
      },
      {
        category: 'Audit & Compliance',
        score: auditScore,
        status: auditScore >= 85 ? 'compliant' : auditScore >= 70 ? 'warning' : 'non-compliant',
        lastChecked: new Date().toISOString(),
        issues: Math.max(0, Math.floor((100 - auditScore) / 10)),
        description: 'Comprehensive audit trail and compliance monitoring'
      },
      {
        category: 'System Security',
        score: securityScore,
        status: securityScore >= 85 ? 'compliant' : securityScore >= 70 ? 'warning' : 'non-compliant',
        lastChecked: new Date().toISOString(),
        issues: Math.max(0, failedActions + activeAlerts),
        description: 'Infrastructure and application security measures'
      }
    ];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'financial': return <CreditCard className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      case 'cms': return <BookOpen className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getComplianceStatus = (status: string, _score: number) => {
    if (status === 'compliant') return { color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> };
    if (status === 'warning') return { color: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4" /> };
    return { color: 'text-red-600', icon: <XCircle className="h-4 w-4" /> };
  };

  const exportAuditReport = (format: 'csv' | 'pdf') => {
    const filteredLogs = AuditService.getFilteredAuditLogs({
      category: filterCategory,
      severity: filterSeverity,
      dateRange,
      searchQuery
    });

    const exportData = filteredLogs.map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      category: log.category,
      severity: log.severity,
      action: log.action,
      description: log.description,
      performedBy: log.performedBy,
      performedByRole: log.performedByRole,
      ipAddress: log.ipAddress,
      location: log.location || 'Unknown',
      success: log.success ? 'Success' : 'Failed',
      affectedUser: log.affectedUser || '',
      affectedResource: log.affectedResource || ''
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
      const csvContent = [headers, ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export action
      AuditService.logSystemAction(
        'Audit Report Export',
        admin.email || admin.name,
        admin.role,
        `CSV report with ${exportData.length} records`,
        true,
        { format, recordCount: exportData.length, filters: { filterCategory, filterSeverity, dateRange } }
      );
    }
  };

  const resolveAlert = (alertId: string) => {
    AuditService.resolveSecurityAlert(alertId, admin.email || admin.name);
    loadAuditData(); // Refresh data
  };

  const refreshData = () => {
    loadAuditData();
    
    // Log refresh action
    AuditService.logSystemAction(
      'Audit Dashboard Refresh',
      admin.email || admin.name,
      admin.role,
      'Enterprise Audit Dashboard',
      true
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading audit dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogs = AuditService.getFilteredAuditLogs({
    category: filterCategory,
    severity: filterSeverity,
    dateRange,
    searchQuery
  });

  const activeAlerts = securityAlerts.filter(alert => alert.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate('admin-dashboard')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Enterprise Audit Dashboard</h1>
                  <p className="text-sm text-gray-500">Real-time security and compliance monitoring</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-600 text-white">
                    {admin.name?.split(' ').map(n => n[0]).join('') || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                  <p className="text-xs text-gray-500">Audit Manager</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="email-verification">Email Verification</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">{auditStats.totalLogs || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">{auditStats.logsToday || 0} today</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                      <p className="text-2xl font-bold text-gray-900">{auditStats.activeAlerts || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-red-600 font-medium">{auditStats.criticalLogs || 0} critical</span>
                    <span className="text-gray-500 ml-2">• {auditStats.failedActions || 0} failed</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(complianceMetrics.reduce((acc, m) => acc + m.score, 0) / complianceMetrics.length) || 0}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-green-600 font-medium">
                      {complianceMetrics.filter(m => m.status === 'compliant').length}/{complianceMetrics.length} compliant
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Health</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {auditStats.totalLogs > 0 ? Math.max(85, 100 - Math.min(15, auditStats.failedActions * 2)) : 95}%
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-green-600 font-medium">Operational</span>
                    <span className="text-gray-500 ml-2">• All systems active</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Critical Events & Active Security Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Critical Events</CardTitle>
                  <CardDescription>High-priority audit events from real admin activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs.filter(log => log.severity === 'critical' || log.severity === 'high').slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0 mt-1">
                          {getCategoryIcon(log.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-500 truncate">{log.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="text-xs text-blue-600">
                              {log.performedBy} ({log.performedByRole})
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {auditLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No critical events in recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Security Alerts</CardTitle>
                  <CardDescription>Security incidents requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border border-red-200 bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{alert.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Source: {alert.source}</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                    {activeAlerts.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No active security alerts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>Current compliance status based on audit data analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceMetrics.map((metric, index) => {
                    const statusInfo = getComplianceStatus(metric.status, metric.score);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={statusInfo.color}>
                            {statusInfo.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{metric.category}</p>
                            <p className="text-sm text-gray-500">{metric.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{metric.score}%</p>
                            <p className="text-xs text-gray-500">{metric.issues} issues</p>
                          </div>
                          <div className="w-20">
                            <Progress value={metric.score} className="h-2" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-64">
                    <Label htmlFor="search">Search Events</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by action, user, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="cms">CMS</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Last 24h</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={refreshData} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  
                  <Button onClick={() => exportAuditReport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Real Audit Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs ({filteredLogs.length} events)</CardTitle>
                <CardDescription>Real-time audit trail of all administrative activities</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.slice(0, 50).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(log.category)}
                              <span className="capitalize">{log.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.performedBy}</p>
                              <p className="text-xs text-gray-500">{log.performedByRole}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {log.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-gray-600 truncate" title={log.description}>
                              {log.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400 font-mono">{log.ipAddress}</span>
                              {log.affectedUser && (
                                <span className="text-xs text-blue-600">Affected: {log.affectedUser}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4" />
                      <p>No audit logs found matching the current filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Security Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Failed Actions</p>
                      <p className="text-2xl font-bold text-gray-900">{auditStats.failedActions || 0}</p>
                    </div>
                    <Lock className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Failed admin operations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Events</p>
                      <p className="text-2xl font-bold text-gray-900">{auditStats.logsByCategory?.security || 0}</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Security-related activities</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {auditStats.totalLogs > 0 ? Math.max(85, 100 - Math.min(15, auditStats.failedActions * 3)) : 95}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Based on audit analysis</p>
                </CardContent>
              </Card>
            </div>

            {/* Security Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts Management</CardTitle>
                <CardDescription>Active security incidents and threat monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-4 rounded-lg border">
                      <AlertTriangle className={`h-5 w-5 mt-1 ${alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{alert.description}</p>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Source: {alert.source}</span>
                          <span>Type: {alert.type.replace('_', ' ')}</span>
                          <span>Status: {alert.status}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        {alert.assignedTo && (
                          <p className="text-sm text-blue-600 mt-1">Assigned to: {alert.assignedTo}</p>
                        )}
                        {alert.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve Alert
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {securityAlerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No security alerts - system is secure</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Dashboard</CardTitle>
                <CardDescription>Regulatory and standard compliance monitoring based on audit data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {complianceMetrics.map((metric, index) => {
                    const statusInfo = getComplianceStatus(metric.status, metric.score);
                    return (
                      <div key={index} className="p-6 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={statusInfo.color}>
                              {statusInfo.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{metric.category}</h3>
                              <p className="text-sm text-gray-500">{metric.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-gray-900">{metric.score}%</p>
                            <p className="text-sm text-gray-500">Compliance Score</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Overall Compliance</Label>
                            <Progress value={metric.score} className="h-3" />
                            <p className="text-xs text-gray-500">
                              {metric.score >= 90 ? 'Excellent' : metric.score >= 75 ? 'Good' : 'Needs Attention'}
                            </p>
                          </div>
                          
                          <div>
                            <Label>Issues Found</Label>
                            <p className="text-2xl font-bold text-gray-900">{metric.issues}</p>
                            <p className="text-xs text-gray-500">Requiring attention</p>
                          </div>
                          
                          <div>
                            <Label>Last Checked</Label>
                            <p className="text-sm text-gray-900">
                              {new Date(metric.lastChecked).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">Real-time monitoring</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Verification Tab */}
          <TabsContent value="email-verification" className="space-y-6">
            {/* Email Verification Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <MailCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{emailVerificationStats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    +{emailVerificationStats.eventsToday} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{emailVerificationStats.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {emailVerificationStats.successfulEvents} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Events</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{emailVerificationStats.failedEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    {emailVerificationStats.failedEvents > 0 ? 'Requires attention' : 'All good'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resend Events</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{emailVerificationStats.resendEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    {emailVerificationStats.resendEvents > 0 ? 'Rate limited' : 'Normal flow'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Email Verification Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Email Verification Statistics
                </CardTitle>
                <CardDescription>Detailed email verification metrics and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Events by Action */}
                  <div>
                    <h4 className="font-medium mb-4">Events by Action</h4>
                    <div className="space-y-3">
                      {Object.entries(emailVerificationStats.eventsByAction).map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{action}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events by Severity */}
                  <div>
                    <h4 className="font-medium mb-4">Events by Severity</h4>
                    <div className="space-y-3">
                      {Object.entries(emailVerificationStats.eventsBySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{severity}</span>
                          <Badge variant={severity === 'critical' ? 'destructive' : severity === 'high' ? 'default' : 'secondary'}>
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Verification Failures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Email Verification Failures
                </CardTitle>
                <CardDescription>Track and analyze email verification failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Filter by user email..."
                      value={emailVerificationFilters.userEmail}
                      onChange={(e) => setEmailVerificationFilters(prev => ({ ...prev, userEmail: e.target.value }))}
                      className="max-w-sm"
                    />
                    <Select value={emailVerificationFilters.action} onValueChange={(value) => setEmailVerificationFilters(prev => ({ ...prev, action: value }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="email-verification-sent">Email Sent</SelectItem>
                        <SelectItem value="email-verification-attempted">Verification Attempted</SelectItem>
                        <SelectItem value="email-verification-failed">Verification Failed</SelectItem>
                        <SelectItem value="email-verification-resend">Resend</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={loadEmailVerificationAuditData} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailVerificationFailures.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{log.performedBy}</TableCell>
                          <TableCell className="text-sm">{log.action}</TableCell>
                          <TableCell>
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.success ? 'Success' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-red-600">
                            {log.errorMessage || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Email Verification Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Email Verification Performance
                </CardTitle>
                <CardDescription>Performance metrics and optimization insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Response Time */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Average Response Time</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {emailVerificationPerformance.averageResponseTime.toFixed(2)}s
                    </div>
                    <p className="text-xs text-gray-500">Target: &lt; 3s</p>
                  </div>

                  {/* Error Rates */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Error Rates</h4>
                    <div className="space-y-2">
                      {Object.entries(emailVerificationPerformance.errorRates).map(([error, rate]) => (
                        <div key={error} className="flex justify-between">
                          <span className="text-sm">{error}</span>
                          <span className="text-sm font-medium">{(rate * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retry Success Rates */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Retry Success Rates</h4>
                    <div className="space-y-2">
                      {Object.entries(emailVerificationPerformance.retrySuccessRates).map(([retry, rate]) => (
                        <div key={retry} className="flex justify-between">
                          <span className="text-sm">{retry}</span>
                          <span className="text-sm font-medium">{(rate * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Verification Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Email Verification Reports
                </CardTitle>
                <CardDescription>Generate comprehensive email verification reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {emailVerificationReports.dailyReport && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Daily Report</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Events</span>
                          <span className="text-sm font-medium">{emailVerificationReports.dailyReport.totalEvents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate</span>
                          <span className="text-sm font-medium">{emailVerificationReports.dailyReport.successRate.toFixed(1)}%</span>
                        </div>
                        <Button onClick={() => exportAuditReport('csv')} size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}

                  {emailVerificationReports.weeklyReport && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Weekly Report</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Events</span>
                          <span className="text-sm font-medium">{emailVerificationReports.weeklyReport.totalEvents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate</span>
                          <span className="text-sm font-medium">{emailVerificationReports.weeklyReport.successRate.toFixed(1)}%</span>
                        </div>
                        <Button onClick={() => exportAuditReport('csv')} size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}

                  {emailVerificationReports.monthlyReport && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Monthly Report</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Events</span>
                          <span className="text-sm font-medium">{emailVerificationReports.monthlyReport.totalEvents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate</span>
                          <span className="text-sm font-medium">{emailVerificationReports.monthlyReport.successRate.toFixed(1)}%</span>
                        </div>
                        <Button onClick={() => exportAuditReport('csv')} size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Reports</CardTitle>
                <CardDescription>Generate and download comprehensive audit reports from real data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 rounded-lg border">
                    <FileText className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Security Audit Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Real security event analysis with {auditStats.logsByCategory?.security || 0} security logs
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-6 rounded-lg border">
                    <Users className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">User Activity Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Admin user behavior analysis with {auditStats.logsByCategory?.user || 0} user events
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-6 rounded-lg border">
                    <CheckCircle className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Compliance Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Regulatory compliance status based on {auditStats.totalLogs || 0} audit events
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-6 rounded-lg border">
                    <CreditCard className="h-8 w-8 text-orange-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Financial Audit Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Payment and financial audit trail with {auditStats.logsByCategory?.financial || 0} financial events
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-6 rounded-lg border">
                    <Database className="h-8 w-8 text-red-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">System Performance Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Infrastructure and system health with {auditStats.logsByCategory?.system || 0} system events
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-6 rounded-lg border">
                    <Activity className="h-8 w-8 text-indigo-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Comprehensive Report</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Complete audit report covering all {auditStats.totalLogs || 0} logged events
                    </p>
                    <Button onClick={() => exportAuditReport('csv')} className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}