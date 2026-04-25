import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
 
  Send, 
  X, 
  Settings, 
  CheckCircle, 
  Clock, 
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SpecialtyType, MedicalSystem, SystemRequest, FCPSQuestion, QuestionData, AdminData } from '../types';
import { 
  getMedicalSystemsWithQuestionCounts, 
  getSystemRequests, 
  createSystemRequest, 
  approveSystemRequest, 
  rejectSystemRequest,
  getSystemQuestionCountsByStatus, 
  getSystemQuestions,
  updateFCPSQuestion,
  deleteFCPSQuestion,
  getMedicalSystems,
  forceRefreshMedicalSystems
} from '../utils/cmsUtils';
import QuestionEditor from './QuestionEditor';

interface SystemManagerProps {
  onClose: () => void;
  adminId: string;
  adminRole: string;
  selectedSpecialty?: SpecialtyType;
}

const SystemManager: React.FC<SystemManagerProps> = ({
  onClose,
  adminId,
  adminRole,
  selectedSpecialty = 'medicine'
}) => {
  // ✅ SURGICAL FIX 1: Move all hooks to the top (React Rules of Hooks)
  const [currentView, setCurrentView] = useState<'systems' | 'requests' | 'create-request'>('systems');
  const [systems, setSystems] = useState<MedicalSystem[]>([]);
  const [systemRequests, setSystemRequests] = useState<SystemRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<SpecialtyType>(selectedSpecialty);
  
  // Form states
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemDescription, setNewSystemDescription] = useState('');
  const [newSystemSpecialty, setNewSystemSpecialty] = useState<SpecialtyType>('medicine');
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ SURGICAL FIX 2: Move these hooks to proper position
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<FCPSQuestion | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  // Load data
  useEffect(() => {
    loadSystemsData();
  }, [selectedSpecialtyFilter]);

  const loadSystemsData = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
  
      
      // First, ensure medical systems are available
      let systemsData: MedicalSystem[] = [];
      
      try {
        systemsData = getMedicalSystemsWithQuestionCounts(selectedSpecialtyFilter);
        console.log('📊 Initial systems data:', {
          count: systemsData.length,
          specialty: selectedSpecialtyFilter
        });
      } catch (systemsError) {
        console.error('❌ Error getting systems with question counts:', systemsError);
        
        // Try fallback: get basic medical systems
        try {
          const basicSystems = getMedicalSystems(selectedSpecialtyFilter);
          console.log('🔄 Falling back to basic systems:', basicSystems.length);
          
          if (Array.isArray(basicSystems) && basicSystems.length > 0) {
            // Add questionCount = 0 to basic systems
            systemsData = basicSystems.map(system => ({
              ...system,
              questionCount: 0
            }));
          } else {
            throw new Error('No medical systems available');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback systems also failed:', fallbackError);
          throw new Error('Failed to load medical systems');
        }
      }
      
      // If we still don't have systems, try force refresh
      if (!Array.isArray(systemsData) || systemsData.length === 0) {
        console.log('🔄 No systems found, attempting force refresh...');
        
        try {
          const refreshedSystems = forceRefreshMedicalSystems();
          if (Array.isArray(refreshedSystems) && refreshedSystems.length > 0) {
            systemsData = refreshedSystems.map(system => ({
              ...system,
              questionCount: 0
            }));
            console.log('✅ Force refresh successful:', systemsData.length);
          } else {
            throw new Error('Force refresh failed');
          }
        } catch (refreshError) {
          console.error('❌ Force refresh failed:', refreshError);
          
          // Create minimal fallback systems as last resort
          systemsData = createFallbackSystems(selectedSpecialtyFilter);
          console.log('🚨 Using minimal fallback systems:', systemsData.length);
        }
      }
      
      // Load system requests
      let requestsData: SystemRequest[] = [];
      try {
        requestsData = getSystemRequests();
      } catch (requestsError) {
        console.error('❌ Error loading system requests:', requestsError);
        requestsData = []; // Use empty array as fallback
      }
      
      // Update state
      setSystems(systemsData);
      setSystemRequests(requestsData);
      
      console.log('✅ Systems data loaded successfully:', {
        systems: systemsData.length,
        requests: requestsData.length,
        totalQuestions: systemsData.reduce((sum, sys) => sum + (sys.questionCount || 0), 0)
      });
      
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('❌ Critical error loading systems data:', error);
      setLoadError(error instanceof Error ? error.message : 'Unknown error loading systems');
      
      // Set fallback empty data
      setSystems([]);
      setSystemRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SURGICAL FIX 3: Fixed event listener dependencies  
  useEffect(() => {
    const handleSystemUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Medical systems updated, refreshing SystemManager...', customEvent.detail);
      
      // Only refresh if it affects current specialty
      const { specialty } = customEvent.detail;
      if (!specialty || specialty === selectedSpecialtyFilter) {
        // Force refresh medical systems cache first
        try {
          const { forceRefreshMedicalSystems } = await import('../utils/cmsUtils');
          forceRefreshMedicalSystems();
        } catch (error) {
          console.error('❌ Error force refreshing medical systems:', error);
        }
        
        // Then reload systems data
        loadSystemsData();
      }
    };

    window.addEventListener('medicalSystemsUpdated', handleSystemUpdate);
    
    return () => {
      window.removeEventListener('medicalSystemsUpdated', handleSystemUpdate);
    };
  }, [selectedSpecialtyFilter, loadSystemsData]); // ✅ FIXED: Added loadSystemsData dependency

  // Create minimal fallback systems when everything else fails
  const createFallbackSystems = (specialty: SpecialtyType): MedicalSystem[] => {
    const fallbackSystems = [
      {
        id: `fallback-${specialty}-1`,
        name: specialty === 'medicine' ? 'Cardiovascular' : 
              specialty === 'surgery' ? 'General Surgery' : 'Obstetrics',
        description: `Basic ${specialty} system (fallback)`,
        specialty,
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        questionCount: 0,
        isUniversal: false,
        isCustom: false
      },
      {
        id: `fallback-${specialty}-2`,
        name: specialty === 'medicine' ? 'Gastroenterology' : 
              specialty === 'surgery' ? 'Orthopedic Surgery' : 'Gynecology',
        description: `Basic ${specialty} system (fallback)`,
        specialty,
        isActive: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        questionCount: 0,
        isUniversal: false,
        isCustom: false
      }
    ];
    
    console.log(`🚨 Created ${fallbackSystems.length} fallback systems for ${specialty}`);
    return fallbackSystems;
  };

  // Retry loading with exponential backoff
  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 5000); // Max 5 seconds
    console.log(`🔄 Retrying systems load (attempt ${newRetryCount}) after ${delay}ms...`);
    
    setTimeout(() => {
      loadSystemsData();
    }, delay);
  };

  // Handle system request creation
  const handleCreateSystemRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSystemName.trim() || !newSystemDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createSystemRequest({
        systemName: newSystemName.trim(),
        description: newSystemDescription.trim(),
        specialty: newSystemSpecialty,
        requestedBy: adminId,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      
      // Reset form
      setNewSystemName('');
      setNewSystemDescription('');
      setNewSystemSpecialty('medicine');
      
      // Reload data and switch to requests view
      await loadSystemsData();
      setCurrentView('requests');
      
      alert('System request submitted successfully!');
    } catch (error) {
      console.error('❌ Error creating system request:', error);
      alert('Failed to create system request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle system request approval
  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this system request?')) return;
    
    try {
      const success = await approveSystemRequest(requestId, adminId, adminRole);
      if (success) {
        await loadSystemsData();
        alert('System request approved and system created successfully!');
      } else {
        alert('Failed to approve system request.');
      }
    } catch (error) {
      console.error('❌ Error approving system request:', error);
      alert('Failed to approve system request. Please try again.');
    }
  };

  // Handle system request rejection
  const handleRejectRequest = async (requestId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection (optional):');
    if (rejectionReason === null) return; // User cancelled
    
    try {
      const success = await rejectSystemRequest(requestId, adminId, adminRole, rejectionReason);
      if (success) {
        await loadSystemsData();
        alert('System request rejected successfully.');
      } else {
        alert('Failed to reject system request.');
      }
    } catch (error) {
      console.error('❌ Error rejecting system request:', error);
      alert('Failed to reject system request. Please try again.');
    }
  };

  // Handle view questions
  const handleViewQuestions = (systemName: string) => {
    setSelectedSystem(systemName);
  };

  // Handle edit question
  const handleEditQuestion = (question: FCPSQuestion) => {
    setEditingQuestion(question);
    setShowQuestionEditor(true);
    setSelectedSystem(null); // Close the view questions popup
  };

  // Handle delete question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteFCPSQuestion(questionId);
      // Refresh data
      await loadSystemsData();
      console.log('✅ Question deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  // Handle update question
  const handleUpdateQuestion = async (questionData: QuestionData) => {
    try {
      if (!editingQuestion) return;

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

      await updateFCPSQuestion(editingQuestion.id, fcpsQuestion);
      
      // Close editor and refresh data
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      await loadSystemsData();
      
      console.log('✅ Question updated successfully');
    } catch (error) {
      console.error('❌ Error updating question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  // Filter requests
  const filteredRequests = systemRequests.filter(request =>
    (request.systemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ViewQuestionsPopup Component
  interface ViewQuestionsPopupProps {
    systemName: string;
    specialty: 'medicine' | 'surgery' | 'gynae-obs';
    onClose: () => void;
    onEditQuestion: (question: FCPSQuestion) => void;
    onDeleteQuestion: (questionId: string) => void;
  }

  const ViewQuestionsPopup: React.FC<ViewQuestionsPopupProps> = ({
    systemName,
    specialty,
    onClose,
    onEditQuestion,
    onDeleteQuestion
  }) => {
    const [questions, setQuestions] = useState<FCPSQuestion[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      loadQuestions();
    }, [systemName, specialty, statusFilter]);

    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const systemQuestions = getSystemQuestions(systemName, specialty, statusFilter);
        setQuestions(systemQuestions);
      } catch (error) {
        console.error('Error loading system questions:', error);
        setQuestions([]); // Fallback to empty array
      } finally {
        setIsLoading(false);
      }
    };

    const filteredQuestions = questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteQuestion = async (questionId: string) => {
      if (!confirm('Are you sure you want to delete this question?')) return;
      
      try {
        await onDeleteQuestion(questionId);
        await loadQuestions(); // Reload questions
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    };

    const getStatusCounts = () => {
      try {
        const all = getSystemQuestions(systemName, specialty, 'all');
        return {
          all: all.length,
          approved: all.filter(q => q.status === 'approved').length,
          pending: all.filter(q => q.status === 'pending').length,
          rejected: all.filter(q => q.status === 'rejected').length
        };
      } catch (error) {
        console.error('Error getting status counts:', error);
        return { all: 0, approved: 0, pending: 0, rejected: 0 };
      }
    };

    const statusCounts = getStatusCounts();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Questions for {systemName}</h2>
              <p className="text-gray-600">{specialty.toUpperCase()} specialty • {filteredQuestions.length} questions found</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                >
                  Approved ({statusCounts.approved})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({statusCounts.pending})
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('rejected')}
                >
                  Rejected ({statusCounts.rejected})
                </Button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : `No questions available for this system.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                          <Badge className={
                            question.status === 'approved' ? 'bg-green-100 text-green-800' :
                            question.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {question.status}
                          </Badge>
                          {question.source === 'excel-import' && (
                            <Badge variant="outline" className="text-xs">
                              Excel Import
                            </Badge>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 mb-2">
                          {question.question.length > 150 
                            ? `${question.question.substring(0, 150)}...` 
                            : question.question
                          }
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{question.difficulty}</span>
                          <span>•</span>
                          <span>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : 'N/A'}</span>
                          <span>•</span>
                          <span>Created by: {question.createdBy || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditQuestion(question)}
                          title="Edit question"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Systems management with comprehensive error handling
  const renderSystemsManagement = () => {
    // Handle loading state
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Medical Systems</h3>
            <p className="text-gray-600">Fetching systems data for {selectedSpecialtyFilter}...</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>
            )}
          </div>
        </div>
      );
    }

    // Handle error state
    if (loadError) {
      return (
        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Medical Systems</h3>
                <p className="text-red-700 mb-4">{loadError}</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Loading
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => loadSystemsData()}
                    disabled={isLoading}
                  >
                    Force Refresh
                  </Button>
                </div>
                {retryCount > 0 && (
                  <p className="text-sm text-red-600 mt-2">Failed attempts: {retryCount}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Get systems with safe fallback
    let systemsWithCounts: MedicalSystem[] = [];
    try {
      systemsWithCounts = systems.length > 0 ? systems : createFallbackSystems(selectedSpecialtyFilter);
    } catch (error) {
      console.error('❌ Error preparing systems data:', error);
      systemsWithCounts = createFallbackSystems(selectedSpecialtyFilter);
    }

    return (
      <div className="space-y-6">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedSpecialtyFilter} onValueChange={(value: SpecialtyType) => setSelectedSpecialtyFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medicine">Medicine</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="gynae-obs">Gynae & Obs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warning for fallback systems */}
        {systems.length === 0 && systemsWithCounts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Using fallback systems. Some features may be limited.</span>
                <Button size="sm" variant="outline" onClick={() => loadSystemsData()}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Systems Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Medical Systems ({systemsWithCounts.length})
            </CardTitle>
            <CardDescription>
              Question statistics for {selectedSpecialtyFilter} specialty systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">System Name</TableHead>
                    <TableHead className="text-center">Total Questions</TableHead>
                    <TableHead className="text-center">Approved</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Rejected</TableHead>
                    <TableHead className="text-center w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemsWithCounts
                    .filter(system =>
                      system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      system.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((system) => {
                      let counts = { total: 0, approved: 0, pending: 0, rejected: 0 };
                      
                      try {
                        counts = getSystemQuestionCountsByStatus(system.name, selectedSpecialtyFilter);
                      } catch (error) {
                        console.error(`❌ Error getting counts for ${system.name}:`, error);
                      }
                      
                      return (
                        <TableRow key={system.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{system.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-[300px]">
                                {system.description}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={system.isUniversal ? 'default' : 'secondary'} className="text-xs">
                                  {system.isUniversal ? 'Universal' : system.specialty}
                                </Badge>
                                {system.isCustom && (
                                  <Badge variant="outline" className="text-xs">Custom</Badge>
                                )}
                                {system.id?.startsWith('fallback-') && (
                                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                                    Fallback
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-blue-600">{counts.total}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-green-600">{counts.approved}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-yellow-600">{counts.pending}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-red-600">{counts.rejected}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewQuestions(system.name)}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {systemsWithCounts.filter(system =>
              system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              system.description.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No systems found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No systems available for the selected specialty.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Questions Popup */}
        {selectedSystem && (
          <ViewQuestionsPopup
            systemName={selectedSystem}
            specialty={selectedSpecialtyFilter}
            onClose={() => setSelectedSystem(null)}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {/* Question Editor Popup */}
        {showQuestionEditor && editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <QuestionEditor
                admin={{ id: adminId, role: adminRole } as AdminData}
                onNavigate={() => {}}
                initialQuestion={{
                  id: editingQuestion.id,
                  text: editingQuestion.question,
                  options: editingQuestion.options,
                  correctAnswer: editingQuestion.correctAnswer,
                  explanation: editingQuestion.explanation,
                  specialty: editingQuestion.specialty,
                  system: editingQuestion.system,
                  difficulty: editingQuestion.difficulty,
                  status: editingQuestion.status as 'pending' | 'approved' | 'rejected',
                  submittedBy: editingQuestion.createdBy,
                  optionExplanations: editingQuestion.optionExplanations || [],
                  tags: editingQuestion.tags || [],
                  isActive: true,
                  createdAt: editingQuestion.createdAt,
                  updatedAt: editingQuestion.updatedAt || editingQuestion.createdAt
                }}
                mode="edit"
                onSave={handleUpdateQuestion}
                onCancel={() => {
                  setShowQuestionEditor(false);
                  setEditingQuestion(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render system requests
  const renderSystemRequests = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-1">{request.systemName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{request.specialty}</Badge>
                    <Badge 
                      className={
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{request.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Requested by: {request.requestedBy}</span>
                <span>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>

              {request.status === 'pending' && adminRole === 'super-admin' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="text-sm text-green-600">
                  ✅ Approved by {request.approvedBy} on {new Date(request.approvedAt!).toLocaleDateString()}
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="text-sm text-red-600">
                  ❌ Rejected by {request.rejectedBy} on {new Date(request.rejectedAt!).toLocaleDateString()}
                  {request.rejectionReason && (
                    <div className="mt-1 text-gray-600">
                      Reason: {request.rejectionReason}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No system requests available.'}
          </p>
        </div>
      )}
    </div>
  );

  // Render create request form
  const renderCreateRequest = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Request New Medical System</CardTitle>
          <CardDescription>
            Submit a request for a new medical system to be added to the platform.
            All requests require super admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSystemRequest} className="space-y-6">
            <div>
              <Label htmlFor="systemName">System Name *</Label>
              <Input
                id="systemName"
                value={newSystemName}
                onChange={(e) => setNewSystemName(e.target.value)}
                placeholder="e.g., Cardiothoracic Surgery"
                required
              />
            </div>

            <div>
              <Label htmlFor="systemDescription">Description *</Label>
              <Textarea
                id="systemDescription"
                value={newSystemDescription}
                onChange={(e) => setNewSystemDescription(e.target.value)}
                placeholder="Provide a detailed description of the medical system..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="systemSpecialty">Specialty *</Label>
              <Select value={newSystemSpecialty} onValueChange={(value: SpecialtyType) => setNewSystemSpecialty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="gynae-obs">Gynae & Obs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentView('requests')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // Main loading state
  if (isLoading && systems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading Medical Systems</h3>
            <p className="text-gray-600">Initializing systems data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            {currentView !== 'systems' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentView === 'create-request') {
                    setCurrentView('requests');
                  } else {
                    setCurrentView('systems');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentView === 'systems' && 'Medical Systems Manager'}
                {currentView === 'requests' && 'System Requests'}
                {currentView === 'create-request' && 'Create System Request'}
              </h2>
              <p className="text-gray-600">
                {currentView === 'systems' && `Manage medical systems for ${selectedSpecialtyFilter}`}
                {currentView === 'requests' && 'Review and manage system requests'}
                {currentView === 'create-request' && 'Request a new medical system'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation tabs */}
        {currentView !== 'create-request' && (
          <div className="border-b px-6">
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('systems')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'systems'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Systems ({systems.length})
              </button>
              <button
                onClick={() => setCurrentView('requests')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Requests ({systemRequests.filter(r => r.status === 'pending').length} pending)
              </button>
            </div>
          </div>
        )}

        {/* Actions bar */}
        {currentView === 'requests' && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <Button
              onClick={() => setCurrentView('create-request')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request New System
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {currentView === 'systems' && renderSystemsManagement()}
          {currentView === 'requests' && renderSystemRequests()}
          {currentView === 'create-request' && renderCreateRequest()}
        </div>
      </div>
    </div>
  );
};

export default SystemManager;