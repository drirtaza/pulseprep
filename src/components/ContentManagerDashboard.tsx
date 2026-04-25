import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { 
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  BarChart3,
  
  Eye,
  Edit,
  Trash2,
  Target,
  Zap,
  Database,
  FileText,
  Settings,
  MessageSquare
  
  
  
} from 'lucide-react';

import QuestionEditor from './QuestionEditor';
import SystemManager from './SystemManager';
import ExcelImportWizard from './ExcelImportWizard';
import MockExamManagement from './MockExamManagement';
import { AdminData, FCPSQuestion, QuestionData } from '../types';
import {
  getFCPSQuestions,
  getMedicalSystems,
  getSystemRequests,
  createFCPSQuestion,
  updateFCPSQuestion,
  deleteFCPSQuestion,
  logCMSActivity
} from '../utils/cmsUtils';

// Import Excel import utilities
import {
  getImportHistory,
  getImportStatistics,
  BatchSubmission
} from '../utils/excelImportUtils';

interface ContentManagerDashboardProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type DashboardView = 'overview' | 'questions' | 'systems' | 'excel-import' | 'import-history' | 'mock-exams';

const ContentManagerDashboard: React.FC<ContentManagerDashboardProps> = ({
  admin,
  onNavigate,
  onLogout
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [questions, setQuestions] = useState<FCPSQuestion[]>([]);
  

  const [importStats, setImportStats] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<BatchSubmission[]>([]);
  
  // UI states
  const [selectedSpecialty, setSelectedSpecialty] = useState<'medicine' | 'surgery' | 'gynae-obs'>('medicine');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showSystemManager, setShowSystemManager] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FCPSQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load questions, systems, and analytics
      const [questionsData ] = await Promise.all([
        getFCPSQuestions(),
        getMedicalSystems(),
        getSystemRequests()
      ]);

      setQuestions(questionsData);
      

      // Load Excel import data
      const importStatsData = getImportStatistics(admin.id);
      const importHistoryData = getImportHistory(admin.id);
      
      setImportStats(importStatsData);
      setImportHistory(importHistoryData);



    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [selectedSpecialty]);

  // ✅ SURGICAL FIX: Fixed event listener dependencies
  useEffect(() => {
    const handleSystemUpdate = async () => {
      // Force refresh medical systems cache first
      try {
        const { forceRefreshMedicalSystems } = await import('../utils/cmsUtils');
        forceRefreshMedicalSystems();
      } catch (error) {
        console.error('❌ Error force refreshing medical systems:', error);
      }
      
      // Then reload dashboard data
      loadDashboardData();
    };

    window.addEventListener('medicalSystemsUpdated', handleSystemUpdate);
    
    return () => {
      window.removeEventListener('medicalSystemsUpdated', handleSystemUpdate);
    };
  }, [loadDashboardData]); // ✅ FIXED: Added loadDashboardData dependency

  // Question management
  const handleCreateQuestion = async (questionData: QuestionData) => {
    try {
      // Convert QuestionData to FCPSQuestion format for creation
      const fcpsQuestion: Omit<FCPSQuestion, 'id' | 'createdAt'> = {
        question: questionData.text,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        specialty: questionData.specialty,
        system: questionData.system,
        difficulty: questionData.difficulty,
        status: questionData.status,
        createdBy: admin.id,
        optionExplanations: questionData.optionExplanations || [],
        tags: questionData.tags || [],
        updatedAt: new Date().toISOString()
      };

      const newQuestion = await createFCPSQuestion(fcpsQuestion);
      
      setQuestions(prev => [newQuestion, ...prev]);
      setShowQuestionEditor(false);
      
      // Log activity
      await logCMSActivity(
        'Question Created',
        `New question created: "${questionData.text.substring(0, 50)}..."`,
        admin.id,
        'content-manager',
        'creation'
      );

      // Log audit event for question creation
      try {
        const { securityService } = await import('../services/SecurityService');
        const { AuditService } = await import('../services/AuditService');
        
        securityService.logAuditEvent('content.mcq-created', admin, {
          description: `New FCPS question created: ${questionData.text.substring(0, 50)}...`,
          metadata: {
            questionId: newQuestion.id,
            specialty: questionData.specialty,
            system: questionData.system,
            difficulty: questionData.difficulty
          },
          target: {
            type: 'content',
            id: newQuestion.id,
            name: questionData.text.substring(0, 50)
          }
        });

        AuditService.logCMSAction(
          'Question Created',
          admin.name,
          admin.role,
          newQuestion.id,
          true,
          {
            questionId: newQuestion.id,
            specialty: questionData.specialty,
            system: questionData.system,
            difficulty: questionData.difficulty
          }
        );
      } catch (error) {
        console.error('Failed to log question creation:', error);
      }
      

    } catch (error) {
      console.error('❌ Error creating question:', error);
    }
  };

  const handleUpdateQuestion = async (questionData: QuestionData) => {
    try {
      if (!editingQuestion) return;

      // Convert QuestionData to FCPSQuestion format for update
      const fcpsQuestion: FCPSQuestion = {
        id: editingQuestion.id,
        question: questionData.text,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        specialty: questionData.specialty,
        system: questionData.system,
        difficulty: questionData.difficulty,
        status: questionData.status,
        createdBy: editingQuestion.createdBy,
        optionExplanations: questionData.optionExplanations || [],
        tags: questionData.tags || [],
        createdAt: editingQuestion.createdAt,
        updatedAt: new Date().toISOString()
      };

      const updatedQuestion = await updateFCPSQuestion(editingQuestion.id, fcpsQuestion);
      
      setQuestions(prev => prev.map(q => q.id === (updatedQuestion as any)?.id ? updatedQuestion! : q));
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      
      // Log question update
      try {
        const { securityService } = await import('../services/SecurityService');
        const { AuditService } = await import('../services/AuditService');
        
        securityService.logAuditEvent('content.mcq-updated', admin, {
          description: `FCPS question updated: ${questionData.text.substring(0, 50)}...`,
          metadata: {
            questionId: editingQuestion.id,
            specialty: questionData.specialty,
            system: questionData.system,
            difficulty: questionData.difficulty
          },
          target: {
            type: 'content',
            id: editingQuestion.id,
            name: questionData.text.substring(0, 50)
          }
        });

        AuditService.logCMSAction(
          'Question Updated',
          admin.name,
          admin.role,
          editingQuestion.id,
          true,
          {
            questionId: editingQuestion.id,
            specialty: questionData.specialty,
            system: questionData.system,
            difficulty: questionData.difficulty
          }
        );
      } catch (error) {
        console.error('Failed to log question update:', error);
      }
      
      console.log('✅ Question updated successfully');
    } catch (error) {
      console.error('❌ Error updating question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const questionToDelete = questions.find(q => q.id === questionId);
      await deleteFCPSQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      // Log question deletion
      try {
        const { securityService } = await import('../services/SecurityService');
        const { AuditService } = await import('../services/AuditService');
        
        securityService.logAuditEvent('content.mcq-deleted', admin, {
          description: `FCPS question deleted: ${questionToDelete?.question.substring(0, 50) || 'Unknown'}...`,
          metadata: {
            questionId: questionId,
            specialty: questionToDelete?.specialty || 'unknown',
            system: questionToDelete?.system || 'unknown'
          },
          target: {
            type: 'content',
            id: questionId,
            name: questionToDelete?.question.substring(0, 50) || 'Unknown'
          }
        });

        AuditService.logCMSAction(
          'Question Deleted',
          admin.name,
          admin.role,
          questionId,
          true,
          {
            questionId: questionId,
            specialty: questionToDelete?.specialty || 'unknown',
            system: questionToDelete?.system || 'unknown'
          }
        );
      } catch (error) {
        console.error('Failed to log question deletion:', error);
      }
      
      console.log('✅ Question deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting question:', error);
    }
  };

  // Excel import success handler
  const handleExcelImportSuccess = (batchSubmission: BatchSubmission) => {
    setShowExcelImport(false);
    
    // Reload data to show new imports
    loadDashboardData();
    
    // Show success message
    alert(`Excel import submitted successfully!\n\nBatch: ${batchSubmission.name}\nMCQs: ${batchSubmission.mcqCount}\nStatus: Pending Review`);
  };

  // Filter questions by specialty and user
  const userQuestions = questions.filter(q => 
    q.specialty === selectedSpecialty && q.createdBy === admin.id
  );

  
  // Render overview dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-900">
            Welcome back, {admin.name}! 👋
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Content Manager Dashboard - Create, manage, and import FCPS MCQs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionEditor(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Question
            </Button>
            <Button 
              onClick={() => setShowExcelImport(true)}
              variant="outline" 
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel MCQs
            </Button>
            <Button 
              onClick={() => setCurrentView('mock-exams')}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Target className="w-4 h-4 mr-2" />
              Mock Exams
            </Button>
            <Button 
              onClick={() => setShowSystemManager(true)}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Systems
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Questions</p>
                <p className="text-2xl font-bold text-gray-900">{userQuestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userQuestions.filter(q => q.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userQuestions.filter(q => q.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Import Batches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {importStats?.totalBatches || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Excel Import Statistics */}
      {importStats && importStats.totalBatches > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
              Excel Import Overview
            </CardTitle>
            <CardDescription>
              Your Excel import activity and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importStats.totalBatches}
                </div>
                <div className="text-sm text-blue-700">Total Batches</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importStats.totalMcqs}
                </div>
                <div className="text-sm text-green-700">Total MCQs</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importStats.pendingMcqs}
                </div>
                <div className="text-sm text-yellow-700">Pending Review</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {importStats.approvedMcqs}
                </div>
                <div className="text-sm text-emerald-700">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importStats.rejectedMcqs}
                </div>
                <div className="text-sm text-red-700">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Recent Questions
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('questions')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userQuestions.slice(0, 5).map((question) => (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {question.question.substring(0, 60)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      {question.system} • {new Date(question.createdAt || new Date()).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={
                    question.status === 'approved' ? 'bg-green-100 text-green-800' :
                    question.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {question.status}
                  </Badge>
                </div>
              ))}
              {userQuestions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No questions created yet. Start by creating your first question!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Import Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                Recent Imports
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('import-history')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importStats?.recentBatches?.slice(0, 5).map((batch: BatchSubmission) => (
                <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {batch.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {batch.mcqCount} MCQs • {new Date(batch.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={
                    batch.status === 'approved' ? 'bg-green-100 text-green-800' :
                    batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    batch.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {batch.status}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No Excel imports yet. Try importing your first batch!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks for content management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionEditor(true);
              }}
            >
              <Plus className="w-6 h-6 text-blue-600" />
              <span>Create Question</span>
              <span className="text-xs text-gray-500">Add new MCQ manually</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setShowExcelImport(true)}
            >
              <Upload className="w-6 h-6 text-green-600" />
              <span>Import Excel</span>
              <span className="text-xs text-gray-500">Bulk upload MCQs</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setCurrentView('mock-exams')}
            >
              <Target className="w-6 h-6 text-purple-600" />
              <span>Mock Exams</span>
              <span className="text-xs text-gray-500">Manage mock examinations</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setShowSystemManager(true)}
            >
              <Settings className="w-6 h-6 text-gray-600" />
              <span>Manage Systems</span>
              <span className="text-xs text-gray-500">Add/edit medical systems</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render questions management
  const renderQuestions = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              My Questions ({userQuestions.length})
            </div>
            <Button onClick={() => {
              setEditingQuestion(null);
              setShowQuestionEditor(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Question
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userQuestions.map((question) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      {question.question.substring(0, 100)}
                      {question.question.length > 100 && '...'}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{question.system}</span>
                      <span>•</span>
                      <span className="capitalize">{question.difficulty}</span>
                      <span>•</span>
                      <span>{new Date(question.createdAt || new Date()).toLocaleDateString()}</span>
                      {question.source === 'excel-import' && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            Excel Import
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      question.status === 'approved' ? 'bg-green-100 text-green-800' :
                      question.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {question.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowQuestionEditor(true);
                      }}
                      title="Edit question and add individual option explanations"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {userQuestions.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600">Create your first question to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render systems management tab content
  const renderSystemsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Medical Systems Management
          </CardTitle>
          <CardDescription>
            Manage medical systems for {selectedSpecialty} specialty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Systems Manager</h3>
            <p className="text-gray-600 mb-4">
              Access the systems management interface to view, edit, and manage medical systems and their questions.
            </p>
            <Button 
              onClick={() => setShowSystemManager(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Systems Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render import history
  const renderImportHistory = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Import History ({importHistory.length})
            </div>
            <Button onClick={() => setShowExcelImport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              New Import
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>MCQs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importHistory.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{batch.name}</div>
                      <div className="text-sm text-gray-500">{batch.originalFileName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{batch.mcqCount}</TableCell>
                  <TableCell>
                    <Badge className={
                      batch.status === 'approved' ? 'bg-green-100 text-green-800' :
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      batch.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      batch.priority === 'high' ? 'bg-red-100 text-red-800' :
                      batch.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {batch.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(batch.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {importHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No imports yet</h3>
                    <p className="text-gray-600">Start by importing your first Excel batch.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Content Manager Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Content Manager</h1>
              <Badge className="bg-emerald-100 text-emerald-800">
                {admin.role}
              </Badge>
            </div>
            
            {/* Specialty Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-700">Specialty:</Label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="medicine">Medicine</option>
                  <option value="surgery">Surgery</option>
                  <option value="gynae-obs">Gynae & Obs</option>
                </select>
              </div>
              
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as DashboardView)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Questions</span>
            </TabsTrigger>
            <TabsTrigger value="systems" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Systems</span>
            </TabsTrigger>
            <TabsTrigger value="mock-exams" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Mock Exams</span>
            </TabsTrigger>
            <TabsTrigger value="excel-import" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Excel Import</span>
            </TabsTrigger>
            <TabsTrigger value="import-history" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="questions">
            {renderQuestions()}
          </TabsContent>

          <TabsContent value="systems">
            {renderSystemsTab()}
          </TabsContent>

          <TabsContent value="mock-exams">
            <MockExamManagement
              admin={admin}
              selectedSpecialty={selectedSpecialty}
            />
          </TabsContent>

          <TabsContent value="excel-import">
            <ExcelImportWizard
              admin={admin}
              specialty={selectedSpecialty}
              onSuccess={handleExcelImportSuccess}
              onCancel={() => setCurrentView('overview')}
            />
          </TabsContent>

          <TabsContent value="import-history">
            {renderImportHistory()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Overlays */}
      {showQuestionEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <QuestionEditor
              admin={admin}
              onNavigate={onNavigate}
              initialQuestion={editingQuestion ? {
                id: editingQuestion.id,
                text: editingQuestion.question,
                options: editingQuestion.options,
                correctAnswer: editingQuestion.correctAnswer,
                explanation: editingQuestion.explanation,
                specialty: editingQuestion.specialty,
                system: editingQuestion.system,
                difficulty: editingQuestion.difficulty,
                status: editingQuestion.status || 'pending',
                submittedBy: editingQuestion.createdBy,
                optionExplanations: editingQuestion.optionExplanations || [],
                tags: editingQuestion.tags || [],
                isActive: true,
                createdAt: editingQuestion.createdAt,
                updatedAt: editingQuestion.updatedAt || editingQuestion.createdAt
              } : null}
              mode={editingQuestion ? 'edit' : 'create'}
              onSave={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
              onCancel={() => {
                setShowQuestionEditor(false);
                setEditingQuestion(null);
              }}
            />
          </div>
        </div>
      )}

      {showSystemManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <SystemManager
              onClose={() => setShowSystemManager(false)}
              adminId={admin.id}
              adminRole={admin.role}
              selectedSpecialty={selectedSpecialty}
            />
          </div>
        </div>
      )}

      {showExcelImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ExcelImportWizard
              admin={admin}
              specialty={selectedSpecialty}
              onSuccess={handleExcelImportSuccess}
              onCancel={() => setShowExcelImport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagerDashboard;