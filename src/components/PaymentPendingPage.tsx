import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Clock,
  User,
  Mail,
  Phone,
  Upload,
  MessageCircle,
  LogOut,
  CheckCircle,
  AlertCircle,
  Activity,
  Heart,
  Scissors,
  Baby,
  GraduationCap,
  Calendar,
  CreditCard,
  IdCard
} from 'lucide-react';
import { PageType, UserData } from '../types';
import { getPaymentSettings } from '../utils/paymentSettings';
import { PaymentReUploadSection } from './PaymentReUploadSection';
import { useState, useEffect } from 'react';

interface PaymentPendingPageProps {
  onNavigate: (page: PageType) => void;
  user: UserData;
  onReUploadPayment?: () => void;
}

const PaymentPendingPage = ({ onNavigate, user, onReUploadPayment }: PaymentPendingPageProps) => {
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [userData, setUserData] = useState<UserData>(user);

  // Load payment settings to get the correct amount
  useEffect(() => {
    const settings = getPaymentSettings();
    setPaymentSettings(settings);
  }, []);

  // Get theme colors based on specialty
  const getThemeColors = () => {
    switch (userData.specialty) {
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
          icon: Heart
        };
    }
  };

  const themeColors = getThemeColors();
  const SpecialtyIcon = themeColors.icon;

  const specialtyNames = {
    medicine: 'Internal Medicine',
    surgery: 'General Surgery',
    'gynae-obs': 'Gynecology & Obstetrics'
  };

  // Update user data when prop changes
  useEffect(() => {
    setUserData(user);
  }, [user]);

  // Update user data from localStorage when page loads (to catch status changes)
  useEffect(() => {
    const currentUser = localStorage.getItem('pulseprep_user_pending');
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear user data and navigate to home
    localStorage.removeItem('pulseprep_user');
    localStorage.removeItem('pulseprep_auth');
    localStorage.removeItem('pulseprep_user_pending');
    onNavigate('home');
  };

  const handleReUpload = () => {
    if (onReUploadPayment) {
      onReUploadPayment();
    }
  };

  const contactOptions = [
    {
      type: 'email',
      label: 'Email Support',
      value: 'support@pulseprep.com',
      icon: Mail,
      description: 'Get help via email'
    },
    {
      type: 'whatsapp',
      label: 'WhatsApp',
      value: '+92-300-1234567',
      icon: MessageCircle,
      description: 'Quick chat support'
    },
    {
      type: 'hours',
      label: 'Office Hours',
      value: 'Monday-Friday, 9 AM - 6 PM',
      icon: Clock,
      description: 'Support availability'
    }
  ];

  const nextSteps = [
    {
      step: 1,
      title: "We're reviewing your payment screenshot",
      description: "Our finance team is verifying your transaction details",
      status: userData.paymentStatus === 'rejected' ? 'pending' : 'in-progress'
    },
    {
      step: 2,
      title: "Our finance team will verify the transaction",
      description: "This includes checking the amount, transaction ID, and bank details",
      status: userData.paymentStatus === 'completed' ? 'completed' : 'pending'
    },
    {
      step: 3,
      title: "You'll receive email confirmation when approved",
      description: "We'll send you an email notification once everything is verified",
      status: userData.paymentStatus === 'completed' ? 'completed' : 'pending'
    },
    {
      step: 4,
      title: "All features will be activated immediately",
      description: "You'll get instant access to practice questions, mock exams, and analytics",
      status: userData.paymentStatus === 'completed' ? 'completed' : 'pending'
    },
    {
      step: 5,
      title: "You can start practicing right after approval",
      description: "Begin your medical exam preparation journey with full platform access",
      status: userData.paymentStatus === 'completed' ? 'completed' : 'pending'
    }
  ];

  // Get the payment amount from user's payment details or admin settings
  const getPaymentAmount = () => {
    if (userData.paymentDetails?.amount && userData.paymentDetails?.currency) {
      return `${userData.paymentDetails.currency} ${userData.paymentDetails.amount.toLocaleString()}`;
    } else if (paymentSettings) {
      return `${paymentSettings.currency} ${paymentSettings.paymentAmount.toLocaleString()}`;
    } else {
      return 'Loading...';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${themeColors.gradient} rounded-lg flex items-center justify-center`}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-slate-900">PulsePrep</h1>
              <p className="text-slate-600 text-sm">Payment Verification</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Dynamic Status Banner */}
        <Alert className={`mb-8 ${
          userData.paymentStatus === 'rejected' 
            ? 'border-red-200 bg-red-50' 
            : userData.paymentStatus === 'completed' 
            ? 'border-green-200 bg-green-50'
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          {userData.paymentStatus === 'rejected' ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : userData.paymentStatus === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-600" />
          )}
          <AlertDescription className={
            userData.paymentStatus === 'rejected' 
              ? 'text-red-800' 
              : userData.paymentStatus === 'completed' 
              ? 'text-green-800'
              : 'text-yellow-800'
          }>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <strong>
                  {userData.paymentStatus === 'rejected' 
                    ? 'Payment Rejected' 
                    : userData.paymentStatus === 'completed' 
                    ? 'Payment Approved'
                    : 'Payment Verification Pending'}
                </strong>
                <Badge className={
                  userData.paymentStatus === 'rejected' 
                    ? 'bg-red-500/20 text-red-700 border-red-300' 
                    : userData.paymentStatus === 'completed' 
                    ? 'bg-green-500/20 text-green-700 border-green-300'
                    : 'bg-yellow-500/20 text-yellow-700 border-yellow-300'
                }>
                  {userData.paymentStatus === 'rejected' 
                    ? 'Rejected' 
                    : userData.paymentStatus === 'completed' 
                    ? 'Approved'
                    : 'In Review'}
                </Badge>
              </div>
              <p className="text-sm">
                {userData.paymentStatus === 'rejected' 
                  ? 'Your payment was rejected. Please upload a new screenshot below.' 
                  : userData.paymentStatus === 'completed' 
                  ? 'Your payment has been approved! You can now access all features.'
                  : 'Your payment is being reviewed by our team. This typically takes 24-48 hours. You\'ll receive email confirmation once approved.'}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>
                  Your submitted registration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Full Name</p>
                      <p className="text-slate-900">{userData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="text-slate-900">{userData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <SpecialtyIcon className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Specialty</p>
                      <p className="text-slate-900">{specialtyNames[userData.specialty as keyof typeof specialtyNames]}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Study Mode</p>
                      <p className="text-slate-900 capitalize">{userData.studyMode || 'Regular'}</p>
                    </div>
                  </div>
                  {userData.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="text-slate-900">{userData.phone}</p>
                      </div>
                    </div>
                  )}
                  {userData.cnic && (
                    <div className="flex items-center space-x-3">
                      <IdCard className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">CNIC</p>
                        <p className="text-slate-900">{userData.cnic}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
                <CardDescription>
                  Details of your submitted payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Amount Paid</p>
                    <p className="text-slate-900 text-lg font-semibold">{getPaymentAmount()}</p>
                    {paymentSettings && (
                      <p className="text-xs text-slate-500 mt-1">
                        Official registration fee as set by administration
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Payment Status</p>
                    <Badge className={
                      userData.paymentStatus === 'rejected' 
                        ? 'bg-red-500/20 text-red-700 border-red-300' 
                        : userData.paymentStatus === 'completed' 
                        ? 'bg-green-500/20 text-green-700 border-green-300'
                        : 'bg-yellow-500/20 text-yellow-700 border-yellow-300'
                    }>
                      {userData.paymentStatus === 'rejected' 
                        ? 'Rejected' 
                        : userData.paymentStatus === 'completed' 
                        ? 'Approved'
                        : 'Pending Verification'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Submission Date</p>
                    <p className="text-slate-900">{new Date(userData.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Screenshot</p>
                    <p className="text-slate-900">Uploaded Successfully</p>
                  </div>
                  {userData.paymentDetails?.transactionId && (
                    <div>
                      <p className="text-sm text-slate-500">Transaction ID</p>
                      <p className="text-slate-900 font-mono">{userData.paymentDetails.transactionId}</p>
                    </div>
                  )}
                  {userData.paymentDetails?.accountTitle && (
                    <div>
                      <p className="text-sm text-slate-500">Account Title Used</p>
                      <p className="text-slate-900">{userData.paymentDetails.accountTitle}</p>
                    </div>
                  )}
                </div>

                {/* Re-upload Option - Only show for pending/approved status */}
                {userData.paymentStatus !== 'rejected' && (
                  <div className={`mt-6 p-4 rounded-lg border ${
                    userData.specialty === 'medicine' ? 'bg-emerald-50 border-emerald-200' :
                    userData.specialty === 'surgery' ? 'bg-blue-50 border-blue-200' :
                    userData.specialty === 'gynae-obs' ? 'bg-pink-50 border-pink-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Upload className={`w-5 h-5 mt-0.5 ${
                        userData.specialty === 'medicine' ? 'text-emerald-600' :
                        userData.specialty === 'surgery' ? 'text-blue-600' :
                        userData.specialty === 'gynae-obs' ? 'text-pink-600' :
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <h4 className={`mb-2 ${
                          userData.specialty === 'medicine' ? 'text-emerald-600' :
                          userData.specialty === 'surgery' ? 'text-blue-600' :
                          userData.specialty === 'gynae-obs' ? 'text-pink-600' :
                          'text-blue-600'
                        }`}>Need to upload a different screenshot?</h4>
                        <p className="text-slate-600 text-sm mb-3">
                          If there was an issue with your original upload or you need to submit a different payment screenshot, you can upload a new one.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReUpload}
                          className={`${
                            userData.specialty === 'medicine' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' :
                            userData.specialty === 'surgery' ? 'border-blue-200 text-blue-600 hover:bg-blue-50' :
                            userData.specialty === 'gynae-obs' ? 'border-pink-200 text-pink-600 hover:bg-pink-50' :
                            'border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Different Screenshot
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Re-upload Section for Rejected Payments */}
            <div className="space-y-6">
              <PaymentReUploadSection 
                user={userData}
                onReUploadComplete={(updatedUser) => {
                  // Update user state to reflect new pending status
                  setUserData(updatedUser);
                  // Show success message
                  alert('Payment screenshot uploaded successfully! Your payment is now under review.');
                }}
              />
            </div>

            {/* What's Next Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>What's Next</span>
                </CardTitle>
                <CardDescription>
                  Step-by-step verification process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nextSteps.map((step, _index) => (
                    <div key={step.step} className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step.status === 'in-progress' 
                          ? `${
                            userData.specialty === 'medicine' ? 'bg-emerald-500' :
                            userData.specialty === 'surgery' ? 'bg-blue-500' :
                            userData.specialty === 'gynae-obs' ? 'bg-pink-500' :
                            'bg-blue-500'
                          } text-white` 
                          : step.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : step.status === 'in-progress' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          step.step
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-900 mb-1">{step.title}</h4>
                        <p className="text-slate-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Expected Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Expected Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {userData.paymentStatus === 'completed' ? '✓' : 
                     userData.paymentStatus === 'rejected' ? '24-48' : '24-48'}
                  </div>
                  <div className="text-slate-600">
                    {userData.paymentStatus === 'completed' ? 'Completed' : 'Hours'}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    {userData.paymentStatus === 'completed' ? 'Payment approved' :
                     userData.paymentStatus === 'rejected' ? 'Upload new screenshot' :
                     'Typical verification time'}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted:</span>
                      <span className="text-slate-900">{new Date(userData.registrationDate).toLocaleDateString()}</span>
                    </div>
                    {userData.paymentStatus === 'pending' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expected by:</span>
                        <span className="text-slate-900">
                          {new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Summary */}
            {paymentSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Registration Fee:</span>
                    <span className="text-slate-900 font-semibold">
                      {paymentSettings.currency} {paymentSettings.paymentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Payment Method:</span>
                    <span className="text-slate-900">Bank Transfer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Verification:</span>
                    <Badge className={
                      userData.paymentStatus === 'rejected' 
                        ? 'bg-red-100 text-red-800 text-xs' 
                        : userData.paymentStatus === 'completed' 
                        ? 'bg-green-100 text-green-800 text-xs'
                        : 'bg-yellow-100 text-yellow-800 text-xs'
                    }>
                      {userData.paymentStatus === 'rejected' 
                        ? 'Rejected' 
                        : userData.paymentStatus === 'completed' 
                        ? 'Approved'
                        : 'In Progress'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>
                  Need help? Get in touch with us
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactOptions.map((contact, index) => {
                  const IconComponent = contact.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <IconComponent className="w-4 h-4 text-slate-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">{contact.label}</p>
                        <p className={`text-sm ${
                          userData.specialty === 'medicine' ? 'text-emerald-600' :
                          userData.specialty === 'surgery' ? 'text-blue-600' :
                          userData.specialty === 'gynae-obs' ? 'text-pink-600' :
                          'text-blue-600'
                        }`}>{contact.value}</p>
                        <p className="text-slate-500 text-xs">{contact.description}</p>
                      </div>
                    </div>
                  );
                })}

                <div className={`mt-4 p-3 rounded-lg border ${
                  userData.specialty === 'medicine' ? 'bg-emerald-50 border-emerald-200' :
                  userData.specialty === 'surgery' ? 'bg-blue-50 border-blue-200' :
                  userData.specialty === 'gynae-obs' ? 'bg-pink-50 border-pink-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <AlertCircle className={`w-4 h-4 mt-0.5 ${
                      userData.specialty === 'medicine' ? 'text-emerald-600' :
                      userData.specialty === 'surgery' ? 'text-blue-600' :
                      userData.specialty === 'gynae-obs' ? 'text-pink-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className={`text-sm mb-1 ${
                        userData.specialty === 'medicine' ? 'text-emerald-600' :
                        userData.specialty === 'surgery' ? 'text-blue-600' :
                        userData.specialty === 'gynae-obs' ? 'text-pink-600' :
                        'text-blue-600'
                      }`}>Having issues?</p>
                      <p className="text-slate-600 text-xs">
                        {userData.paymentStatus === 'rejected' 
                          ? 'If you need help with uploading a new screenshot, please contact our support team.'
                          : 'If your payment hasn\'t been verified within 48 hours, please contact our support team.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('mailto:support@pulseprep.com')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://wa.me/923001234567')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Chat
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPendingPage;