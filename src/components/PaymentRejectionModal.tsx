import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  XCircle, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  User,
  Mail
} from 'lucide-react';

interface PaymentRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRejection: (reason: string) => void;
  userName: string;
  userEmail: string;
  isSubmitting?: boolean;
}

export const PaymentRejectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirmRejection, 
  
  userName, 
  userEmail,
  isSubmitting = false 
}: PaymentRejectionModalProps) => {
  const [reason, setReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');

  const presetReasons = [
    'Screenshot is unclear or blurry',
    'Payment amount not visible clearly',
    'Transaction details not readable',
    'Wrong payment amount submitted',
    'Invalid or fake screenshot',
    'Bank account details not matching',
    'Transaction date outside acceptable range',
    'Duplicate payment screenshot from another user'
  ];

  const handlePresetSelect = (presetReason: string) => {
    setSelectedPresetReason(presetReason);
    setReason(presetReason);
  };

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirmRejection(reason.trim());
    }
  };

  const handleCancel = () => {
    setReason('');
    setSelectedPresetReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span>Reject Payment</span>
          </DialogTitle>
          <DialogDescription>
            Please provide a clear reason for rejecting this payment. This will help the user understand what needs to be corrected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Payment Details:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">User:</span>
                <span className="text-gray-900">{userName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> The user will receive an email notification with this rejection reason. 
              Please be specific and helpful so they can correct the issue and resubmit.
            </AlertDescription>
          </Alert>

          {/* Preset Reasons */}
          <div>
            <Label className="text-base font-medium text-gray-900 mb-3 block">
              Quick Rejection Reasons:
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presetReasons.map((presetReason, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(presetReason)}
                  disabled={isSubmitting}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedPresetReason === presetReason
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{presetReason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div>
            <Label htmlFor="reason" className="text-base font-medium text-gray-900 mb-2 block">
              Rejection Reason: *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a specific reason for rejecting this payment..."
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters. Be specific to help the user correct the issue.
            </p>
          </div>

          {/* Character Count */}
          <div className="text-right">
            <span className={`text-xs ${
              reason.length < 10 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {reason.length} characters {reason.length < 10 && '(minimum 10 required)'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={reason.trim().length < 10 || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Good rejection reasons include:</p>
                <ul className="text-xs space-y-1">
                  <li>• Specific issues with the screenshot (blurry, cut off, etc.)</li>
                  <li>• Missing or incorrect payment information</li>
                  <li>• Amount discrepancies or validation issues</li>
                  <li>• Technical problems with the uploaded image</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};