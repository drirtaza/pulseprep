import React, { useState } from 'react';
import { Check, User, Mail, Phone, CreditCard, BookOpen, Clock, ArrowRight, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { FinalFormPageProps, SpecialtyType, StudyModeType } from '../types';

const FinalFormPage: React.FC<FinalFormPageProps> = ({
  onSignUpComplete,
  formData,
  onNavigate,
  
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);

  const handleFinalSubmit = async () => {
    if (!formData) {
      setError('Registration data is missing. Please start the registration process again.');
      return;
    }

    // Enhanced email verification validation
    if (!formData.emailVerified) {
      setEmailVerificationError('Email verification is required to complete registration. Please verify your email first.');
      return;
    }

    if (formData.emailVerificationStatus !== 'verified') {
      setEmailVerificationError(`Email verification status is invalid: ${formData.emailVerificationStatus}. Please complete the verification process.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setEmailVerificationError(null);

    try {
      await onSignUpComplete(formData);
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
      console.error('Registration completion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmailVerificationStatusDisplay = () => {
    if (!formData?.emailVerified) {
      return {
        status: 'Not Verified',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }

    switch (formData?.emailVerificationStatus) {
      case 'verified':
        return {
          status: 'Verified',
          color: 'text-green-600',
          bgColor: 'bg-green-500',
          icon: <Check className="h-4 w-4" />
        };
      case 'expired':
        return {
          status: 'Expired',
          color: 'text-amber-600',
          bgColor: 'bg-amber-500',
          icon: <Clock className="h-4 w-4" />
        };
      case 'failed':
        return {
          status: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-500',
          icon: <AlertCircle className="h-4 w-4" />
        };
      case 'pending':
      case 'sent':
        return {
          status: 'Pending',
          color: 'text-amber-600',
          bgColor: 'bg-amber-500',
          icon: <RefreshCw className="h-4 w-4 animate-spin" />
        };
      default:
        return {
          status: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-500',
          icon: <AlertCircle className="h-4 w-4" />
        };
    }
  };

  const getEmailVerificationDetails = () => {
    const details = [];
    
    if (formData?.emailVerificationAttempts) {
      details.push(`Attempts: ${formData.emailVerificationAttempts}`);
    }
    
    if (formData?.emailVerificationLastAttemptAt) {
      details.push(`Last Attempt: ${new Date(formData.emailVerificationLastAttemptAt).toLocaleString()}`);
    }
    
    if (formData?.emailVerificationEmailId) {
      details.push(`Email ID: ${formData.emailVerificationEmailId}`);
    }
    
    if (formData?.emailVerificationDeliveryStatus) {
      details.push(`Delivery: ${formData.emailVerificationDeliveryStatus}`);
    }
    
    return details;
  };

  const getSpecialtyDisplayName = (specialty: SpecialtyType): string => {
    const specialtyNames = {
      'medicine': 'Internal Medicine',
      'surgery': 'Surgery',
      'gynae-obs': 'Gynecology & Obstetrics'
    };
    return specialtyNames[specialty] || specialty;
  };

  const getStudyModeDisplayName = (studyMode: StudyModeType): string => {
    const studyModeNames = {
      'regular': 'Regular Study',
      'intensive': 'Intensive Study',
      'weekend': 'Weekend Study',
      'guided': 'Guided Study'
    };
    return studyModeNames[studyMode] || studyMode;
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Registration Data Missing
            </h2>
            <p className="text-gray-600 mb-4">
              We couldn't find your registration information. Please start the registration process again.
            </p>
            <Button 
              onClick={() => onNavigate?.('signup')}
              className="w-full"
            >
              Start Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Registration
          </h1>
          <p className="text-gray-600">
            Review your information and finalize your account setup
          </p>
        </div>

        {/* Registration Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registration Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="font-medium">{formData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">CNIC:</span>
                  <span className="font-medium">{formData.cnic}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Academic Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Specialty:</span>
                  <Badge variant="secondary">
                    {getSpecialtyDisplayName(formData.specialty)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Study Mode:</span>
                  <Badge variant="outline">
                    {getStudyModeDisplayName(formData.studyMode)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Verification Status */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Verification Status</h3>
              <div className="space-y-4">
                {/* Email Verification Status */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getEmailVerificationStatusDisplay().bgColor}`} />
                    <div>
                      <span className="text-sm font-medium">Email Verification</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getEmailVerificationStatusDisplay().icon}
                        <span className={`text-sm font-medium ${getEmailVerificationStatusDisplay().color}`}>
                          {getEmailVerificationStatusDisplay().status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {formData?.emailVerified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Email Verification Details */}
                {getEmailVerificationDetails().length > 0 && (
                  <div className="text-xs text-gray-500 space-y-1">
                    {getEmailVerificationDetails().map((detail, index) => (
                      <div key={index}>{detail}</div>
                    ))}
                  </div>
                )}

                {/* Payment Verification Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData?.paymentVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-sm">
                    Payment Verification: 
                    <span className={`font-medium ml-1 ${formData?.paymentVerified ? 'text-green-600' : 'text-amber-600'}`}>
                      {formData?.paymentVerified ? 'Verified' : 'Pending'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Verification Error Display */}
        {emailVerificationError && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {emailVerificationError}
            </AlertDescription>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate?.('email-verification')}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Go to Email Verification
              </Button>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onNavigate?.('payment')}
            className="flex-1"
          >
            Back to Payment
          </Button>
          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Completing Registration...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Complete Registration
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>

        {/* Terms Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By completing your registration, you agree to our{' '}
            <button 
              onClick={() => onNavigate?.('about')}
              className="text-blue-600 hover:underline"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button 
              onClick={() => onNavigate?.('about')}
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinalFormPage;