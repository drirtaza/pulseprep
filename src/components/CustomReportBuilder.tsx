import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Plus, X, Download, Save, Calendar, BarChart3,
  Users, Target, Eye,
  Settings, FileText, Home, ChevronRight, ArrowLeft,
  Trash2, Edit3, Copy
} from 'lucide-react';
import { AdminData } from '../types';

interface ReportWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  dataSource: string;
  filters: Record<string, any>;
  dateRange: {
    from: string;
    to: string;
  };
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  createdAt: string;
  createdBy: string;
  lastModified: string;
  isPublic: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}

interface CustomReportBuilderProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function CustomReportBuilder({ admin, onNavigate }: CustomReportBuilderProps) {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [currentReport, setCurrentReport] = useState<CustomReport | null>(null);
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ReportWidget | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('builder');

  const widgetTypes = [
    { type: 'metric', label: 'Key Metric', icon: <Target className="h-4 w-4" /> },
    { type: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
    { type: 'table', label: 'Data Table', icon: <FileText className="h-4 w-4" /> },
    { type: 'text', label: 'Text Block', icon: <FileText className="h-4 w-4" /> }
  ];

  const dataSources = [
    { id: 'user-metrics', label: 'User Metrics', category: 'Users' },
    { id: 'revenue-data', label: 'Revenue Data', category: 'Finance' },
    { id: 'question-performance', label: 'Question Performance', category: 'Content' },
    { id: 'system-usage', label: 'System Usage', category: 'Platform' },
    { id: 'engagement-metrics', label: 'Engagement Metrics', category: 'Behavior' }
  ];

  const chartTypes = [
    { type: 'bar', label: 'Bar Chart' },
    { type: 'line', label: 'Line Chart' },
    { type: 'pie', label: 'Pie Chart' },
    { type: 'area', label: 'Area Chart' },
    { type: 'scatter', label: 'Scatter Plot' }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (currentReport) {
      loadReportData();
    }
  }, [currentReport]);

  const loadReports = () => {
    try {
      const storedReports = JSON.parse(localStorage.getItem('pulseprep_custom_reports') || '[]');
      setReports(storedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  const loadReportData = async () => {
    if (!currentReport) return;
    
    // Simulate loading data for each widget
    const data: Record<string, any> = {};
    
    for (const widget of currentReport.widgets) {
      data[widget.id] = await generateWidgetData(widget);
    }
    
    setReportData(data);
  };

  const generateWidgetData = async (widget: ReportWidget) => {
    // Simulate API call to get data based on widget configuration
    switch (widget.dataSource) {
      case 'user-metrics':
        return {
          totalUsers: 750,
          activeUsers: 520,
          newUsers: 45,
          userGrowth: [
            { month: 'Jan', users: 600 },
            { month: 'Feb', users: 650 },
            { month: 'Mar', users: 700 },
            { month: 'Apr', users: 750 }
          ]
        };
        
      case 'revenue-data':
        return {
          totalRevenue: 285000,
          monthlyRevenue: 28500,
          revenueGrowth: 12.5,
          revenueByMonth: [
            { month: 'Jan', revenue: 24000 },
            { month: 'Feb', revenue: 26500 },
            { month: 'Mar', revenue: 27200 },
            { month: 'Apr', revenue: 28500 }
          ]
        };
        
      case 'question-performance':
        return {
          totalQuestions: 1350,
          avgAccuracy: 64.5,
          topSystems: [
            { system: 'Cardiology', accuracy: 68 },
            { system: 'Respiratory', accuracy: 72 },
            { system: 'Neurology', accuracy: 58 }
          ]
        };
        
      case 'system-usage':
        return {
          totalSessions: 2150,
          avgSessionDuration: 28.5,
          popularFeatures: [
            { feature: 'MCQ Practice', usage: 95 },
            { feature: 'Mock Exams', usage: 78 },
            { feature: 'Analytics', usage: 65 }
          ]
        };
        
      case 'engagement-metrics':
        return {
          dailyActiveUsers: 320,
          weeklyActiveUsers: 650,
          retention30d: 72,
          engagementTrend: [
            { date: '2024-01-01', engagement: 65 },
            { date: '2024-01-02', engagement: 68 },
            { date: '2024-01-03', engagement: 72 },
            { date: '2024-01-04', engagement: 70 }
          ]
        };
        
      default:
        return {};
    }
  };

  const createNewReport = () => {
    const newReport: CustomReport = {
      id: `report-${Date.now()}`,
      name: 'New Custom Report',
      description: 'A custom analytics report',
      widgets: [],
      createdAt: new Date().toISOString(),
      createdBy: admin.name,
      lastModified: new Date().toISOString(),
      isPublic: false
    };
    
    setCurrentReport(newReport);
    setWidgets([]);
    setIsEditMode(true);
    setActiveTab('builder');
  };

  const addWidget = (type: string) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      chartType: type === 'chart' ? 'bar' : undefined,
      dataSource: dataSources[0].id,
      filters: {},
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      size: 'medium',
      position: { x: 0, y: widgets.length * 200 }
    };
    
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    
    if (currentReport) {
      setCurrentReport({
        ...currentReport,
        widgets: updatedWidgets,
        lastModified: new Date().toISOString()
      });
    }
    
    setSelectedWidget(newWidget);
    setShowWidgetPanel(true);
  };

  const updateWidget = (widgetId: string, updates: Partial<ReportWidget>) => {
    const updatedWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setWidgets(updatedWidgets);
    
    if (currentReport) {
      setCurrentReport({
        ...currentReport,
        widgets: updatedWidgets,
        lastModified: new Date().toISOString()
      });
    }
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget({ ...selectedWidget, ...updates });
    }
  };

