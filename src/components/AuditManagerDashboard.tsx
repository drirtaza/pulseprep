import React from 'react';
import { AdminData } from '../types';
import EnterpriseAuditDashboard from './EnterpriseAuditDashboard';

interface AuditManagerDashboardProps {
  admin: AdminData;
  onLogout: () => void;
}

const AuditManagerDashboard: React.FC<AuditManagerDashboardProps> = ({ admin, onLogout }) => {
  // Navigation handler for audit manager - currently only handles logout
  const handleNavigate = () => {
    // For audit managers, most navigation is handled within the audit dashboard
    // This can be extended to handle specific page navigation if needed

  };

  return (
    <EnterpriseAuditDashboard 
      admin={admin} 
      onNavigate={handleNavigate}
      onLogout={onLogout} 
    />
  );
};

export default AuditManagerDashboard;