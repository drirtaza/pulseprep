import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Calendar,
  User,
  FileText,
  DollarSign,
  CreditCard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { UserDataWithAttempts } from '../types';

interface PaymentJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDataWithAttempts | null;
  finalStatus?: 'completed' | 'rejected' | 'pending';
}

export const PaymentJourneyModal = ({ isOpen, onClose, user, finalStatus = 'pending' }: PaymentJourneyModalProps) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingImageName, setViewingImageName] = useState<string>('');
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  // ✅ FIXED: Add null checking for user prop
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              User data not available. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ FIXED: Safe access to payment attempts with proper validation
  const attempts = Array.isArray(user.paymentAttempts) ? user.paymentAttempts : [];
  const sortedAttempts = [...attempts].reverse(); // Show newest first

  const toggleAttemptExpansion = (attemptId: string) => {
    try {
      setExpandedAttempts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(attemptId)) {
          newSet.delete(attemptId);
        } else {
          newSet.add(attemptId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('❌ Error toggling attempt expansion:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFinalStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleViewImage = (screenshot: string, screenshotName: string) => {
    try {
      if (screenshot && screenshotName) {
        setViewingImage(screenshot);
        setViewingImageName(screenshotName);
      }
    } catch (error) {
      console.error('❌ Error viewing image:', error);
      alert('Error viewing image. Please try again.');
    }
  };

  const handleDownloadImage = (screenshot: string, screenshotName: string) => {
    try {
      if (!screenshot || !screenshotName) {
        alert('Image data not available for download.');
        return;
      }

      const link = document.createElement('a');
      link.href = screenshot;
      link.download = screenshotName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      alert('Error downloading image. Please try again.');
    }
  };

  // ✅ FIXED: Safe string access with fallbacks
  const safeGetString = (value: any, defaultValue: string = '') => {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value !== 'string') {
      return String(value);
    }
    return value;
  };

  // ✅ FIXED: Safe number access with fallbacks
  const safeGetNumber = (value: any, defaultValue: number = 0) => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return defaultValue;
    }
    return value;
  };

  if (viewingImage) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>
              {viewingImageName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative max-w-full">
              <img 
                src={viewingImage} 
                alt="Payment Screenshot" 
                className="max-w-full max-h-[70vh] object-contain border rounded-lg shadow-lg"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleDownloadImage(viewingImage, viewingImageName)}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => setViewingImage(null)}
                variant="outline"
              >
                Back to Journey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Payment Journey - {safeGetString(user.name, 'Unknown User')}</span>
          </DialogTitle>
          <DialogDescription>
            Complete payment verification history and timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Journey Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {finalStatus === 'completed' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : finalStatus === 'rejected' ? (
                  <XCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <Clock className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <Badge className={getFinalStatusBadge(finalStatus)}>
                {finalStatus === 'completed' ? 'APPROVED' : safeGetString(finalStatus, 'PENDING').toUpperCase()}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Final Status</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              <p className="text-sm text-gray-600">Total Attempts</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {user.actualAmountPaid ? `PKR ${safeGetNumber(user.actualAmountPaid).toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Amount Paid</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{safeGetString(user.email, 'No email')}</p>
              <p className="text-sm text-gray-600">User Email</p>
            </div>
          </div>

          {/* Payment Journey Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Payment Attempt Timeline
            </h3>
            
            {sortedAttempts.map((attempt, index) => {
              if (!attempt || !attempt.id) {
                return null; // Skip invalid attempts
              }

              const isLatest = index === 0;
              const attemptNumber = attempts.length - index;
              const isExpanded = expandedAttempts.has(attempt.id);
              
              return (
                <div 
                  key={attempt.id} 
                  className={`border rounded-lg transition-all ${
                    isLatest ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  } ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}
                >
                  {/* Attempt Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleAttemptExpansion(attempt.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        {getStatusIcon(attempt.status || 'pending')}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Attempt #{attemptNumber}
                            {isLatest && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                                Latest
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {attempt.uploadedAt ? new Date(attempt.uploadedAt).toLocaleString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(attempt.status || 'pending')}>
                        {(() => {
                          const status = safeGetString(attempt.status, 'pending');
                          return status.charAt(0).toUpperCase() + status.slice(1);
                        })()}
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded Attempt Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        {/* Screenshot Section */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Payment Screenshot:</h5>
                          <div className="flex items-start space-x-3">
                            {attempt.screenshot ? (
                              <>
                                <img 
                                  src={attempt.screenshot} 
                                  alt={`Payment attempt ${attemptNumber}`}
                                  className="w-24 h-24 object-cover border rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleViewImage(
                                    attempt.screenshot, 
                                    safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)
                                  )}
                                />
                                <div className="space-y-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewImage(
                                      attempt.screenshot, 
                                      safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)
                                    )}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Full Size
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadImage(
                                      attempt.screenshot, 
                                      safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)
                                    )}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <p className="text-xs text-gray-500">
                                    {safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center w-24 h-24 border rounded bg-gray-100">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Transaction Details:</h5>
                          <div className="space-y-3">
                            {attempt.transactionId && (
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Transaction ID:</p>
                                  <p className="text-sm text-gray-900 font-mono">{attempt.transactionId}</p>
                                </div>
                              </div>
                            )}
                            
                            {attempt.accountTitle && (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Account Title:</p>
                                  <p className="text-sm text-gray-900">{attempt.accountTitle}</p>
                                </div>
                              </div>
                            )}
                            
                            {attempt.amount && (
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Amount:</p>
                                  <p className="text-sm text-gray-900 font-semibold">
                                    {safeGetString(attempt.currency, 'PKR')} {safeGetNumber(attempt.amount).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Review Details */}
                      {(attempt.status === 'rejected' || attempt.status === 'approved') && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                          <div className="flex items-start space-x-3">
                            <User className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              <h6 className="font-medium text-gray-900 mb-2">
                                {attempt.status === 'rejected' ? 'Rejection Details' : 'Approval Details'}
                              </h6>
                              
                              {attempt.rejectionReason && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm text-red-800">
                                    <strong>Reason:</strong> {attempt.rejectionReason}
                                  </p>
                                </div>
                              )}
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                  <strong>Reviewed by:</strong> {safeGetString(attempt.reviewedBy, 'Finance Manager')}
                                </p>
                                <p>
                                  <strong>Review date:</strong> {attempt.reviewedAt ? new Date(attempt.reviewedAt).toLocaleString() : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {attempts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment attempts found for this user.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close Journey View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};