import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  authType: string;
}

export default function AuthErrorBoundary({ children, authType }: Props) {
  return (
    <ErrorBoundary context={`auth-${authType}`}>
      {children}
    </ErrorBoundary>
  );
}