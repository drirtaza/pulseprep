import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Clock, Users, Target, Eye, Calendar, User, CheckCircle, XCircle, AlertCircle, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { AdminData, MockExamSet, MockExamQuestion, SpecialtyType } from '../types';
import { getMockExamSets, addMockExamSet, getMockExamQuestions, updateMockExamSet, deleteMockExamSet, getMockExamQuestionsBySet, getMockExamQuestionCounts, updateMockExamQuestion, deleteMockExamQuestion } from '../utils/mockExamUtils';
// ADD THIS IMPORT - DO NOT MODIFY EXISTING ExcelImportWizard IMPORT
import { MockExamImportWizard } from './MockExamImportWizard';

interface MockExamManagementProps {
  admin: AdminData;
  selectedSpecialty: SpecialtyType;
}

const MockExamManagement: React.FC<MockExamManagementProps> = ({ admin, selectedSpecialty: specialty }) => {
  const [mockExamSets, setMockExamSets] = useState<MockExamSet[]>([]);
  const [mockExamQuestions, setMockExamQuestions] = useState<MockExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('sets');
  const [showMockExamSetDetails, setShowMockExamSetDetails] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<MockExamSet | null>(null);
  const [showMockExamSetForm, setShowMockExamSetForm] = useState(false);
  
  // ADD THIS NEW STATE
  const [showMockImportWizard, setShowMockImportWizard] = useState(false);
  const [mockExamQuestionCounts, setMockExamQuestionCounts] = useState<any[]>([]);

  // 🆕 NEW: Question viewer modal state
  const [showQuestionViewer, setShowQuestionViewer] = useState(false);
  const [selectedMockExamForViewing, setSelectedMockExamForViewing] = useState<string>('');
  const [viewerQuestions, setViewerQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // 🆕 NEW: Question editor state
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1);

  // Safe specialty handling with fallback
  const specialtyDisplayName = specialty ? specialty.replace('-', ' ').toUpperCase() : 'MEDICINE';

  // Load data when component mounts or specialty changes
  useEffect(() => {
    if (specialty) {
      loadMockExamSets();
      loadMockExamQuestions();
      loadMockExamQuestionCounts();
    }
  }, [specialty]);

  const loadMockExamSets = async () => {
    try {
      setIsLoading(true);
      const sets = await getMockExamSets(specialty);
      setMockExamSets(sets);
      console.log(`📊 Loaded ${sets.length} mock exam sets for ${specialty}`);
    } catch (error) {
      console.error('Error loading mock exam sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockExamQuestions = async () => {
    try {
      const questions = await getMockExamQuestions(specialty);
      setMockExamQuestions(questions);
      console.log(`📊 Loaded ${questions.length} mock exam questions for ${specialty}`);
    } catch (error) {
      console.error('Error loading mock exam questions:', error);
    }
  };

  // 🆕 NEW: Load mock exam question counts
  const loadMockExamQuestionCounts = async () => {
    try {
      const counts = getMockExamQuestionCounts(specialty);
      setMockExamQuestionCounts(counts);
      console.log(`📊 Loaded question counts for ${specialty}`, counts);
    } catch (error) {
      console.error('Error loading mock exam question counts:', error);
      setMockExamQuestionCounts([]);
    }
  };

  // 🆕 NEW: Handle viewing questions for a specific mock exam
  const handleViewQuestions = async (mockExamName: string) => {
    try {
      setLoadingQuestions(true);
      setSelectedMockExamForViewing(mockExamName);
      setShowQuestionViewer(true);
      
      console.log(`📋 Loading questions for ${mockExamName} in ${specialty}`);
      
      // Load questions from the separate mock exam storage
      // Include all statuses (pending + approved) for management interface
      const questions = getMockExamQuestionsBySet(specialty, mockExamName, true);
      
      console.log(`📊 Loaded ${questions.length} questions for ${mockExamName}`);
      setViewerQuestions(questions);
    } catch (error) {
      console.error('Error loading questions for viewer:', error);
      setViewerQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // 🆕 NEW: Handle editing a question
  const handleEditQuestion = (question: any, index: number) => {
    setEditingQuestion({
      ...question,
      // Ensure options is an array
      options: question.options || []
    });
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  // 🆕 NEW: Handle saving edited question
  const handleSaveQuestion = async (updatedQuestion: any) => {
    try {
      const success = updateMockExamQuestion(
        specialty, 
        selectedMockExamForViewing, 
        updatedQuestion.id, 
        updatedQuestion
      );
      
      if (success) {
        // Update local state
        const updatedQuestions = [...viewerQuestions];
        updatedQuestions[editingQuestionIndex] = {
          ...updatedQuestion,
          status: 'pending', // Content manager edits require admin approval
          updatedAt: new Date().toISOString()
        };
        setViewerQuestions(updatedQuestions);
        
        // Refresh counts
        loadMockExamQuestionCounts();
        
        setShowQuestionEditor(false);
        setEditingQuestion(null);
        setEditingQuestionIndex(-1);
        
        alert('Question updated successfully! It will need admin approval.');
      } else {
        alert('Failed to update question. Please try again.');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  // 🆕 NEW: Handle deleting a question
  const handleDeleteQuestion = async (question: any, index: number) => {
    if (!confirm(`Are you sure you want to delete this question?\n\n"${question.question?.substring(0, 100)}..."`)) {
      return;
    }
    
    try {
      const success = deleteMockExamQuestion(
        specialty, 
        selectedMockExamForViewing, 
        question.id
      );
      
      if (success) {
        // Update local state
        const updatedQuestions = viewerQuestions.filter((_, i) => i !== index);
        setViewerQuestions(updatedQuestions);
        
        // Refresh counts
        loadMockExamQuestionCounts();
        
        alert('Question deleted successfully!');
      } else {
        alert('Failed to delete question. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  const handleEditMockExamSet = (mockExamSet: MockExamSet) => {
    setEditingSet(mockExamSet);
    setShowMockExamSetForm(true);
  };

  const handleUpdateMockExamSet = async (formData: any) => {
    if (!editingSet) return;
    
    try {
      setIsLoading(true);
      
      const updatedSet = {
        ...editingSet,
        name: formData.name,
        totalQuestions: parseInt(formData.totalQuestions),
        timeLimit: parseInt(formData.timeLimit),
        passingCriteria: parseInt(formData.passingCriteria),
        updatedAt: new Date().toISOString(),
        status: 'pending' // When content manager edits, it goes to pending for admin approval
      };
      
      await updateMockExamSet(updatedSet.id, {
         ...updatedSet,
        status: updatedSet.status as 'pending' | 'rejected' | 'approved'
      });
      
      // Reload mock exam sets
      await loadMockExamSets();
      
      setShowMockExamSetForm(false);
      setEditingSet(null);
      
      alert('Mock exam set updated successfully! It will need admin approval.');
    } catch (error) {
      console.error('Error updating mock exam set:', error);
      alert('Failed to update mock exam set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMockExamSet = async (setId: string) => {
    if (!confirm('Are you sure you want to delete this mock exam set?')) return;
    
    try {
      setIsLoading(true);
      await deleteMockExamSet(setId);
      await loadMockExamSets();
      alert('Mock exam set deleted successfully!');
    } catch (error) {
      console.error('Error deleting mock exam set:', error);
      alert('Failed to delete mock exam set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMockExamSet = async (formData: any) => {
    try {
      setIsLoading(true);
      
      const newSet = {
        name: formData.name,
        totalQuestions: parseInt(formData.totalQuestions),
        timeLimit: parseInt(formData.timeLimit),
        passingCriteria: parseInt(formData.passingCriteria),
        specialty: specialty,
        systemDistribution: [],
        difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
        isActive: true,
        createdBy: admin.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending' as const
      };
      
      await addMockExamSet(newSet);
      await loadMockExamSets();
      setShowMockExamSetForm(false);
      alert('Mock exam set created successfully! It will need admin approval.');
    } catch (error) {
      console.error('Error creating mock exam set:', error);
      alert('Failed to create mock exam set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const selectedSetDetails = mockExamSets.find(set => set.id === showMockExamSetDetails);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mock Exam Management</h2>
          <p className="text-muted-foreground">
            Manage mock exam sets and questions for {specialtyDisplayName}
          </p>
        </div>
        <Button onClick={() => {
          setEditingSet(null);
          setShowMockExamSetForm(true);
        }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Mock Exam Set
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sets" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Mock Exam Sets ({mockExamSets.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Mock Questions ({mockExamQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mock Exam Sets
              </CardTitle>
              <CardDescription>
                Configure and manage mock exam parameters for your specialty
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading mock exam sets...</p>
                  </div>
                </div>
              ) : mockExamSets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>Pass %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExamSets.map((set) => (
                      <TableRow key={set.id}>
                        <TableCell>{set.name}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {set.totalQuestions}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {set.timeLimit} min
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          {set.passingCriteria}%
                        </TableCell>
                        <TableCell>{getStatusBadge(set.status || 'pending')}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {set.createdBy}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMockExamSet(set)}
                              disabled={isLoading}
                              title="Edit this mock exam set"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowMockExamSetDetails(set.id)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {set.status === 'approved' && set.createdBy !== 'System' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMockExamSet(set.id)}
                                disabled={isLoading}
                                title="Delete this mock exam set"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Mock Exam Sets</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first mock exam set to get started
                  </p>
                  <Button onClick={() => {
                    setEditingSet(null);
                    setShowMockExamSetForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Mock Exam Set
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mock Exam Questions by Set</CardTitle>
              <CardDescription>Manage questions for each mock exam</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mock Exam</TableHead>
                    <TableHead>Total Questions</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['Mock 1', 'Mock 2', 'Mock 3', 'Previous Years'].map((mockName) => {
                    const mockExamData = mockExamQuestionCounts.find(m => m.name === mockName) || { 
                      name: mockName, 
                      total: 0, 
                      approved: 0, 
                      pending: 0 
                    };
                    
                    return (
                      <TableRow key={mockName}>
                        <TableCell>{mockName}</TableCell>
                        <TableCell>{mockExamData.total}</TableCell>
                        <TableCell>{mockExamData.approved}</TableCell>
                        <TableCell>{mockExamData.pending}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleViewQuestions(mockName)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Questions
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🆕 NEW: Import Questions tab content */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Mock Exam Questions</CardTitle>
              <CardDescription>Upload Excel files with MCQs for specific mock exams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Supported Excel Format</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Required columns:</strong> Question, Option A-E, Correct Answer, Explanation</p>
                    <p><strong>Optional columns:</strong> Category, Difficulty</p>
                    <p><strong>Works with:</strong> Your existing 19-column FCPS format automatically!</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">⚠️ Prerequisites</h4>
                  <div className="text-sm text-amber-800">
                    <p>Mock exam sets must be created and approved before importing questions.</p>
                    <p>Only approved mock exam sets will appear in the dropdown.</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowMockImportWizard(true)}
                  disabled={mockExamSets.filter(set => set.status === 'approved').length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {mockExamSets.filter(set => set.status === 'approved').length === 0 
                    ? 'No Approved Mock Exam Sets' 
                    : 'Start Mock Exam Import'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mock Exam Set Details Modal */}
      {showMockExamSetDetails && selectedSetDetails && (
        <Dialog open={!!showMockExamSetDetails} onOpenChange={() => setShowMockExamSetDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mock Exam Set Details
              </DialogTitle>
              <DialogDescription>
                Configuration details for "{selectedSetDetails.name}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedSetDetails.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSetDetails.status || 'pending')}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Questions</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedSetDetails.totalQuestions}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Time Limit</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedSetDetails.timeLimit} minutes
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Passing Criteria</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {selectedSetDetails.passingCriteria}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedSetDetails.createdBy}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedSetDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Difficulty Distribution</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">Easy</Badge>
                    <span className="text-sm">{selectedSetDetails.difficultyDistribution.easy}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="default">Medium</Badge>
                    <span className="text-sm">{selectedSetDetails.difficultyDistribution.medium}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="destructive">Hard</Badge>
                    <span className="text-sm">{selectedSetDetails.difficultyDistribution.hard}%</span>
                  </div>
                </div>
              </div>
              
              {selectedSetDetails.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rejection Reason</Label>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{selectedSetDetails.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Mock Exam Set Form Modal */}
      {showMockExamSetForm && (
        <Dialog open={showMockExamSetForm} onOpenChange={setShowMockExamSetForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSet ? 'Edit Mock Exam Set' : 'Create Mock Exam Set'}
              </DialogTitle>
              <DialogDescription>
                Configure the mock exam set parameters. Changes will require admin approval.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = Object.fromEntries(formData.entries());
              if (editingSet) {
                handleUpdateMockExamSet(data);
              } else {
                handleCreateMockExamSet(data);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Exam Set Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingSet?.name || ''}
                    placeholder="e.g., Mock 1 - Foundation Level"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalQuestions">Total Questions</Label>
                    <Input
                      id="totalQuestions"
                      name="totalQuestions"
                      type="number"
                      defaultValue={editingSet?.totalQuestions || 100}
                      min="10"
                      max="300"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      name="timeLimit"
                      type="number"
                      defaultValue={editingSet?.timeLimit || 120}
                      min="30"
                      max="360"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="passingCriteria">Passing Criteria (%)</Label>
                  <Input
                    id="passingCriteria"
                    name="passingCriteria"
                    type="number"
                    defaultValue={editingSet?.passingCriteria || 60}
                    min="1"
                    max="100"
                    required
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {editingSet ? 'Update Mock Exam Set' : 'Create Mock Exam Set'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowMockExamSetForm(false);
                      setEditingSet(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 🆕 NEW: Question Viewer Modal with Edit/Delete Actions */}
      {showQuestionViewer && (
        <Dialog open={showQuestionViewer} onOpenChange={() => setShowQuestionViewer(false)}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Questions for {selectedMockExamForViewing}
              </DialogTitle>
              <DialogDescription>
                {specialtyDisplayName} specialty • {viewerQuestions.length} questions found
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {loadingQuestions ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading questions...</p>
                  </div>
                </div>
              ) : viewerQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Questions Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No questions have been imported for {selectedMockExamForViewing} yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use the "Import Questions" tab to add questions to this mock exam.
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 p-1">
                    {viewerQuestions.map((question, index) => (
                      <Card key={question.id || index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  Question {index + 1}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.category || question.system || 'General'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    question.difficulty === 'Easy' ? 'border-green-300 text-green-700' :
                                    question.difficulty === 'Medium' ? 'border-yellow-300 text-yellow-700' :
                                    'border-red-300 text-red-700'
                                  }`}
                                >
                                  {question.difficulty || 'Medium'}
                                </Badge>
                                {getStatusBadge(question.status || 'pending')}
                              </div>
                              <CardTitle className="text-base leading-relaxed">
                                {question.question || question.questionText}
                              </CardTitle>
                            </div>
                            {/* 🆕 NEW: Action buttons */}
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditQuestion(question, index)}
                                title="Edit this question"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteQuestion(question, index)}
                                title="Delete this question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Options */}
                          <div className="grid grid-cols-1 gap-2">
                            {question.options?.map((option: string, optIndex: number) => (
                              <div 
                                key={optIndex}
                                className={`p-3 rounded-lg border-2 text-sm ${
                                  optIndex === question.correctAnswer 
                                    ? 'border-green-400 bg-green-50 text-green-900' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    optIndex === question.correctAnswer 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-400 text-white'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className="flex-1">{option}</span>
                                  {optIndex === question.correctAnswer && (
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Explanation */}
                          {question.explanation && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <h5 className="font-medium text-blue-900 mb-1 text-sm">Explanation:</h5>
                              <p className="text-blue-800 text-sm leading-relaxed">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <span>ID: {question.id}</span>
                            {question.createdAt && (
                              <span>Added: {new Date(question.createdAt).toLocaleDateString()}</span>
                            )}
                            {question.source && (
                              <span>Source: {question.source}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            <div className="flex-shrink-0 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {viewerQuestions.length > 0 && (
                    <>
                      Total: {viewerQuestions.length} questions • 
                      Approved: {viewerQuestions.filter(q => q.status === 'approved').length} • 
                      Pending: {viewerQuestions.filter(q => q.status === 'pending').length}
                    </>
                  )}
                </div>
                <Button onClick={() => setShowQuestionViewer(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 🆕 NEW: Question Editor Modal */}
      {showQuestionEditor && editingQuestion && (
        <Dialog open={showQuestionEditor} onOpenChange={() => setShowQuestionEditor(false)}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Question
              </DialogTitle>
              <DialogDescription>
                Make changes to the question. Edited questions require admin approval.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  
                  const updatedQuestion = {
                    ...editingQuestion,
                    question: formData.get('question') as string,
                    options: [
                      formData.get('optionA') as string,
                      formData.get('optionB') as string,
                      formData.get('optionC') as string,
                      formData.get('optionD') as string,
                      formData.get('optionE') as string,
                    ].filter(Boolean),
                    correctAnswer: parseInt(formData.get('correctAnswer') as string),
                    explanation: formData.get('explanation') as string,
                    difficulty: formData.get('difficulty') as string,
                    system: formData.get('system') as string
                  };
                  
                  handleSaveQuestion(updatedQuestion);
                }} className="space-y-6 p-1">
                  
                  {/* Question Text */}
                  <div>
                    <Label htmlFor="question">Question Text</Label>
                    <Textarea
                      id="question"
                      name="question"
                      defaultValue={editingQuestion.question || editingQuestion.questionText}
                      rows={4}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  {/* Options */}
                  <div>
                    <Label>Answer Options</Label>
                    <div className="space-y-3 mt-2">
                      {['A', 'B', 'C', 'D', 'E'].map((letter, index) => (
                        <div key={letter} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                            {letter}
                          </div>
                          <Input
                            name={`option${letter}`}
                            defaultValue={editingQuestion.options?.[index] || ''}
                            placeholder={`Option ${letter}`}
                            className="flex-1"
                            required={index < 4} // A-D are required, E is optional
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Correct Answer */}
                  <div>
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <Select defaultValue={editingQuestion.correctAnswer?.toString() || '0'}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingQuestion.options?.map((option: string, index: number) => (
                          option && (
                            <SelectItem key={index} value={index.toString()}>
                              {String.fromCharCode(65 + index)}: {option.substring(0, 50)}...
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Explanation */}
                  <div>
                    <Label htmlFor="explanation">Explanation</Label>
                    <Textarea
                      id="explanation"
                      name="explanation"
                      defaultValue={editingQuestion.explanation}
                      rows={3}
                      className="mt-1"
                      placeholder="Explain why this answer is correct..."
                    />
                  </div>
                  
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select defaultValue={editingQuestion.difficulty || 'Medium'}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="system">System/Category</Label>
                      <Input
                        id="system"
                        name="system"
                        defaultValue={editingQuestion.system || editingQuestion.category || ''}
                        placeholder="e.g., Cardiovascular System"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionEditor(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 🆕 NEW: Mock Import Wizard */}
      {showMockImportWizard && (
        <MockExamImportWizard
          specialty={specialty}
          onSuccess={() => {
            setShowMockImportWizard(false);
            loadMockExamQuestions();
            loadMockExamQuestionCounts();
          }}
          onCancel={() => setShowMockImportWizard(false)}
        />
      )}
    </div>
  );
};

export default MockExamManagement;