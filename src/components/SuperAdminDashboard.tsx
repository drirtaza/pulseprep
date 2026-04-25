import React, { useState, useEffect } from 'react';
import { SuperAdminSidebar } from './admin/SuperAdminSidebar';
import { SuperAdminHeader } from './admin/SuperAdminHeader';
import { SuperAdminOverview } from './admin/SuperAdminOverview';
import SuperAdminUsersTable from './admin/SuperAdminUsersTable';
import { SuperAdminContentManager } from './admin/SuperAdminContentManager';
import { SuperAdminAnalytics } from './admin/SuperAdminAnalytics';
import { SuperAdminSettings } from './admin/SuperAdminSettings';
import { SuperAdminSecurity } from './admin/SuperAdminSecurity';
import { SuperAdminAdminsTable } from './admin/SuperAdminAdminsTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { CheckCircle, XCircle, AlertTriangle, Clock, Eye, Edit, Crown, DollarSign, Shield, BookText, Users } from 'lucide-react';
import { AdminData, UserData, FCPSQuestion, SystemRequest, MockExamSet, MockExamQuestion, PageType, UserStatus } from '../types';

// Import safe storage utilities
import { safeGetItem, safeSetItem } from '../utils/storageUtils';

interface SuperAdminDashboardProps {
  admin: AdminData;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  admin,
  onNavigate,
  onLogout
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [questions, setQuestions] = useState<FCPSQuestion[]>([]);
  const [systemRequests, setSystemRequests] = useState<SystemRequest[]>([]);
  const [mockExamSets, setMockExamSets] = useState<MockExamSet[]>([]);
  const [mockExamQuestions, setMockExamQuestions] = useState<MockExamQuestion[]>([]);

  // ✅ FIXED: Safe null checking helper functions
  const safeGetAdminName = (admin: AdminData | null): string => {
    if (!admin || !admin.name) {
      return 'Admin User';
    }
    return admin.name;
  };

  const safeGetUserName = (user: UserData | null): string => {
    if (!user) {
      return 'Unknown User';
    }
    return user.name || user.fullName || 'Unknown User';
  };

  const safeGetString = (value: string | null | undefined, defaultValue: string = ''): string => {
    if (value === null || value === undefined || typeof value !== 'string') {
      return defaultValue;
    }
    return value;
  };

  // Load data from localStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
  
      
      // ✅ FIXED: Load users with proper array validation
      const storedUsers = safeGetItem('all_users', []);
      const validatedUsers = Array.isArray(storedUsers) ? storedUsers : [];
      setUsers(validatedUsers);
      

      // ✅ FIXED: Load admins with proper array validation
      const storedAdmins = safeGetItem('all_admins', []);
      const validatedAdmins = Array.isArray(storedAdmins) ? storedAdmins : [];
      setAdmins(validatedAdmins);
      

      // ✅ FIXED: Load FCPS questions with proper array validation
      const storedQuestions = safeGetItem('pulseprep_fcps_questions', []);
      const validatedQuestions = Array.isArray(storedQuestions) ? storedQuestions : [];
      setQuestions(validatedQuestions);
      

      // ✅ FIXED: Load system requests with proper array validation
      const storedSystemRequests = safeGetItem('pulseprep_system_requests', []);
      const validatedSystemRequests = Array.isArray(storedSystemRequests) ? storedSystemRequests : [];
      setSystemRequests(validatedSystemRequests);
      

      // ✅ FIXED: Load mock exam sets with proper array validation
      const storedMockExamSets = safeGetItem('pulseprep_mock_exam_sets', []);
      const validatedMockExamSets = Array.isArray(storedMockExamSets) ? storedMockExamSets : [];
      setMockExamSets(validatedMockExamSets);
      

