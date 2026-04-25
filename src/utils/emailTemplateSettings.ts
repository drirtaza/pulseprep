// Email Template Settings Interface
export interface EmailTemplate {
  id: string;
  name: string;
  category: 'authentication' | 'payment' | 'system' | 'marketing';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: EmailVariable[];
  isActive: boolean;
  lastModified: string;
  modifiedBy: string;
}

export interface EmailVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface EmailTemplateSettings {
  // SMTP Configuration
  smtpSettings: {
    host: string;
    port: number;
    secure: boolean; // true for SSL, false for TLS
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
  };
  
  // Email Templates
  templates: EmailTemplate[];
  
  // Email Signature
  signature: {
    html: string;
    text: string;
    includeInAll: boolean;
  };
  
  // Notification Settings
  notifications: {
    welcomeEmail: boolean;
    paymentConfirmation: boolean;
    passwordReset: boolean;
    emailVerification: boolean;
    adminAlerts: boolean;
    systemMaintenance: boolean;
    examReminders: boolean;
    certificateReady: boolean;
  };
  
  // Email Performance
  tracking: {
    enableTracking: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
  };
  
  // Admin Metadata
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

// Default Email Templates
export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    category: 'authentication',
    subject: 'Welcome to {{platformName}} - Your Medical Exam Journey Begins!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; font-size: 28px; margin: 0;">Welcome to {{platformName}}!</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">Your Medical Exam Success Partner</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; font-size: 20px; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              Congratulations on joining {{platformName}}! We're thrilled to have you as part of our medical education community.
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              You've taken the first step towards mastering your {{specialty}} specialty with our comprehensive exam preparation platform.
            </p>
          </div>
          
          <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1E40AF; margin-top: 0; margin-bottom: 15px;">What's Next?</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your email verification</li>
              <li style="margin-bottom: 8px;">Upload your payment confirmation</li>
              <li style="margin-bottom: 8px;">Start practicing with thousands of MCQs</li>
              <li style="margin-bottom: 8px;">Take mock exams to assess your progress</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{platformUrl}}/dashboard" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Need help? Contact our support team at {{supportEmail}}
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Welcome to {{platformName}}!

Hello {{userName}},

Congratulations on joining {{platformName}}! We're thrilled to have you as part of our medical education community.

You've taken the first step towards mastering your {{specialty}} specialty with our comprehensive exam preparation platform.

What's Next?
- Complete your email verification
- Upload your payment confirmation  
- Start practicing with thousands of MCQs
- Take mock exams to assess your progress

Access your dashboard: {{platformUrl}}/dashboard

Need help? Contact our support team at {{supportEmail}}

