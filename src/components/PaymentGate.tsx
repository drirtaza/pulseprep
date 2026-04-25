import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Lock,
  CreditCard,
  MessageCircle,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  BookOpen,
  FileText,
  Heart,
  Scissors,
  Baby
} from 'lucide-react';
import { UserData, PageType } from '../types';

interface PaymentGateProps {
  user: UserData | null;
  children: React.ReactNode;
  onNavigate: (page: PageType) => void;
  featureName?: string;
}

const PaymentGate = ({ user, children, onNavigate, featureName = "Premium Features" }: PaymentGateProps) => {
  // Check if user has access
  const hasAccess = user && user.paymentStatus === 'completed';

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Get theme colors based on specialty
  const getThemeColors = () => {
    if (!user) {
      return {
        primary: 'blue-500',
        primaryText: 'blue-600',
        primaryBg: 'blue-50',
        primaryBorder: 'blue-200',
        gradient: 'from-blue-500 to-indigo-600',
        icon: Lock
      };
    }

    switch (user.specialty) {
      case 'medicine':
        return {
          primary: 'emerald-500',
          primaryText: 'emerald-600',
          primaryBg: 'emerald-50',
          primaryBorder: 'emerald-200',
          gradient: 'from-emerald-500 to-teal-600',
          icon: Heart
        };
      case 'surgery':
        return {
          primary: 'blue-500',
          primaryText: 'blue-600',
          primaryBg: 'blue-50',
          primaryBorder: 'blue-200',
          gradient: 'from-blue-500 to-indigo-600',
          icon: Scissors
        };
      case 'gynae-obs':
        return {
          primary: 'pink-500',
          primaryText: 'pink-600',
          primaryBg: 'pink-50',
          primaryBorder: 'pink-200',
          gradient: 'from-pink-500 to-rose-600',
          icon: Baby
        };
      default:
        return {
          primary: 'blue-500',
          primaryText: 'blue-600',
          primaryBg: 'blue-50',
          primaryBorder: 'blue-200',
          gradient: 'from-blue-500 to-indigo-600',
          icon: Lock
        };
    }
  };

  const themeColors = getThemeColors();

  // Feature icons mapping
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('practice')) return Target;
    if (lowerFeature.includes('mock') || lowerFeature.includes('exam')) return FileText;
    if (lowerFeature.includes('analytics') || lowerFeature.includes('performance')) return BarChart3;
    if (lowerFeature.includes('question') || lowerFeature.includes('bank')) return BookOpen;
    if (lowerFeature.includes('study') || lowerFeature.includes('material')) return BookOpen;
    return Target;
  };

  const FeatureIcon = getFeatureIcon(featureName);

  // Get payment status message
  const getPaymentStatusInfo = () => {
    if (!user) {
      return {
        status: 'No Account',
        message: 'Please log in to access premium features',
        actionText: 'Sign In',
        actionPage: 'login' as PageType,
        alertType: 'info'
      };
    }

    switch (user.paymentStatus) {
      case 'pending':
        return {
          status: 'Payment Pending',
          message: 'Your payment is being verified. This typically takes 24-48 hours.',
          actionText: 'Check Status',
          actionPage: 'final-form' as PageType,
          alertType: 'warning'
        };
      case 'rejected':
        return {
          status: 'Payment Issue',
          message: 'There was an issue with your payment. Please contact support or try again.',
          actionText: 'Contact Support',
          actionPage: 'contact' as PageType,
          alertType: 'error'
        };
      default:
        return {
          status: 'Payment Required',
          message: 'Complete your payment to access all platform features.',
          actionText: 'Complete Payment',
          actionPage: 'final-form' as PageType,
          alertType: 'info'
        };
    }
  };

  const statusInfo = getPaymentStatusInfo();

  const premiumFeatures = [
    {
      icon: Target,
      title: 'Practice Sessions',
      description: 'Unlimited practice questions with detailed explanations'
    },
    {
      icon: FileText,
      title: 'Mock Exams',
      description: 'Full-length practice exams with real-time scoring'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Detailed progress tracking and weak area identification'
    },
    {
      icon: BookOpen,
      title: 'Complete Question Bank',
      description: 'Access to thousands of specialty-specific questions'
    },
    {
      icon: CheckCircle,
      title: 'Study Materials',
      description: 'Comprehensive study guides and reference materials'
    },
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'AI-powered recommendations based on your performance'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-12 h-12 bg-gradient-to-r ${themeColors.gradient} rounded-xl flex items-center justify-center mr-3`}>
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-slate-900">PulsePrep</span>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${themeColors.gradient} rounded-2xl flex items-center justify-center`}>
              <Lock className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-slate-900 mb-2">
              Premium Feature Access Required
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              This feature requires payment verification to access
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Feature Being Accessed */}
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 bg-${themeColors.primaryBg} rounded-xl flex items-center justify-center border border-${themeColors.primaryBorder}`}>
                <FeatureIcon className={`w-8 h-8 text-${themeColors.primaryText}`} />
              </div>
              <h3 className="text-xl text-slate-900 mb-2">You're trying to access:</h3>
              <Badge variant="outline" className={`text-${themeColors.primaryText} border-${themeColors.primaryBorder} bg-${themeColors.primaryBg} px-4 py-2 text-base`}>
                {featureName}
              </Badge>
            </div>

            {/* Payment Status Alert */}
            <Alert className={`
              ${statusInfo.alertType === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
              ${statusInfo.alertType === 'error' ? 'border-red-200 bg-red-50' : ''}
              ${statusInfo.alertType === 'info' ? `border-${themeColors.primaryBorder} bg-${themeColors.primaryBg}` : ''}
            `}>
              {statusInfo.alertType === 'warning' && <Clock className="h-5 w-5 text-yellow-600" />}
              {statusInfo.alertType === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
              {statusInfo.alertType === 'info' && <CreditCard className={`h-5 w-5 text-${themeColors.primaryText}`} />}
              <AlertDescription className={`
                ${statusInfo.alertType === 'warning' ? 'text-yellow-800' : ''}
                ${statusInfo.alertType === 'error' ? 'text-red-800' : ''}
                ${statusInfo.alertType === 'info' ? `text-${themeColors.primaryText}` : ''}
              `}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <strong>{statusInfo.status}</strong>
                    {user && (
                      <Badge className={`
                        ${statusInfo.alertType === 'warning' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-300' : ''}
                        ${statusInfo.alertType === 'error' ? 'bg-red-500/20 text-red-700 border-red-300' : ''}
                        ${statusInfo.alertType === 'info' ? `bg-${themeColors.primary}/20 text-${themeColors.primaryText} border-${themeColors.primaryBorder}` : ''}
                      `}>
                        {user.paymentStatus}
                      </Badge>
                    )}
                  </div>
                  <p>{statusInfo.message}</p>
                </div>
              </AlertDescription>
            </Alert>

            {user && (
              <div className="text-center space-y-2">
                <p className="text-slate-600">
                  Welcome back, <span className="text-slate-900">{user.name}</span>
                </p>
                <p className="text-sm text-slate-500">
                  Specialty: <span className="capitalize">{user.specialty.replace('-', ' & ')}</span>
                </p>
              </div>
            )}

            {/* Premium Features Preview */}
            <div>
              <h4 className="text-lg text-slate-900 mb-4 text-center">What you'll get with premium access:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {premiumFeatures.map((feature, index) => {
                  const FeatureIconComponent = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <FeatureIconComponent className={`w-5 h-5 text-${themeColors.primaryText} mt-0.5`} />
                      <div>
                        <h5 className="text-slate-900 text-sm">{feature.title}</h5>
                        <p className="text-slate-600 text-xs">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={() => onNavigate(statusInfo.actionPage)}
                className={`w-full bg-gradient-to-r ${themeColors.gradient} hover:opacity-90 text-white border-0 h-12`}
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {statusInfo.actionText}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:support@pulseprep.com')}
                  className={`border-${themeColors.primaryBorder} text-${themeColors.primaryText} hover:bg-${themeColors.primaryBg}`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('dashboard')}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className={`p-4 bg-${themeColors.primaryBg} rounded-lg border border-${themeColors.primaryBorder}`}>
              <div className="flex items-start space-x-3">
                <CheckCircle className={`w-5 h-5 text-${themeColors.primaryText} mt-0.5`} />
                <div>
                  <h5 className={`text-${themeColors.primaryText} mb-2`}>Why verify payment?</h5>
                  <ul className="text-slate-600 text-sm space-y-1">
                    <li>• Ensures fair access to premium content</li>
                    <li>• Supports continuous platform development</li>
                    <li>• Provides unlimited access to all features</li>
                    <li>• Includes priority support and updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentGate;