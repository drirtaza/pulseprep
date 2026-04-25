import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Line, Legend,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Target, 
  Download, RefreshCw, 
  ArrowDown, Eye, Clock, Award,
  Home, ChevronRight, ArrowLeft, Activity
} from 'lucide-react';
import { AdminData } from '../types';

interface AdvancedAnalyticsProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AdvancedAnalytics({ admin, onNavigate }: AdvancedAnalyticsProps) {
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [userBehaviorData, setUserBehaviorData] = useState<any>(null);
  const [questionPerformance, setQuestionPerformance] = useState<any>(null);
  const [cohortAnalysis, setCohortAnalysis] = useState<any>(null);
  const [predictiveMetrics, setPredictiveMetrics] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('system');

  const chartColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#F97316', '#84CC16'];
  
  useEffect(() => {
    loadAdvancedAnalytics();
  }, [selectedTimeRange]);

  const loadAdvancedAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load advanced analytics data
      const [, revenue, behavior, questions, cohort, predictive] = await Promise.all([
        generateSystemAnalytics(),
        generateRevenueAnalytics(),
        generateUserBehaviorAnalytics(),
        generateQuestionPerformanceAnalytics(),
        generateCohortAnalysis(),
        generatePredictiveMetrics()
      ]);

      setRevenueAnalytics(revenue);
      setUserBehaviorData(behavior);
      setQuestionPerformance(questions);
      setCohortAnalysis(cohort);
      setPredictiveMetrics(predictive);
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // System Analytics Generator
  const generateSystemAnalytics = () => {
    // Mock system metrics for demo
    const systemMetrics = { specialtyDistribution: [] };
    
    // Platform usage statistics
    const platformUsage = {
      totalSessions: Math.floor(Math.random() * 5000) + 2000,
      avgSessionDuration: Math.floor(Math.random() * 20) + 15, // minutes
      bounceRate: Math.floor(Math.random() * 15) + 5, // percentage
      pageViews: Math.floor(Math.random() * 50000) + 20000,
      uniqueVisitors: Math.floor(Math.random() * 3000) + 1000
    };

    // Hourly usage pattern
    const hourlyUsage = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sessions: Math.floor(Math.random() * 200) + 50,
      avgDuration: Math.floor(Math.random() * 30) + 10
    }));

    // Device analytics
    const deviceAnalytics = [
      { device: 'Desktop', sessions: 1250, percentage: 62 },
      { device: 'Mobile', sessions: 560, percentage: 28 },
      { device: 'Tablet', sessions: 200, percentage: 10 }
    ];

    // Browser analytics
    const browserAnalytics = [
      { browser: 'Chrome', sessions: 1400, percentage: 70 },
      { browser: 'Safari', sessions: 280, percentage: 14 },
      { browser: 'Firefox', sessions: 200, percentage: 10 },
      { browser: 'Edge', sessions: 120, percentage: 6 }
    ];

    return {
      platformUsage,
      hourlyUsage,
      deviceAnalytics,
      browserAnalytics,
      specialtyEngagement: systemMetrics.specialtyDistribution
    };
  };

  // Revenue Analytics Generator
  const generateRevenueAnalytics = () => {
    // Mock financial metrics for demo
    const financialMetrics = { totalRevenue: 323000 };
    
    // Monthly Revenue Trend
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        users: Math.floor(Math.random() * 200) + 50,
        arpu: Math.floor(Math.random() * 100) + 150
      };
    }).reverse();

    // Revenue by Specialty
    const revenueBySpecialty = [
      { specialty: 'Medicine', revenue: 145000, users: 320, percentage: 45 },
      { specialty: 'Surgery', revenue: 120000, users: 280, percentage: 37 },
      { specialty: 'Gynae & Obs', revenue: 58000, users: 150, percentage: 18 }
    ];

    // Revenue forecast
    const revenueForecast = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() + i + 1);
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        predicted: Math.floor(Math.random() * 20000) + 30000,
        confidence: Math.floor(Math.random() * 20) + 75
      };
    });

    return {
      monthlyRevenue,
      revenueBySpecialty,
      revenueForecast,
      kpis: {
        totalRevenue: financialMetrics.totalRevenue,
        mrr: 28500,
        arr: 342000,
        cac: 125,
        ltv: 850,
        grossMargin: 78.5
      }
    };
  };

  // User Behavior Analytics Generator
  const generateUserBehaviorAnalytics = () => {
    // User activity patterns
    const userActivity = {
      dailyActiveUsers: Math.floor(Math.random() * 500) + 200,
      weeklyActiveUsers: Math.floor(Math.random() * 800) + 400,
      monthlyActiveUsers: Math.floor(Math.random() * 1200) + 600,
      avgSessionDuration: Math.floor(Math.random() * 30) + 15,
      userRetention30d: Math.floor(Math.random() * 30) + 60,
      bounceRate: Math.floor(Math.random() * 15) + 8
    };

    // Session duration distribution
    const sessionDurations = [
      { duration: '0-5 min', count: 320, percentage: 32 },
      { duration: '5-15 min', count: 280, percentage: 28 },
      { duration: '15-30 min', count: 220, percentage: 22 },
      { duration: '30+ min', count: 180, percentage: 18 }
    ];

    // User journey flow
    const userJourney = [
      { step: 'Landing', users: 1000, conversion: 100 },
      { step: 'Registration', users: 850, conversion: 85 },
      { step: 'Payment', users: 680, conversion: 68 },
      { step: 'First MCQ', users: 580, conversion: 58 },
      { step: 'Regular Usage', users: 420, conversion: 42 }
    ];

    // Feature usage
    const featureUsage = [
      { feature: 'MCQ Practice', usage: 95, satisfaction: 4.8 },
      { feature: 'Mock Exams', usage: 78, satisfaction: 4.6 },
      { feature: 'Performance Analytics', usage: 65, satisfaction: 4.4 },
      { feature: 'Study Plans', usage: 52, satisfaction: 4.2 }
    ];

    return {
      userActivity,
      sessionDurations,
      userJourney,
      featureUsage
    };
  };

  // Question Performance Analytics Generator
  const generateQuestionPerformanceAnalytics = () => {
    // System-wise performance
    const systemPerformance = [
      { system: 'Cardiovascular', totalQuestions: 450, avgAccuracy: 68, difficulty: 'Medium' },
      { system: 'Respiratory', totalQuestions: 380, avgAccuracy: 72, difficulty: 'Easy' },
      { system: 'Neurology', totalQuestions: 320, avgAccuracy: 58, difficulty: 'Hard' },
      { system: 'Gastroenterology', totalQuestions: 290, avgAccuracy: 65, difficulty: 'Medium' },
      { system: 'Endocrinology', totalQuestions: 250, avgAccuracy: 62, difficulty: 'Hard' }
    ];

    // Question difficulty distribution
    const difficultyDistribution = [
      { difficulty: 'Easy', count: 280, accuracy: 85, timeSpent: 45 },
      { difficulty: 'Medium', count: 520, accuracy: 68, timeSpent: 75 },
      { difficulty: 'Hard', count: 350, accuracy: 52, timeSpent: 120 }
    ];

    // Top performing questions
    const topQuestions = Array.from({ length: 10 }, (_, i) => ({
      id: `Q${1000 + i}`,
      system: ['Cardiology', 'Respiratory', 'Neurology'][Math.floor(Math.random() * 3)],
      accuracy: 95 - i * 2,
      attempts: Math.floor(Math.random() * 500) + 100,
      avgTime: Math.floor(Math.random() * 60) + 30
    }));

    return {
      systemPerformance,
      difficultyDistribution,
      topQuestions,
      kpis: {
        totalQuestions: 1350,
        overallAccuracy: 64.5,
        avgTimePerQuestion: 85,
        questionsReviewed: 280,
        flaggedQuestions: 45
      }
    };
  };

  // Cohort Analysis Generator
  const generateCohortAnalysis = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const cohortData = months.map((month, cohortIndex) => {
      const retentionData = Array.from({ length: 6 - cohortIndex }, (_, monthIndex) => {
        const baseRetention = 100 - (monthIndex * 15) - (cohortIndex * 2);
        return Math.max(5, baseRetention + Math.random() * 10 - 5);
      });
      
      return {
        cohort: month,
        users: Math.floor(Math.random() * 200) + 100,
        retention: retentionData
      };
    });

    return { cohortData };
  };

  // Predictive Metrics Generator
  const generatePredictiveMetrics = () => {
    // Growth predictions
    const userGrowthPrediction = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() + i + 1);
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        predicted: Math.floor(Math.random() * 100) + 50 + i * 20,
        organic: Math.floor(Math.random() * 60) + 30 + i * 10,
        paid: Math.floor(Math.random() * 40) + 20 + i * 10
      };
    });

    return {
      userGrowthPrediction,
      riskFactors: [
        { factor: 'Market Competition', impact: 'High', probability: 65 },
        { factor: 'Economic Downturn', impact: 'Medium', probability: 35 },
        { factor: 'Technology Changes', impact: 'Low', probability: 25 }
      ]
    };
  };

  const exportAdvancedData = (section: string) => {
    const data = {
      revenue: revenueAnalytics,
      behavior: userBehaviorData,
      questions: questionPerformance,
      cohort: cohortAnalysis,
      predictive: predictiveMetrics
    };

    const exportData = section === 'all' ? data : { [section]: (data as any)[section] };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advanced-analytics-${section}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7A0C2E] to-[#5A0821] p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-white">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading advanced analytics...</p>
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
            <span className="text-white">Advanced Analytics</span>
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
            <h1 className="text-3xl text-white mb-2">🚀 Advanced Analytics & Insights</h1>
            <p className="text-pink-100">Deep platform insights with predictive analytics and behavioral analysis</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="text-pink-200 text-sm">
                Logged in as: <span className="text-white font-medium">{admin.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <Button
              onClick={loadAdvancedAnalytics}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => exportAdvancedData('all')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="system" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Activity className="h-4 w-4 mr-2" />
              System Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Users className="h-4 w-4 mr-2" />
              User Activity
            </TabsTrigger>
            <TabsTrigger value="growth" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <TrendingUp className="h-4 w-4 mr-2" />
              Growth Metrics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue Reports
            </TabsTrigger>
          </TabsList>

          {/* System Analytics Tab */}
          <TabsContent value="system" className="space-y-6">
            {/* Platform Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">2,847</div>
                  <div className="text-pink-200 text-sm">Total Sessions</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">18.5min</div>
                  <div className="text-pink-200 text-sm">Avg Session</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">32,456</div>
                  <div className="text-pink-200 text-sm">Page Views</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">1,523</div>
                  <div className="text-pink-200 text-sm">Unique Visitors</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <ArrowDown className="h-8 w-8 text-red-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">8.2%</div>
                  <div className="text-pink-200 text-sm">Bounce Rate</div>
                </div>
              </Card>
            </div>

            {/* Hourly Usage Pattern & Device Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Hourly Usage Pattern</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { hour: '00:00', sessions: 45 }, { hour: '02:00', sessions: 32 },
                    { hour: '04:00', sessions: 28 }, { hour: '06:00', sessions: 65 },
                    { hour: '08:00', sessions: 125 }, { hour: '10:00', sessions: 180 },
                    { hour: '12:00', sessions: 220 }, { hour: '14:00', sessions: 195 },
                    { hour: '16:00', sessions: 235 }, { hour: '18:00', sessions: 280 },
                    { hour: '20:00', sessions: 320 }, { hour: '22:00', sessions: 185 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'white' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'white' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Area type="monotone" dataKey="sessions" stroke="#8B5CF6" fill="rgba(139, 92, 246, 0.3)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Device & Browser Analytics</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-pink-100 text-sm mb-2">Device Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { device: 'Desktop', percentage: 62 },
                        { device: 'Mobile', percentage: 28 },
                        { device: 'Tablet', percentage: 10 }
                      ].map((item, index) => (
                        <div key={item.device} className="flex items-center justify-between">
                          <span className="text-white text-sm">{item.device}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-white/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${item.percentage}%`,
                                  backgroundColor: chartColors[index]
                                }}
                              />
                            </div>
                            <span className="text-pink-200 text-sm">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-pink-100 text-sm mb-2">Browser Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { browser: 'Chrome', percentage: 70 },
                        { browser: 'Safari', percentage: 14 },
                        { browser: 'Firefox', percentage: 10 },
                        { browser: 'Edge', percentage: 6 }
                      ].map((item, index) => (
                        <div key={item.browser} className="flex items-center justify-between">
                          <span className="text-white text-sm">{item.browser}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-white/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${item.percentage}%`,
                                  backgroundColor: chartColors[index + 3]
                                }}
                              />
                            </div>
                            <span className="text-pink-200 text-sm">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* User Activity KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-blue-300">320</div>
                  <div className="text-pink-200 text-xs">Daily Active</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-green-300">650</div>
                  <div className="text-pink-200 text-xs">Weekly Active</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-purple-300">850</div>
                  <div className="text-pink-200 text-xs">Monthly Active</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-orange-300">28.5min</div>
                  <div className="text-pink-200 text-xs">Avg Session</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-pink-300">72%</div>
                  <div className="text-pink-200 text-xs">30d Retention</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-cyan-300">12.5%</div>
                  <div className="text-pink-200 text-xs">Bounce Rate</div>
                </div>
              </Card>
            </div>

            {/* User Journey & Session Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">User Journey Flow</h3>
                <div className="space-y-4">
                  {[
                    { step: 'Landing', users: 1000, conversion: 100 },
                    { step: 'Registration', users: 850, conversion: 85 },
                    { step: 'Payment', users: 680, conversion: 68 },
                    { step: 'First MCQ', users: 580, conversion: 58 },
                    { step: 'Regular Usage', users: 420, conversion: 42 }
                  ].map((step, index) => (
                    <div key={step.step} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-pink-100">{step.step}</span>
                          <span className="text-white">{step.users} users ({step.conversion}%)</span>
                        </div>
                        <Progress value={step.conversion} className="h-2 bg-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Session Duration Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { duration: '0-5 min', count: 320, percentage: 32 },
                        { duration: '5-15 min', count: 280, percentage: 28 },
                        { duration: '15-30 min', count: 220, percentage: 22 },
                        { duration: '30+ min', count: 180, percentage: 18 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ duration, percentage }) => `${duration}: ${percentage}%`}
                    >
                      {chartColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Feature Usage */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Feature Usage & Satisfaction</h3>
              <div className="space-y-4">
                {[
                  { feature: 'MCQ Practice', usage: 95, satisfaction: 4.8 },
                  { feature: 'Mock Exams', usage: 78, satisfaction: 4.6 },
                  { feature: 'Performance Analytics', usage: 65, satisfaction: 4.4 },
                  { feature: 'Study Plans', usage: 52, satisfaction: 4.2 }
                ].map((item, _index) => (
                  <div key={item.feature} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="text-pink-100">{item.feature}</div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-pink-200">Usage</span>
                        <span className="text-white">{item.usage}%</span>
                      </div>
                      <Progress value={item.usage} className="h-2 bg-white/20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-300">★</span>
                      <span className="text-white">{item.satisfaction}</span>
                      <span className="text-pink-200 text-sm">/ 5.0</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Growth Metrics Tab */}
          <TabsContent value="growth" className="space-y-6">
            {/* Growth KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">+12.5%</div>
                  <div className="text-pink-200 text-sm">Monthly Growth</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">45</div>
                  <div className="text-pink-200 text-sm">New Users Today</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">68%</div>
                  <div className="text-pink-200 text-sm">Conversion Rate</div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <div className="text-center">
                  <Award className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                  <div className="text-2xl text-white mb-1">72%</div>
                  <div className="text-pink-200 text-sm">User Retention</div>
                </div>
              </Card>
            </div>

            {/* Growth Prediction */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">User Growth Prediction</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { month: 'Jul', organic: 65, paid: 25, total: 90 },
                  { month: 'Aug', organic: 78, paid: 32, total: 110 },
                  { month: 'Sep', organic: 85, paid: 38, total: 123 },
                  { month: 'Oct', organic: 92, paid: 45, total: 137 },
                  { month: 'Nov', organic: 105, paid: 52, total: 157 },
                  { month: 'Dec', organic: 118, paid: 58, total: 176 }
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
                  />
                  <Legend />
                  <Area type="monotone" dataKey="organic" stackId="1" stroke="#10B981" fill="rgba(16, 185, 129, 0.3)" />
                  <Area type="monotone" dataKey="paid" stackId="1" stroke="#06B6D4" fill="rgba(6, 182, 212, 0.3)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Cohort Analysis */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">User Retention Cohort Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left text-pink-100 py-3 px-2">Cohort</th>
                      <th className="text-left text-pink-100 py-3 px-2">Users</th>
                      <th className="text-left text-pink-100 py-3 px-2">Week 1</th>
                      <th className="text-left text-pink-100 py-3 px-2">Week 2</th>
                      <th className="text-left text-pink-100 py-3 px-2">Week 4</th>
                      <th className="text-left text-pink-100 py-3 px-2">Week 8</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cohort: 'Jan 2024', users: 150, retention: [85, 72, 65, 58] },
                      { cohort: 'Feb 2024', users: 180, retention: [88, 75, 68, 61] },
                      { cohort: 'Mar 2024', users: 220, retention: [82, 70, 62, 55] },
                      { cohort: 'Apr 2024', users: 195, retention: [90, 78, 70, 63] }
                    ].map((cohort) => (
                      <tr key={cohort.cohort} className="border-b border-white/10">
                        <td className="text-white py-3 px-2 font-medium">{cohort.cohort}</td>
                        <td className="text-pink-100 py-3 px-2">{cohort.users}</td>
                        {cohort.retention.map((retention, index) => (
                          <td key={index} className="py-3 px-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              retention >= 70 ? 'bg-green-500/20 text-green-300' :
                              retention >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {retention}%
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Revenue Reports Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-green-300">PKR 2.8L</div>
                  <div className="text-pink-200 text-xs">Total Revenue</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-blue-300">PKR 28.5K</div>
                  <div className="text-pink-200 text-xs">MRR</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-purple-300">PKR 3.4L</div>
                  <div className="text-pink-200 text-xs">ARR</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-orange-300">PKR 125</div>
                  <div className="text-pink-200 text-xs">CAC</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-pink-300">PKR 850</div>
                  <div className="text-pink-200 text-xs">LTV</div>
                </div>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="text-center">
                  <div className="text-2xl text-cyan-300">78.5%</div>
                  <div className="text-pink-200 text-xs">Gross Margin</div>
                </div>
              </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Trend */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Monthly Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={[
                    { month: 'Jan', revenue: 24000, users: 150 },
                    { month: 'Feb', revenue: 26500, users: 180 },
                    { month: 'Mar', revenue: 27200, users: 195 },
                    { month: 'Apr', revenue: 28500, users: 220 },
                    { month: 'May', revenue: 31200, users: 245 },
                    { month: 'Jun', revenue: 34800, users: 268 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'white' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: 'white' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: 'white' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue (PKR)" />
                    <Line yAxisId="right" type="monotone" dataKey="users" stroke="#F59E0B" strokeWidth={3} name="Users" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>

              {/* Revenue by Specialty */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-white text-lg mb-4">Revenue by Specialty</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { specialty: 'Medicine', revenue: 145000, percentage: 45 },
                        { specialty: 'Surgery', revenue: 120000, percentage: 37 },
                        { specialty: 'Gynae & Obs', revenue: 58000, percentage: 18 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ specialty, percentage }) => `${specialty}: ${percentage}%`}
                    >
                      {chartColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Revenue Forecast */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Revenue Forecast (Next 6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { month: 'Jul', predicted: 38500, confidence: 85 },
                  { month: 'Aug', predicted: 42300, confidence: 82 },
                  { month: 'Sep', predicted: 46800, confidence: 78 },
                  { month: 'Oct', predicted: 51200, confidence: 75 },
                  { month: 'Nov', predicted: 55800, confidence: 72 },
                  { month: 'Dec', predicted: 61200, confidence: 68 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'white' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: 'white' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="predicted" fill="#8B5CF6" name="Predicted Revenue (PKR)" />
                  <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#F59E0B" strokeWidth={3} name="Confidence %" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}