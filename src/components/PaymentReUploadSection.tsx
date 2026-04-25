import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Loader2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { UserData } from '../types';
import { getPaymentSettings } from '../utils/paymentSettings';
import { 
  addPaymentAttempt, 
  getPaymentAttemptCount, 
  migratePaymentDetailsToAttempts 
} from '../utils/paymentAttemptsUtils';

interface PaymentReUploadSectionProps {
  user: UserData;
  onReUploadComplete: (updatedUser: UserData) => void;
}

export const PaymentReUploadSection = ({ user, onReUploadComplete }: PaymentReUploadSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const paymentSettings = getPaymentSettings();
  const attemptCount = getPaymentAttemptCount(user as any);
  const nextAttemptNumber = attemptCount + 1;

  // Only show if payment is rejected
  if (user.paymentStatus !== 'rejected') {
    return null;
  }

  // FIXED: Get original payment amount from user's first attempt or payment details
  const getOriginalPaymentAmount = () => {
    // First, try to get from existing payment attempts
    const userWithAttempts = migratePaymentDetailsToAttempts(user);
    if (userWithAttempts.paymentAttempts && userWithAttempts.paymentAttempts.length > 0) {
      const firstAttempt = userWithAttempts.paymentAttempts[0];
      if (firstAttempt.amount && firstAttempt.currency) {
        return {
          amount: firstAttempt.amount,
          currency: firstAttempt.currency
        };
      }
    }
    
    // Fallback to old payment details format
    if (user.paymentDetails?.amount && user.paymentDetails?.currency) {
      return {
        amount: user.paymentDetails.amount,
        currency: user.paymentDetails.currency
      };
    }
    
    // Last resort: use current payment settings (for very old users)
    return {
      amount: paymentSettings?.paymentAmount || 7000,
      currency: paymentSettings?.currency || 'PKR'
    };
  };

  const originalPayment = getOriginalPaymentAmount();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Use same validation as PaymentPage
    const maxSize = (paymentSettings?.uploadRequirements?.maxFileSize || 5) * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${paymentSettings?.uploadRequirements?.maxFileSize || 5}MB`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentScreenshot(e.target?.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentScreenshot) {
      alert('Please upload your payment screenshot');
      return;
    }

    setIsSubmitting(true);

    try {
      // FIXED: Create new payment attempt with ORIGINAL payment amount
      const newAttempt = {
        screenshot: paymentScreenshot,
        screenshotName: `payment_attempt_${nextAttemptNumber}_${Date.now()}.jpg`,
        screenshotType: paymentScreenshot.split(',')[0],
        transactionId: transactionId.trim() || undefined,
        accountTitle: accountTitle.trim() || undefined,
        // FIXED: Use original payment amount that user actually paid
        amount: originalPayment.amount,
        currency: originalPayment.currency,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const
      };

      console.log('💰 Re-upload preserving original payment:', {
        originalAmount: originalPayment.amount,
        originalCurrency: originalPayment.currency,
        currentSettingsAmount: paymentSettings?.paymentAmount,
        currentSettingsCurrency: paymentSettings?.currency,
        userId: user.id
      });

      // Add attempt to user data
      const userWithAttempts = addPaymentAttempt(user as any, newAttempt);
      
      // Update user status to pending
      const updatedUser = {
        ...userWithAttempts,
        paymentStatus: 'pending' as const
      };

      // Update localStorage
      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
      if (userIndex > -1) {
        allUsers[userIndex] = updatedUser;
        localStorage.setItem('all_users', JSON.stringify(allUsers));
      }

      // Update current user storage
      localStorage.setItem('pulseprep_user_pending', JSON.stringify(updatedUser));

      // Notify parent component
      onReUploadComplete(updatedUser);

      // Reset form
      setPaymentScreenshot(null);
      setTransactionId('');
      setAccountTitle('');
      setIsExpanded(false);

    } catch (error) {
      console.error('Error re-uploading payment:', error);
      alert('Error uploading payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-yellow-800 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Upload Different Screenshot
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Attempt #{nextAttemptNumber} - Upload a clearer payment screenshot
            </CardDescription>
            <p className="text-xs mt-1 text-yellow-600">
              Original payment: {originalPayment.currency} {originalPayment.amount.toLocaleString()}
            </p>
          </div>
          <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
            {attemptCount} previous attempts
          </Badge>
        </div>
      </CardHeader>
      
      {!isExpanded ? (
        <CardContent>
          <Button
            onClick={() => setIsExpanded(true)}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Screenshot
          </Button>
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
          {/* Payment Amount Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Payment Amount:</strong> Your original payment of {originalPayment.currency} {originalPayment.amount.toLocaleString()} will be preserved.
              {paymentSettings && (originalPayment.amount !== paymentSettings.paymentAmount) && (
                <span className="block text-xs mt-1">
                  (Current rate: {paymentSettings.currency} {paymentSettings.paymentAmount.toLocaleString()})
                </span>
              )}
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <Label className="text-yellow-800 font-medium">
                Payment Screenshot *
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="border-yellow-300 focus:ring-yellow-500"
                disabled={uploading || isSubmitting}
                required
              />
              {uploading && (
                <div className="flex items-center mt-2 text-yellow-700">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
              {paymentScreenshot && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 mb-2">✅ Screenshot uploaded successfully</p>
                  <img 
                    src={paymentScreenshot} 
                    alt="Payment screenshot" 
                    className="max-w-xs h-auto border rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Transaction ID */}
            {paymentSettings?.uploadRequirements?.requireTransactionId && (
              <div>
                <Label className="text-yellow-800 font-medium">
                  Transaction ID {paymentSettings.uploadRequirements.requireTransactionId ? '*' : ''}
                </Label>
                <Input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="border-yellow-300 focus:ring-yellow-500"
                  placeholder="Enter transaction ID"
                  disabled={isSubmitting}
                  required={paymentSettings.uploadRequirements.requireTransactionId}
                />
              </div>
            )}

            {/* Account Title */}
            {paymentSettings?.uploadRequirements?.requireAccountTitle && (
              <div>
                <Label className="text-yellow-800 font-medium">
                  Account Title {paymentSettings.uploadRequirements.requireAccountTitle ? '*' : ''}
                </Label>
                <Input
                  type="text"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="border-yellow-300 focus:ring-yellow-500"
                  placeholder="Enter account title used"
                  disabled={isSubmitting}
                  required={paymentSettings.uploadRequirements.requireAccountTitle}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={!paymentScreenshot || isSubmitting}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Attempt #{nextAttemptNumber}
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                disabled={isSubmitting}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
};