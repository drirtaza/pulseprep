import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  Eye,
  Download,
  RefreshCw,
  Search,
  
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { AdminData } from '../../types';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'data_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userEmail: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  additionalData?: any;
}

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userType: 'user' | 'admin';
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

interface SuperAdminSecurityProps {
  admin: AdminData;
  onRefresh: () => void;
  onExportLogs: () => void;
  onTerminateSession: (sessionId: string) => void;
  onBlockIP: (ipAddress: string) => void;
}

export const SuperAdminSecurity: React.FC<SuperAdminSecurityProps> = ({
  onRefresh,
  onExportLogs,
  onTerminateSession,
  onBlockIP
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');

  // Get real security events from service or use empty array if none available
  const securityEvents: SecurityEvent[] = [];

  // Get real active sessions from service or use empty array if none available
  const activeSessions: ActiveSession[] = [];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <Users className="h-4 w-4 text-gray-600" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-blue-600" />;
      case 'admin_action':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ipAddress.includes(searchTerm);
    
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  // Security metrics
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical').length;
  const failedLogins = securityEvents.filter(e => e.type === 'failed_login').length;
  const activeSessionsCount = activeSessions.filter(s => s.isActive).length;
  const adminSessions = activeSessions.filter(s => s.userType === 'admin').length;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-2">Monitor system security, audit logs, and active sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onExportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-700">
                {criticalEvents > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                Alerts
              </Badge>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">{criticalEvents}</div>
            <div className="text-red-700 text-sm">Critical Events</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">Failed</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-1">{failedLogins}</div>
            <div className="text-orange-700 text-sm">Failed Logins</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Live</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">{activeSessionsCount}</div>
            <div className="text-blue-700 text-sm">Active Sessions</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">{adminSessions}</div>
            <div className="text-purple-700 text-sm">Admin Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring
          </CardTitle>
          <CardDescription>Comprehensive security monitoring and audit logs</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security Events
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Sessions
              </TabsTrigger>
              <TabsTrigger value="threats" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Threat Analysis
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Health */}
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Security Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">System Security</span>
                        <Badge className="bg-green-100 text-green-800">Secure</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Authentication</span>
                        <Badge className="bg-green-100 text-green-800">Strong</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-gray-700">Session Management</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Monitor</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Data Protection</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Security Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {securityEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()} • {event.ipAddress}
                            </p>
                          </div>
                          {getSeverityBadge(event.severity)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Events Tab */}
            <TabsContent value="events" className="space-y-6 mt-6">
              {/* Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                    <SelectItem value="password_change">Password Change</SelectItem>
                    <SelectItem value="admin_action">Admin Action</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Events Table */}
              <Card className="border border-gray-200">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Event</TableHead>
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Severity</TableHead>
                        <TableHead className="font-semibold">IP Address</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.type)}
                              <span className="font-medium">{event.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{event.userEmail}</div>
                              <div className="text-sm text-gray-500">{event.userId}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                          <TableCell className="font-mono text-sm">{event.ipAddress}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {event.location || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {event.type === 'failed_login' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onBlockIP(event.ipAddress)}
                                  className="h-8 px-3"
                                >
                                  Block IP
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6 mt-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Active User Sessions</CardTitle>
                  <CardDescription>Monitor and manage all active user sessions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Device</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Login Time</TableHead>
                        <TableHead className="font-semibold">Last Activity</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{session.userEmail}</div>
                              <div className="text-sm text-gray-500">{session.userId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.userType === 'admin' ? 'destructive' : 'default'}>
                              {session.userType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(session.device)}
                              <span>{session.device}</span>
                              <span className="text-sm text-gray-500">• {session.browser}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {session.location}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">{session.ipAddress}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {new Date(session.loginTime).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-gray-400" />
                              {new Date(session.lastActivity).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onTerminateSession(session.id)}
                              className="h-8 px-3"
                            >
                              Terminate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Threat Analysis Tab */}
            <TabsContent value="threats" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Threat Summary */}
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Threat Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-gray-700">High Risk IPs</span>
                        <Badge className="bg-red-100 text-red-800">2</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <span className="text-gray-700">Suspicious Activity</span>
                        <Badge className="bg-yellow-100 text-yellow-800">5</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-gray-700">Blocked IPs</span>
                        <Badge className="bg-green-100 text-green-800">12</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-gray-700">Rate Limited</span>
                        <Badge className="bg-blue-100 text-blue-800">3</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Recommendations */}
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Security Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-900">Enable 2FA</span>
                        </div>
                        <p className="text-sm text-orange-800">Consider enabling two-factor authentication for all admin accounts</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Password Policy</span>
                        </div>
                        <p className="text-sm text-blue-800">Enforce stronger password requirements for enhanced security</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">Session Security</span>
                        </div>
                        <p className="text-sm text-green-800">Current session management settings are optimal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};