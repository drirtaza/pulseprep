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
  FileText
} from 'lucide-react';
import { UserDataWithAttempts } from '../types';

interface PaymentAttemptsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDataWithAttempts | null;
}

export const PaymentAttemptsHistoryModal = ({ isOpen, onClose, user }: PaymentAttemptsHistoryModalProps) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingImageName, setViewingImageName] = useState<string>('');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
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
    if (value === null || value === undefined || typeof value !== 'string') {
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
                Back to History
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Payment Attempt History - {safeGetString(user.name, 'Unknown User')}</span>
          </DialogTitle>
          <DialogDescription>
            Complete timeline of all payment attempts for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              <p className="text-sm text-gray-600">Total Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{safeGetString(user.paymentStatus, 'Unknown')}</p>
              <p className="text-sm text-gray-600">Current Status</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{safeGetString(user.email, 'No email')}</p>
              <p className="text-sm text-gray-600">User Email</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {sortedAttempts.map((attempt, index) => {
              if (!attempt || !attempt.id) {
                return null; // Skip invalid attempts
              }

              const isLatest = index === 0;
              const attemptNumber = attempts.length - index;
              
              return (
                <div 
                  key={attempt.id} 
                  className={`border rounded-lg p-4 ${
                    isLatest ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(attempt.status || 'pending')}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Attempt #{attemptNumber}
                          {isLatest && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                              Current
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
                      {safeGetString(attempt.status, 'pending').charAt(0).toUpperCase() + 
                       safeGetString(attempt.status, 'pending').slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Screenshot */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Screenshot:</p>
                      <div className="flex items-center space-x-2">
                        {attempt.screenshot ? (
                          <>
                            <img 
                              src={attempt.screenshot} 
                              alt={`Payment attempt ${attemptNumber}`}
                              className="w-20 h-20 object-cover border rounded cursor-pointer hover:opacity-80"
                              onClick={() => handleViewImage(
                                attempt.screenshot, 
                                safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)
                              )}
                            />
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
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
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadImage(
                                  attempt.screenshot, 
                                  safeGetString(attempt.screenshotName, `payment-${attemptNumber}.jpg`)
                                )}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-20 h-20 border rounded bg-gray-100">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      {attempt.transactionId && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Transaction ID:</p>
                          <p className="text-sm text-gray-900 font-mono">{attempt.transactionId}</p>
                        </div>
                      )}
                      {attempt.accountTitle && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Account Title:</p>
                          <p className="text-sm text-gray-900">{attempt.accountTitle}</p>
                        </div>
                      )}
                      {attempt.amount && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Amount:</p>
                          <p className="text-sm text-gray-900">
                            {safeGetString(attempt.currency, 'PKR')} {(attempt.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Details */}
                  {(attempt.status === 'rejected' || attempt.status === 'approved') && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            {attempt.status === 'rejected' ? 'Rejection Details:' : 'Approval Details:'}
                          </p>
                          {attempt.rejectionReason && (
                            <p className="text-sm text-gray-600 mt-1">{attempt.rejectionReason}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Reviewed by: {safeGetString(attempt.reviewedBy, 'Finance Manager')} | {' '}
                            {attempt.reviewedAt ? new Date(attempt.reviewedAt).toLocaleString() : 'Unknown time'}
                          </div>
                        </div>
                      </div>
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

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};