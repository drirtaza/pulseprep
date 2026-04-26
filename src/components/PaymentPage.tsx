import React, { useState, useEffect } from 'react';
import { SignUpFormData, PageType, PaymentDetails } from '../types';
import { getPaymentSettings, ExtendedPaymentSettings, getCurrentPaymentAmount } from '../utils/paymentSettings';
import { uploadPaymentScreenshotDataUrl } from '../lib/uploadPaymentScreenshot';
import { getSubscriptionSettings } from '../utils/subscriptionUtils';

interface PaymentPageProps {
  onNavigate: (page: PageType) => void;
  onStepComplete: (data: Partial<SignUpFormData>, nextPage: PageType) => void;
  formData: SignUpFormData | null;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onNavigate, onStepComplete, formData }) => {
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [phone, setPhone] = useState(formData?.phone || '');
  const [cnic, setCnic] = useState(formData?.cnic || '');
  const [uploading, setUploading] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<ExtendedPaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [subscriptionSettings, setSubscriptionSettings] = useState(getSubscriptionSettings());
  const [showManualCopyModal, setShowManualCopyModal] = useState(false);
  const [manualCopyData, setManualCopyData] = useState<{text: string, label: string}>({text: '', label: ''});

  // Safe function to get default subscription plan with payment settings integration
  const getSafeDefaultSubscriptionPlan = () => {
    try {
      // Get current payment amount from payment settings
      const currentPayment = getCurrentPaymentAmount();
      
      // Use state instead of calling getDefaultSubscriptionPlan() directly
      const defaultPlan = subscriptionSettings.plans.find(p => p.isDefault) || 
                         subscriptionSettings.plans.find(p => p.id === subscriptionSettings.defaultPlanId) || 
                         subscriptionSettings.plans[0];
      
      if (defaultPlan) {
        return {
          ...defaultPlan,
          price: currentPayment.amount,
          currency: currentPayment.currency
        };
      }
      
      // Static fallback if no plans found
      return {
        id: 'plan-3month',
        name: '3-Month FCPS Preparation', // FIXED: Static text, no recursion
        duration: 3,
        price: currentPayment.amount,
        currency: currentPayment.currency,
        description: 'Complete 3-month access to your chosen specialty' // FIXED: Static text
      };
    } catch (error) {
      console.error('❌ Error getting default subscription plan:', error);
      return {
        id: 'plan-3month',
        name: '3-Month FCPS Preparation', // FIXED: Static fallback
        duration: 3,
        price: 7000,
        currency: 'PKR',
        description: 'Complete 3-month access to your chosen specialty' // FIXED: Static fallback
      };
    }
  };

  // Load payment settings and subscription plan on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('💰 Loading payment settings...');
        
        // Load payment settings
        const settings = getPaymentSettings();
        
        // Load subscription settings
        const subSettings = getSubscriptionSettings();
        setSubscriptionSettings(subSettings);
        
        // Add defensive check for bankAccounts
        if (!settings.bankAccounts || !Array.isArray(settings.bankAccounts)) {
          console.error('❌ Invalid payment settings: bankAccounts is missing or not an array');
          console.log('🔧 Attempting to reinitialize payment settings...');
          
          // Force reinitialize payment settings
          localStorage.removeItem('pulseprep_payment_settings');
          const reinitializedSettings = getPaymentSettings();
          setPaymentSettings(reinitializedSettings);
        } else {
          setPaymentSettings(settings);
        }
        
        // Load subscription plan safely
        const plan = getSafeDefaultSubscriptionPlan();
        setSubscriptionPlan(plan);
        
        console.log('💰 Payment page loaded with settings:', {
          totalBankAccounts: settings.bankAccounts?.length || 0,
          activeBankAccounts: settings.bankAccounts?.filter((b: any) => b.isActive).length || 0,
          defaultAccount: settings.bankAccounts?.find(b => b.isDefault)?.bankName || 'None',
          hasValidSettings: !!(settings.bankAccounts && Array.isArray(settings.bankAccounts)),
          subscriptionPlan: plan,
          subscriptionSettings: subSettings
        });
        
        // Add storage event listener for real-time updates
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'pulseprep_payment_settings') {
            console.log('💰 Payment settings changed, reloading...');
            const newSettings = getPaymentSettings();
            setPaymentSettings(newSettings);
            const updatedPlan = getSafeDefaultSubscriptionPlan();
            setSubscriptionPlan(updatedPlan);
          }
          
          if (e.key === 'pulseprep_subscription_settings') {
            console.log('📋 Subscription settings changed, reloading...');
            const newSubSettings = getSubscriptionSettings();
            setSubscriptionSettings(newSubSettings);
            const updatedPlan = getSafeDefaultSubscriptionPlan();
            setSubscriptionPlan(updatedPlan);
          }
        };

        window.addEventListener('storage', handleStorageChange);

        // Store cleanup function
        (window as any).paymentPageCleanup = () => {
          window.removeEventListener('storage', handleStorageChange);
        };
        
      } catch (error) {
        console.error('❌ Error loading payment settings:', error);
        // Force reinitialize if there's an error
        try {
          localStorage.removeItem('pulseprep_payment_settings');
          const fallbackSettings = getPaymentSettings();
          setPaymentSettings(fallbackSettings);
          
          // Set fallback plan
          const fallbackPlan = getSafeDefaultSubscriptionPlan();
          setSubscriptionPlan(fallbackPlan);
          
          console.log('✅ Fallback payment settings loaded');
        } catch (fallbackError) {
          console.error('❌ Failed to load fallback settings:', fallbackError);
          // Set absolute fallback
          setSubscriptionPlan({
            id: 'plan-3month',
            name: '3-Month FCPS Preparation', // FIXED: Static text, no recursion
            duration: 3,
            price: 7000,
            currency: 'PKR',
            description: 'Complete 3-month access to your chosen specialty' // FIXED: Static text
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
    
    // Cleanup on unmount
    return () => {
      if ((window as any).paymentPageCleanup) {
        (window as any).paymentPageCleanup();
      }
    };
  }, []);

  const validateFileUpload = (file: File): string | null => {
    if (!paymentSettings) return "Payment settings not loaded";
    
    // Default upload requirements if not specified in new structure
    // Cap 2.5MB so base64 + JSON fits serverless request limits; server enforces the same
    const uploadRequirements = {
      maxFileSize: 2.5,
      acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      requireTransactionId: false,
      requireAccountTitle: false
    };
    
    // Check file size
    const maxSize = uploadRequirements.maxFileSize * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      return `File size must be less than ${uploadRequirements.maxFileSize}MB`;
    }
    
    // Check file format
    if (!uploadRequirements.acceptedFormats.includes(file.type)) {
      return `File format not supported. Allowed formats: ${uploadRequirements.acceptedFormats.join(', ')}`;
    }
    
    return null;
  };

  const validatePhone = (phoneNumber: string): boolean => {
    // Pakistani phone number validation
    const phoneRegex = /^(\+92|92|0)?[0-9]{10}$/;
    return phoneRegex.test(phoneNumber.replace(/[-\s]/g, ''));
  };

  const validateCNIC = (cnicNumber: string): boolean => {
    // Pakistani CNIC validation (format: 12345-6789012-3)
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
    return cnicRegex.test(cnicNumber);
  };

  const formatPhone = (value: string): string => {
    // Auto-format Pakistani phone numbers
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('92')) {
      return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 12)}`;
    } else if (digits.startsWith('0')) {
      return `+92-${digits.slice(1, 4)}-${digits.slice(4, 11)}`;
    } else if (digits.length <= 10) {
      return digits.replace(/(\d{3})(\d{7})/, '+92-$1-$2');
    }
    return value;
  };

  const formatCNIC = (value: string): string => {
    // Auto-format CNIC (12345-6789012-3)
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNIC(e.target.value);
    setCnic(formatted);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFileUpload(file);
    if (validationError) {
      alert(validationError);
      event.target.value = ''; // Clear the input
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPaymentScreenshot(result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Enhanced clipboard function with multiple fallback methods
  const copyToClipboard = async (text: string, label: string, buttonElement?: HTMLButtonElement) => {
    try {
      // Method 1: Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log(`✅ ${label} copied to clipboard using Clipboard API`);
        showCopySuccess(buttonElement, label);
        return;
      }
    } catch (clipboardError) {
      console.warn(`⚠️ Clipboard API failed for ${label}:`, clipboardError);
    }

    try {
      // Method 2: Try legacy execCommand method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log(`✅ ${label} copied to clipboard using execCommand`);
        showCopySuccess(buttonElement, label);
        return;
      }
    } catch (execError) {
      console.warn(`⚠️ execCommand failed for ${label}:`, execError);
    }

    // Method 3: Show manual copy modal as last resort
    console.log(`📋 Showing manual copy modal for ${label}`);
    setManualCopyData({ text, label });
    setShowManualCopyModal(true);
  };

  const showCopySuccess = (buttonElement?: HTMLButtonElement, _label?: string) => {
    if (buttonElement) {
      const original = buttonElement.textContent;
      buttonElement.textContent = '✅ Copied!';
      buttonElement.style.backgroundColor = '#10b981';
      setTimeout(() => {
        buttonElement.textContent = original;
        buttonElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentScreenshot) {
      alert('Please upload your payment screenshot');
      return;
    }

    const signupEmail = (formData?.email || '').trim();
    if (!signupEmail) {
      alert('Missing email. Please go back and complete the previous steps.');
      return;
    }
    
    // Validate phone number
    if (!phone.trim()) {
      alert('Please enter your mobile number');
      return;
    }

    if (!validatePhone(phone)) {
      alert('Please enter a valid Pakistani mobile number (e.g., +92-300-1234567)');
      return;
    }

    // Validate CNIC
    if (!cnic.trim()) {
      alert('Please enter your CNIC number');
      return;
    }

    if (!validateCNIC(cnic)) {
      alert('Please enter a valid CNIC number (format: 12345-6789012-3)');
      return;
    }

    // Get current payment amount from payment settings
    const currentPayment = getCurrentPaymentAmount();

    let screenshotRef = paymentScreenshot;
    if (paymentScreenshot.startsWith('data:')) {
      setIsUploadingProof(true);
      try {
        screenshotRef = await uploadPaymentScreenshotDataUrl(signupEmail, paymentScreenshot);
      } catch (err) {
        console.error('Payment screenshot upload failed:', err);
        alert(
          err instanceof Error
            ? err.message
            : 'Could not upload payment screenshot. Check your connection and try a smaller image (max 2.5MB).'
        );
        setIsUploadingProof(false);
        return;
      } finally {
        setIsUploadingProof(false);
      }
    }

    const paymentDetails: PaymentDetails = {
      paymentMethod: 'bank-transfer',
      paymentScreenshot: screenshotRef,
      paymentScreenshotType: paymentScreenshot.startsWith('data:')
        ? paymentScreenshot.split(',')[0]
        : 'image/url',
      paymentScreenshotName: `payment_${Date.now()}.jpg`,
      transactionId,
      accountTitle,
      amount: currentPayment.amount, // ✅ FIXED: Use payment settings amount
      uploadedAt: new Date().toISOString(),
      currency: currentPayment.currency // ✅ FIXED: Use payment settings currency
    };

    // Log payment submission
    try {
      const { AuditService } = await import('../services/AuditService');
      
      // Log financial action
      AuditService.logFinancialAction(
        'Payment Upload Submitted',
        formData?.fullName || 'Unknown User',
        'user',
        currentPayment.amount,
        formData?.email || 'unknown@example.com',
        true,
        {
          paymentMethod: 'bank-transfer',
          currency: currentPayment.currency,
          hasScreenshot: !!paymentScreenshot
        }
      );
    } catch (error) {
      console.error('Failed to log payment submission:', error);
    }

    onStepComplete(
      { 
        paymentDetails,
        paymentVerified: false,
        phone: phone.trim(),
        cnic: cnic.trim()
      },
      'final-form'
    );
  };

  // Loading state
  if (isLoading || !paymentSettings || !subscriptionPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
          {isLoading && <p className="text-sm text-gray-500 mt-2">Initializing payment settings...</p>}
        </div>
      </div>
    );
  }

  // Error state - if payment settings are still invalid
  if (!paymentSettings.bankAccounts || !Array.isArray(paymentSettings.bankAccounts)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Settings Error</h3>
          <p className="text-gray-600 mb-4">Unable to load payment information. Please contact support or try refreshing the page.</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => onNavigate('email-verification')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get active bank accounts with defensive check
  const activeBankAccounts = paymentSettings.bankAccounts?.filter((account: any) => account.isActive) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Manual Copy Modal */}
      {showManualCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">📋 Copy {manualCopyData.label}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your browser doesn't support automatic copying. Please manually copy the text below:
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="font-mono text-sm break-all select-all">
                {manualCopyData.text}
              </p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => {
                  // Try one more time to copy
                  navigator.clipboard?.writeText(manualCopyData.text).then(() => {
                    console.log('✅ Manual copy successful');
                    setShowManualCopyModal(false);
                  }).catch(() => {
                    // If it still fails, just close the modal
                    console.log('📋 User will copy manually');
                  });
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Copy Again
              </button>
              <button
                onClick={() => setShowManualCopyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: You can also select the text above and use Ctrl+C (or Cmd+C on Mac) to copy.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Payment Upload</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">✓</div>
                <span className="text-sm text-gray-600">Sign Up</span>
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">✓</div>
                <span className="text-sm text-gray-600">Email Verification</span>
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">3</div>
                <span className="text-sm font-medium text-blue-600">Payment</span>
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">4</div>
                <span className="text-sm text-gray-600">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Payment Amount Display */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                💰 {subscriptionPlan.name}: {getCurrentPaymentAmount().currency} {getCurrentPaymentAmount().amount.toLocaleString()}
              </h3>
              <p className="text-blue-700 text-sm">
                {subscriptionPlan.description}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Amount set by admin: {getCurrentPaymentAmount().currency} {getCurrentPaymentAmount().amount}
              </p>
              <p className="text-blue-600 text-xs">
                Subscription automatically expires after {subscriptionPlan.duration} months
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">📋 Payment Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Transfer the exact amount to any of the bank accounts below</li>
                <li>Take a clear screenshot of your payment confirmation</li>
                <li>Upload the screenshot and fill in your details</li>
                <li>Wait for payment verification (usually within 24-48 hours)</li>
                <li>Access your account once payment is approved</li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">📌 Important Notes:</h4>
                <ul className="text-sm text-yellow-700">
                  <li>• {paymentSettings.paymentInstructions || 'Please transfer the exact amount and upload payment screenshot for verification'}</li>
                  <li>• Payment verification is done manually within {paymentSettings.verificationSettings?.gracePeriodHours || 48} hours</li>
                  <li>• Make sure the screenshot clearly shows the transaction details</li>
                  <li>• You can use any of the bank accounts listed below</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">⚠️ Please transfer the exact amount. Incorrect amounts may delay verification.</p>
              </div>
            </div>

            {/* Enhanced Bank Accounts Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🏦 Bank Account Details ({activeBankAccounts.length} Available Options)</h3>
              {activeBankAccounts.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">⚠️ No active bank accounts found. Please contact support.</p>
                </div>
              ) : (
                activeBankAccounts.map((bank: any, index: number) => (
                  <div key={bank.id} className={`bg-white p-6 rounded-lg border-2 shadow-sm transition-all hover:shadow-md ${
                    bank.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">{bank.bankName}</h4>
                      <div className="flex gap-2">
                        {bank.isDefault && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            ⭐ Recommended
                          </span>
                        )}
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Option {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Account Title:</span>
                        <p className="text-gray-800 font-mono">{bank.accountTitle}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Account Number:</span>
                        <p className="text-gray-800 font-mono">{bank.accountNumber}</p>
                      </div>
                      {bank.iban && (
                        <div>
                          <span className="font-medium text-gray-600">IBAN:</span>
                          <p className="text-gray-800 font-mono text-xs">{bank.iban}</p>
                        </div>
                      )}
                      {bank.branchCode && (
                        <div>
                          <span className="font-medium text-gray-600">Branch Code:</span>
                          <p className="text-gray-800 font-mono">{bank.branchCode}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Copy to Clipboard Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={(e) => copyToClipboard(bank.accountNumber, 'Account Number', e.currentTarget)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs transition-colors"
                      >
                        📋 Copy Account Number
                      </button>
                      <button
                        onClick={(e) => copyToClipboard(bank.accountTitle, 'Account Title', e.currentTarget)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs transition-colors"
                      >
                        📋 Copy Account Title
                      </button>
                      {bank.iban && (
                        <button
                          onClick={(e) => copyToClipboard(bank.iban, 'IBAN', e.currentTarget)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs transition-colors"
                        >
                          📋 Copy IBAN
                        </button>
                      )}
                      {bank.branchCode && (
                        <button
                          onClick={(e) => copyToClipboard(bank.branchCode, 'Branch Code', e.currentTarget)}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-xs transition-colors"
                        >
                          📋 Copy Branch Code
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">📱 Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+92-300-1234567"
                      maxLength={16}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your Pakistani mobile number
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNIC Number *
                    </label>
                    <input
                      type="text"
                      value={cnic}
                      onChange={handleCNICChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12345-6789012-3"
                      maxLength={15}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your 13-digit CNIC number
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Upload Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">📸 Upload Payment Screenshot</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Screenshot *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max file size: 2.5MB. Accepted formats: JPEG, JPG, PNG, WebP
                    </p>
                  </div>

                  {uploading && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}

                  {paymentScreenshot && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-green-600 mb-2">✅ Screenshot uploaded successfully</p>
                      <img 
                        src={paymentScreenshot} 
                        alt="Payment screenshot" 
                        className="max-w-md h-auto border rounded-lg shadow-sm"
                      />
                    </div>
                  )}

                  {/* Optional fields - only show if required by settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter transaction ID if available"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Title Used (Optional)
                    </label>
                    <input
                      type="text"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the account title you used for payment"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => onNavigate('email-verification')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!paymentScreenshot || uploading || isUploadingProof || !phone.trim() || !cnic.trim()}
                  className={`px-6 py-2 rounded-lg ${
                    paymentScreenshot && !uploading && phone.trim() && cnic.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;