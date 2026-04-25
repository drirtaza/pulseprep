import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  dashboardType: string;
  userRole: string;
}

export default function DashboardErrorBoundary({ children, dashboardType, userRole }: Props) {
  return (
    <ErrorBoundary context={`${dashboardType}-dashboard-${userRole}`}>
      {children}
    </ErrorBoundary>
  );
}