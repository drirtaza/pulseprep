import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Users,
  UserPlus,
  Shield,
  Crown,
  DollarSign,
  BookText,
  
  Eye,
  Edit,
  MoreHorizontal,
  Search,
  
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  
} from 'lucide-react';
import { AdminData } from '../../types';

interface SuperAdminAdminsTableProps {
  admin: AdminData;
  admins: AdminData[];
  onRefresh: () => void;
  onCreateAdmin: (adminData: Partial<AdminData>) => void;
  onUpdateAdmin: (adminId: string, updates: Partial<AdminData>) => void;
  onDeleteAdmin: (adminId: string) => void;
  onViewAdmin: (admin: AdminData) => void;
  onExportData: () => void;
}

export const SuperAdminAdminsTable: React.FC<SuperAdminAdminsTableProps> = ({
  admin,
  admins,
  onRefresh,
  onCreateAdmin,
  onUpdateAdmin,
  
  onViewAdmin,
  onExportData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

  // New admin form state
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    role: 'content-manager',
    password: '',
    confirmPassword: '',
    notes: ''
  });

  // Calculate metrics
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.status === 'active').length;
  const superAdmins = admins.filter(a => a.role === 'super-admin').length;
  const contentManagers = admins.filter(a => a.role === 'content-manager').length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin':
        return <Crown className="h-4 w-4" />;
      case 'finance-manager':
        return <DollarSign className="h-4 w-4" />;
      case 'audit-manager':
        return <Shield className="h-4 w-4" />;
      case 'content-manager':
        return <BookText className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'finance-manager':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'audit-manager':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'content-manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleName = (role: string) => {
    return role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[rgba(82,184,114,1)] text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-[rgba(157,90,90,1)] text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-[rgba(206,128,30,1)] text-orange-700 border-orange-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtering logic
  const filteredAdmins = admins.filter(adminItem => {
    const matchesSearch = searchTerm === '' || 
      adminItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || adminItem.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || adminItem.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sorting logic
  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    let aValue = '';
    let bValue = '';
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'created':
        aValue = a.createdAt || '';
        bValue = b.createdAt || '';
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleCreateAdmin = () => {
    if (newAdminForm.password !== newAdminForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const adminData: Partial<AdminData> = {
      name: newAdminForm.name,
      email: newAdminForm.email,
      role: newAdminForm.role as AdminData['role'],
      password: newAdminForm.password,
      status: 'active',
      createdBy: admin.id,
      createdAt: new Date().toISOString()
    };

    onCreateAdmin(adminData);
    setNewAdminForm({
      name: '',
      email: '',
      role: 'content-manager',
      password: '',
      confirmPassword: '',
      notes: ''
    });
    setShowCreateDialog(false);
  };

  const handleEditAdmin = (adminToEdit: AdminData) => {
    setSelectedAdmin(adminToEdit);
    setShowEditDialog(true);
  };

  const handleUpdateAdmin = () => {
    if (selectedAdmin) {
      onUpdateAdmin(selectedAdmin.id, selectedAdmin);
      setShowEditDialog(false);
      setSelectedAdmin(null);
    }
  };

  const canManageAdmin = (targetAdmin: AdminData): boolean => {
    // Super admin can manage everyone except other super admins
    if (admin.role === 'super-admin') {
      return targetAdmin.role !== 'super-admin' || targetAdmin.id === admin.id;
    }
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrator Management</h1>
          <p className="text-gray-600 mt-2">Manage administrator accounts and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Administrator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Administrator</DialogTitle>
                <DialogDescription>
                  Add a new administrator to the platform with specific role permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-name">Full Name</Label>
                  <Input
                    id="new-name"
                    value={newAdminForm.name}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                    placeholder="Administrator's full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-email">Email Address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2"
                    placeholder="admin@pulseprep.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-role">Administrator Role</Label>
                  <Select value={newAdminForm.role} onValueChange={(value) => setNewAdminForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-manager">Content Manager</SelectItem>
                      <SelectItem value="finance-manager">Finance Manager</SelectItem>
                      <SelectItem value="audit-manager">Audit Manager</SelectItem>
                      {admin.role === 'super-admin' && (
                        <SelectItem value="super-admin">Super Administrator</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-2"
                    placeholder="Secure password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-confirm-password">Confirm Password</Label>
                  <Input
                    id="new-confirm-password"
                    type="password"
                    value={newAdminForm.confirmPassword}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="mt-2"
                    placeholder="Confirm password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-notes">Notes (Optional)</Label>
                  <Textarea
                    id="new-notes"
                    value={newAdminForm.notes}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-2"
                    placeholder="Additional notes about this administrator"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateAdmin} className="flex-1">
                    Create Administrator
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">{totalAdmins}</div>
            <div className="text-purple-700 text-sm">Total Administrators</div>
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
            <div className="text-2xl font-bold text-green-900 mb-1">{activeAdmins}</div>
            <div className="text-green-700 text-sm">Active Administrators</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-700">Super</Badge>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">{superAdmins}</div>
            <div className="text-red-700 text-sm">Super Administrators</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BookText className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Content</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">{contentManagers}</div>
            <div className="text-blue-700 text-sm">Content Managers</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Management Interface */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Administrator Management Console</CardTitle>
              <CardDescription>Manage administrator accounts, roles, and permissions</CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search administrators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super-admin">Super Administrator</SelectItem>
                <SelectItem value="content-manager">Content Manager</SelectItem>
                <SelectItem value="finance-manager">Finance Manager</SelectItem>
                <SelectItem value="audit-manager">Audit Manager</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Administrators Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Administrator</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Created By</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAdmins.map((adminItem) => (
                  <TableRow key={adminItem.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium">
                          {adminItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{adminItem.name}</div>
                          <div className="text-sm text-gray-500">ID: {adminItem.id.slice(-8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-gray-900">{adminItem.email}</div>
                        <div className="text-sm text-gray-500">Administrator</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getRoleColor(adminItem.role)} flex items-center gap-1 w-fit`}
                      >
                        {getRoleIcon(adminItem.role)}
                        {getRoleName(adminItem.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(adminItem.status || 'active')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {adminItem.createdAt ? new Date(adminItem.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {adminItem.createdBy || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewAdmin(adminItem)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageAdmin(adminItem) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAdmin(adminItem)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
            <DialogDescription>
              Modify administrator details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedAdmin.name}
                  onChange={(e) => setSelectedAdmin(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) => setSelectedAdmin(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-role">Administrator Role</Label>
                <Select 
                  value={selectedAdmin.role} 
                  onValueChange={(value) => setSelectedAdmin(prev => prev ? ({ ...prev, role: value as AdminData['role'] }) : null)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content-manager">Content Manager</SelectItem>
                    <SelectItem value="finance-manager">Finance Manager</SelectItem>
                    <SelectItem value="audit-manager">Audit Manager</SelectItem>
                    {admin.role === 'super-admin' && (
                      <SelectItem value="super-admin">Super Administrator</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedAdmin.status || 'active'} 
                  onValueChange={(value) => setSelectedAdmin(prev => prev ? ({ ...prev, status: value }) : null)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateAdmin} className="flex-1">
                  Update Administrator
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};