Best regards,
The {{platformName}} Team
    `,
    variables: [
      { name: 'platformName', description: 'Name of the platform', example: 'PulsePrep', required: true },
      { name: 'userName', description: 'User\'s full name', example: 'Dr. Sarah Ahmed', required: true },
      { name: 'specialty', description: 'User\'s chosen specialty', example: 'Medicine', required: true },
      { name: 'platformUrl', description: 'Platform website URL', example: 'https://pulseprep.com', required: true },
      { name: 'supportEmail', description: 'Support email address', example: 'support@pulseprep.com', required: true }
    ],
    isActive: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'System'
  },
  {
    id: 'payment-confirmation',
    name: 'Payment Confirmation',
    category: 'payment',
    subject: 'Payment Confirmed - Welcome to {{platformName}}! 🎉',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #10B981; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">✓</div>
            <h1 style="color: #059669; font-size: 24px; margin: 0;">Payment Confirmed!</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">Your account is now fully activated</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; font-size: 18px; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              Great news! Your payment has been verified and your {{platformName}} account is now fully activated.
            </p>
          </div>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 15px;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Amount:</td>
                <td style="padding: 8px 0; color: #1F2937; font-weight: bold; border-bottom: 1px solid #E5E7EB;">{{paymentAmount}} {{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Transaction ID:</td>
                <td style="padding: 8px 0; color: #1F2937; font-weight: bold; border-bottom: 1px solid #E5E7EB;">{{transactionId}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #E5E7EB;">Date:</td>
                <td style="padding: 8px 0; color: #1F2937; font-weight: bold; border-bottom: 1px solid #E5E7EB;">{{paymentDate}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Specialty:</td>
                <td style="padding: 8px 0; color: #1F2937; font-weight: bold;">{{specialty}}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1E40AF; margin-top: 0; margin-bottom: 15px;">You Now Have Access To:</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">🧠 Thousands of specialty-specific MCQs</li>
              <li style="margin-bottom: 8px;">📚 Comprehensive study materials</li>
              <li style="margin-bottom: 8px;">🎯 Mock exams with detailed feedback</li>
              <li style="margin-bottom: 8px;">📊 Progress tracking and analytics</li>
              <li style="margin-bottom: 8px;">🏆 Performance certificates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{platformUrl}}/dashboard" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start Learning Now
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Questions? We're here to help at {{supportEmail}}
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Payment Confirmed! ✓

Hello {{userName}},

Great news! Your payment has been verified and your {{platformName}} account is now fully activated.

Payment Details:
- Amount: {{paymentAmount}} {{currency}}
- Transaction ID: {{transactionId}}
- Date: {{paymentDate}}
- Specialty: {{specialty}}

You Now Have Access To:
- Thousands of specialty-specific MCQs
- Comprehensive study materials
- Mock exams with detailed feedback
- Progress tracking and analytics
- Performance certificates

Start learning: {{platformUrl}}/dashboard

Questions? We're here to help at {{supportEmail}}

Best regards,
The {{platformName}} Team
    `,
    variables: [
      { name: 'platformName', description: 'Name of the platform', example: 'PulsePrep', required: true },
      { name: 'userName', description: 'User\'s full name', example: 'Dr. Sarah Ahmed', required: true },
      { name: 'specialty', description: 'User\'s chosen specialty', example: 'Medicine', required: true },
      { name: 'paymentAmount', description: 'Payment amount', example: '2500', required: true },
      { name: 'currency', description: 'Payment currency', example: 'PKR', required: true },
      { name: 'transactionId', description: 'Transaction reference', example: 'TXN123456789', required: true },
      { name: 'paymentDate', description: 'Payment confirmation date', example: '2024-01-15', required: true },
      { name: 'platformUrl', description: 'Platform website URL', example: 'https://pulseprep.com', required: true },
      { name: 'supportEmail', description: 'Support email address', example: 'support@pulseprep.com', required: true }
    ],
    isActive: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'System'
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    category: 'authentication',
    subject: 'Reset Your {{platformName}} Password',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #F59E0B; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">🔒</div>
            <h1 style="color: #D97706; font-size: 24px; margin: 0;">Password Reset Request</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">Secure your account</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; font-size: 18px; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              We received a request to reset the password for your {{platformName}} account.
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              If you made this request, click the button below to reset your password. This link will expire in {{expirationTime}}.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{resetLink}}" style="background-color: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #92400E; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged. For security concerns, contact us at {{supportEmail}}.
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3B82F6; font-size: 14px; word-break: break-all; margin: 5px 0 0 0;">
              {{resetLink}}
            </p>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              This request was made from IP: {{userIP}} at {{requestTime}}
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Password Reset Request

Hello {{userName}},

We received a request to reset the password for your {{platformName}} account.

If you made this request, use this link to reset your password:
{{resetLink}}

This link will expire in {{expirationTime}}.

Security Notice: If you didn't request this password reset, please ignore this email. Your password will remain unchanged. For security concerns, contact us at {{supportEmail}}.

This request was made from IP: {{userIP}} at {{requestTime}}

