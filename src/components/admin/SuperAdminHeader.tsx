import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Menu,
  Bell,
  RefreshCw,
  User,
  Settings,
  LogOut,
  Shield,
  Crown,
  DollarSign,
  BookText,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { AdminData } from '../../types';

interface NavigationItem {
  id: string;
  label: string;
  description: string;
}

interface SuperAdminHeaderProps {
  admin: AdminData;
  activeTab: string;
  onRefresh: () => void;
  onLogout: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarCollapsed: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  totalPendingApprovals?: number;
  onNavigateToSettings?: () => void;
  onNavigateToProfile?: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  admin,
  activeTab,
  onRefresh,
  onLogout,
  setSidebarCollapsed,
  sidebarCollapsed,
  setMobileMenuOpen,
  totalPendingApprovals = 0,
  onNavigateToSettings,
  onNavigateToProfile
}) => {
  const navigationItems: NavigationItem[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      description: 'Command center'
    },
    { 
      id: 'users', 
      label: 'Users', 
      description: 'Customer success'
    },
    { 
      id: 'admins', 
      label: 'Admins', 
      description: 'Team oversight'
    },
    { 
      id: 'content', 
      label: 'Content', 
      description: 'Editorial workflow'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      description: 'System configuration'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      description: 'Business intelligence'
    },
    { 
      id: 'security', 
      label: 'Security', 
      description: 'Security operations'
    }
  ];

  const currentPage = navigationItems.find(item => item.id === activeTab);

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
        return <User className="h-4 w-4" />;
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

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Page info and controls */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button - only visible on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Page title and description */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900 capitalize">
                {currentPage?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {currentPage?.description || 'Admin interface'}
              </p>
            </div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center gap-4">
            {/* Refresh button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              className="hidden sm:flex text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hidden sm:flex text-gray-400 hover:text-gray-600"
            >
              <Bell className="h-4 w-4" />
              {totalPendingApprovals > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalPendingApprovals > 99 ? '99+' : totalPendingApprovals}
                </span>
              )}
            </Button>

            {/* User menu - visible on both mobile and desktop */}
            <div className="flex items-center gap-3">
              {/* User info - hidden on mobile */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getRoleColor(admin.role)}`}
                >
                  <span className="flex items-center gap-1">
                    {getRoleIcon(admin.role)}
                    {getRoleName(admin.role)}
                  </span>
                </Badge>
              </div>

              {/* User avatar and dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium hover:from-blue-500 hover:to-blue-700"
                  >
                    {admin.name.charAt(0).toUpperCase()}
                    <ChevronDown className="absolute -bottom-1 -right-1 h-3 w-3 bg-gray-100 text-gray-600 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{admin.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {admin.email}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-fit mt-1 ${getRoleColor(admin.role)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getRoleIcon(admin.role)}
                          {getRoleName(admin.role)}
                        </span>
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Profile action */}
                  <DropdownMenuItem 
                    onClick={onNavigateToProfile}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  {/* Settings action - only for super admin */}
                  {admin.role === 'super-admin' && (
                    <DropdownMenuItem 
                      onClick={onNavigateToSettings}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}

                  {/* Mobile-only actions */}
                  <div className="sm:hidden">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onRefresh}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Refresh</span>
                    </DropdownMenuItem>
                    
                    {totalPendingApprovals > 0 && (
                      <DropdownMenuItem className="cursor-pointer">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                        <Badge className="ml-auto bg-red-500 text-white">
                          {totalPendingApprovals}
                        </Badge>
                      </DropdownMenuItem>
                    )}
                  </div>

                  <DropdownMenuSeparator />
                  
                  {/* Logout */}
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};