import { useState, useEffect, useMemo } from "react";
import { Download, MoreHorizontal, CheckCircle, XCircle, AlertTriangle, Users, CreditCard, TrendingUp, Clock, Eye, FileText, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

import { UserData, AdminData, PageType } from "../../types";
import { PaymentJourneyModal } from "../PaymentJourneyModal";
import { PaymentRejectionModal } from "../PaymentRejectionModal";
import { PaymentAttemptsHistoryModal } from "../PaymentAttemptsHistoryModal";


interface Props {
  admin: AdminData;
  onNavigate: (page: PageType) => void;
  onRefresh: () => void;
}

export default function SuperAdminUsersTable({ admin, onRefresh }: Props) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'specialty' | 'status' | 'payment' | 'expiry'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<'all' | 'medicine' | 'surgery' | 'gynae-obs'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPaymentJourney, setShowPaymentJourney] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionUser, setRejectionUser] = useState<UserData | null>(null);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'suspend' | 'activate' | ''>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      setIsLoading(true);
      const storedUsers = localStorage.getItem('all_users');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers)) {
          setUsers(parsedUsers);
          console.log(`📊 Loaded ${parsedUsers.length} users`);
        } else {
          console.warn('⚠️ Stored users is not an array');
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe helper functions
  const safeUserName = (user: UserData): string => {
    return user?.name || user?.fullName || 'N/A';
  };

  const safeUserEmail = (user: UserData): string => {
    return user?.email || 'N/A';
  };

  const safeUserSpecialty = (user: UserData): string => {
    return user?.specialty || 'N/A';
  };

  const safeUserPaymentStatus = (user: UserData): 'pending' | 'completed' | 'rejected' => {
    return user?.paymentStatus === 'completed' ? 'completed' : 
           user?.paymentStatus === 'rejected' ? 'rejected' : 'pending';
  };

  const safeUserRegistrationDate = (user: UserData): string => {
    if (!user?.registrationDate) return 'N/A';
    try {
      return new Date(user.registrationDate).toISOString();
    } catch {
      return 'N/A';
    }
  };

  // 🆕 Expiry helper functions
  const safeUserSubscriptionExpiry = (user: UserData): string | null => {
    return user?.subscriptionExpiryDate || null;
  };

  const calculateDaysLeft = (user: UserData): number => {
    const expiryDate = safeUserSubscriptionExpiry(user);
    if (!expiryDate) return 0;
    
    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  const formatExpiryDate = (user: UserData): string => {
    const expiryDate = safeUserSubscriptionExpiry(user);
    if (!expiryDate) return 'No subscription';
    
    try {
      return new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDaysLeftBadge = (user: UserData) => {
    const daysLeft = calculateDaysLeft(user);
    const expiryDate = safeUserSubscriptionExpiry(user);
    
    if (!expiryDate) {
      return <Badge variant="outline" className="text-gray-500 border-gray-300">No subscription</Badge>;
    }
    
    if (daysLeft < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired ({Math.abs(daysLeft)} days ago)</Badge>;
    }
    
    if (daysLeft <= 7) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        {daysLeft} days left
      </Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" />
      {daysLeft} days left
    </Badge>;
  };

  // Calculate metrics
  const totalUsers = users.length;
  const pendingUsers = users.filter(u => safeUserPaymentStatus(u) === 'pending').length;
  const activeUsers = users.filter(u => safeUserPaymentStatus(u) === 'completed').length;
  const rejectedUsers = users.filter(u => safeUserPaymentStatus(u) === 'rejected').length;
  const conversionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0';

  // Apply filters and search
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        safeUserName(user).toLowerCase().includes(term) ||
        safeUserEmail(user).toLowerCase().includes(term) ||
        safeUserSpecialty(user).toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => safeUserPaymentStatus(user) === filterStatus);
    }

    // Specialty filter
    if (filterSpecialty !== 'all') {
      filtered = filtered.filter(user => safeUserSpecialty(user) === filterSpecialty);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus, filterSpecialty]);

  // Sort users
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = safeUserName(a).toLowerCase();
          bValue = safeUserName(b).toLowerCase();
          break;
        case 'email':
          aValue = safeUserEmail(a).toLowerCase();
          bValue = safeUserEmail(b).toLowerCase();
          break;
        case 'date':
          aValue = safeUserRegistrationDate(a);
          bValue = safeUserRegistrationDate(b);
          break;
        case 'specialty':
          aValue = safeUserSpecialty(a);
          bValue = safeUserSpecialty(b);
          break;
        case 'status':
          aValue = safeUserPaymentStatus(a);
          bValue = safeUserPaymentStatus(b);
          break;
        case 'payment':
          aValue = safeUserPaymentStatus(a);
          bValue = safeUserPaymentStatus(b);
          break;
        case 'expiry':
          const aExpiry = safeUserSubscriptionExpiry(a);
          const bExpiry = safeUserSubscriptionExpiry(b);
          if (!aExpiry && !bExpiry) return 0;
          if (!aExpiry) return 1;
          if (!bExpiry) return -1;
          aValue = aExpiry;
          bValue = bExpiry;
          break;
        default:
          aValue = safeUserRegistrationDate(a);
          bValue = safeUserRegistrationDate(b);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredUsers, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleUserAction = (action: 'approve' | 'reject' | 'suspend' | 'view' | 'edit', user: UserData) => {
    setSelectedUser(user);
    
    switch (action) {
      case 'view':
        setShowUserModal(true);
        break;
      case 'edit':
        setEditingUser({ ...user });
        setShowEditUserModal(true);
        break;
      case 'approve':
        updateUserStatus(user, 'completed');
        break;
      case 'reject':
        setRejectionUser(user);
        setShowRejectionModal(true);
        break;
      case 'suspend':
        updateUserStatus(user, 'suspended');
        break;
    }
  };

  const handleEditUserSubmit = (updatedUser: UserData) => {
    try {
      const allUsers = [...users];
      const userIndex = allUsers.findIndex(u => u.id === updatedUser.id || u.email === updatedUser.email);
      
      if (userIndex !== -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser };
        setUsers(allUsers);
        localStorage.setItem('all_users', JSON.stringify(allUsers));
        
        console.log(`✅ Updated user ${updatedUser.email} successfully`);
        setShowEditUserModal(false);
        setEditingUser(null);
        onRefresh();
      } else {
        console.error('❌ User not found for update');
        alert('Error: User not found. Please refresh and try again.');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateUserStatus = (user: UserData, status: 'completed' | 'rejected' | 'suspended') => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === user.id || u.email === user.email) {
          const updatedUser = { ...u };
          
          if (status === 'completed') {
            updatedUser.paymentStatus = 'completed';
            updatedUser.status = 'active';
            
            // Add to approved payments list
            const approvedPayments = JSON.parse(localStorage.getItem('approved_payments') || '[]');
            if (!approvedPayments.includes(user.id)) {
              approvedPayments.push(user.id);
              localStorage.setItem('approved_payments', JSON.stringify(approvedPayments));
            }
          } else if (status === 'rejected') {
            updatedUser.paymentStatus = 'rejected';
            updatedUser.status = 'rejected';
          } else if (status === 'suspended') {
            updatedUser.status = 'suspended';
            updatedUser.suspendedAt = new Date().toISOString();
            updatedUser.suspendedBy = admin.name;
          }
          
          return updatedUser;
        }
        return u;
      });

      setUsers(updatedUsers);
      localStorage.setItem('all_users', JSON.stringify(updatedUsers));
      
      console.log(`✅ Updated user ${user.email} status to ${status}`);
    } catch (error) {
      console.error('❌ Error updating user status:', error);
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUserIds.size === 0) return;

    const selectedUsers = users.filter(user => selectedUserIds.has(user.id));
    
    selectedUsers.forEach(user => {
      if (bulkAction === 'approve') {
        updateUserStatus(user, 'completed');
      } else if (bulkAction === 'reject') {
        updateUserStatus(user, 'rejected');
      } else if (bulkAction === 'suspend') {
        updateUserStatus(user, 'suspended');
      }
    });

    setSelectedUserIds(new Set());
    setBulkAction('');
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === sortedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(sortedUsers.map(u => u.id)));
    }
  };

  const exportData = () => {
    try {
      const csvContent = [
        ['Name', 'Email', 'Specialty', 'Registration Date', 'Payment Status', 'Subscription Expiry', 'Days Left', 'Phone', 'CNIC'],
        ...sortedUsers.map(user => [
          safeUserName(user),
          safeUserEmail(user),
          safeUserSpecialty(user),
          new Date(safeUserRegistrationDate(user)).toLocaleDateString(),
          safeUserPaymentStatus(user),
          formatExpiryDate(user),
          calculateDaysLeft(user).toString(),
          user.phone || 'N/A',
          user.cnic || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
    }
  };

  const getStatusBadge = (user: UserData) => {
    const status = safeUserPaymentStatus(user);
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user registrations and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadUsers}>
            <Users className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">{totalUsers.toLocaleString()}</div>
            <div className="text-blue-700 text-sm">Total Users</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-1">{activeUsers.toLocaleString()}</div>
            <div className="text-green-700 text-sm">Active Users</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-900 mb-1">{pendingUsers.toLocaleString()}</div>
            <div className="text-orange-700 text-sm">Pending Users</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-700">Rejected</Badge>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">{rejectedUsers.toLocaleString()}</div>
            <div className="text-red-700 text-sm">Rejected Users</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">Rate</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">{conversionRate}%</div>
            <div className="text-purple-700 text-sm">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSpecialty} onValueChange={(value: any) => setFilterSpecialty(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="gynae-obs">Gynae-Obs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Registration Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="specialty">Specialty</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="payment">Payment Status</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUserIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-900">
                  {selectedUserIds.size} user{selectedUserIds.size > 1 ? 's' : ''} selected
                </span>
                <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAction} 
                  disabled={!bulkAction}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Action
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedUserIds(new Set())}
                className="text-blue-600 border-blue-300"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Registration Data</span>
            <span className="text-sm font-normal text-gray-600">
              Showing {sortedUsers.length} of {totalUsers} users
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === sortedUsers.length && sortedUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('name')}>
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('email')}>
                    Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('specialty')}>
                    Specialty {sortBy === 'specialty' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('date')}>
                    Registered {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('expiry')}>
                    Subscription {sortBy === 'expiry' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort('status')}>
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow 
                    key={user.id || user.email} 
                    className={`hover:bg-gray-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          {safeUserName(user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{safeUserName(user)}</div>
                          <div className="text-sm text-gray-600">{user.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900">{safeUserEmail(user)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`
                        ${safeUserSpecialty(user) === 'medicine' ? 'bg-green-100 text-green-800' : ''}
                        ${safeUserSpecialty(user) === 'surgery' ? 'bg-blue-100 text-blue-800' : ''}
                        ${safeUserSpecialty(user) === 'gynae-obs' ? 'bg-pink-100 text-pink-800' : ''}
                      `}>
                        {safeUserSpecialty(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(safeUserRegistrationDate(user)).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatExpiryDate(user)}
                        </div>
                        <div>
                          {getDaysLeftBadge(user)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserAction('view', user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction('edit', user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPaymentJourney(true);
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Payment Journey
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPaymentHistory(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Payment History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {safeUserPaymentStatus(user) === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('approve', user)}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('reject', user)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Payment
                              </DropdownMenuItem>
                            </>
                          )}
                          {safeUserPaymentStatus(user) === 'completed' && (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('suspend', user)}
                              className="text-orange-600"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sortedUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' || filterSpecialty !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No users have registered yet.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete information for {selectedUser ? safeUserName(selectedUser) : ''}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <p className="font-medium">{safeUserName(selectedUser)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <p className="font-medium">{safeUserEmail(selectedUser)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Specialty</label>
                  <p className="font-medium">{safeUserSpecialty(selectedUser)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="font-medium">{new Date(safeUserRegistrationDate(selectedUser)).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">CNIC</label>
                  <p className="font-medium">{selectedUser.cnic || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Status</label>
                  <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subscription Expiry</label>
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{formatExpiryDate(selectedUser)}</p>
                    {getDaysLeftBadge(selectedUser)}
                  </div>
                </div>
              </div>
              
              {selectedUser.paymentDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Information</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Amount:</strong> {selectedUser.paymentDetails.amount} PKR</p>
                    <p><strong>Method:</strong> {selectedUser.paymentDetails.method?.name}</p>
                    <p><strong>Bank:</strong> {selectedUser.paymentDetails.bank?.bankName}</p>
                    <p><strong>Transaction ID:</strong> {selectedUser.paymentDetails.transactionId}</p>
                    {selectedUser.paymentDetails.notes && (
                      <p><strong>Notes:</strong> {selectedUser.paymentDetails.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and settings</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name || editingUser.fullName || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      name: e.target.value,
                      fullName: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      email: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cnic">CNIC</Label>
                  <Input
                    id="edit-cnic"
                    value={editingUser.cnic || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      cnic: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-specialty">Specialty</Label>
                  <Select
                    value={editingUser.specialty || 'medicine'}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser,
                      specialty: value as 'medicine' | 'surgery' | 'gynae-obs'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="gynae-obs">Gynecology & Obstetrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">User Status</Label>
                  <Select
                    value={editingUser.status || 'active'}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser,
                      status: value as 'active' | 'suspended' | 'pending'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-payment-status">Payment Status</Label>
                  <Select
                    value={editingUser.paymentStatus || 'pending'}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser,
                      paymentStatus: value as 'pending' | 'completed' | 'rejected'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-expiry">Subscription Expiry</Label>
                  <Input
                    id="edit-expiry"
                    type="date"
                    value={editingUser.subscriptionExpiryDate ? new Date(editingUser.subscriptionExpiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      subscriptionExpiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleEditUserSubmit(editingUser)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Journey Modal */}
      {selectedUser && (
        <PaymentJourneyModal
          isOpen={showPaymentJourney}
          onClose={() => setShowPaymentJourney(false)}
          user={selectedUser ? {
            ...selectedUser,
            paymentAttempts: selectedUser.paymentAttempts || []
          } : null}
          finalStatus={safeUserPaymentStatus(selectedUser)}
        />
      )}

      {/* Payment History Modal */}
      {selectedUser && (
        <PaymentAttemptsHistoryModal
          isOpen={showPaymentHistory}
          onClose={() => setShowPaymentHistory(false)}
          user={selectedUser ? {
            ...selectedUser,
            paymentAttempts: selectedUser.paymentAttempts || []
          } : null}
        />
      )}

      {/* Payment Rejection Modal */}
      {rejectionUser && (
        <PaymentRejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setRejectionUser(null);
          }}
          userName={rejectionUser?.name || rejectionUser?.fullName || ''}
          userEmail={rejectionUser?.email || ''}
          onConfirmRejection={(_reason: string) => {
            if (rejectionUser) {
              updateUserStatus(rejectionUser, 'rejected');
              setShowRejectionModal(false);
              setRejectionUser(null);
            }
          }}
        />
      )}
    </div>
  );
}