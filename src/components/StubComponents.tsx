// Stub implementations for missing components
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

// Generic stub component
function StubComponent({ 
  title, 
  children, 
  onNavigate 
}: { 
  title: string; 
  children?: ReactNode;
  onNavigate?: (page: string) => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This feature is under development.
          </p>
          {children}
          {onNavigate && (
            <Button onClick={() => onNavigate('home')}>
              Return Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export all stub components
export const SignUpPage = ({ onNavigate }: any) => 
  <StubComponent title="Sign Up" onNavigate={onNavigate} />;

export const EmailVerificationPage = ({ onNavigate }: any) => 
  <StubComponent title="Email Verification" onNavigate={onNavigate} />;

export const PaymentPage = ({ onNavigate }: any) => 
  <StubComponent title="Payment" onNavigate={onNavigate} />;

export const FinalFormPage = ({ onNavigate }: any) => 
  <StubComponent title="Final Form" onNavigate={onNavigate} />;

export const ForgotPasswordPage = ({ onNavigate }: any) => 
  <StubComponent title="Forgot Password" onNavigate={onNavigate} />;

export const AdminLoginPage = ({ onNavigate }: any) => 
  <StubComponent title="Admin Login" onNavigate={onNavigate} />;

export const PaymentPendingPage = ({ onNavigate }: any) => 
  <StubComponent title="Payment Pending" onNavigate={onNavigate} />;

export const AboutPage = ({ onNavigate }: any) => 
  <StubComponent title="About PulsePrep" onNavigate={onNavigate} />;

export const ContactPage = ({ onNavigate }: any) => 
  <StubComponent title="Contact Us" onNavigate={onNavigate} />;

// Dashboard stubs
export const MedicineDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Medicine Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const SurgeryDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Surgery Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const GynaeDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Gynae Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

// Admin dashboard stubs
export const FinanceManagerDashboard = ({ onLogout }: any) => 
  <StubComponent title="Finance Manager Dashboard">
    <Button onClick={onLogout}>Logout</Button>
  </StubComponent>;

export const SuperAdminDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Super Admin Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const AuditManagerDashboard = ({ onLogout }: any) => 
  <StubComponent title="Audit Manager Dashboard">
    <Button onClick={onLogout}>Logout</Button>
  </StubComponent>;

export const ContentManagerDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Content Manager Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

// Other component stubs
export const MCQInterface = ({ onNavigate }: any) => 
  <StubComponent title="MCQ Interface" onNavigate={onNavigate} />;

export const MockExamInstructionsPage = ({ onNavigate }: any) => 
  <StubComponent title="Mock Exam Instructions" onNavigate={onNavigate} />;

export const MockExamResultsPage = ({ onNavigate }: any) => 
  <StubComponent title="Mock Exam Results" onNavigate={onNavigate} />;

export const MockExamReviewPage = ({ onNavigate }: any) => 
  <StubComponent title="Mock Exam Review" onNavigate={onNavigate} />;

export const AnalyticsDashboard = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Analytics Dashboard" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const ReportsPage = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Reports" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const AdvancedAnalytics = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Advanced Analytics" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const CustomReportBuilder = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Custom Report Builder" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;

export const BookmarkReviewPage = ({ onNavigate, onLogout }: any) => 
  <StubComponent title="Bookmark Review" onNavigate={onNavigate}>
    <Button onClick={onLogout} className="mr-2">Logout</Button>
  </StubComponent>;