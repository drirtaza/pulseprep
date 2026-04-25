# 🔒 PulsePrep Security System Guide

## How to Access Security Features

### 1. **Admin Login**
- Use **Ctrl+Alt+A** or **Ctrl+Shift+A** to access admin login
- OR click the logo 5 times quickly
- OR hold Ctrl and double-click anywhere
- Login with super-admin credentials

### 2. **Security Dashboard Access**
Once logged in as Super Admin, you can access the Security Dashboard in several ways:

#### From Quick Actions (Bottom of Dashboard):
- Look for the **"Security Dashboard"** button with an eye icon
- Shows red notification badge if there are unresolved security alerts

#### From SuperAdmin Navigation:
- The button will show the number of unresolved alerts if any exist

### 3. **Security Features You Can View**

#### **Overview Tab**
- **Security Metrics**: Total logins, failed logins, security alerts, active users
- **Real-time Statistics**: Live security data and system health
- **Top Failed Login Attempts**: See which accounts are being targeted
- **Alert Types Distribution**: Breakdown of different security issues

#### **Security Alerts Tab**
- **Real-time Alerts**: Failed logins, suspicious activity, permission violations
- **Alert Management**: Resolve, dismiss, and track alert status
- **Severity Levels**: Critical, High, Medium, Low priority alerts
- **Alert Details**: Full context including IP addresses, timestamps, and user agents

#### **Audit Logs Tab**
- **Complete Activity Log**: Every user and admin action is tracked
- **Search & Filter**: Find specific actions, users, or time periods
- **Action Types**: Login/logout, user management, system operations, content changes
- **Detailed Metadata**: IP addresses, session IDs, timestamps, and context

#### **Active Sessions Tab**
- **Live Session Monitoring**: See all active user and admin sessions
- **Session Details**: Start time, last activity, IP address, user agent
- **Session Management**: Track session duration and activity
- **Concurrent Session Detection**: Identify unusual login patterns

### 4. **Automatic Security Features**

#### **Role-Based Access Control**
- **Super Admin**: Full access to all features
- **Finance Manager**: Financial data and user management
- **Content Manager**: Content and user data access
- **Automatic Permission Checking**: Components automatically hide/show based on user role

#### **Audit Logging (Background)**
- **User Actions**: Signup, login, logout, practice sessions, mock exams
- **Admin Actions**: User management, system operations, report generation
- **System Events**: Backups, security scans, configuration changes
- **Auto-Storage**: All events stored in localStorage with cleanup

#### **Session Management**
- **Auto-Logout**: Sessions timeout after 60 minutes of inactivity
- **Session Warnings**: Users get warned before timeout
- **Session Tracking**: Every session is monitored and logged
- **IP Monitoring**: Track login locations and detect anomalies

#### **Security Monitoring**
- **Failed Login Tracking**: Automatic account lockout after 5 failed attempts
- **Suspicious Activity Detection**: Rapid actions, unusual IP changes
- **Real-time Alerts**: Instant notifications for security events
- **Permission Violations**: Logged when users try to access restricted areas

### 5. **Security Reports & Export**

#### **Export Security Data**
- Click **"Export"** button in Security Dashboard
- Downloads comprehensive JSON report with:
  - All audit logs
  - Security alerts
  - Login attempts
  - System metrics

#### **Security Report Types**
- **Live Dashboard**: Real-time security monitoring
- **Historical Analysis**: Date-range filtered security data
- **User Activity Reports**: Individual user behavior analysis
- **System Health Reports**: Overall security posture

### 6. **Testing the Security System**

#### **Generate Test Data**
1. **Login/Logout** multiple times to see audit logs
2. **Start Practice Sessions** to generate user activity logs
3. **Try Admin Functions** to see admin action logs
4. **Invalid Login Attempts** to trigger security alerts

#### **View Security Data**
1. **Access Security Dashboard** from SuperAdmin panel
2. **Browse Different Tabs** to see various security aspects
3. **Filter and Search** audit logs and alerts
4. **Export Reports** to see comprehensive security data

### 7. **Security Storage**

All security data is stored in localStorage with these keys:
- `pulseprep_audit_logs` - Complete audit trail
- `pulseprep_security_alerts` - Security alerts and incidents
- `pulseprep_login_attempts` - Login attempt history
- `pulseprep_security_sessions` - Active session tracking
- `pulseprep_locked_accounts` - Account lockout data

### 8. **Real-Time Features**

- **Auto-Refresh**: Security dashboard refreshes every 30 seconds
- **Live Alerts**: New security alerts appear immediately
- **Session Monitoring**: Active session tracking with timeout warnings
- **Background Logging**: All user actions automatically logged

---

## 🚀 Quick Start

1. **Access Admin**: Use `Ctrl+Alt+A`
2. **Login as Super Admin**: Use test credentials
3. **Click "Security Dashboard"** from Quick Actions
4. **Explore Each Tab**: Overview → Alerts → Audit Logs → Sessions
5. **Generate Activity**: Login/logout, use features to see logs
6. **Export Report**: Download comprehensive security data

The security system is now fully operational and monitoring all platform activity! 🛡️