Best regards,
The {{platformName}} Team
    `,
    variables: [
      { name: 'platformName', description: 'Name of the platform', example: 'PulsePrep', required: true },
      { name: 'userName', description: 'User\'s full name', example: 'Dr. Sarah Ahmed', required: true },
      { name: 'resetLink', description: 'Password reset URL', example: 'https://pulseprep.com/reset/abc123', required: true },
      { name: 'expirationTime', description: 'Link expiration time', example: '24 hours', required: true },
      { name: 'userIP', description: 'User\'s IP address', example: '192.168.1.1', required: false },
      { name: 'requestTime', description: 'Time of request', example: '2024-01-15 10:30 AM', required: false },
      { name: 'supportEmail', description: 'Support email address', example: 'support@pulseprep.com', required: true }
    ],
    isActive: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'System'
  },
  {
    id: 'email-verification',
    name: 'Email Verification',
    category: 'authentication',
    subject: 'Verify Your Email Address - {{platformName}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #3B82F6; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">✉️</div>
            <h1 style="color: #1E40AF; font-size: 24px; margin: 0;">Verify Your Email</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">Complete your {{platformName}} registration</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; font-size: 18px; margin-bottom: 15px;">Hello {{userName}},</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              Thank you for signing up for {{platformName}}! To complete your registration and access your account, please verify your email address.
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              Use the verification code below to verify your email address:
            </p>
          </div>
          
          <div style="background-color: #EFF6FF; padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <h3 style="color: #1E40AF; margin-top: 0; margin-bottom: 20px; font-size: 18px;">Verification Code</h3>
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px dashed #3B82F6; display: inline-block; margin-bottom: 15px;">
              <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1E40AF; letter-spacing: 8px; text-align: center;">
                {{verificationCode}}
              </div>
            </div>
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              ⏰ This code will expire in {{expirationTime}} for security reasons
            </p>
          </div>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 15px; font-size: 16px;">What's Next?</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Enter the verification code on the website</li>
              <li style="margin-bottom: 8px;">Complete your payment verification</li>
              <li style="margin-bottom: 8px;">Start practicing with thousands of MCQs</li>
              <li style="margin-bottom: 8px;">Take mock exams to assess your progress</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{verificationUrl}}" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #92400E; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you didn't create an account with {{platformName}}, please ignore this email. For security concerns, contact us at {{supportEmail}}.
            </p>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Need help? Contact our support team at {{supportEmail}}
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Verify Your Email Address - {{platformName}}

Hello {{userName}},

Thank you for signing up for {{platformName}}! To complete your registration and access your account, please verify your email address.

Verification Code: {{verificationCode}}

This code will expire in {{expirationTime}} for security reasons.

What's Next?
- Enter the verification code on the website
- Complete your payment verification
- Start practicing with thousands of MCQs
- Take mock exams to assess your progress

Verify your email: {{verificationUrl}}

Security Notice: If you didn't create an account with {{platformName}}, please ignore this email. For security concerns, contact us at {{supportEmail}}.

Need help? Contact our support team at {{supportEmail}}

Best regards,
The {{platformName}} Team
    `,
    variables: [
      { name: 'platformName', description: 'Name of the platform', example: 'PulsePrep', required: true },
      { name: 'userName', description: 'User\'s full name', example: 'Dr. Sarah Ahmed', required: true },
      { name: 'verificationCode', description: '6-digit verification code', example: '123456', required: true },
      { name: 'expirationTime', description: 'Code expiration time', example: '15 minutes', required: true },
      { name: 'verificationUrl', description: 'Verification page URL', example: 'https://pulseprep.com/verify', required: true },
      { name: 'supportEmail', description: 'Support email address', example: 'support@pulseprep.com', required: true }
    ],
    isActive: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'System'
  },
  {
    id: 'admin-alert',
    name: 'Admin System Alert',
    category: 'system',
    subject: '🚨 {{platformName}} System Alert: {{alertType}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #EF4444; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">🚨</div>
            <h1 style="color: #DC2626; font-size: 24px; margin: 0;">System Alert</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">{{alertType}} - {{severity}} Priority</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; font-size: 18px; margin-bottom: 15px;">Alert Details</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              <strong>Time:</strong> {{alertTime}}<br>
              <strong>System:</strong> {{systemComponent}}<br>
              <strong>Severity:</strong> {{severity}}<br>
              <strong>Status:</strong> {{status}}
            </p>
          </div>
          
          <div style="background-color: #FEF2F2; border: 1px solid #EF4444; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #DC2626; margin-top: 0; margin-bottom: 15px;">Description</h3>
            <p style="color: #7F1D1D; margin: 0; line-height: 1.6;">
              {{alertDescription}}
            </p>
          </div>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1F2937; margin-top: 0; margin-bottom: 15px;">Technical Details</h3>
            <pre style="color: #374151; font-family: monospace; font-size: 12px; margin: 0; white-space: pre-wrap;">{{technicalDetails}}</pre>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{dashboardUrl}}" style="background-color: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Admin Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              This is an automated system alert from {{platformName}}
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
🚨 System Alert: {{alertType}}

Alert Details:
- Time: {{alertTime}}
- System: {{systemComponent}}
- Severity: {{severity}}
- Status: {{status}}

Description:
{{alertDescription}}

Technical Details:
{{technicalDetails}}

View Admin Dashboard: {{dashboardUrl}}

