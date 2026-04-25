import { useState, useEffect } from 'react';
import { analyticsService, AnalyticsReport } from '../services/AnalyticsService';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, Download, Calendar, Search, TrendingUp,
  Users, DollarSign, Shield, BarChart3, RefreshCw, Target,
  ArrowLeft, Home, ChevronRight
} from 'lucide-react';
import { AdminData } from '../types';

interface ReportsPageProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function ReportsPage({ admin, onNavigate }: ReportsPageProps) {
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    try {
      const storedReports = JSON.parse(localStorage.getItem('pulseprep_analytics_reports') || '[]');
      setReports(storedReports.sort((a: AnalyticsReport, b: AnalyticsReport) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  const generateReport = async (reportType: AnalyticsReport['reportType']) => {
    setIsGenerating(true);
    try {
      const report = analyticsService.generateReport(
        reportType,
        {
          from: new Date(dateRange.from).toISOString(),
          to: new Date(dateRange.to).toISOString()
        },
        admin.name
      );
      
      setReports(prev => [report, ...prev]);
      setSelectedReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (report: AnalyticsReport, format: 'json' | 'pdf') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}-${new Date(report.generatedAt).toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // In a real implementation, this would generate a PDF
      alert('PDF export functionality would be implemented here with a library like jsPDF or server-side rendering.');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || report.reportType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'user-performance': return <Users className="h-4 w-4" />;
      case 'system-usage': return <BarChart3 className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'comprehensive': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'user-performance': return 'bg-blue-500/20 text-blue-200';
      case 'system-usage': return 'bg-green-500/20 text-green-200';
      case 'financial': return 'bg-yellow-500/20 text-yellow-200';
      case 'security': return 'bg-red-500/20 text-red-200';
      case 'comprehensive': return 'bg-purple-500/20 text-purple-200';
      default: return 'bg-gray-500/20 text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A0C2E] to-[#5A0821] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-pink-100 text-sm mb-4">
            <Home className="h-4 w-4" />
            <span>Super Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Reports Center</span>
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
            <h1 className="text-3xl text-white mb-2">📊 Analytics Reports</h1>
            <p className="text-pink-100">Generate and view detailed analytics reports</p>
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
            <Button
              onClick={() => onNavigate('analytics-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Dashboard
            </Button>
            <Button
              onClick={() => onNavigate('admin-dashboard')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Report Generation & List */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generate New Report */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Generate New Report</h3>
              
              {/* Date Range Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-pink-100 text-sm mb-2">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Report Type Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => generateReport('comprehensive')}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Comprehensive Report'}
                </Button>
                
                <Button
                  onClick={() => generateReport('user-performance')}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Performance
                </Button>
                
                <Button
                  onClick={() => generateReport('system-usage')}
                  disabled={isGenerating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  System Usage
                </Button>
                
                <Button
                  onClick={() => generateReport('financial')}
                  disabled={isGenerating}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financial
                </Button>
                
                <Button
                  onClick={() => generateReport('security')}
                  disabled={isGenerating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Button>
              </div>
            </Card>

            {/* Search and Filter */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <h3 className="text-white text-lg mb-4">Filter Reports</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-pink-100 text-sm mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pink-300" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-pink-300"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-pink-100 text-sm mb-2">Report Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="all">All Reports</option>
                    <option value="comprehensive">Comprehensive</option>
                    <option value="user-performance">User Performance</option>
                    <option value="system-usage">System Usage</option>
                    <option value="financial">Financial</option>
                    <option value="security">Security</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Reports List */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg">Recent Reports ({filteredReports.length})</h3>
                <Button
                  onClick={loadReports}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedReport?.id === report.id
                        ? 'bg-white/20 border-white/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getReportTypeIcon(report.reportType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {report.title}
                          </p>
                          <p className="text-pink-200 text-xs mt-1">
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </p>
                          <Badge className={`${getReportTypeBadgeColor(report.reportType)} mt-2`}>
                            {report.reportType.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredReports.length === 0 && (
                  <div className="text-center text-pink-200 py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reports found</p>
                    <p className="text-sm">Generate your first report to get started</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel - Report Details */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                {/* Report Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      {getReportTypeIcon(selectedReport.reportType)}
                      <h2 className="text-2xl text-white">{selectedReport.title}</h2>
                    </div>
                    <p className="text-pink-100 mb-4">{selectedReport.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-pink-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Generated: {new Date(selectedReport.generatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>By: {selectedReport.generatedBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => exportReport(selectedReport, 'json')}
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={() => exportReport(selectedReport, 'pdf')}
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                {/* Report Content */}
                <Tabs defaultValue="summary" className="space-y-6">
                  <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <TabsTrigger value="summary" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
                      Recommendations
                    </TabsTrigger>
                    <TabsTrigger value="data" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
                      Raw Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-6">
                    {/* Date Range */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white mb-2">Report Period</h4>
                      <p className="text-pink-200 text-sm">
                        {new Date(selectedReport.dateRange.from).toLocaleDateString()} - {new Date(selectedReport.dateRange.to).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Key Metrics Summary */}
                    {selectedReport.reportType === 'comprehensive' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                          <Users className="h-6 w-6 text-blue-300 mx-auto mb-2" />
                          <div className="text-xl text-white">
                            {selectedReport.data?.userPerformance?.userMetrics?.length || 0}
                          </div>
                          <div className="text-pink-200 text-sm">Total Users</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                          <BarChart3 className="h-6 w-6 text-green-300 mx-auto mb-2" />
                          <div className="text-xl text-white">
                            {selectedReport.data?.systemUsage?.totalSessions || 0}
                          </div>
                          <div className="text-pink-200 text-sm">Total Sessions</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                          <DollarSign className="h-6 w-6 text-yellow-300 mx-auto mb-2" />
                          <div className="text-xl text-white">
                            ${selectedReport.data?.financial?.totalRevenue?.toLocaleString() || 0}
                          </div>
                          <div className="text-pink-200 text-sm">Revenue</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                          <TrendingUp className="h-6 w-6 text-purple-300 mx-auto mb-2" />
                          <div className="text-xl text-white">
                            {selectedReport.data?.systemUsage?.averageAccuracy?.toFixed(1) || 0}%
                          </div>
                          <div className="text-pink-200 text-sm">Avg Accuracy</div>
                        </div>
                      </div>
                    )}

                    {/* Report Type Specific Summary */}
                    {selectedReport.reportType === 'user-performance' && (
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h4 className="text-white text-lg mb-4">User Performance Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl text-blue-300">
                              {selectedReport.data?.userMetrics?.length || 0}
                            </div>
                            <div className="text-pink-200 text-sm">Active Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-green-300">
                              {selectedReport.data?.averageScores?.overall?.toFixed(1) || 0}%
                            </div>
                            <div className="text-pink-200 text-sm">Average Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-purple-300">
                              {selectedReport.data?.completionRates?.overall?.toFixed(1) || 0}%
                            </div>
                            <div className="text-pink-200 text-sm">Completion Rate</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedReport.reportType === 'financial' && (
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h4 className="text-white text-lg mb-4">Financial Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl text-green-300">
                              ${selectedReport.data?.totalRevenue?.toLocaleString() || 0}
                            </div>
                            <div className="text-pink-200 text-sm">Total Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-blue-300">
                              {selectedReport.data?.conversionRate?.toFixed(1) || 0}%
                            </div>
                            <div className="text-pink-200 text-sm">Conversion Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-purple-300">
                              ${selectedReport.data?.averageRevenuePerUser?.toFixed(0) || 0}
                            </div>
                            <div className="text-pink-200 text-sm">ARPU</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-4">
                    <h4 className="text-white text-lg">Key Insights</h4>
                    {selectedReport.insights.length > 0 ? (
                      <div className="space-y-3">
                        {selectedReport.insights.map((insight, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start space-x-3">
                              <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                                <TrendingUp className="h-4 w-4 text-blue-300" />
                              </div>
                              <p className="text-pink-100 flex-1">{insight}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-pink-200 py-8">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No insights available for this report</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <h4 className="text-white text-lg">Recommendations</h4>
                    {selectedReport.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedReport.recommendations.map((recommendation, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start space-x-3">
                              <div className="bg-green-500/20 p-2 rounded-lg mt-1">
                                <Target className="h-4 w-4 text-green-300" />
                              </div>
                              <p className="text-pink-100 flex-1">{recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-pink-200 py-8">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recommendations available for this report</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="data" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white text-lg">Raw Data</h4>
                      <Button
                        onClick={() => exportReport(selectedReport, 'json')}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                      <pre className="text-pink-100 text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedReport.data, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-12">
                <div className="text-center text-pink-200">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl text-white mb-2">No Report Selected</h3>
                  <p className="mb-6">Select a report from the list or generate a new one to view detailed analytics</p>
                  <Button
                    onClick={() => generateReport('comprehensive')}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Comprehensive Report'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}