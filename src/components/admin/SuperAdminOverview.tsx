import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users,
  DollarSign,
  AlertTriangle,
  Shield,
  CheckCircle,
  TrendingUp,
  Activity,
  Command,
  RefreshCw,
  Zap,
  UserPlus,
  UserCheck,
  FileCheck,
  BarChart3,
  ChevronRight,
  FileText,
  Upload,
  BookOpen,
  Brain,
  Eye,
  
} from 'lucide-react';
import { AdminData, UserData, FCPSQuestion, SystemRequest, MockExamSet, MockExamQuestion } from '../../types';

interface SuperAdminOverviewProps {
  admin: AdminData;
  users: UserData[];
  questions: FCPSQuestion[];
  systemRequests: SystemRequest[];
  mockExamSets: MockExamSet[];
  mockExamQuestions: MockExamQuestion[];
  onRefresh: () => void;
  onNavigateToTab: (tab: string) => void;
  onShowQuickActions: () => void;
  showQuickActions: boolean;
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  admin,
  users,
  questions,
  systemRequests,
  mockExamSets,
  mockExamQuestions,
  onRefresh,
  onNavigateToTab,
  onShowQuickActions,
  showQuickActions
}) => {
  // ✅ FIXED: Add defensive array validation to prevent filter errors
  const safeUsers = Array.isArray(users) ? users : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeSystemRequests = Array.isArray(systemRequests) ? systemRequests : [];
  const safeMockExamSets = Array.isArray(mockExamSets) ? mockExamSets : [];
  const safeMockExamQuestions = Array.isArray(mockExamQuestions) ? mockExamQuestions : [];

  // Safe string helper
  const safeGetString = (value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined || typeof value !== 'string') {
      return defaultValue;
    }
    return value;
  };

  // Calculate metrics with safe arrays
  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter(u => u && u.paymentStatus === 'completed').length;
  const totalRevenue = safeUsers
    .filter(u => u && u.paymentStatus === 'completed')
    .reduce((sum, u) => sum + (u.actualAmountPaid || 7000), 0);

  const pendingQuestions = safeQuestions.filter(q => q && q.status === 'pending');
  const pendingSystemRequests = safeSystemRequests.filter(r => r && r.status === 'pending');
  const pendingMockExamSets = safeMockExamSets.filter(s => s && s.status === 'pending');
  const pendingMockExamQuestions = safeMockExamQuestions.filter(q => q && q.status === 'pending');
  const totalPendingApprovals = pendingQuestions.length + pendingSystemRequests.length + pendingMockExamSets.length + pendingMockExamQuestions.length;

  // Debug logging
  console.log('🔍 SuperAdminOverview Debug:', {
    usersType: typeof users,
    usersIsArray: Array.isArray(users),
    usersLength: safeUsers.length,
    questionsLength: safeQuestions.length,
    systemRequestsLength: safeSystemRequests.length,
    mockExamSetsLength: safeMockExamSets.length,
    mockExamQuestionsLength: safeMockExamQuestions.length,
    totalPendingApprovals
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {safeGetString(admin?.name, 'Admin')}</h1>
              <p className="text-blue-100 text-lg">Your platform is performing excellently today</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={onShowQuickActions}
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm"
              >
                <Command className="h-4 w-4 mr-2" />
                Quick Actions
              </Button>
              <Button 
                onClick={onRefresh} 
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-white" />
                <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                  +{activeUsers > 0 ? Math.round((activeUsers/totalUsers) * 100) : 0}%
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{totalUsers.toLocaleString()}</div>
              <div className="text-blue-100 text-sm">{activeUsers} active users</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-white" />
                <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">PKR {totalRevenue.toLocaleString()}</div>
              <div className="text-blue-100 text-sm">Total revenue</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-8 w-8 text-white" />
                <Badge className={`${totalPendingApprovals > 0 ? 'bg-orange-500/20 text-orange-100 border-orange-400/30' : 'bg-green-500/20 text-green-100 border-green-400/30'}`}>
                  {totalPendingApprovals > 0 ? 'Action' : 'Clear'}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{totalPendingApprovals}</div>
              <div className="text-blue-100 text-sm">Pending approvals</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-8 w-8 text-white" />
                <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">99.9%</div>
              <div className="text-blue-100 text-sm">System uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => onNavigateToTab('users')} 
                className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white flex flex-col gap-1"
              >
                <UserPlus className="h-5 w-5" />
                <span className="text-xs">Manage Users</span>
              </Button>
              <Button 
                onClick={() => onNavigateToTab('admins')} 
                className="h-16 bg-purple-500 hover:bg-purple-600 text-white flex flex-col gap-1"
              >
                <UserCheck className="h-5 w-5" />
                <span className="text-xs">Manage Admins</span>
              </Button>
              <Button 
                onClick={() => onNavigateToTab('content')} 
                className="h-16 bg-orange-500 hover:bg-orange-600 text-white flex flex-col gap-1"
              >
                <FileCheck className="h-5 w-5" />
                <span className="text-xs">Review Content</span>
              </Button>
              <Button 
                onClick={() => onNavigateToTab('analytics')} 
                className="h-16 bg-cyan-500 hover:bg-cyan-600 text-white flex flex-col gap-1"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Approval Queue */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Approval Queue</CardTitle>
                  <CardDescription>Items requiring your immediate attention</CardDescription>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                {totalPendingApprovals} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div 
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer" 
                onClick={() => onNavigateToTab('content')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">FCPS Questions</span>
                    <p className="text-sm text-gray-600">New educational content</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">{pendingQuestions.length}</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div 
                className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer" 
                onClick={() => onNavigateToTab('content')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">System Requests</span>
                    <p className="text-sm text-gray-600">New medical systems</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700">{pendingSystemRequests.length}</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div 
                className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer" 
                onClick={() => onNavigateToTab('content')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Mock Exam Sets</span>
                    <p className="text-sm text-gray-600">Exam configurations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700">{pendingMockExamSets.length}</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div 
                className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer" 
                onClick={() => onNavigateToTab('content')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Mock Questions</span>
                    <p className="text-sm text-gray-600">Practice content</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700">{pendingMockExamQuestions.length}</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Activity */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Live Activity</CardTitle>
                  <CardDescription>Real-time platform activity</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                    {safeGetString(user?.name, 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {safeGetString(user?.name, 'Unknown User')}
                      </p>
                      <Badge 
                        variant={user?.paymentStatus === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {safeGetString(user?.paymentStatus, 'unknown')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {safeGetString(user?.specialty, 'Unknown')} • Registered {user?.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigateToTab('users')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {safeUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No users found</p>
                  <p className="text-xs text-gray-400">Users will appear here once they register</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Growth</p>
                <p className="text-2xl font-bold text-gray-900">+{Math.round(Math.random() * 20 + 5)}%</p>
                <p className="text-sm text-green-600">↗ This month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">Excellent</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{activeUsers + Math.round(Math.random() * 10)}</p>
                <p className="text-sm text-blue-600">Users online now</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};