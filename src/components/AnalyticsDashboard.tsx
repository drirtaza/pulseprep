import { useState, useEffect } from 'react';

import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Activity, BookOpen, Clock, 
  Target, Download, RefreshCw, Eye, BarChart3, ArrowLeft,
  Home, ChevronRight
} from 'lucide-react';
import { AdminData } from '../types';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMCQsAnswered: number;
  averageAccuracy: number;
  averageSessionDuration: number;
  specialtyDistribution: Array<{specialty: string; count: number}>;
  popularSystems: Array<{name: string; count: number}>;
  peakUsageHours: number[];
}

interface FinancialMetrics {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  pendingPayments: number;
  revenueBySpecialty: Array<{specialty: string; revenue: number}>;
  paymentMethodDistribution: Array<{method: string; count: number}>;
}

interface UserPerformanceData {
  userId: string;
  userName: string;
  specialty: string;
  averageScore: number;
  totalMCQsAnswered: number;
  studyTime: number;
  improvementTrend: number;
}

interface AnalyticsDashboardProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AnalyticsDashboard({ admin, onNavigate }: AnalyticsDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [userPerformanceData, setUserPerformanceData] = useState<UserPerformanceData[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Chart colors for different specialties
  const specialtyColors = {
    medicine: '#10B981', // emerald
    surgery: '#3B82F6',  // blue
    'gynae-obs': '#F97316' // orange/rose
  };

  const chartColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
  
  useEffect(() => {
    loadAnalyticsData();
    setupRealTimeUpdates();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Generate mock data for demonstration
      const mockSystemMetrics: SystemMetrics = {
        totalUsers: 750 + Math.floor(Math.random() * 100),
        activeUsers: 520 + Math.floor(Math.random() * 50),
        newUsersToday: 12 + Math.floor(Math.random() * 20),
        totalMCQsAnswered: 45000 + Math.floor(Math.random() * 5000),
        averageAccuracy: 64.5 + Math.random() * 10,
        averageSessionDuration: 28.5 + Math.random() * 10,
        specialtyDistribution: [
          { specialty: 'medicine', count: 350 },
          { specialty: 'surgery', count: 280 },
          { specialty: 'gynae-obs', count: 120 }
        ],
        popularSystems: [
          { name: 'Cardiovascular', count: 1250 },
          { name: 'Respiratory', count: 980 },
          { name: 'Neurology', count: 850 },
          { name: 'Gastroenterology', count: 720 }
        ],
        peakUsageHours: [18, 19, 20, 21]
      };

      const mockFinancialMetrics: FinancialMetrics = {
        totalRevenue: 285000 + Math.floor(Math.random() * 50000),
        revenueToday: 2850 + Math.floor(Math.random() * 1000),
        revenueThisMonth: 28500 + Math.floor(Math.random() * 5000),
        conversionRate: 68.5 + Math.random() * 10,
        averageRevenuePerUser: 380 + Math.random() * 50,
        pendingPayments: 12 + Math.floor(Math.random() * 8),
        revenueBySpecialty: [
          { specialty: 'medicine', revenue: 145000 },
          { specialty: 'surgery', revenue: 120000 },
          { specialty: 'gynae-obs', revenue: 58000 }
        ],
        paymentMethodDistribution: [
          { method: 'bank_transfer', count: 450 },
          { method: 'jazzcash', count: 280 },
          { method: 'easypaisa', count: 170 }
        ]
      };

      const mockUserPerformance: UserPerformanceData[] = Array.from({ length: 15 }, (_, i) => ({
        userId: `user-${i + 1}`,
        userName: `Student ${i + 1}`,
        specialty: ['medicine', 'surgery', 'gynae-obs'][Math.floor(Math.random() * 3)],
        averageScore: 60 + Math.random() * 35,
        totalMCQsAnswered: 100 + Math.floor(Math.random() * 500),
        studyTime: 10 + Math.random() * 40,
        improvementTrend: -10 + Math.random() * 20
      }));

      setSystemMetrics(mockSystemMetrics);
      setFinancialMetrics(mockFinancialMetrics);
      setUserPerformanceData(mockUserPerformance);

      // Mock real-time data
      setRealTimeMetrics({
        activeUsers: 45 + Math.floor(Math.random() * 20),
        mcqsAnsweredLastHour: 150 + Math.floor(Math.random() * 50),
        averageAccuracyLastHour: 65 + Math.random() * 10,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const handleAnalyticsUpdate = (_event: Event) => {
      setRealTimeMetrics({
        activeUsers: 45 + Math.floor(Math.random() * 20),
        mcqsAnsweredLastHour: 150 + Math.floor(Math.random() * 50),
        averageAccuracyLastHour: 65 + Math.random() * 10,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('analytics-update', handleAnalyticsUpdate as EventListener);
    return () => window.removeEventListener('analytics-update', handleAnalyticsUpdate as EventListener);
  };

  const handleExportData = () => {
    const data = {
      systemMetrics,
      financialMetrics,
      userPerformanceData,
      exportedAt: new Date().toISOString(),
      exportedBy: admin.name
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulseprep-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    alert('Comprehensive report generated! Check console for details.');
    console.log('Generated comprehensive analytics report:', {
      systemMetrics,
      financialMetrics,
      userPerformanceData,
      timeRange: selectedTimeRange,
      generatedBy: admin.name,
      generatedAt: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7A0C2E] to-[#5A0821] p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-white">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A0C2E] to-[#5A0821] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-pink-100 text-sm mb-4">
            <Home className="h-4 w-4" />
            <span>Super Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Analytics Dashboard</span>
          </div>
          
          <Button
            onClick={() => onNavigate('admin-dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Super Admin Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-white mb-2">📊 Analytics Dashboard</h1>
            <p className="text-pink-100">Comprehensive platform analytics and insights</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="text-pink-200 text-sm">
                Logged in as: <span className="text-white font-medium">{admin.name}</span>
              </div>
              <div className="text-pink-200 text-sm">
                Role: <span className="text-white font-medium capitalize">{admin.role.replace('-', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button
              onClick={loadAnalyticsData}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExportData}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => onNavigate('reports')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports Center
            </Button>
            <Button
              onClick={generateReport}
              className="bg-white text-[#7A0C2E] hover:bg-pink-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Real-time Metrics Bar */}
        {realTimeMetrics && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm">Live Data</span>
                </div>
                <div className="text-white text-sm">
                  Active Users: <span className="font-medium">{realTimeMetrics.activeUsers}</span>
                </div>
                <div className="text-white text-sm">
                  MCQs/Hour: <span className="font-medium">{realTimeMetrics.mcqsAnsweredLastHour}</span>
                </div>
                <div className="text-white text-sm">
                  Accuracy: <span className="font-medium">{realTimeMetrics.averageAccuracyLastHour?.toFixed(1)}%</span>
                </div>
              </div>
              <div className="text-pink-100 text-xs">
                Last updated: {new Date(realTimeMetrics.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Target className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-pink-100 text-sm">Total Users</p>
                    <p className="text-white text-2xl font-medium">{systemMetrics?.totalUsers || 0}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-green-300 text-xs">+{systemMetrics?.newUsersToday || 0}</span>
                      <span className="text-pink-100 text-xs">today</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-300" />
                  </div>
                  <div>
                    <p className="text-pink-100 text-sm">Active Users</p>
                    <p className="text-white text-2xl font-medium">{systemMetrics?.activeUsers || 0}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-pink-100 text-xs">
                        {systemMetrics?.totalUsers ? ((systemMetrics.activeUsers / systemMetrics.totalUsers) * 100).toFixed(1) : 0}% active
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-pink-100 text-sm">MCQs Answered</p>
                    <p className="text-white text-2xl font-medium">{systemMetrics?.totalMCQsAnswered?.toLocaleString() || 0}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-pink-100 text-xs">
                        {systemMetrics?.averageAccuracy?.toFixed(1) || 0}% accuracy
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-300" />
                  </div>
                  <div>
                    <p className="text-pink-100 text-sm">Total Revenue</p>
                    <p className="text-white text-2xl font-medium">
                      PKR {financialMetrics?.totalRevenue?.toLocaleString() || 0}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-green-300 text-xs">
                        +PKR {financialMetrics?.revenueToday?.toLocaleString() || 0}
                      </span>
                      <span className="text-pink-100 text-xs">today</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Specialty Distribution */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">User Distribution by Specialty</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={systemMetrics?.specialtyDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ specialty, count }) => `${specialty}: ${count}`}
                    >
                      {(systemMetrics?.specialtyDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={specialtyColors[entry.specialty as keyof typeof specialtyColors] || chartColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Popular Systems */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Most Popular Study Systems</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={systemMetrics?.popularSystems?.slice(0, 8) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: 'white' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'white' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Peak Usage Hours */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Peak Usage Hours</h3>
              <div className="flex flex-wrap gap-2">
                {systemMetrics?.peakUsageHours?.map((hour, index) => (
                  <Badge key={index} className="bg-purple-500/20 text-purple-200 border border-purple-300/20">
                    {hour}:00 - {hour + 1}:00
                  </Badge>
                )) || []}
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Growth */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 lg:col-span-2">
                <h3 className="text-white text-lg mb-4">User Growth Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { date: '7 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 50) },
                    { date: '6 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 45) },
                    { date: '5 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 40) },
                    { date: '4 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 30) },
                    { date: '3 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 20) },
                    { date: '2 days ago', users: Math.max(0, (systemMetrics?.totalUsers || 0) - 10) },
                    { date: 'Today', users: systemMetrics?.totalUsers || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'white' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'white' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Area type="monotone" dataKey="users" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* User Stats */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">User Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pink-100">Active Users</span>
                      <span className="text-white">{systemMetrics?.activeUsers}/{systemMetrics?.totalUsers}</span>
                    </div>
                    <Progress 
                      value={systemMetrics?.totalUsers ? (systemMetrics.activeUsers / systemMetrics.totalUsers) * 100 : 0} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pink-100">Avg Session Duration</span>
                      <span className="text-white">{Math.round(systemMetrics?.averageSessionDuration || 0)}min</span>
                    </div>
                    <Progress 
                      value={Math.min(((systemMetrics?.averageSessionDuration || 0) / 60) * 100, 100)} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pink-100">Platform Accuracy</span>
                      <span className="text-white">{systemMetrics?.averageAccuracy?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress 
                      value={systemMetrics?.averageAccuracy || 0} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Top Performing Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left text-pink-100 py-2">User</th>
                      <th className="text-left text-pink-100 py-2">Specialty</th>
                      <th className="text-left text-pink-100 py-2">Avg Score</th>
                      <th className="text-left text-pink-100 py-2">MCQs Answered</th>
                      <th className="text-left text-pink-100 py-2">Study Time</th>
                      <th className="text-left text-pink-100 py-2">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPerformanceData
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .slice(0, 10)
                      .map((user) => (
                        <tr key={user.userId} className="border-b border-white/10">
                          <td className="text-white py-2">{user.userName}</td>
                          <td className="text-pink-100 py-2 capitalize">{user.specialty}</td>
                          <td className="text-white py-2">{user.averageScore.toFixed(1)}%</td>
                          <td className="text-pink-100 py-2">{user.totalMCQsAnswered}</td>
                          <td className="text-pink-100 py-2">{Math.round(user.studyTime)}h</td>
                          <td className="py-2">
                            <Badge className={`${user.improvementTrend > 0 ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                              {user.improvementTrend > 0 ? '+' : ''}{user.improvementTrend.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Average Scores by Specialty */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Average Scores by Specialty</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      specialty: 'Medicine', 
                      score: userPerformanceData
                        .filter(u => u.specialty === 'medicine')
                        .reduce((avg, u, _, arr) => avg + u.averageScore / arr.length, 0) || 0
                    },
                    { 
                      specialty: 'Surgery', 
                      score: userPerformanceData
                        .filter(u => u.specialty === 'surgery')
                        .reduce((avg, u, _, arr) => avg + u.averageScore / arr.length, 0) || 0
                    },
                    { 
                      specialty: 'Gynae & Obs', 
                      score: userPerformanceData
                        .filter(u => u.specialty === 'gynae-obs')
                        .reduce((avg, u, _, arr) => avg + u.averageScore / arr.length, 0) || 0
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="specialty" tick={{ fontSize: 12, fill: 'white' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'white' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Bar dataKey="score" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Study Time Distribution */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Study Time Distribution</h3>
                <div className="space-y-3">
                  {[
                    { range: '0-10 hours', count: userPerformanceData.filter(u => u.studyTime < 10).length },
                    { range: '10-25 hours', count: userPerformanceData.filter(u => u.studyTime >= 10 && u.studyTime < 25).length },
                    { range: '25-50 hours', count: userPerformanceData.filter(u => u.studyTime >= 25 && u.studyTime < 50).length },
                    { range: '50+ hours', count: userPerformanceData.filter(u => u.studyTime >= 50).length }
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-pink-100">{item.range}</span>
                        <span className="text-white">{item.count} users</span>
                      </div>
                      <Progress 
                        value={userPerformanceData.length > 0 ? (item.count / userPerformanceData.length) * 100 : 0} 
                        className="h-2 bg-white/20"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Improvement Trends */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">User Improvement Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl text-green-300 mb-2">
                    {userPerformanceData.filter(u => u.improvementTrend > 5).length}
                  </div>
                  <div className="text-pink-100 text-sm">Significant Improvement</div>
                  <div className="text-xs text-pink-200">(&gt;5% increase)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-yellow-300 mb-2">
                    {userPerformanceData.filter(u => u.improvementTrend >= -5 && u.improvementTrend <= 5).length}
                  </div>
                  <div className="text-pink-100 text-sm">Stable Performance</div>
                  <div className="text-xs text-pink-200">(-5% to +5%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-red-300 mb-2">
                    {userPerformanceData.filter(u => u.improvementTrend < -5).length}
                  </div>
                  <div className="text-pink-100 text-sm">Needs Attention</div>
                  <div className="text-xs text-pink-200">(&gt;5% decrease)</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">
                    PKR {financialMetrics?.totalRevenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-pink-100 text-sm">Total Revenue</div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">
                    {financialMetrics?.conversionRate?.toFixed(1) || 0}%
                  </div>
                  <div className="text-pink-100 text-sm">Conversion Rate</div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">
                    PKR {financialMetrics?.averageRevenuePerUser?.toFixed(0) || 0}
                  </div>
                  <div className="text-pink-100 text-sm">Avg Revenue/User</div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">
                    {financialMetrics?.pendingPayments || 0}
                  </div>
                  <div className="text-pink-100 text-sm">Pending Payments</div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Specialty */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Revenue by Specialty</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialMetrics?.revenueBySpecialty || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ specialty, revenue }) => `${specialty}: PKR ${revenue}`}
                    >
                      {(financialMetrics?.revenueBySpecialty || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={specialtyColors[entry.specialty as keyof typeof specialtyColors] || chartColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`PKR ${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Payment Method Distribution */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {(financialMetrics?.paymentMethodDistribution || []).map((method, index) => {
                    const total = financialMetrics?.paymentMethodDistribution?.reduce((sum, m) => sum + m.count, 0) || 1;
                    const percentage = (method.count / total) * 100;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-pink-100 capitalize">{method.method}</span>
                          <span className="text-white">{method.count} payments</span>
                        </div>
                        <Progress value={percentage} className="h-2 bg-white/20" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Monthly Revenue Trend */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: '3 months ago', revenue: Math.max(0, (financialMetrics?.revenueThisMonth || 0) * 0.7) },
                  { month: '2 months ago', revenue: Math.max(0, (financialMetrics?.revenueThisMonth || 0) * 0.85) },
                  { month: 'Last month', revenue: Math.max(0, (financialMetrics?.revenueThisMonth || 0) * 0.95) },
                  { month: 'This month', revenue: financialMetrics?.revenueThisMonth || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'white' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value) => [`PKR ${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}