This is an automated system alert from {{platformName}}.
    `,
    variables: [
      { name: 'platformName', description: 'Name of the platform', example: 'PulsePrep', required: true },
      { name: 'alertType', description: 'Type of alert', example: 'High CPU Usage', required: true },
      { name: 'severity', description: 'Alert severity level', example: 'High', required: true },
      { name: 'alertTime', description: 'When alert occurred', example: '2024-01-15 10:30 AM', required: true },
      { name: 'systemComponent', description: 'Affected system component', example: 'Database Server', required: true },
      { name: 'status', description: 'Current status', example: 'Active', required: true },
      { name: 'alertDescription', description: 'Alert description', example: 'CPU usage exceeded 90% threshold', required: true },
      { name: 'technicalDetails', description: 'Technical information', example: 'Error logs and stack traces', required: false },
      { name: 'dashboardUrl', description: 'Admin dashboard URL', example: 'https://pulseprep.com/admin', required: true }
    ],
    isActive: true,
    lastModified: new Date().toISOString(),
    modifiedBy: 'System'
  }
];

// Default Email Template Settings
export const defaultEmailTemplateSettings: EmailTemplateSettings = {
  smtpSettings: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: 'noreply@pulseprep.com',
    fromName: 'PulsePrep',
    replyTo: 'support@pulseprep.com'
  },
  
  templates: defaultEmailTemplates,
  
  signature: {
    html: `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          Best regards,<br>
          <strong>The PulsePrep Team</strong><br>
          <a href="https://pulseprep.com" style="color: #3B82F6;">https://pulseprep.com</a><br>
          📧 support@pulseprep.com | 📞 +92-300-1234567
        </p>
      </div>
    `,
    text: `
