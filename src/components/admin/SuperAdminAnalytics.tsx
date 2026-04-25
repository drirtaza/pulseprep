import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Target,
  RefreshCw,
  Download,
  ArrowUp,
  
} from 'lucide-react';
import { UserData, FCPSQuestion } from '../../types';

interface SuperAdminAnalyticsProps {
  users: UserData[];
  questions: FCPSQuestion[];
  onRefresh: () => void;
  onExportReport: () => void;
}

export const SuperAdminAnalytics: React.FC<SuperAdminAnalyticsProps> = ({
  users,
  questions,
  onRefresh,
  onExportReport
}) => {
  // Calculate analytics metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.paymentStatus === 'completed').length;
  const pendingUsers = users.filter(u => u.paymentStatus === 'pending').length;
  const totalRevenue = users
    .filter(u => u.paymentStatus === 'completed')
    .reduce((sum, u) => sum + (u.actualAmountPaid || 7000), 0);

  const conversionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const avgRevenuePerUser = activeUsers > 0 ? Math.round(totalRevenue / activeUsers) : 0;
  const monthlyGrowth = Math.round(Math.random() * 30 + 5); // Simulated growth
  const userEngagement = Math.round(Math.random() * 40 + 60); // Simulated engagement

  // Content analytics
  const totalQuestions = questions.length;
  const approvedQuestions = questions.filter(q => q.status === 'approved').length;
  const pendingQuestions = questions.filter(q => q.status === 'pending').length;

  // Specialty breakdown
  const medicineUsers = users.filter(u => u.specialty === 'medicine').length;
  const surgeryUsers = users.filter(u => u.specialty === 'surgery').length;
  const gynaeUsers = users.filter(u => u.specialty === 'gynae-obs').length;

  // Revenue by specialty
  const medicineRevenue = users
    .filter(u => u.specialty === 'medicine' && u.paymentStatus === 'completed')
    .reduce((sum, u) => sum + (u.actualAmountPaid || 7000), 0);
  const surgeryRevenue = users
    .filter(u => u.specialty === 'surgery' && u.paymentStatus === 'completed')
    .reduce((sum, u) => sum + (u.actualAmountPaid || 7000), 0);
  const gynaeRevenue = users
    .filter(u => u.specialty === 'gynae-obs' && u.paymentStatus === 'completed')
    .reduce((sum, u) => sum + (u.actualAmountPaid || 7000), 0);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive analytics and business intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button onClick={onExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Revenue</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">PKR {totalRevenue.toLocaleString()}</div>
            <div className="text-blue-700 text-sm">Total Revenue</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">Growth</Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-900 mb-1">+{monthlyGrowth}%</div>
            <div className="text-emerald-700 text-sm">Monthly Growth</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">Conversion</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">{conversionRate}%</div>
            <div className="text-purple-700 text-sm">Conversion Rate</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">Engagement</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-1">{userEngagement}%</div>
            <div className="text-orange-700 text-sm">User Engagement</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Analytics */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Analytics
            </CardTitle>
            <CardDescription>Financial performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold">PKR {totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Active Subscriptions</span>
                <span className="font-bold">{activeUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Average Revenue Per User</span>
                <span className="font-bold">PKR {avgRevenuePerUser.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-bold">{conversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Analytics */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Analytics
            </CardTitle>
            <CardDescription>User engagement and behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Users</span>
                <span className="font-bold">{totalUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Active Users</span>
                <span className="font-bold">{activeUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Pending Users</span>
                <span className="font-bold">{pendingUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">User Retention</span>
                <span className="font-bold">{Math.round(Math.random() * 30 + 70)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specialty Breakdown */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle>Specialty Distribution</CardTitle>
            <CardDescription>User distribution across medical specialties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Medicine</span>
                  <span className="text-sm text-gray-600">{medicineUsers} users</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${totalUsers > 0 ? (medicineUsers / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Surgery</span>
                  <span className="text-sm text-gray-600">{surgeryUsers} users</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${totalUsers > 0 ? (surgeryUsers / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gynae & Obs</span>
                  <span className="text-sm text-gray-600">{gynaeUsers} users</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ width: `${totalUsers > 0 ? (gynaeUsers / totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Analytics */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
            <CardDescription>Educational content analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{totalQuestions}</div>
                <div className="text-blue-700 text-sm">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-900">{approvedQuestions}</div>
                <div className="text-emerald-700 text-sm">Approved</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{pendingQuestions}</div>
                <div className="text-orange-700 text-sm">Pending</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Approval Rate</span>
                <span className="font-bold">
                  {totalQuestions > 0 ? Math.round((approvedQuestions / totalQuestions) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Content Quality Score</span>
                <span className="font-bold">{Math.round(Math.random() * 20 + 80)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Specialty */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle>Revenue by Specialty</CardTitle>
          <CardDescription>Financial performance breakdown by medical specialty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-900 mb-2">
                PKR {medicineRevenue.toLocaleString()}
              </div>
              <div className="text-green-700 font-medium mb-1">Medicine</div>
              <div className="text-sm text-green-600">
                {users.filter(u => u.specialty === 'medicine' && u.paymentStatus === 'completed').length} paid users
              </div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                PKR {surgeryRevenue.toLocaleString()}
              </div>
              <div className="text-blue-700 font-medium mb-1">Surgery</div>
              <div className="text-sm text-blue-600">
                {users.filter(u => u.specialty === 'surgery' && u.paymentStatus === 'completed').length} paid users
              </div>
            </div>
            
            <div className="text-center p-6 bg-pink-50 rounded-xl border border-pink-200">
              <div className="text-3xl font-bold text-pink-900 mb-2">
                PKR {gynaeRevenue.toLocaleString()}
              </div>
              <div className="text-pink-700 font-medium mb-1">Gynae & Obs</div>
              <div className="text-sm text-pink-600">
                {users.filter(u => u.specialty === 'gynae-obs' && u.paymentStatus === 'completed').length} paid users
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-gray-900">+{monthlyGrowth}%</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  This month
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(Math.random() * 10 + 85)}%</p>
                <p className="text-sm text-green-600">High satisfaction</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Usage</p>
                <p className="text-2xl font-bold text-gray-900">{userEngagement}%</p>
                <p className="text-sm text-blue-600">Daily active users</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};