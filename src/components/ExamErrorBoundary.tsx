import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  examType: string;
  hasProgress?: boolean;
}

export default function ExamErrorBoundary({ children, examType, hasProgress }: Props) {
  return (
    <ErrorBoundary context={`exam-${examType}-${hasProgress ? 'with-progress' : 'no-progress'}`}>
      {children}
    </ErrorBoundary>
  );
}