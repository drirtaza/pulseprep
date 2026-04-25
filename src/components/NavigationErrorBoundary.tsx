import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  navigationType: string;
}

export default function NavigationErrorBoundary({ children, navigationType }: Props) {
  return (
    <ErrorBoundary context={`navigation-${navigationType}`}>
      {children}
    </ErrorBoundary>
  );
}