import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  User,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { AdminData, Question, SystemRequest } from '../types';

interface ContentManagerReviewsProps {
  admin: AdminData;
  onClose: () => void;
}

export default function ContentManagerReviews({ admin }: ContentManagerReviewsProps) {
  // Use admin parameter to prevent unused variable warning
  console.log('Content manager logged in:', admin.id);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [systemRequests, setSystemRequests] = useState<SystemRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Question | SystemRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    action: '',
    feedback: '',
    rating: 5
  });
  const [filters, setFilters] = useState({
    status: 'all',
    specialty: 'all',
    submittedBy: '',
    dateRange: '30d'
  });

  // Mock data for demonstration
  useEffect(() => {
    loadReviewData();
  }, [filters]);

  const loadReviewData = () => {
    setLoading(true);
    
    // Simulate loading questions and system requests
    setTimeout(() => {
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          question: 'Which of the following is the most common cause of acute coronary syndrome?',
          text: 'Which of the following is the most common cause of acute coronary syndrome?',
          options: ['Atherosclerotic plaque rupture', 'Coronary artery spasm', 'Coronary embolism', 'Aortic dissection'],
          correctAnswer: 0,
          explanation: 'Atherosclerotic plaque rupture is the most common underlying mechanism of acute coronary syndrome.',
          system: 'Cardiovascular System',
          specialty: 'medicine',
          difficulty: 'medium',
          status: 'pending',
          submittedBy: 'Dr. Ahmed Khan',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 'q2',
          question: 'What is the gold standard surgical approach for acute appendicitis?',
          text: 'What is the gold standard surgical approach for acute appendicitis?',
          options: ['Open appendectomy', 'Laparoscopic appendectomy', 'Conservative management', 'Drainage only'],
          correctAnswer: 1,
          explanation: 'Laparoscopic appendectomy is now considered the gold standard for most cases of acute appendicitis.',
          system: 'Gastrointestinal System',
          specialty: 'surgery',
          difficulty: 'easy',
          status: 'pending',
          submittedBy: 'Dr. Sarah Ahmed',
          createdAt: '2024-01-14T14:20:00Z'
        }
      ];

      const mockSystemRequests: SystemRequest[] = [
        {
          id: 'sr1',
          name: 'Orthopedic System - Hand Surgery',
          systemName: 'Orthopedic System - Hand Surgery',
          description: 'Specialized system focusing on hand and wrist surgical procedures',
          specialty: 'surgery',
          status: 'pending',
          requestedBy: 'Dr. Muhammad Ali',
          requestedAt: '2024-01-13T09:15:00Z',
          createdAt: '2024-01-13T09:15:00Z'
        }
      ];

      setQuestions(mockQuestions);
      setSystemRequests(mockSystemRequests);
      setLoading(false);
    }, 1000);
  };

  const handleReviewSubmit = () => {
    if (!selectedItem || !reviewForm.action) return;

    console.log('Submitting review:', {
      item: selectedItem,
      review: reviewForm
    });

    // Update the item status
    if ('text' in selectedItem) {
      // It's a question
      setQuestions(prev => 
        prev.map(q => 
          q.id === selectedItem.id 
            ? { ...q, status: reviewForm.action as any }
            : q
        )
      );
    } else {
      // It's a system request
      setSystemRequests(prev => 
        prev.map(sr => 
          sr.id === selectedItem.id 
            ? { ...sr, status: reviewForm.action as any }
            : sr
        )
      );
    }

    setShowReviewModal(false);
    setSelectedItem(null);
    setReviewForm({ action: '', feedback: '', rating: 5 });
    
    alert('Review submitted successfully!');
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const pendingSystemRequests = systemRequests.filter(sr => sr.status === 'pending');
  const totalPending = pendingQuestions.length + pendingSystemRequests.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Content Reviews</h2>
          <p className="text-gray-600">Review and approve submitted questions and system requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">
            {totalPending} pending reviews
          </Badge>
          <Button variant="outline" onClick={loadReviewData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Specialty</Label>
              <Select value={filters.specialty} onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}>
                <SelectTrigger>
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
            
            <div>
              <Label>Submitted By</Label>
              <Input
                value={filters.submittedBy}
                onChange={(e) => setFilters(prev => ({ ...prev, submittedBy: e.target.value }))}
                placeholder="Search by submitter..."
              />
            </div>
            
            <div>
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Questions ({questions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="systems" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>System Requests ({systemRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No questions to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{question.system}</Badge>
                          <Badge variant="outline">{question.specialty}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <Badge className={getStatusColor(question.status || 'pending')}>
                            {question.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2 line-clamp-2">{question.text}</h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{question.submittedBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(question.createdAt!)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(question);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        
                        {question.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedItem(question);
                                setReviewForm({ action: 'approved', feedback: '', rating: 5 });
                                handleReviewSubmit();
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedItem(question);
                                setReviewForm({ action: 'rejected', feedback: 'Requires revision', rating: 3 });
                                setShowReviewModal(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="systems" className="space-y-4">
          {systemRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No system requests to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {systemRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{request.specialty}</Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2">{request.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{request.requestedBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(request.createdAt!)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(request);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedItem(request);
                                setReviewForm({ action: 'approved', feedback: '', rating: 5 });
                                handleReviewSubmit();
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedItem(request);
                                setReviewForm({ action: 'rejected', feedback: 'Needs more details', rating: 3 });
                                setShowReviewModal(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Review {selectedItem && 'text' in selectedItem ? 'Question' : 'System Request'}
            </DialogTitle>
            <DialogDescription>
              Provide feedback and make a decision on this submission
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Item Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {'text' in selectedItem ? 'Question Details' : 'System Request Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {'text' in selectedItem ? (
                    <div>
                      <Label className="text-xs text-gray-500">Question Text</Label>
                      <p className="text-sm mt-1">{selectedItem.text}</p>
                      
                      <div className="mt-3">
                        <Label className="text-xs text-gray-500">Options</Label>
                        <ul className="text-sm mt-1 space-y-1">
                          {selectedItem.options.map((option, index) => (
                            <li key={index} className={index === selectedItem.correctAnswer ? 'font-medium text-green-600' : ''}>
                              {String.fromCharCode(65 + index)}. {option}
                              {index === selectedItem.correctAnswer && ' (Correct)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {selectedItem.explanation && (
                        <div className="mt-3">
                          <Label className="text-xs text-gray-500">Explanation</Label>
                          <p className="text-sm mt-1">{selectedItem.explanation}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs text-gray-500">System Name</Label>
                      <p className="text-sm mt-1">{'name' in selectedItem ? selectedItem.name : 'N/A'}</p>
                      
                      <div className="mt-3">
                        <Label className="text-xs text-gray-500">Description</Label>
                        <p className="text-sm mt-1">{'description' in selectedItem ? selectedItem.description : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Review Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Action</Label>
                    <Select value={reviewForm.action} onValueChange={(value) => setReviewForm(prev => ({ ...prev, action: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                        <SelectItem value="pending">Keep Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Feedback</Label>
                    <Textarea
                      value={reviewForm.feedback}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Provide feedback to the submitter..."
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button onClick={handleReviewSubmit} disabled={!reviewForm.action}>
                      Submit Review
                    </Button>
                    <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                      Cancel
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
}