  const removeWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(updatedWidgets);
    
    if (currentReport) {
      setCurrentReport({
        ...currentReport,
        widgets: updatedWidgets,
        lastModified: new Date().toISOString()
      });
    }
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
      setShowWidgetPanel(false);
    }
  };

  const saveReport = () => {
    if (!currentReport) return;
    
    const existingReports = [...reports];
    const existingIndex = existingReports.findIndex(r => r.id === currentReport.id);
    
    const reportToSave = {
      ...currentReport,
      widgets,
      lastModified: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      existingReports[existingIndex] = reportToSave;
    } else {
      existingReports.push(reportToSave);
    }
    
    setReports(existingReports);
    localStorage.setItem('pulseprep_custom_reports', JSON.stringify(existingReports));
    setIsEditMode(false);
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = '✅ Report saved successfully!';
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  const duplicateReport = (report: CustomReport) => {
    const duplicatedReport: CustomReport = {
      ...report,
      id: `report-${Date.now()}`,
      name: `${report.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      widgets: report.widgets.map(widget => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    
    setReports([duplicatedReport, ...reports]);
    localStorage.setItem('pulseprep_custom_reports', JSON.stringify([duplicatedReport, ...reports]));
  };

  const deleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('pulseprep_custom_reports', JSON.stringify(updatedReports));
      
      if (currentReport?.id === reportId) {
        setCurrentReport(null);
        setWidgets([]);
        setActiveTab('library');
      }
    }
  };

  const exportReport = (format: 'json' | 'pdf') => {
    if (!currentReport) return;
    
    if (format === 'json') {
      const exportData = {
        report: currentReport,
        data: reportData
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentReport.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      alert('PDF export functionality would be implemented with a library like jsPDF');
    }
  };

  const renderWidget = (widget: ReportWidget) => {
    const data = reportData[widget.id] || {};
    
    switch (widget.type) {
      case 'metric':
        return (
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 h-full">
            <div className="text-center">
              <h3 className="text-white text-lg mb-2">{widget.title}</h3>
              <div className="text-3xl text-blue-300 mb-1">
                {typeof data.value === 'number' ? data.value.toLocaleString() : (data.totalUsers || data.totalRevenue || 0)}
              </div>
              <div className="text-pink-200 text-sm">
                {data.change && (
                  <span className={`${data.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {data.change > 0 ? '+' : ''}{data.change}%
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
        
      case 'chart':
        return (
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 h-full">
            <h3 className="text-white text-lg mb-4">{widget.title}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <div>
                {widget.chartType === 'bar' && (
                  <BarChart data={data.userGrowth || data.revenueByMonth || []}>
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
                    <Bar dataKey="users" fill="#8B5CF6" />
                    <Bar dataKey="revenue" fill="#10B981" />
                  </BarChart>
                )}
                
                {widget.chartType === 'line' && (
                  <LineChart data={data.engagementTrend || []}>
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
                    <Line type="monotone" dataKey="engagement" stroke="#06B6D4" strokeWidth={2} />
                  </LineChart>
                )}
                
                {widget.chartType === 'pie' && (
                  <PieChart>
                    <Pie
                      data={data.topSystems || data.popularFeatures || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="accuracy"
                      label={({ system, feature }) => system || feature}
                    >
                      {(data.topSystems || data.popularFeatures || []).map((entry: any) => (
                        <Cell key={`cell-${entry.system || entry.feature}`} fill={['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][0]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </div>
            </ResponsiveContainer>
          </Card>
        );
        
      case 'table':
        return (
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 h-full">
            <h3 className="text-white text-lg mb-4">{widget.title}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-pink-100 py-2">Item</th>
                    <th className="text-left text-pink-100 py-2">Value</th>
                    <th className="text-left text-pink-100 py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topSystems || data.popularFeatures || []).map((item: any) => (
                    <tr key={item.system || item.feature} className="border-b border-white/10">
                      <td className="text-white py-2">{item.system || item.feature}</td>
                      <td className="text-pink-100 py-2">{item.accuracy || item.usage}%</td>
                      <td className="text-green-300 py-2">+5%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
        
      case 'text':
        return (
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 h-full">
            <h3 className="text-white text-lg mb-4">{widget.title}</h3>
            <div className="text-pink-100">
              <p>This is a custom text block. You can add insights, explanations, or any other text content here.</p>
            </div>
          </Card>
        );
        
      default:
        return null;
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
            <span className="text-white">Custom Report Builder</span>
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
            <h1 className="text-3xl text-white mb-2">🎯 Custom Report Builder</h1>
            <p className="text-pink-100">Create personalized analytics reports with drag-and-drop widgets</p>
          </div>
          <div className="flex items-center space-x-4">
            {currentReport && (
              <>
                <Button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Preview' : 'Edit'}
                </Button>
                <Button
                  onClick={saveReport}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
                <Button
                  onClick={() => exportReport('json')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button
              onClick={createNewReport}
              className="bg-white text-[#7A0C2E] hover:bg-pink-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="builder" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <Settings className="h-4 w-4 mr-2" />
              Report Builder
            </TabsTrigger>
            <TabsTrigger value="library" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#7A0C2E]">
              <FileText className="h-4 w-4 mr-2" />
              Report Library
            </TabsTrigger>
          </TabsList>

          {/* Report Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            {currentReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Report Canvas */}
                <div className="lg:col-span-3">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <input
                          type="text"
                          value={currentReport.name}
                          onChange={(e) => setCurrentReport({...currentReport, name: e.target.value})}
                          className="text-xl text-white bg-transparent border-b border-white/20 focus:border-white/40 outline-none"
                        />
                        <textarea
                          value={currentReport.description}
                          onChange={(e) => setCurrentReport({...currentReport, description: e.target.value})}
                          className="text-pink-100 text-sm bg-transparent border-none outline-none resize-none mt-1 w-full"
                          rows={1}
                        />
                      </div>
                      {isEditMode && (
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => setShowWidgetPanel(!showWidgetPanel)}
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Widget
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Widget Canvas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-96">
                      {widgets.map((widget) => (
                        <div
                          key={widget.id}
                          className={`relative ${
                            widget.size === 'small' ? 'col-span-1' :
                            widget.size === 'medium' ? 'md:col-span-1' :
                            widget.size === 'large' ? 'md:col-span-2' :
                            'md:col-span-3'
                          }`}
                        >
                          {isEditMode && (
                            <div className="absolute top-2 right-2 z-10 flex space-x-1">
                              <Button
                                onClick={() => {
                                  setSelectedWidget(widget);
                                  setShowWidgetPanel(true);
                                }}
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 text-white border-0 p-1"
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => removeWidget(widget.id)}
                                size="sm"
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-0 p-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {renderWidget(widget)}
                        </div>
                      ))}
                      
                      {widgets.length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <div className="text-pink-200 mb-4">
                            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>No widgets added yet</p>
                            <p className="text-sm">Click "Add Widget" to start building your report</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Widget Panel */}
                {showWidgetPanel && (
                  <div className="lg:col-span-1">
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg">
                          {selectedWidget ? 'Edit Widget' : 'Add Widget'}
                        </h3>
                        <Button
                          onClick={() => setShowWidgetPanel(false)}
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 p-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {!selectedWidget ? (
                        <div className="space-y-3">
                          <p className="text-pink-100 text-sm mb-4">Choose a widget type:</p>
                          {widgetTypes.map((type) => (
                            <Button
                              key={type.type}
                              onClick={() => addWidget(type.type)}
                              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 justify-start"
                            >
                              {type.icon}
                              <span className="ml-2">{type.label}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-pink-100 text-sm mb-2">Title</label>
                            <input
                              type="text"
                              value={selectedWidget.title}
                              onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-pink-100 text-sm mb-2">Data Source</label>
                            <select
                              value={selectedWidget.dataSource}
                              onChange={(e) => updateWidget(selectedWidget.id, { dataSource: e.target.value })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            >
                              {dataSources.map((source) => (
                                <option key={source.id} value={source.id}>
                                  {source.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedWidget.type === 'chart' && (
                            <div>
                              <label className="block text-pink-100 text-sm mb-2">Chart Type</label>
                              <select
                                value={selectedWidget.chartType}
                                onChange={(e) => updateWidget(selectedWidget.id, { chartType: e.target.value as any })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                              >
                                {chartTypes.map((chart) => (
                                  <option key={chart.type} value={chart.type}>
                                    {chart.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-pink-100 text-sm mb-2">Size</label>
                            <select
                              value={selectedWidget.size}
                              onChange={(e) => updateWidget(selectedWidget.id, { size: e.target.value as any })}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                              <option value="full">Full Width</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-pink-100 text-sm mb-2">From</label>
                              <input
                                type="date"
                                value={selectedWidget.dateRange.from}
                                onChange={(e) => updateWidget(selectedWidget.id, { 
                                  dateRange: { ...selectedWidget.dateRange, from: e.target.value }
                                })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-pink-100 text-sm mb-2">To</label>
                              <input
                                type="date"
                                value={selectedWidget.dateRange.to}
                                onChange={(e) => updateWidget(selectedWidget.id, { 
                                  dateRange: { ...selectedWidget.dateRange, to: e.target.value }
                                })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-12">
                <div className="text-center text-pink-200">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl text-white mb-2">No Report Selected</h3>
                  <p className="mb-6">Create a new report or select an existing one from the library</p>
                  <Button
                    onClick={createNewReport}
                    className="bg-white text-[#7A0C2E] hover:bg-pink-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Report
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Report Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white text-lg mb-2">{report.name}</h3>
                      <p className="text-pink-100 text-sm mb-3">{report.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-pink-200">
                        <div>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(report.lastModified).toLocaleDateString()}
                        </div>
                        <div>
                          <Users className="h-3 w-3 inline mr-1" />
                          {report.createdBy}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${report.isPublic ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'}`}>
                      {report.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-pink-200 text-sm">
                      {report.widgets.length} widgets
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => {
                          setCurrentReport(report);
                          setWidgets(report.widgets);
                          setActiveTab('builder');
                        }}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentReport(report);
                          setWidgets(report.widgets);
                          setIsEditMode(true);
                          setActiveTab('builder');
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => duplicateReport(report)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => deleteReport(report.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-pink-200" />
                  <h3 className="text-xl text-white mb-2">No Custom Reports</h3>
                  <p className="text-pink-200 mb-6">Create your first custom report to get started</p>
                  <Button
                    onClick={createNewReport}
                    className="bg-white text-[#7A0C2E] hover:bg-pink-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}