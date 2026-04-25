import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  FileText,
  Upload,
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  
  Search
} from 'lucide-react';
import { FCPSQuestion, SystemRequest, MockExamSet, MockExamQuestion } from '../../types';

interface SuperAdminContentManagerProps {
  questions: FCPSQuestion[];
  systemRequests: SystemRequest[];
  mockExamSets: MockExamSet[];
  mockExamQuestions: MockExamQuestion[];
  onRefresh: () => void;
  onApproveQuestion: (questionId: string) => void;
  onRejectQuestion: (questionId: string, reason: string) => void;
  onApproveSystemRequest: (requestId: string) => void;
  onRejectSystemRequest: (requestId: string, reason: string) => void;
  onApproveMockExamQuestion?: (questionId: string) => void; // NEW
  onRejectMockExamQuestion?: (questionId: string, reason: string) => void; // NEW
  onViewQuestion: (question: FCPSQuestion) => void;
  onExportData: () => void;
}

export const SuperAdminContentManager: React.FC<SuperAdminContentManagerProps> = ({
  questions,
  systemRequests,
  mockExamSets,
  mockExamQuestions,
  onRefresh,
  onApproveQuestion,
  onRejectQuestion,
  onApproveSystemRequest,
  onRejectSystemRequest,
  onApproveMockExamQuestion, // NEW
  onRejectMockExamQuestion,  // NEW
  onViewQuestion,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Calculate metrics
  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const approvedQuestions = questions.filter(q => q.status === 'approved');
  const rejectedQuestions = questions.filter(q => q.status === 'rejected');
  const pendingSystemRequests = systemRequests.filter(r => r.status === 'pending');
  const pendingMockExamSets = mockExamSets.filter(s => s.status === 'pending');
  const pendingMockExamQuestions = mockExamQuestions.filter(q => q.status === 'pending');

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

  const handleQuickApprove = (questionId: string) => {
    onApproveQuestion(questionId);
  };

  const handleQuickReject = (questionId: string) => {
    if (rejectionReason.trim()) {
      onRejectQuestion(questionId, rejectionReason);
      setRejectionReason('');
      setSelectedItemId(null);
    }
  };

  // Add handlers for mock exam questions
  const handleQuickApproveMockQuestion = (questionId: string) => {
    if (onApproveMockExamQuestion) {
      onApproveMockExamQuestion(questionId);
    }
  };

  const handleQuickRejectMockQuestion = (questionId: string) => {
    if (rejectionReason.trim() && onRejectMockExamQuestion) {
      onRejectMockExamQuestion(questionId, rejectionReason);
      setRejectionReason('');
      setSelectedItemId(null);
    }
  };

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = searchTerm === '' || 
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.system.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || question.status === statusFilter;
    const matchesSpecialty = specialtyFilter === 'all' || question.specialty === specialtyFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  // ✅ SURGICAL FIX: Add null safety for systemName
  const filteredSystemRequests = systemRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      (request.systemName && request.systemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSpecialty = specialtyFilter === 'all' || request.specialty === specialtyFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">Review and approve educational content submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button onClick={onExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Content Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Questions</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">{questions.length}</div>
            <div className="text-blue-700 text-sm">Total Questions</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-1">{pendingQuestions.length}</div>
            <div className="text-orange-700 text-sm">Pending Review</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-900 mb-1">{approvedQuestions.length}</div>
            <div className="text-emerald-700 text-sm">Approved Questions</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-700">Rejected</Badge>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">{rejectedQuestions.length}</div>
            <div className="text-red-700 text-sm">Rejected Questions</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Interface */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Review Console</CardTitle>
              <CardDescription>Review and approve educational content submissions</CardDescription>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="gynae-obs">Gynae & Obs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FCPS Questions ({pendingQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="systems" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                System Requests ({pendingSystemRequests.length})
              </TabsTrigger>
              <TabsTrigger value="mock-sets" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Mock Sets ({pendingMockExamSets.length})
              </TabsTrigger>
              <TabsTrigger value="mock-questions" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Mock Questions ({pendingMockExamQuestions.length})
              </TabsTrigger>
            </TabsList>

            {/* FCPS Questions Tab */}
            <TabsContent value="questions" className="space-y-4 mt-6">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No questions found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <Card key={question.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {question.specialty.replace('-', ' ')}
                              </Badge>
                              <Badge variant="secondary">{question.system}</Badge>
                              {getDifficultyBadge(question.difficulty)}
                              {getStatusBadge(question.status || 'pending')}
                            </div>
                            <p className="text-gray-900 font-medium line-clamp-2 mb-2">{question.question}</p>
                            <p className="text-sm text-gray-600">
                              Submitted {new Date(question.createdAt || new Date()).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewQuestion(question)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                            {question.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickApprove(question.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedItemId(question.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rejection Reason Input */}
                        {selectedItemId === question.id && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Label htmlFor="rejection-reason">Rejection Reason</Label>
                            <Textarea
                              id="rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a detailed reason for rejection..."
                              rows={3}
                              className="mt-2"
                            />
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleQuickReject(question.id)}
                                disabled={!rejectionReason.trim()}
                              >
                                Confirm Rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show options preview */}
                        {question.options && question.options.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label className="text-sm font-medium">Options:</Label>
                            {question.options.slice(0, 2).map((option: string, index: number) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                                <span className="truncate">{option}</span>
                                {index === question.correctAnswer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                            {question.options.length > 2 && (
                              <p className="text-sm text-gray-500">
                                +{question.options.length - 2} more options...
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* System Requests Tab */}
            <TabsContent value="systems" className="space-y-4 mt-6">
              {filteredSystemRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No system requests found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSystemRequests.map((request) => (
                    <Card key={request.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {request.specialty.replace('-', ' ')}
                              </Badge>
                              {getStatusBadge(request.status)}
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2">{request.systemName}</h3>
                            {request.description && (
                              <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Requested by: {request.requestedBy} • {new Date(request.createdAt || new Date()).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => onApproveSystemRequest(request.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedItemId(request.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rejection Reason for System Requests */}
                        {selectedItemId === request.id && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Label htmlFor="system-rejection-reason">Rejection Reason</Label>
                            <Textarea
                              id="system-rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejecting this system request..."
                              rows={3}
                              className="mt-2"
                            />
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (rejectionReason.trim()) {
                                    onRejectSystemRequest(request.id, rejectionReason);
                                    setRejectionReason('');
                                    setSelectedItemId(null);
                                  }
                                }}
                                disabled={!rejectionReason.trim()}
                              >
                                Confirm Rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Mock Exam Sets Tab */}
            <TabsContent value="mock-sets" className="space-y-4 mt-6">
              {pendingMockExamSets.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending mock exam sets for review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMockExamSets.map((mockSet) => (
                    <Card key={mockSet.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {mockSet.specialty.replace('-', ' ')}
                              </Badge>
                              {getStatusBadge(mockSet.status || 'pending')}
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2">{mockSet.name}</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                              <div>Questions: {mockSet.totalQuestions}</div>
                              <div>Time: {mockSet.timeLimit} min</div>
                              <div>Pass: {mockSet.passingCriteria}%</div>
                            </div>
                            <p className="text-sm text-gray-500">
                              Created by: {mockSet.createdBy} • {new Date(mockSet.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {mockSet.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { updateMockExamSetStatus } = await import('../../utils/mockExamUtils');
                                      await updateMockExamSetStatus(mockSet.id, 'approved');
                                      onRefresh();
                                    } catch (error) {
                                      console.error('Error approving mock exam set:', error);
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedItemId(mockSet.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rejection Reason for Mock Exam Sets */}
                        {selectedItemId === mockSet.id && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Label htmlFor="mockset-rejection-reason">Rejection Reason</Label>
                            <Textarea
                              id="mockset-rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejecting this mock exam set..."
                              rows={3}
                              className="mt-2"
                            />
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (rejectionReason.trim()) {
                                    try {
                                      const { updateMockExamSetStatus } = await import('../../utils/mockExamUtils');
                                      await updateMockExamSetStatus(mockSet.id, 'rejected', rejectionReason);
                                      setRejectionReason('');
                                      setSelectedItemId(null);
                                      onRefresh();
                                    } catch (error) {
                                      console.error('Error rejecting mock exam set:', error);
                                    }
                                  }
                                }}
                                disabled={!rejectionReason.trim()}
                              >
                                Confirm Rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Mock Questions Tab - REPLACE THE EXISTING PLACEHOLDER */}
            <TabsContent value="mock-questions" className="space-y-4 mt-6">
              {mockExamQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No mock exam questions found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Mock exam questions will appear here once imported
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockExamQuestions
                    .filter(question => {
                      const matchesSearch = searchTerm === '' || 
                        question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        question.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        question.mockExam?.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const matchesStatus = statusFilter === 'all' || question.status === statusFilter;
                      const matchesSpecialty = specialtyFilter === 'all' || question.specialty === specialtyFilter;
                      
                      return matchesSearch && matchesStatus && matchesSpecialty;
                    })
                    .map((question) => (
                    <Card key={question.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {question.specialty?.replace('-', ' ')}
                              </Badge>
                              <Badge variant="secondary">{question.system}</Badge>
                              <Badge className="bg-purple-100 text-purple-800">
                                {question.mockExam}
                              </Badge>
                              {getDifficultyBadge(question.difficulty)}
                              {getStatusBadge(question.status || 'pending')}
                            </div>
                            <p className="text-gray-900 font-medium line-clamp-2 mb-2">
                              {question.question?.substring(0, 100)}...
                            </p>
                            <p className="text-sm text-gray-600">
                              Imported {new Date(question.createdAt || new Date()).toLocaleDateString()}
                              {question.mockExam && ` • ${question.mockExam}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Create a compatible FCPSQuestion object for viewing
                                const fcpsQuestion: FCPSQuestion = {
                                  id: question.id,
                                  question: question.question,
                                  options: question.options || [],
                                  correctAnswer: question.correctAnswer || 0,
                                  explanation: question.explanation || '',
                                  specialty: question.specialty,
                                  system: question.system || 'General',
                                  difficulty: question.difficulty || 'Medium',
                                  status: question.status || 'pending',
                                  createdBy: question.createdBy || 'content-manager',
                                  createdAt: question.createdAt,
                                  updatedAt: question.updatedAt || question.createdAt,
                                  rejectionReason: question.rejectionReason || undefined
                                };
                                onViewQuestion(fcpsQuestion);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                            {question.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickApproveMockQuestion(question.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedItemId(question.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rejection Reason Input for Mock Questions */}
                        {selectedItemId === question.id && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Label htmlFor="mock-rejection-reason">Rejection Reason</Label>
                            <Textarea
                              id="mock-rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a detailed reason for rejection..."
                              rows={3}
                              className="mt-2"
                            />
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleQuickRejectMockQuestion(question.id)}
                                disabled={!rejectionReason.trim()}
                              >
                                Confirm Rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show options preview for mock questions */}
                        {question.options && question.options.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label className="text-sm font-medium">Options:</Label>
                            {question.options.slice(0, 2).map((option: string, index: number) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                                <span className="truncate">{option}</span>
                                {index === question.correctAnswer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                            {question.options.length > 2 && (
                              <p className="text-sm text-gray-500">
                                +{question.options.length - 2} more options...
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};