      // ✅ NEW: Load mock exam questions from new storage format (per mock exam)
      loadMockExamQuestionsFromNewStorage();

      
          } catch (error) {
        console.error('❌ Error loading super admin dashboard data:', error);
        
        // Set empty arrays as fallback to prevent crashes
      setUsers([]);
      setAdmins([]);
      setQuestions([]);
      setSystemRequests([]);
      setMockExamSets([]);
      setMockExamQuestions([]);
    }
  };

  // ✅ NEW: Function to load mock exam questions from new storage format
  const loadMockExamQuestionsFromNewStorage = async () => {
    try {
  
      
      const specialties = ['medicine', 'surgery', 'gynae-obs'];
      const mockExams = ['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'];
      let allMockExamQuestions: any[] = [];
      
      for (const specialty of specialties) {
        for (const mockExam of mockExams) {
          const storageKey = `pulseprep_mock_questions_${specialty}_${mockExam.toLowerCase().replace(' ', '_')}`;
          const rawQuestions = safeGetItem(storageKey, []);
          const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
          
          // Format questions for admin interface
          const formattedQuestions = questions.map(q => ({
            ...q,
            specialty: specialty,
            mockExam: mockExam,
            id: q.id || `${specialty}-${mockExam}-${Date.now()}`,
            question: q.question || q.questionText || '',
            questionText: q.question || q.questionText || '', // Add questionText for compatibility
            options: q.options || [],
            correctAnswer: q.correctAnswer || 0,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'Medium',
            system: q.system || q.category || 'General',
            createdAt: q.createdAt || new Date().toISOString(),
            updatedAt: q.updatedAt || new Date().toISOString(),
            status: q.status || 'pending',
            createdBy: q.createdBy || 'content-manager'
          }));
          
          if (formattedQuestions.length > 0) {
    
            allMockExamQuestions.push(...formattedQuestions);
          }
        }
      }
      
      setMockExamQuestions(allMockExamQuestions);

      
    } catch (error) {
      console.error('❌ Error loading mock exam questions from new storage:', error);
      setMockExamQuestions([]);
    }
  };

  const handleRefresh = () => {
    loadData();
    
  };

  const handleNavigateToTab = (tab: string) => {
    setSelectedTab(tab);
    setMobileMenuOpen(false);
  };

  const handleShowQuickActions = () => {
    setShowQuickActions(!showQuickActions);
  };

  const handleEditUser = async (updatedUser: UserData) => {
    try {

      
      // Get all users with proper validation
      const rawAllUsers = safeGetItem('all_users', []);
      
      // ✅ FIXED: Ensure allUsers is actually an array
      let allUsers: any[] = [];
      if (Array.isArray(rawAllUsers)) {
        allUsers = rawAllUsers;
      } else {
        console.warn('⚠️ all_users is not an array, initializing as empty array:', typeof rawAllUsers, rawAllUsers);
        allUsers = [];
      }
      
      console.log('📊 Debug info:', {
        rawAllUsersType: typeof rawAllUsers,
        isArray: Array.isArray(rawAllUsers),
        allUsersLength: allUsers.length,
        updatedUserId: updatedUser.id
      });
      
      const userIndex = allUsers.findIndex((u: any) => u && u.id === updatedUser.id);
      
      if (userIndex !== -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser };
        const success = safeSetItem('all_users', allUsers);
        
        if (success) {
          console.log('✅ User updated successfully:', updatedUser.email);
          
          // Update the local users state to reflect changes immediately
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          
          // Log user update
          try {
            const { AuditService } = await import('../services/AuditService');
            const originalUser = allUsers.find((u: any) => u && u.id === updatedUser.id);
            AuditService.logUserAction(
              'User Updated',
              admin.name,
              admin.role,
              updatedUser.email,
              true,
              {
                userId: updatedUser.id,
                updatedFields: Object.keys(updatedUser).filter(key => 
                  originalUser && updatedUser[key as keyof UserData] !== originalUser[key as keyof UserData]
                ),
                previousData: originalUser
              }
            );
          } catch (error) {
            console.error('Failed to log user update:', error);
          }
          
          // Show success message
          alert('User updated successfully!');
        } else {
          console.error('❌ Failed to save user changes due to storage quota');
          alert('Failed to save changes due to storage limitations. Please try again.');
        }
      } else {
        console.error('❌ User not found in all_users array');
        console.log('📊 Available user IDs:', allUsers.map((u: any) => u?.id).filter(Boolean));
        alert('Error: User not found. Please refresh and try again.');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      console.error('📊 Error details:', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = () => {
    console.log('Export data clicked');
    // Implement data export
  };

  // Content management handlers
  const handleApproveQuestion = async (questionId: string) => {
    const questionToApprove = questions.find(q => q.id === questionId);
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, status: 'approved' } : q
    ));
    
    // Update localStorage
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, status: 'approved' } : q
    );
    safeSetItem('pulseprep_fcps_questions', updatedQuestions);
    
    // Log question approval
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logCMSAction(
        'Question Approved',
        admin.name,
        admin.role,
        questionId,
        true,
        {
          questionId,
          questionTitle: questionToApprove?.question || 'Unknown',
          approvedBy: admin.id
        }
      );
    } catch (error) {
      console.error('Failed to log question approval:', error);
    }
    
    console.log('✅ Question approved:', questionId);
  };

  const handleRejectQuestion = async (questionId: string, reason: string) => {
    const questionToReject = questions.find(q => q.id === questionId);
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, status: 'rejected', rejectionReason: reason } : q
    ));
    
    // Update localStorage
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, status: 'rejected', rejectionReason: reason } : q
    );
    safeSetItem('pulseprep_fcps_questions', updatedQuestions);
    
    // Log question rejection
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logCMSAction(
        'Question Rejected',
        admin.name,
        admin.role,
        questionId,
        true,
        {
          questionId,
          questionTitle: questionToReject?.question || 'Unknown',
          rejectionReason: reason,
          rejectedBy: admin.id
        }
      );
    } catch (error) {
      console.error('Failed to log question rejection:', error);
    }
    
    console.log('❌ Question rejected:', questionId, 'Reason:', reason);
  };

  // ✅ SURGICAL FIX: Real approval handlers that call actual functions
  const handleApproveSystemRequest = async (requestId: string) => {
    try {
      console.log('🔄 Approving system request:', requestId);
      
      // Import the approval function
      const { approveSystemRequest } = await import('../utils/cmsUtils');
      
      // Call the actual approval function that creates the system
      const success = await approveSystemRequest(requestId, admin.id, admin.role);
      
      if (success) {
        // Refresh all data to show the new system
        loadData();
        alert('System request approved and medical system created successfully!');
        console.log('✅ System request approved and system created successfully');
      } else {
        alert('Failed to approve system request.');
        console.error('❌ System request approval failed');
      }
    } catch (error) {
      console.error('❌ Error approving system request:', error);
      alert('Error approving system request. Please try again.');
    }
  };

  const handleRejectSystemRequest = async (requestId: string, reason: string) => {
    try {
      console.log('🔄 Rejecting system request:', requestId, 'Reason:', reason);
      
      // Import the rejection function
      const { rejectSystemRequest } = await import('../utils/cmsUtils');
      
      // Call the actual rejection function
      const success = await rejectSystemRequest(requestId, admin.id, admin.role, reason);
      
      if (success) {
        // Refresh data
        loadData();
        alert('System request rejected successfully.');
        console.log('✅ System request rejected successfully');
      } else {
        alert('Failed to reject system request.');
        console.error('❌ System request rejection failed');
      }
    } catch (error) {
      console.error('❌ Error rejecting system request:', error);
      alert('Error rejecting system request. Please try again.');
    }
  };

  // ✅ NEW: Updated handlers for mock exam questions
  const handleApproveMockExamQuestion = async (questionId: string) => {
    try {
      const question = mockExamQuestions.find(q => q.id === questionId);
      if (!question) {
        console.error('❌ Question not found:', questionId);
        return;
      }
      
      // Import the update function
      const { updateMockExamQuestionStatusBySet } = await import('../utils/mockExamUtils');
      
      // Update in storage
      const success = updateMockExamQuestionStatusBySet(
        question.specialty,
        question.mockExam || '',
        questionId,
        'approved'
      );
      
      if (success) {
        // Update local state
        setMockExamQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, status: 'approved' } : q
        ));
        console.log('✅ Mock exam question approved:', questionId);
      } else {
        console.error('❌ Failed to approve mock exam question:', questionId);
      }
    } catch (error) {
      console.error('❌ Error approving mock exam question:', error);
    }
  };

  const handleRejectMockExamQuestion = async (questionId: string, reason: string) => {
    try {
      const question = mockExamQuestions.find(q => q.id === questionId);
      if (!question) {
        console.error('❌ Question not found:', questionId);
        return;
      }
      
      // Import the update function
      const { updateMockExamQuestionStatusBySet } = await import('../utils/mockExamUtils');
      
      // Update in storage
      const success = updateMockExamQuestionStatusBySet(
        question.specialty,
        question.mockExam || '',
        questionId,
        'rejected',
        reason
      );
      
      if (success) {
        // Update local state
        setMockExamQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, status: 'rejected', rejectionReason: reason } : q
        ));
        console.log('❌ Mock exam question rejected:', questionId, 'Reason:', reason);
      } else {
        console.error('❌ Failed to reject mock exam question:', questionId);
      }
    } catch (error) {
      console.error('❌ Error rejecting mock exam question:', error);
    }
  };

  const [selectedQuestionForReview, setSelectedQuestionForReview] = useState<FCPSQuestion | null>(null);
  const [selectedAdminForView, setSelectedAdminForView] = useState<AdminData | null>(null);
  const [selectedUserForView, setSelectedUserForView] = useState<UserData | null>(null);

  const handleViewQuestion = (question: FCPSQuestion) => {
    console.log('View question:', question);
    setSelectedQuestionForReview(question);
  };

  const handleCloseQuestionReview = () => {
    setSelectedQuestionForReview(null);
  };

  const handleCloseAdminView = () => {
    setSelectedAdminForView(null);
  };

  const handleCloseUserView = () => {
    setSelectedUserForView(null);
  };

  // Admin management handlers
  const handleCreateAdmin = async (adminData: Partial<AdminData>) => {
    const newAdmin: AdminData = {
      id: `admin-${Date.now()}`,
      name: adminData.name || '',
      email: adminData.email || '',
      role: adminData.role || 'content-manager',
      password: adminData.password || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: admin?.id || 'system'
    };

    const updatedAdmins = [...admins, newAdmin];
    setAdmins(updatedAdmins);
    safeSetItem('all_admins', updatedAdmins);
    
    // Log admin creation
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logUserAction(
        'Admin Created',
        admin.name,
        admin.role,
        newAdmin.email,
        true,
        {
          newAdminId: newAdmin.id,
          newAdminRole: newAdmin.role,
          createdBy: admin.id
        }
      );
    } catch (error) {
      console.error('Failed to log admin creation:', error);
    }
    
    console.log('✅ Admin created:', newAdmin);
  };

  const handleUpdateAdmin = async (adminId: string, updates: Partial<AdminData>) => {
    const adminToUpdate = admins.find(a => a.id === adminId);
    const updatedAdmins = admins.map(a => 
      a.id === adminId ? { ...a, ...updates } : a
    );
    setAdmins(updatedAdmins);
    safeSetItem('all_admins', updatedAdmins);
    
    // Log admin update
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logUserAction(
        'Admin Updated',
        admin.name,
        admin.role,
        adminToUpdate?.email || 'unknown',
        true,
        {
          adminId,
          updatedFields: Object.keys(updates),
          previousData: adminToUpdate
        }
      );
    } catch (error) {
      console.error('Failed to log admin update:', error);
    }
    
    console.log('✅ Admin updated:', adminId, updates);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    const adminToDelete = admins.find(a => a.id === adminId);
    const updatedAdmins = admins.filter(a => a.id !== adminId);
    setAdmins(updatedAdmins);
    safeSetItem('all_admins', updatedAdmins);
    
    // Log admin deletion
    try {
      const { AuditService } = await import('../services/AuditService');
      AuditService.logUserAction(
        'Admin Deleted',
        admin.name,
        admin.role,
        adminToDelete?.email || 'unknown',
        true,
        {
          adminId,
          deletedAdminData: adminToDelete
        }
      );
    } catch (error) {
      console.error('Failed to log admin deletion:', error);
    }
    
    console.log('🗑️ Admin deleted:', adminId);
  };

  const handleViewAdmin = (adminToView: AdminData) => {
    console.log('View admin:', adminToView);
    setSelectedAdminForView(adminToView);
  };

  // Settings handlers
  const handleSaveSettings = (section: string, settings: any) => {
    console.log('Save settings:', section, settings);
    // Implement settings save functionality
    safeSetItem(`pulseprep_${section}_settings`, settings);
  };

  const handleExportSettings = () => {
    console.log('Export settings clicked');
    // Implement settings export
  };

  const handleImportSettings = (settings: any) => {
    console.log('Import settings:', settings);
    // Implement settings import
  };

  // Security handlers
  const handleExportLogs = () => {
    console.log('Export logs clicked');
    // Implement logs export
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log('Terminate session:', sessionId);
    // Implement session termination
  };

  const handleBlockIP = (ipAddress: string) => {
    console.log('Block IP:', ipAddress);
    // Implement IP blocking
  };

  const handleExportReport = () => {
    console.log('Export analytics report clicked');
    // Implement report export
  };

  // ✅ FIXED: Calculate total pending approvals with proper array safety
  const totalPendingApprovals = 
    (Array.isArray(questions) ? questions.filter(q => q.status === 'pending').length : 0) +
    (Array.isArray(systemRequests) ? systemRequests.filter(r => r.status === 'pending').length : 0) +
    (Array.isArray(mockExamSets) ? mockExamSets.filter(s => s.status === 'pending').length : 0) +
    (Array.isArray(mockExamQuestions) ? mockExamQuestions.filter(q => q.status === 'pending').length : 0);

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <SuperAdminOverview
            admin={admin}
            users={users}
            questions={questions}
            systemRequests={systemRequests}
            mockExamSets={mockExamSets}
            mockExamQuestions={mockExamQuestions}
            onRefresh={handleRefresh}
            onNavigateToTab={handleNavigateToTab}
            onShowQuickActions={handleShowQuickActions}
            showQuickActions={showQuickActions}
          />
        );
      case 'users':
        return (
          <SuperAdminUsersTable
            admin={admin}
            onNavigate={onNavigate}
            onRefresh={handleRefresh}
          />
        );
      case 'content':
        return (
          <SuperAdminContentManager
            questions={questions}
            systemRequests={systemRequests}
            mockExamSets={mockExamSets}
            mockExamQuestions={mockExamQuestions}
            onRefresh={handleRefresh}
            onApproveQuestion={handleApproveQuestion}
            onRejectQuestion={handleRejectQuestion}
            onApproveSystemRequest={handleApproveSystemRequest}
            onRejectSystemRequest={handleRejectSystemRequest}
            onApproveMockExamQuestion={handleApproveMockExamQuestion}
            onRejectMockExamQuestion={handleRejectMockExamQuestion}
            onViewQuestion={handleViewQuestion}
            onExportData={handleExportData}
          />
        );
      case 'analytics':
        return (
          <SuperAdminAnalytics
            users={users}
            questions={questions}
            onRefresh={handleRefresh}
            onExportReport={handleExportReport}
          />
        );
      case 'admins':
        return (
          <SuperAdminAdminsTable
            admin={admin}
            admins={admins}
            onRefresh={handleRefresh}
            onCreateAdmin={handleCreateAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            onViewAdmin={handleViewAdmin}
            onExportData={handleExportData}
          />
        );
      case 'settings':
        return (
          <SuperAdminSettings
            admin={admin}
            onRefresh={handleRefresh}
            onSaveSettings={handleSaveSettings}
            onExportSettings={handleExportSettings}
            onImportSettings={handleImportSettings}
          />
        );
      case 'security':
        return (
          <SuperAdminSecurity
            admin={admin}
            onRefresh={handleRefresh}
            onExportLogs={handleExportLogs}
            onTerminateSession={handleTerminateSession}
            onBlockIP={handleBlockIP}
          />
        );
      default:
        return (
          <SuperAdminOverview
            admin={admin}
            users={users}
            questions={questions}
            systemRequests={systemRequests}
            mockExamSets={mockExamSets}
            mockExamQuestions={mockExamQuestions}
            onRefresh={handleRefresh}
            onNavigateToTab={handleNavigateToTab}
            onShowQuickActions={handleShowQuickActions}
            showQuickActions={showQuickActions}
          />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Easy</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'hard':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Hard</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const getRoleName = (role: string) => {
    const safeRole = safeGetString(role, 'unknown');
    return safeRole.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'finance-manager':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'audit-manager':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'content-manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin':
        return <Crown className="h-4 w-4" />;
      case 'finance-manager':
        return <DollarSign className="h-4 w-4" />;
      case 'audit-manager':
        return <Shield className="h-4 w-4" />;
      case 'content-manager':
        return <BookText className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'super-admin':
        return [
          'Full system access',
          'Manage all administrators',
          'System configuration',
          'Security management',
          'Data export/import',
          'User management',
          'Content approval',
          'Analytics access'
        ];
      case 'content-manager':
        return [
          'Create and edit questions',
          'Review content submissions',
          'Manage mock exams',
          'View content analytics',
          'Export content data'
        ];
      case 'finance-manager':
        return [
          'View financial reports',
          'Manage subscriptions',
          'Payment processing',
          'Revenue analytics',
          'Billing management'
        ];
      case 'audit-manager':
        return [
          'View audit logs',
          'Security monitoring',
          'User activity tracking',
          'Compliance reporting',
          'System health checks'
        ];
      default:
        return ['Limited access'];
    }
  };

  // ✅ FIXED: Safe specialty name function with null checking
  const getSpecialtyName = (specialty: string | null | undefined) => {
    const safeSpecialty = safeGetString(specialty, 'unknown');
    
    switch (safeSpecialty) {
      case 'medicine':
        return 'Medicine';
      case 'surgery':
        return 'Surgery';
      case 'gynae-obs':
        return 'Gynecology & Obstetrics';
      default:
        if (safeSpecialty && safeSpecialty.length > 0) {
          return safeSpecialty.charAt(0).toUpperCase() + safeSpecialty.slice(1);
        }
        return 'Unknown Specialty';
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'medicine':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'surgery':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'gynae-obs':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  // ✅ FIXED: Ensure admin is never null before rendering
  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">Loading...</div>
          <div className="text-gray-600">Please wait while we load your dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SuperAdminSidebar
        admin={admin}
        selectedTab={selectedTab}
        onTabSelect={handleNavigateToTab}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        totalPendingApprovals={totalPendingApprovals}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SuperAdminHeader
          admin={admin}
          activeTab={selectedTab}
          onRefresh={handleRefresh}
          onLogout={onLogout}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setMobileMenuOpen={setMobileMenuOpen}
          totalPendingApprovals={totalPendingApprovals}
          onNavigateToSettings={() => handleNavigateToTab('settings')}
          onNavigateToProfile={() => console.log('Navigate to profile')}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Question Review Modal */}
      <Dialog open={!!selectedQuestionForReview} onOpenChange={handleCloseQuestionReview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Question Review
            </DialogTitle>
            <DialogDescription>
              Review the question details and take action if needed
            </DialogDescription>
          </DialogHeader>

          {selectedQuestionForReview && (
            <div className="space-y-6">
              {/* Question Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="capitalize">
                          {getSpecialtyName(selectedQuestionForReview.specialty)}
                        </Badge>
                        <Badge variant="secondary">{safeGetString(selectedQuestionForReview.system, 'Unknown System')}</Badge>
                        {getDifficultyBadge(selectedQuestionForReview.difficulty)}
                        {getStatusBadge(selectedQuestionForReview.status || 'pending')}
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        <div>Question ID: {selectedQuestionForReview.id}</div>
                        <div>Created: {new Date(selectedQuestionForReview.createdAt || new Date()).toLocaleString()}</div>
                        <div>Created by: {safeGetString(selectedQuestionForReview.createdBy, 'Unknown')}</div>
                        {selectedQuestionForReview.rejectionReason && (
                          <div className="text-red-600 mt-2">
                            <strong>Rejection Reason:</strong> {selectedQuestionForReview.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Question:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed">{safeGetString(selectedQuestionForReview.question, 'No question text available')}</p>
                    </div>
                  </div>

                  {/* Options */}
                  {selectedQuestionForReview.options && selectedQuestionForReview.options.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Options:</h3>
                      <div className="space-y-2">
                        {selectedQuestionForReview.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg border-2 ${
                              index === selectedQuestionForReview.correctAnswer 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <span className="text-gray-800">{safeGetString(option, `Option ${index + 1}`)}</span>
                              {index === selectedQuestionForReview.correctAnswer && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Correct
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {selectedQuestionForReview.explanation && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Explanation:</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed">{selectedQuestionForReview.explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedQuestionForReview.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => {
                          handleApproveQuestion(selectedQuestionForReview.id);
                          handleCloseQuestionReview();
                        }}
                        className="hover:bg-green-700 text-white bg-[rgba(192,46,46,1)]"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Question
                      </Button>
                      <Button 
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            handleRejectQuestion(selectedQuestionForReview.id, reason);
                            handleCloseQuestionReview();
                          }
                        }}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin View Modal */}
      <Dialog open={!!selectedAdminForView} onOpenChange={handleCloseAdminView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Admin Details
            </DialogTitle>
            <DialogDescription>
              View administrator information and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedAdminForView && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-medium">
                      {safeGetAdminName(selectedAdminForView).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{safeGetAdminName(selectedAdminForView)}</h3>
                        <Badge className={getRoleColor(selectedAdminForView.role)}>
                          {getRoleIcon(selectedAdminForView.role)}
                          <span className="ml-1">{getRoleName(selectedAdminForView.role)}</span>
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{safeGetString(selectedAdminForView.email)}</p>
                      <div className="text-sm text-gray-500">
                        <div>Admin ID: {selectedAdminForView.id}</div>
                        <div>Created: {new Date(selectedAdminForView.createdAt).toLocaleString()}</div>
                        <div>Created by: {safeGetString(selectedAdminForView.createdBy, 'System')}</div>
                        <div>Status: {selectedAdminForView.status}</div>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Permissions & Access:</h4>
                    <div className="space-y-2">
                      {getRolePermissions(selectedAdminForView.role).map((permission, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User View Modal */}
      <Dialog open={!!selectedUserForView} onOpenChange={handleCloseUserView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              View user information and account status
            </DialogDescription>
          </DialogHeader>

          {selectedUserForView && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-medium">
                      {safeGetUserName(selectedUserForView).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{safeGetUserName(selectedUserForView)}</h3>
                        {getPaymentStatusBadge(selectedUserForView.paymentStatus)}
                      </div>
                      <p className="text-gray-600 mb-2">{safeGetString(selectedUserForView.email)}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSpecialtyColor(selectedUserForView.specialty)}>
                          {getSpecialtyName(selectedUserForView.specialty)}
                        </Badge>
                        {selectedUserForView.status && getUserStatusBadge(selectedUserForView.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>User ID: {selectedUserForView.id}</div>
                        <div>Registered: {new Date(selectedUserForView.registrationDate).toLocaleString()}</div>
                        <div>Phone: {safeGetString(selectedUserForView.phone, 'Not provided')}</div>
                        <div>CNIC: {safeGetString(selectedUserForView.cnic, 'Not provided')}</div>
                        <div>Study Mode: {safeGetString(selectedUserForView.studyMode, 'Not specified')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        const updatedUser = { ...selectedUserForView, status: 'active' };
                        handleEditUser({
                          ...updatedUser,
                          status: updatedUser.status as UserStatus
                        });
                        handleCloseUserView();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={selectedUserForView.status === 'active'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate User
                    </Button>
                    <Button 
                      onClick={() => {
                        const updatedUser = { ...selectedUserForView, status: 'suspended' };
                        handleEditUser({
                          ...updatedUser,
                          status: updatedUser.status as UserStatus
                        });
                        handleCloseUserView();
                      }}
                      variant="destructive"
                      disabled={selectedUserForView.status === 'suspended'}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Suspend User
                    </Button>
                    <Button 
                      onClick={() => {
                        handleCloseUserView();
                      }}
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;