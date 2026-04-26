import { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Eye,
  Download,
  Search,
  RefreshCw,
  FileText,
  Shield,
  LogOut,
  Heart,
  Scissors,
  Baby,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { AdminData, UserData } from '../types';
import { 
  getPendingPayments, 
  getPaymentHistory,
  getApprovedPayments
} from '../utils/paymentVerification';
import { 
  getLatestPaymentAttempt, 
  getPaymentAttemptCount, 
  hasPaymentScreenshot,
  safelyMigrateUser
} from '../utils/paymentAttemptsUtils';
import { PaymentAttemptsHistoryModal } from './PaymentAttemptsHistoryModal';
import { PaymentRejectionModal } from './PaymentRejectionModal';
import { PaymentJourneyModal } from './PaymentJourneyModal';
import { getPaymentSettings, formatPaymentAmount, getCurrentPaymentAmount } from '../utils/paymentSettings';
import { calculateActualRevenue } from '../utils/revenueCalculations';

// Import safe storage utilities
import { safeGetItem } from '../utils/storageUtils';

interface FinanceManagerDashboardProps {
  admin: AdminData;
  onLogout: () => void;
}

const mapApiUserToUserData = (row: any): UserData => {
  const pd = row?.payment_details && typeof row.payment_details === 'object' ? row.payment_details : {};
  const attemptsFromDetails = (pd as { paymentAttempts?: unknown }).paymentAttempts;
  const paymentAttempts = Array.isArray(attemptsFromDetails) ? attemptsFromDetails : [];
  return {
    id: row?.id || row?.email || crypto.randomUUID(),
    name: row?.name || row?.full_name || '',
    fullName: row?.full_name || row?.name || '',
    email: row?.email || '',
    specialty: row?.specialty === 'surgery' || row?.specialty === 'gynae-obs' ? row.specialty : 'medicine',
    studyMode: 'regular',
    registrationDate: row?.registration_date || row?.created_at || new Date().toISOString(),
    phone: row?.phone || '',
    cnic: row?.cnic || '',
    paymentStatus:
      row?.payment_status === 'completed' || row?.payment_status === 'approved'
        ? 'completed'
        : row?.payment_status === 'rejected'
          ? 'rejected'
          : 'pending',
    paymentDetails: pd,
    status: row?.status || 'pending',
    paymentAttempts,
    emailVerified: Boolean(row?.email_verified),
    emailVerificationAttempts: 0,
    emailVerificationStatus: row?.email_verified ? 'verified' : 'pending'
  };
};

const FinanceManagerDashboard = ({ admin, onLogout }: FinanceManagerDashboardProps) => {
  const [pendingPayments, setPendingPayments] = useState<UserData[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState(getPaymentSettings());

  const [attemptHistoryModal, setAttemptHistoryModal] = useState<{
    isOpen: boolean;
    user: any | null;
  }>({
    isOpen: false,
    user: null
  });

  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    userEmail: '',
    isSubmitting: false
  });

  const [journeyModal, setJourneyModal] = useState<{
    isOpen: boolean;
    user: any | null;
    finalStatus: 'completed' | 'rejected' | 'pending';
  }>({
    isOpen: false,
    user: null,
    finalStatus: 'pending'
  });
  const pendingSnapshotRef = useRef<string>('');

  // Load data on component mount and set up auto-refresh
  useEffect(() => {
    refreshData({ silent: false });
    const interval = setInterval(() => refreshData({ silent: true }), 8000); // smart background refresh
    const refreshOnFocus = () => refreshData({ silent: true });
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshData({ silent: true });
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, []);

  // Load payment settings
  useEffect(() => {
    const settings = getPaymentSettings();
    setPaymentSettings(settings);

  }, []);

  const refreshData = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const pendingResp = await fetch('/api/admin-users-list?paymentStatus=pending', { cache: 'no-store' });
      if (pendingResp.ok) {
        const pendingJson = await pendingResp.json();
        const items = Array.isArray(pendingJson?.items) ? pendingJson.items : [];
        const pending = items
          .filter((row: any) => (row?.payment_status || 'pending') === 'pending')
          .map(mapApiUserToUserData);
        const snapshot = JSON.stringify(
          pending.map((u: UserData) => ({
            email: u.email,
            status: u.status,
            paymentStatus: u.paymentStatus,
            registrationDate: u.registrationDate
          }))
        );
        if (snapshot !== pendingSnapshotRef.current) {
          pendingSnapshotRef.current = snapshot;
          setPendingPayments(pending);
        }
      } else {
        // Fallback to legacy local path if API is temporarily unavailable
        const pending = getPendingPayments();
        const validatedPending = Array.isArray(pending) ? pending : [];
        const snapshot = JSON.stringify(
          validatedPending.map((u: any) => ({
            email: u?.email || '',
            status: u?.status || '',
            paymentStatus: u?.paymentStatus || '',
            registrationDate: u?.registrationDate || ''
          }))
        );
        if (snapshot !== pendingSnapshotRef.current) {
          pendingSnapshotRef.current = snapshot;
          setPendingPayments(validatedPending);
        }
      }
      
      // ✅ FIXED: Use safe array validation for payment history
      const history = getPaymentHistory();
      const validatedHistory = Array.isArray(history) ? history : [];
      setPaymentHistory(validatedHistory);
      
      setLastUpdated(new Date());
      
      // Refresh payment settings in case they were updated
      const updatedSettings = getPaymentSettings();
      setPaymentSettings(updatedSettings);
      

    } catch (error) {
      console.error('❌ Error refreshing finance data:', error);
      // Set empty arrays as fallback
      if (pendingSnapshotRef.current !== '[]') {
        pendingSnapshotRef.current = '[]';
        setPendingPayments([]);
      }
      setPaymentHistory([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Calculate statistics with current payment amount and safe array validation
  const currentPaymentAmount = getCurrentPaymentAmount();
  const statistics = (() => {
    try {
      // ✅ FIXED: Use safe storage and array validation
      const rawAllUsers = safeGetItem('all_users', []);
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      
      // ✅ FIXED: Safe array operations with validation
      const safePendingPayments = Array.isArray(pendingPayments) ? pendingPayments : [];
      const safePaymentHistory = Array.isArray(paymentHistory) ? paymentHistory : [];
      
      return {
        pendingCount: safePendingPayments.length,
        approvedToday: safePaymentHistory.filter(p => 
          p && p.status === 'completed' && 
          p.processedAt && new Date(p.processedAt).toDateString() === new Date().toDateString()
        ).length,
        totalRevenue: calculateActualRevenue(allUsers),
        activeUsersCount: (() => {
          try {
            const approved = getApprovedPayments();
            return Array.isArray(approved) ? approved.length : 0;
          } catch (error) {
            console.error('❌ Error getting approved payments count:', error);
            return 0;
          }
        })(),
        currentPaymentAmount: currentPaymentAmount.amount,
        currentPaymentCurrency: currentPaymentAmount.currency
      };
    } catch (error) {
      console.error('❌ Error calculating statistics:', error);
      return {
        pendingCount: 0,
        approvedToday: 0,
        totalRevenue: 0,
        activeUsersCount: 0,
        currentPaymentAmount: currentPaymentAmount.amount,
        currentPaymentCurrency: currentPaymentAmount.currency
      };
    }
  })();

  const statsCards = [
    {
      title: 'Pending Payments',
      value: statistics.pendingCount,
      icon: Clock,
      color: 'yellow',
      description: 'Awaiting approval'
    },
    {
      title: 'Approved Today',
      value: statistics.approvedToday,
      icon: CheckCircle,
      color: 'green',
      description: 'Processed today'
    },
    {
      title: 'Total Revenue',
      value: `${paymentSettings?.currency || 'PKR'} ${(statistics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'blue',
      description: 'All approved payments'
    },
    {
      title: 'Active Users',
      value: statistics.activeUsersCount,
      icon: Users,
      color: 'purple',
      description: 'With completed payments'
    }
  ];

  const handleApprovePayment = async (userId: string, userName: string) => {
    if (window.confirm(`Approve payment for ${userName}?`)) {
      const target = pendingPayments.find(p => p.id === userId);
      if (!target?.email) {
        alert('Could not resolve user email for approval.');
        return;
      }
      const approvedAmount =
        typeof target.paymentDetails?.amount === 'number' && target.paymentDetails.amount > 0
          ? target.paymentDetails.amount
          : paymentSettings?.paymentAmount || 7000;

      const resp = await fetch('/api/admin-update-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: target.email,
          adminRole: admin.role,
          status: 'active',
          paymentStatus: 'completed',
          emailVerified: target.emailVerified,
          paymentDetails: target.paymentDetails || {},
          action: 'payment_approve',
          approvedAmount,
          approvedCurrency: target.paymentDetails?.currency || paymentSettings?.currency || 'PKR',
          reviewedBy: admin.name
        })
      });
      if (resp.ok) {
        alert('Payment approved successfully!');
        refreshData();
        setSelectedPayments(prev => prev.filter(id => id !== userId));
      } else {
        const message = await resp.text().catch(() => '');
        alert(`Error approving payment. ${message || ''}`);
      }
    }
  };

  const handleRejectPayment = async (userId: string, userName: string, userEmail?: string) => {
    // Open rejection reason modal instead of direct rejection
    setRejectionModal({
      isOpen: true,
      userId,
      userName,
      userEmail: userEmail || '',
      isSubmitting: false
    });
  };

  const handleConfirmRejection = async (reason: string) => {
    setRejectionModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const target = pendingPayments.find(p => p.id === rejectionModal.userId);
      if (!target?.email) {
        alert('Could not resolve user email for rejection.');
        return;
      }

      const resp = await fetch('/api/admin-update-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: target.email,
          adminRole: admin.role,
          status: 'rejected',
          paymentStatus: 'rejected',
          emailVerified: target.emailVerified,
          paymentDetails: {
            ...(target.paymentDetails || {}),
            rejectionReason: reason
          },
          reviewedBy: admin.name,
          reviewNote: reason
        })
      });

      if (resp.ok) {
        alert('Payment rejected successfully!');
        refreshData();
        setRejectionModal({
          isOpen: false,
          userId: '',
          userName: '',
          userEmail: '',
          isSubmitting: false
        });
        setSelectedPayments(prev => prev.filter(id => id !== rejectionModal.userId));
      } else {
        const message = await resp.text().catch(() => '');
        alert(`Error rejecting payment. ${message || ''}`);
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Error rejecting payment. Please try again.');
    } finally {
      setRejectionModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleBulkApprove = () => {
    if (selectedPayments.length === 0) return;
    
    if (window.confirm(`Approve ${selectedPayments.length} selected payments?`)) {
      (async () => {
        let successCount = 0;
        for (const userId of selectedPayments) {
          const target = pendingPayments.find(p => p.id === userId);
          if (!target?.email) continue;
          const approvedAmount =
            typeof target.paymentDetails?.amount === 'number' && target.paymentDetails.amount > 0
              ? target.paymentDetails.amount
              : paymentSettings?.paymentAmount || 7000;

          const resp = await fetch('/api/admin-update-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: target.email,
              adminRole: admin.role,
              status: 'active',
              paymentStatus: 'completed',
              emailVerified: target.emailVerified,
              paymentDetails: target.paymentDetails || {},
              action: 'payment_approve',
              approvedAmount,
              approvedCurrency: target.paymentDetails?.currency || paymentSettings?.currency || 'PKR',
              reviewedBy: admin.name
            })
          });
          if (resp.ok) successCount++;
        }
        alert(`${successCount} payments approved successfully!`);
        setSelectedPayments([]);
        refreshData();
      })();
    }
  };

  const handleBulkReject = () => {
    if (selectedPayments.length === 0) return;
    
    const reason = window.prompt(`Reason for rejecting ${selectedPayments.length} selected payments:`);
    if (reason && reason.trim()) {
      (async () => {
        let successCount = 0;
        for (const userId of selectedPayments) {
          const target = pendingPayments.find(p => p.id === userId);
          if (!target?.email) continue;
          const resp = await fetch('/api/admin-update-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: target.email,
              adminRole: admin.role,
              status: 'rejected',
              paymentStatus: 'rejected',
              emailVerified: target.emailVerified,
              paymentDetails: {
                ...(target.paymentDetails || {}),
                rejectionReason: reason.trim()
              },
              reviewedBy: admin.name,
              reviewNote: reason.trim()
            })
          });
          if (resp.ok) successCount++;
        }
        alert(`${successCount} payments rejected successfully!`);
        setSelectedPayments([]);
        refreshData();
      })();
    }
  };

  const handleViewImage = (imageData: string) => {
    setViewingImage(imageData);
    setImageViewerOpen(true);
    
  };

  const handleViewAttemptHistory = (userWithAttempts: any) => {
    setAttemptHistoryModal({
      isOpen: true,
      user: userWithAttempts
    });
  };

  const handleViewPaymentJourney = (paymentHistoryItem: any) => {
    try {
      // ✅ FIXED: Use safe storage to get user data
      const rawAllUsers = safeGetItem('all_users', []);
      const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
      const fullUser = allUsers.find((u: any) => u && u.email === paymentHistoryItem.userEmail);
      
      if (fullUser) {
        const userWithAttempts = safelyMigrateUser(fullUser);
        setJourneyModal({
          isOpen: true,
          user: userWithAttempts,
          finalStatus: paymentHistoryItem.status === 'completed' ? 'completed' : 
                      paymentHistoryItem.status === 'rejected' ? 'rejected' : 'pending'
        });
      } else {
        alert('User data not found. This may be a legacy payment record.');
      }
    } catch (error) {
      console.error('❌ Error loading payment journey:', error);
      alert('Error loading payment journey. Please try again.');
    }
  };

  const downloadImage = (imageData: string, imageName: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = imageName || `payment-screenshot-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case 'medicine': return Heart;
      case 'surgery': return Scissors;
      case 'gynae-obs': return Baby;
      default: return FileText;
    }
  };

  // ✅ FIXED: Safe filtering with array validation
  const filteredPaymentHistory = (() => {
    try {
      const safePaymentHistory = Array.isArray(paymentHistory) ? paymentHistory : [];
      return safePaymentHistory.filter(payment => {
        if (!payment) return false;
        
        const matchesSearch = (payment.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (payment.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('❌ Error filtering payment history:', error);
      return [];
    }
  })();

  const exportPaymentHistory = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "User Name,Email,Specialty,Status,Date,Amount,Reason\n"
        + filteredPaymentHistory.map(payment => {
            // Use actual amount paid by user instead of current payment settings
            const actualAmount = payment.amount || payment.actualAmount || (paymentSettings?.paymentAmount || 7000);
            const currency = payment.currency || (paymentSettings?.currency || 'PKR');
            return `${payment.userName || ''},${payment.userEmail || ''},${payment.specialty || ''},${payment.status || ''},${payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : ''},${currency} ${actualAmount},${payment.reason || ''}`;
          }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Error exporting payment history:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 bg-[rgba(0,0,0,0.17)]">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Finance Manager Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {admin?.name || 'Finance Manager'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Shield className="w-3 h-3 mr-1" />
                Finance Manager
              </Badge>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
              <Button 
                variant="outline"
                onClick={onLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Settings Info */}
        <div className="mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Current Payment Amount</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {paymentSettings ? formatPaymentAmount(paymentSettings.paymentAmount, paymentSettings.currency) : 'PKR 7,000'}
                  </p>
                  {paymentSettings?.lastUpdated && (
                    <p className="text-xs text-blue-600 mt-1">
                      Last updated: {new Date(paymentSettings.lastUpdated).toLocaleDateString()} by {paymentSettings.updatedBy}
                    </p>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <IconComponent className={`w-5 h-5 ${
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'blue' ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => refreshData({ silent: false })}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Pending Payments Section */}
        <Card className="mb-8 border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Pending Payments</CardTitle>
                <CardDescription>
                  {Array.isArray(pendingPayments) ? pendingPayments.length : 0} payments awaiting approval
                </CardDescription>
              </div>
              {selectedPayments.length > 0 && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleBulkApprove}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve {selectedPayments.length}
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject {selectedPayments.length}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(!Array.isArray(pendingPayments) || pendingPayments.length === 0) ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="text-gray-500">No pending payments to review at the moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-200">
                      <th className="text-left py-3 px-2">
                        <Checkbox
                          checked={selectedPayments.length === pendingPayments.length && pendingPayments.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPayments(pendingPayments.map(p => p.id));
                            } else {
                              setSelectedPayments([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Specialty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Registered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Days Waiting</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => {
                      const SpecialtyIcon = getSpecialtyIcon(payment.specialty || 'medicine');
                      const registrationDate = payment.registrationDate ? new Date(payment.registrationDate) : new Date();
                      const daysWaiting = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // ✅ FIXED: Enhanced payment attempt handling with safe storage
                      let userWithAttempts = payment as any;
                      // Only migrate if user doesn't already have attempts
                      if (!userWithAttempts.paymentAttempts) {
                        userWithAttempts = safelyMigrateUser(payment);
                        
                        // Update the user in localStorage to prevent repeated migration
                        try {
                          const rawAllUsers = safeGetItem('all_users', []);
                          const allUsers = Array.isArray(rawAllUsers) ? rawAllUsers : [];
                          const userIndex = allUsers.findIndex((u: any) => u && u.id === payment.id);
                          if (userIndex > -1) {
                            allUsers[userIndex] = userWithAttempts;
                            localStorage.setItem('all_users', JSON.stringify(allUsers));
                          }
                        } catch (error) {
                          console.error('❌ Error updating user in localStorage:', error);
                        }
                      }
                      
                      const latestAttempt = getLatestPaymentAttempt(userWithAttempts);
                      const attemptCount = getPaymentAttemptCount(userWithAttempts);
                      const hasPaymentDetails = hasPaymentScreenshot(payment);

                      // Get screenshot data (latest attempt or fallback to old format)
                      const screenshotData = latestAttempt?.screenshot || payment.paymentDetails?.paymentScreenshot;
                      
                      const paymentAmount = payment.paymentDetails?.amount || paymentSettings?.paymentAmount || 7000;
                      const paymentCurrency = payment.paymentDetails?.currency || paymentSettings?.currency || 'PKR';
                      
                      return (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-yellow-50">
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedPayments.includes(payment.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPayments(prev => [...prev, payment.id]);
                                } else {
                                  setSelectedPayments(prev => prev.filter(id => id !== payment.id));
                                }
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{payment.name || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{payment.email || 'No email'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <SpecialtyIcon className="w-4 h-4 text-gray-500" />
                              <span className="capitalize text-sm">{(payment.specialty || 'medicine').replace('-', ' & ')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div>{payment.phone || 'N/A'}</div>
                              <div className="text-gray-500">{payment.cnic || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {hasPaymentDetails ? (
                                <>
                                  <div className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <Badge className={`${
                                        attemptCount > 1 
                                          ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                          : 'bg-blue-100 text-blue-800 border-blue-300'
                                      }`}>
                                        <ImageIcon className="w-3 h-3 mr-1" />
                                        {attemptCount > 1 ? `Latest (Attempt #${attemptCount})` : 'Screenshot'}
                                      </Badge>
                                      {screenshotData && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewImage(screenshotData)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    {attemptCount > 1 && (
                                      <button
                                        onClick={() => handleViewAttemptHistory(userWithAttempts)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View Previous ({attemptCount - 1} attempts)
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                                  No Screenshot
                                </Badge>
                              )}
                            </div>
                            {latestAttempt?.transactionId && (
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {latestAttempt.transactionId}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-semibold">
                              {paymentCurrency} {(paymentAmount || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {registrationDate.toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${
                              daysWaiting > 2 ? 'bg-red-100 text-red-800 border-red-300' :
                              daysWaiting > 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              'bg-green-100 text-green-800 border-green-300'
                            }`}>
                              {daysWaiting} days
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleApprovePayment(payment.id, payment.name || 'Unknown User')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectPayment(payment.id, payment.name || 'Unknown User', payment.email)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card className="border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Payment History</CardTitle>
                <CardDescription>
                  Complete record of all payment approvals and rejections
                </CardDescription>
              </div>
              <Button
                onClick={exportPaymentHistory}
                variant="outline"
                className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* History Table */}
            {filteredPaymentHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No payment history found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Payment approvals and rejections will appear here.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Specialty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Processed By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaymentHistory.map((payment, index) => {
                      const SpecialtyIcon = getSpecialtyIcon(payment.specialty || 'medicine');
                      const actualAmount = payment.amount || payment.actualAmount || (paymentSettings?.paymentAmount || 7000);
                      const currency = payment.currency || (paymentSettings?.currency || 'PKR');
                      
                      return (
                        <tr key={`${payment.userEmail}-${payment.processedAt}-${index}`} className="border-b border-gray-100 hover:bg-yellow-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{payment.userName || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{payment.userEmail || 'No email'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <SpecialtyIcon className="w-4 h-4 text-gray-500" />
                              <span className="capitalize text-sm">{(payment.specialty || 'medicine').replace('-', ' & ')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadge(payment.status)}>
                              {payment.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {payment.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {payment.status === 'completed' ? 'Approved' : 
                               payment.status === 'rejected' ? 'Rejected' : 
                               'Pending'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-semibold">
                              {currency} {(actualAmount || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div>{payment.processedBy || 'System'}</div>
                              {payment.reason && payment.status === 'rejected' && (
                                <div className="text-xs text-red-600 mt-1">
                                  Reason: {payment.reason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => handleViewPaymentJourney(payment)}
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Journey
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>
              Review the submitted payment screenshot
            </DialogDescription>
          </DialogHeader>
          {viewingImage && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Payment Screenshot</span>
                <Button
                  onClick={() => downloadImage(viewingImage, 'payment-screenshot.jpg')}
                  size="sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={viewingImage} 
                  alt="Payment Screenshot"
                  className="w-full h-auto"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Attempts History Modal */}
      <PaymentAttemptsHistoryModal
        isOpen={attemptHistoryModal.isOpen}
        onClose={() => setAttemptHistoryModal({ isOpen: false, user: null })}
        user={attemptHistoryModal.user}
      />

      {/* Payment Rejection Modal */}
      <PaymentRejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({
          isOpen: false,
          userId: '',
          userName: '',
          userEmail: '',
          isSubmitting: false
        })}
        onConfirmRejection={handleConfirmRejection}
        userName={rejectionModal.userName}
        userEmail={rejectionModal.userEmail}
        isSubmitting={rejectionModal.isSubmitting}
      />

      {/* Payment Journey Modal */}
      <PaymentJourneyModal
        isOpen={journeyModal.isOpen}
        onClose={() => setJourneyModal({ isOpen: false, user: null, finalStatus: 'pending' })}
        user={journeyModal.user}
        finalStatus={journeyModal.finalStatus}
      />
    </div>
  );
};

export default FinanceManagerDashboard;