import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  paymentType: string;
  hasPaymentData: boolean;
}

export default function PaymentErrorBoundary({ children, paymentType, hasPaymentData }: Props) {
  return (
    <ErrorBoundary context={`payment-${paymentType}-${hasPaymentData ? 'with-data' : 'no-data'}`}>
      {children}
    </ErrorBoundary>
  );
}