Best regards,
The PulsePrep Team
https://pulseprep.com
support@pulseprep.com | +92-300-1234567
    `,
    includeInAll: true
  },
  
  notifications: {
    welcomeEmail: true,
    paymentConfirmation: true,
    passwordReset: true,
    emailVerification: true,
    adminAlerts: true,
    systemMaintenance: false,
    examReminders: true,
    certificateReady: true
  },
  
  tracking: {
    enableTracking: false,
    trackOpens: false,
    trackClicks: false
  },
  
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: 1
};

// Email Template Settings Functions
export const initializeEmailTemplateSettings = (): EmailTemplateSettings => {
  const existingSettings = localStorage.getItem('pulseprep_email_template_settings');
  
  if (existingSettings) {
    try {
      const parsed = JSON.parse(existingSettings);
      // Merge with defaults to ensure all new fields exist
      return {
        ...defaultEmailTemplateSettings,
        ...parsed,
        // Ensure nested objects are properly merged
        smtpSettings: {
          ...defaultEmailTemplateSettings.smtpSettings,
          ...parsed.smtpSettings
        },
        signature: {
          ...defaultEmailTemplateSettings.signature,
          ...parsed.signature
        },
        notifications: {
          ...defaultEmailTemplateSettings.notifications,
          ...parsed.notifications
        },
        tracking: {
          ...defaultEmailTemplateSettings.tracking,
          ...parsed.tracking
        },
        // Ensure templates array exists and includes defaults
        templates: parsed.templates || defaultEmailTemplateSettings.templates
      };
    } catch (error) {
      console.error('Error parsing email template settings, using defaults:', error);
      localStorage.setItem('pulseprep_email_template_settings', JSON.stringify(defaultEmailTemplateSettings));
      return defaultEmailTemplateSettings;
    }
  }
  
  // Save default settings
  localStorage.setItem('pulseprep_email_template_settings', JSON.stringify(defaultEmailTemplateSettings));
  return defaultEmailTemplateSettings;
};

export const updateEmailTemplateSettings = (newSettings: EmailTemplateSettings, updatedBy: string): void => {
  const updatedSettings = {
    ...newSettings,
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedBy,
    version: (newSettings.version || 0) + 1
  };
  
  localStorage.setItem('pulseprep_email_template_settings', JSON.stringify(updatedSettings));
  
  // Log the change for audit
  console.log('📧 Email template settings updated by:', updatedBy, {
    version: updatedSettings.version,
    templatesCount: updatedSettings.templates.length,
    smtpConfigured: !!updatedSettings.smtpSettings.username
  });
};

export const getEmailTemplateSettings = (): EmailTemplateSettings => {
  return initializeEmailTemplateSettings();
};

export const getEmailTemplate = (templateId: string): EmailTemplate | null => {
  const settings = getEmailTemplateSettings();
  return settings.templates.find(template => template.id === templateId && template.isActive) || null;
};

export const processEmailTemplate = (
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; htmlContent: string; textContent: string } => {
  let processedSubject = template.subject;
  let processedHtmlContent = template.htmlContent;
  let processedTextContent = template.textContent;

  // Replace variables in subject
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
  });

  // Replace variables in HTML content
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedHtmlContent = processedHtmlContent.replace(new RegExp(placeholder, 'g'), value);
  });

  // Replace variables in text content
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedTextContent = processedTextContent.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    subject: processedSubject,
    htmlContent: processedHtmlContent,
    textContent: processedTextContent
  };
};

/**
 * Process email verification template with specialized styling
 */
export const processVerificationEmailTemplate = (
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; htmlContent: string; textContent: string } => {
  // First process the template normally
  const processed = processEmailTemplate(template, variables);
  
  // Add verification-specific styling enhancements
  const enhancedHtmlContent = processed.htmlContent
    // Add responsive design improvements
    .replace(/max-width: 600px/g, 'max-width: 600px; width: 100%;')
    // Add better mobile support
    .replace(/font-family: Arial, sans-serif/g, 'font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;')
    // Add better email client compatibility
    .replace(/background-color: #EFF6FF/g, 'background-color: #EFF6FF; mso-background-color: #EFF6FF;')
    .replace(/background-color: #3B82F6/g, 'background-color: #3B82F6; mso-background-color: #3B82F6;')
    // Add fallback fonts for better email client support
    .replace(/font-family: 'Courier New', monospace/g, 'font-family: "Courier New", Courier, monospace;')
    // Add better button styling for email clients
    .replace(/display: inline-block/g, 'display: inline-block; mso-line-height-rule: exactly;')
    // Add table-based layout for better email client support
    .replace(/<div style="text-align: center; margin-bottom: 25px;">/g, '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 25px;"><tr><td style="text-align: center;">')
    .replace(/<\/div>/g, '</td></tr></table>');
  
  return {
    subject: processed.subject,
    htmlContent: enhancedHtmlContent,
    textContent: processed.textContent
  };
};

/**
 * Get verification email template with default variables
 */
export const getVerificationEmailTemplate = (
  verificationCode: string,
  userName: string,
  platformName: string = 'PulsePrep',
  expirationTime: string = '15 minutes',
  verificationUrl: string = 'https://pulseprep.com/verify',
  supportEmail: string = 'support@pulseprep.com'
): { subject: string; htmlContent: string; textContent: string } => {
  const template = getEmailTemplate('email-verification');
  
  if (!template) {
    throw new Error('Email verification template not found');
  }
  
  const variables = {
    platformName,
    userName,
    verificationCode,
    expirationTime,
    verificationUrl,
    supportEmail
  };
  
  return processVerificationEmailTemplate(template, variables);
};

/**
 * Validate verification email template variables
 */
export const validateVerificationEmailVariables = (variables: Record<string, string>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredVariables = ['platformName', 'userName', 'verificationCode', 'expirationTime', 'verificationUrl', 'supportEmail'];
  
  requiredVariables.forEach(variable => {
    if (!variables[variable] || variables[variable].trim() === '') {
      errors.push(`Missing required variable: ${variable}`);
    }
  });
  
  // Validate verification code format (6 digits)
  if (variables.verificationCode && !/^\d{6}$/.test(variables.verificationCode)) {
    errors.push('Verification code must be exactly 6 digits');
  }
  
  // Validate email format for support email
  if (variables.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(variables.supportEmail)) {
    errors.push('Support email must be a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email sending function (mock implementation)
export const sendEmail = async (
  to: string,
  templateId: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const template = getEmailTemplate(templateId);
    if (!template) {
      throw new Error(`Email template '${templateId}' not found`);
    }
    
    const processedEmail = processEmailTemplate(template, variables);
    const settings = getEmailTemplateSettings();
    
    // Mock email sending - in real implementation, use nodemailer or similar
    console.log('📧 Sending email:', {
      to,
      from: `${settings.smtpSettings.fromName} <${settings.smtpSettings.fromEmail}>`,
      subject: processedEmail.subject,
      templateId,
      variables
    });
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock success response
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};