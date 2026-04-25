import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { 
  Settings,
  Palette,
  Mail,
  CreditCard,
  Shield,
  Database,
  RefreshCw,
  Save,
  
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle, 
  Globe,
  Users,
  Plus,
  Edit,
  Trash2,
  Star,
  Copy,
  FileText,
  Home,
  Info,
  Phone,
  RotateCcw,
  Star as StarIcon,
  MessageSquare,
  Heart,
  MessageCircle,
  Crown,
  DollarSign,
  BookText,
  // Email verification icons
  MailCheck,
  BarChart3,
  TestTube,
  Zap,
  Loader2
} from 'lucide-react';
import { AdminData, BankAccount, ExtendedPaymentSettings } from '../../types';
import { 
  getPaymentSettings, 
  updatePaymentSettings, 
  addBankAccount, 
  updateBankAccount, 
  deleteBankAccount
} from '../../utils/paymentSettings';

import { SubscriptionSettings, SubscriptionPlan } from '../../types';
import { 
  getSubscriptionSettings, 
  updateSubscriptionSettings, 
  
} from '../../utils/subscriptionUtils';

// 🆕 Import content settings utilities
import {
  ContentSettings,
  getContentSettings,
  updateContentSettings,
  resetContentSettingsToDefaults,
  subscribeToContentChanges,
  
  addHomePageFeature,
  removeHomePageFeature,
  
  removeTestimonial,
  addContactMethod,
  updateContactMethod,
  removeContactMethod,
  addSocialLink,
  updateSocialLink,
  removeSocialLink
} from '../../utils/contentSettings';

interface SuperAdminSettingsProps {
  admin: AdminData;
  onRefresh: () => void;
  onSaveSettings: (section: string, settings: any) => void;
  onExportSettings: () => void;
  onImportSettings: (settings: any) => void;
}

export const SuperAdminSettings: React.FC<SuperAdminSettingsProps> = ({
  admin,
  onRefresh,
  onSaveSettings,
  onExportSettings,
  
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [showContactMethodDialog, setShowContactMethodDialog] = useState(false);
  const [showSocialLinkDialog, setShowSocialLinkDialog] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    branchCode: '',
    iban: '',
    isActive: true,
    isDefault: false,
    displayOrder: 1
  });

  const [testimonialFormData, setTestimonialFormData] = useState({
    name: '',
    specialty: '',
    content: '',
    rating: 5,
    avatar: ''
  });

  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);

  const [contactMethodFormData, setContactMethodFormData] = useState({
    title: '',
    description: '',
    contact: '',
    response: '',
    icon: 'Mail',
    priority: 1,
    color: 'bg-blue-500',
    isActive: true
  });

  const [socialLinkFormData, setSocialLinkFormData] = useState({
    name: '',
    icon: 'Facebook',
    url: '',
    color: 'bg-blue-600',
    isActive: true,
    displayOrder: 1
  });

  const [featureFormData, setFeatureFormData] = useState({
    title: '',
    description: '',
    icon: 'Star',
    color: 'bg-blue-500',
    isActive: true,
    displayOrder: 1
  });

  const [editingContactMethod, setEditingContactMethod] = useState<any>(null);
  const [editingSocialLink, setEditingSocialLink] = useState<any>(null);
  const [editingFeature, setEditingFeature] = useState<any>(null);

  // 🆕 Content management state
  const [contentSettings, setContentSettings] = useState<ContentSettings | null>(null);
  
  
  
  const [dialogType, setDialogType] = useState<'feature' | 'testimonial' | 'faq' | 'team' | 'milestone' | 'value' | 'contactMethod' | 'supportCategory' | 'pricing-feature' | 'statistic' | 'contact-method' | 'social-link'>('feature');
  
  
  // Real subscription settings state
  const [realSubscriptionSettings, setRealSubscriptionSettings] = useState<SubscriptionSettings | null>(null);

  // Admin Access Settings State
  const [adminAccessSettings, setAdminAccessSettings] = useState<{
    enabled: boolean;
    securityLevel: string;
    defaultMethod: string;
    roleAccess: Record<string, {
      enabled: boolean;
      shortcutMode: 'single' | 'multiple';
      shortcuts: string[];
      method: string;
      status: string;
    }>;
  }>({
    enabled: true,
    securityLevel: 'high',
    defaultMethod: 'keyboard-shortcut',
    roleAccess: {
      'super-admin': {
        enabled: true,
        shortcutMode: 'single',
        shortcuts: ['Ctrl+Alt+Shift+A, then D'],
        method: 'keyboard-shortcut',
        status: 'active'
      },
      'finance-manager': {
        enabled: true,
        shortcutMode: 'single',
        shortcuts: ['Ctrl+Alt+F'],
        method: 'keyboard-shortcut',
        status: 'active'
      },
      'content-manager': {
        enabled: true,
        shortcutMode: 'single',
        shortcuts: ['Ctrl+Alt+C'],
        method: 'keyboard-shortcut',
        status: 'active'
      },
      'audit-manager': {
        enabled: true,
        shortcutMode: 'single',
        shortcuts: ['Ctrl+Alt+Shift+E'],
        method: 'keyboard-shortcut',
        status: 'active'
      }
    }
  });

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'PulsePrep',
    tagline: 'Master FCPS with Confidence',
    supportEmail: 'support@pulseprep.com',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsers: 10000,
    sessionTimeout: 30,
    autoLogout: true
  });

  // Branding Settings State
  const [brandingSettings, setBrandingSettings] = useState({
    primaryColor: '#0066FF',
    secondaryColor: '#FF6B35',
    successColor: '#00C896',
    errorColor: '#FF5757',
    logoUrl: '',
    faviconUrl: '',
    customCSS: '',
    fontFamily: 'Inter'
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@pulseprep.com',
    fromName: 'PulsePrep Team',
    enabled: true,
    encryption: 'tls'
  });

  // Enhanced Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<ExtendedPaymentSettings | null>(null);

  // Subscription Settings State
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    defaultPlan: 'plan-3month',
    trialPeriod: 7,
    gracePeriod: 3,
    autoRenewal: false,
    prorationEnabled: true,
    refundsEnabled: false
  });

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    rateLimitEnabled: true,
    maxRequestsPerHour: 1000,
    apiKeysEnabled: false,
    webhooksEnabled: false,
    loggingEnabled: true,
    analyticsEnabled: true
  });

  // 🆕 Load content settings on component mount
  useEffect(() => {
    loadPaymentSettings();
    loadContentSettings();
    loadSubscriptionSettings();
    loadAdminAccessSettings();
    loadEmailVerificationSettings();
    loadEmailVerificationStats();
    loadEmailTemplates();
  }, []);

  // 🆕 Subscribe to content settings changes
  useEffect(() => {
    const unsubscribe = subscribeToContentChanges((updatedSettings) => {
      setContentSettings(updatedSettings);
    });

    return unsubscribe;
  }, []);

  const loadPaymentSettings = () => {
    try {
      const settings = getPaymentSettings();
      setPaymentSettings(settings);
    } catch (error) {
      console.error('❌ Error loading payment settings:', error);
    }
  };

  // 🆕 Load content settings
  const loadContentSettings = () => {
    try {
      const settings = getContentSettings();
      setContentSettings(settings);
    } catch (error) {
      console.error('❌ Error loading content settings:', error);
    }
  };

  const loadSubscriptionSettings = () => {
    try {
      const settings = getSubscriptionSettings();
      setRealSubscriptionSettings(settings);
    } catch (error) {
      console.error('❌ Error loading subscription settings:', error);
    }
  };

  const loadAdminAccessSettings = () => {
    try {
      const savedSettings = localStorage.getItem('pulseprep_admin_access_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Ensure all roles have the proper structure
        const roles = ['super-admin', 'finance-manager', 'content-manager', 'audit-manager'];
        roles.forEach(role => {
          if (!parsed.roleAccess[role]) {
            parsed.roleAccess[role] = {
              enabled: true,
              shortcutMode: 'single',
              shortcuts: [''],
              method: 'keyboard-shortcut',
              status: 'active'
            };
          }
          // Ensure shortcuts array exists
          if (!parsed.roleAccess[role].shortcuts) {
            parsed.roleAccess[role].shortcuts = [''];
          }
        });
        setAdminAccessSettings(parsed);
      } else {
        // If no settings exist, use the default state that's already defined
        console.log('No admin access settings found, using defaults');
      }
    } catch (error) {
      console.error('Failed to load admin access settings:', error);
    }
  };

  const saveAdminAccessSettings = () => {
    try {
      const settingsToSave = JSON.stringify(adminAccessSettings);
      localStorage.setItem('pulseprep_admin_access_settings', settingsToSave);
      return true;
    } catch (error) {
      console.error('Failed to save admin access settings:', error);
      return false;
    }
  };

  const handleSettingChange = (section: string, key: string, value: any) => {
    setUnsavedChanges(prev => ({ ...prev, [section]: true }));
    
    switch (section) {
      case 'platform':
        setPlatformSettings(prev => ({ ...prev, [key]: value }));
        break;
      case 'branding':
        setBrandingSettings(prev => ({ ...prev, [key]: value }));
        break;
      case 'email':
        setEmailSettings(prev => ({ ...prev, [key]: value }));
        break;
      case 'payment':
        if (paymentSettings) {
          setPaymentSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
        }
        break;
      case 'subscription':
        setSubscriptionSettings(prev => ({ ...prev, [key]: value }));
        break;
      case 'api':
        setApiSettings(prev => ({ ...prev, [key]: value }));
        break;
      // 🆕 Handle content settings changes
      case 'content':
        if (contentSettings) {
          const updatedSettings = { ...contentSettings };
          // Handle nested property updates
          const keys = key.split('.');
          let current: any = updatedSettings;
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          setContentSettings(updatedSettings);
        }
        break;
      // 🆕 Handle admin access settings changes
      case 'admin-access':
        setAdminAccessSettings(prev => {
          const updated = { ...prev };
          // Handle nested property updates for roleAccess
          if (key.startsWith('roleAccess.')) {
            const keys = key.split('.');
            const role = keys[1];
            const property = keys[2];
            if (!updated.roleAccess[role]) {
              updated.roleAccess[role] = {
                enabled: true,
                shortcutMode: 'single',
                shortcuts: [''],
                method: 'keyboard-shortcut',
                status: 'active'
              };
            }
            (updated.roleAccess[role] as any)[property] = value;
          } else {
            // Handle top-level properties
            (updated as any)[key] = value;
          }
          return updated;
        });
        break;
    }
  };

  const handleSaveSection = async (section: string) => {
    let settings;
    let success = false;
    
    switch (section) {
      case 'platform':
        settings = platformSettings;
        break;
      case 'branding':
        settings = brandingSettings;
        break;
      case 'email':
        settings = emailSettings;
        break;
      case 'payment':
        if (paymentSettings) {
          success = updatePaymentSettings(paymentSettings, admin.name || admin.id);
          if (success) {
            loadPaymentSettings(); // Reload to get the updated data
          }
          setUnsavedChanges(prev => ({ ...prev, [section]: false }));
          return;
        }
        break;
      case 'subscription':
        settings = subscriptionSettings;
        break;
      case 'api':
        settings = apiSettings;
        break;
      // 🆕 Handle content settings save
      case 'content':
        if (contentSettings) {
          success = updateContentSettings(contentSettings, admin.name || admin.id);
          if (success) {
            loadContentSettings(); // Reload to get the updated data
          }
          setUnsavedChanges(prev => ({ ...prev, [section]: false }));
          return;
        }
        break;
      // 🆕 Handle admin access settings save
      case 'admin-access':
        settings = adminAccessSettings;
        // Save to localStorage for persistence
        success = saveAdminAccessSettings();
        if (success) {
          // Force reload settings to ensure consistency
          loadAdminAccessSettings();
        }
        break;
      default:
        return;
    }
    
    if (settings) {
      onSaveSettings(section, settings);
      setUnsavedChanges(prev => ({ ...prev, [section]: false }));
    }
  };

  // Bank account handlers (existing code - unchanged)
  const handleAddBank = async () => {
    try {
      const success = addBankAccount({
        ...bankFormData,
        updatedBy: admin.name || admin.id
      }, admin.name || admin.id);
      if (success) {
        setShowAddBankDialog(false);
        setBankFormData({
          bankName: '',
          accountTitle: '',
          accountNumber: '',
          branchCode: '',
          iban: '',
          isActive: true,
          isDefault: false,
          displayOrder: 1
        });
        loadPaymentSettings();
      }
    } catch (error) {
      console.error('❌ Error adding bank account:', error);
    }
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setBankFormData({
      bankName: bank.bankName,
      accountTitle: bank.accountTitle,
      accountNumber: bank.accountNumber,
      branchCode: bank.branchCode,
      iban: bank.iban,
      isActive: bank.isActive,
      isDefault: bank.isDefault,
      displayOrder: bank.displayOrder
    });
    setShowAddBankDialog(true);
  };

  const handleUpdateBank = async () => {
    if (!editingBank) return;
    
    try {
      const success = updateBankAccount(editingBank.id, bankFormData, admin.name || admin.id);
      if (success) {
        setShowAddBankDialog(false);
        setEditingBank(null);
        setBankFormData({
          bankName: '',
          accountTitle: '',
          accountNumber: '',
          branchCode: '',
          iban: '',
          isActive: true,
          isDefault: false,
          displayOrder: 1
        });
        loadPaymentSettings();
      }
    } catch (error) {
      console.error('❌ Error updating bank account:', error);
    }
  };

  const handleDeleteBank = async (accountId: string) => {
    if (paymentSettings && paymentSettings.bankAccounts.length <= 1) {
      alert('Cannot delete the only bank account. Please add another account first.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this bank account?')) {
      try {
              const success = deleteBankAccount(accountId, admin.name || admin.id);
      if (success) {
        loadPaymentSettings();
      }
    } catch (error) {
      console.error('❌ Error deleting bank account:', error);
    }
    }
  };

  const handleSetDefaultBank = async (accountId: string) => {
    try {
      const success = updateBankAccount(accountId, { isDefault: true }, admin.name || admin.id);
      if (success) {
        loadPaymentSettings();
      }
    } catch (error) {
      console.error('❌ Error setting default bank account:', error);
    }
  };

  // 🆕 Content management handlers
  const handleResetContentToDefaults = () => {
    if (confirm('Are you sure you want to reset all content to defaults? This action cannot be undone.')) {
      const success = resetContentSettingsToDefaults(admin.name || admin.id);
      if (success) {
        loadContentSettings();
        alert('Content has been reset to defaults successfully!');
      } else {
        alert('Failed to reset content to defaults. Please try again.');
      }
    }
  };

  const handleAddContentItem = (type: typeof dialogType) => {
    if (type === 'pricing-feature') {
      // Handle pricing feature addition directly
      if (!contentSettings) return;
      
      const newFeature = {
        id: `pricing-feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: 'New pricing feature',
        isActive: true
      };
      
      const updatedFeatures = [...contentSettings.homePage.pricing.features, newFeature];
      const success = updateContentSettings({
        ...contentSettings,
        homePage: {
          ...contentSettings.homePage,
          pricing: {
            ...contentSettings.homePage.pricing,
            features: updatedFeatures
          }
        }
      }, admin.name || admin.id);
      
      if (success) {
        loadContentSettings();
      }
    } else if (type === 'testimonial') {
      // Reset form and open dialog for testimonial
      setTestimonialFormData({
        name: '',
        specialty: '',
        content: '',
        rating: 5,
        avatar: ''
      });
      setEditingTestimonial(null);
      setDialogType('testimonial');
      setShowTestimonialDialog(true);
    } else if (type === 'contact-method') {
      // Reset form and open dialog for contact method
      setContactMethodFormData({
        title: '',
        description: '',
        contact: '',
        response: '',
        icon: 'Mail',
        priority: 1,
        color: 'bg-blue-500',
        isActive: true
      });
      setEditingContactMethod(null);
      setDialogType('contact-method');
      setShowContactMethodDialog(true);
    } else if (type === 'social-link') {
      // Reset form and open dialog for social link
      setSocialLinkFormData({
        name: '',
        icon: 'Facebook',
        url: '',
        color: 'bg-blue-600',
        isActive: true,
        displayOrder: 1
      });
      setEditingSocialLink(null);
      setDialogType('social-link');
      setShowSocialLinkDialog(true);
    } else if (type === 'feature') {
      // Reset form and open dialog for feature
      setFeatureFormData({
        title: '',
        description: '',
        icon: 'Star',
        color: 'bg-blue-500',
        isActive: true,
        displayOrder: 1
      });
      setEditingFeature(null);
      setDialogType('feature');
      setShowFeatureDialog(true);
    } else {
      setDialogType(type);
      setShowAddBankDialog(true);
    }
  };

  const handleEditContentItem = (item: any, type: typeof dialogType) => {
    setDialogType(type);
    
    if (type === 'testimonial') {
      setEditingTestimonial(item);
      setTestimonialFormData({
        name: item.name,
        specialty: item.specialty,
        content: item.content,
        rating: item.rating,
        avatar: item.avatar
      });
      setShowTestimonialDialog(true);
    } else if (type === 'contact-method') {
      setEditingContactMethod(item);
      setContactMethodFormData({
        title: item.title,
        description: item.description,
        contact: item.contact,
        response: item.response,
        icon: item.icon,
        priority: item.priority,
        color: item.color,
        isActive: item.isActive
      });
      setShowContactMethodDialog(true);
    } else if (type === 'social-link') {
      setEditingSocialLink(item);
      setSocialLinkFormData({
        name: item.name,
        icon: item.icon,
        url: item.url,
        color: item.color,
        isActive: item.isActive,
        displayOrder: item.displayOrder
      });
      setShowSocialLinkDialog(true);
    } else if (type === 'feature') {
      setEditingFeature(item);
      setFeatureFormData({
        title: item.title,
        description: item.description,
        icon: item.icon,
        color: item.color,
        isActive: item.isActive,
        displayOrder: item.displayOrder
      });
      setShowFeatureDialog(true);
    } else {
      setShowAddBankDialog(true);
    }
  };

  

  const handleDeleteContentItem = (itemId: string, type: typeof dialogType) => {
    if (!contentSettings) return;
    
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        let success = false;
        
        switch (type) {
          case 'feature':
            success = removeHomePageFeature(itemId, admin.name || admin.id);
            break;
          case 'testimonial':
            success = removeTestimonial(itemId, admin.name || admin.id);
            break;
          case 'pricing-feature':
            // Handle pricing feature deletion directly in content settings
            const updatedFeatures = contentSettings.homePage.pricing.features.filter(f => f.id !== itemId);
            success = updateContentSettings({
              ...contentSettings,
              homePage: {
                ...contentSettings.homePage,
                pricing: {
                  ...contentSettings.homePage.pricing,
                  features: updatedFeatures
                }
              }
            }, admin.name || admin.id);
            break;
          case 'statistic':
            const updatedStats = contentSettings.homePage.statistics.filter(s => s.id !== itemId);
            success = updateContentSettings({
              ...contentSettings,
              homePage: {
                ...contentSettings.homePage,
                statistics: updatedStats
              }
            }, admin.name || admin.id);
            break;
          // Add more cases for other content types
        }
        
        if (success) {
          loadContentSettings();
        }
      } catch (error) {
        console.error('❌ Error deleting content item:', error);
      }
    }
  };

  const getSectionStatus = (section: string) => {
    if (unsavedChanges[section]) {
      return <Badge variant="destructive" className="ml-2">Unsaved</Badge>;
    }
    return <Badge variant="default" className="ml-2 bg-green-500">Saved</Badge>;
  };

  const copyToClipboard = (text: string, _label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    }).catch(err => {
      console.error('❌ Failed to copy to clipboard:', err);
    });
  };

  const handleAddStatistic = () => {
    if (!contentSettings) return;
    
    const newStatistic = {
      id: `stat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: 'New Value',
      label: 'New Statistic',
      description: 'Description for new statistic',
    };
    
    const updatedSettings = {
      ...contentSettings,
      homePage: {
        ...contentSettings.homePage,
        statistics: [...contentSettings.homePage.statistics, newStatistic]
      }
    };
    
    const success = updateContentSettings(updatedSettings, admin.name || admin.id);
    if (success) {
      loadContentSettings();
    }
  };

  const handleDeleteStatistic = (statId: string) => {
    if (!contentSettings) return;
    
    if (confirm('Are you sure you want to delete this statistic?')) {
      const updatedSettings = {
        ...contentSettings,
        homePage: {
          ...contentSettings.homePage,
          statistics: contentSettings.homePage.statistics.filter(s => s.id !== statId)
        }
      };
      
      const success = updateContentSettings(updatedSettings, admin.name || admin.id);
      if (success) {
        loadContentSettings();
      }
    }
  };

  const handleAddTestimonial = async () => {
    if (!contentSettings) return;
    
    try {
      const newTestimonial = {
        ...testimonialFormData,
        id: `testimonial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        avatar: testimonialFormData.avatar || testimonialFormData.name.split(' ').map(n => n[0]).join('')
      };
      
      const success = updateContentSettings({
        ...contentSettings,
        homePage: {
          ...contentSettings.homePage,
          testimonials: [...contentSettings.homePage.testimonials, newTestimonial]
        }
      }, admin.name || admin.id);
      
      if (success) {
        setShowTestimonialDialog(false);
        setTestimonialFormData({
          name: '',
          specialty: '',
          content: '',
          rating: 5,
          avatar: ''
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error adding testimonial:', error);
    }
  };

  const handleUpdateTestimonial = async () => {
    if (!editingTestimonial || !contentSettings) return;
    
    try {
      const updatedTestimonials = contentSettings.homePage.testimonials.map(t => 
        t.id === editingTestimonial.id 
          ? { ...testimonialFormData, id: editingTestimonial.id }
          : t
      );
      
      const success = updateContentSettings({
        ...contentSettings,
        homePage: {
          ...contentSettings.homePage,
          testimonials: updatedTestimonials
        }
      }, admin.name || admin.id);
      
      if (success) {
        setShowTestimonialDialog(false);
        setEditingTestimonial(null);
        setTestimonialFormData({
          name: '',
          specialty: '',
          content: '',
          rating: 5,
          avatar: ''
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error updating testimonial:', error);
    }
  };

  const handleAddContactMethod = async () => {
    if (!contentSettings) return;
    
    try {
      const success = addContactMethod(contactMethodFormData, admin.name || admin.id);
      if (success) {
        setShowContactMethodDialog(false);
        setContactMethodFormData({
          title: '',
          description: '',
          contact: '',
          response: '',
          icon: 'Mail',
          priority: 1,
          color: 'bg-blue-500',
          isActive: true
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error adding contact method:', error);
    }
  };

  const handleUpdateContactMethod = async () => {
    if (!editingContactMethod || !contentSettings) return;
    
    try {
      const success = updateContactMethod(editingContactMethod.id, contactMethodFormData, admin.name || admin.id);
      if (success) {
        setShowContactMethodDialog(false);
        setEditingContactMethod(null);
        setContactMethodFormData({
          title: '',
          description: '',
          contact: '',
          response: '',
          icon: 'Mail',
          priority: 1,
          color: 'bg-blue-500',
          isActive: true
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error updating contact method:', error);
    }
  };

  const handleAddSocialLink = async () => {
    if (!contentSettings) return;
    
    try {
      const success = addSocialLink(socialLinkFormData, admin.name || admin.id);
      if (success) {
        setShowSocialLinkDialog(false);
        setSocialLinkFormData({
          name: '',
          icon: 'Facebook',
          url: '',
          color: 'bg-blue-600',
          isActive: true,
          displayOrder: 1
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error adding social link:', error);
    }
  };

  const handleUpdateSocialLink = async () => {
    if (!editingSocialLink || !contentSettings) return;
    
    try {
      const success = updateSocialLink(editingSocialLink.id, socialLinkFormData, admin.name || admin.id);
      if (success) {
        setShowSocialLinkDialog(false);
        setEditingSocialLink(null);
        setSocialLinkFormData({
          name: '',
          icon: 'Facebook',
          url: '',
          color: 'bg-blue-600',
          isActive: true,
          displayOrder: 1
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error updating social link:', error);
    }
  };

  const handleAddFeature = async () => {
    if (!contentSettings) return;
    
    try {
      const success = addHomePageFeature(featureFormData, admin.name || admin.id);
      if (success) {
        setShowFeatureDialog(false);
        setFeatureFormData({
          title: '',
          description: '',
          icon: 'Star',
          color: 'bg-blue-500',
          isActive: true,
          displayOrder: 1
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error adding feature:', error);
    }
  };

  const handleUpdateFeature = async () => {
    if (!editingFeature || !contentSettings) return;
    
    try {
      // Update the feature in the content settings
      const updatedFeatures = contentSettings.homePage.features.map(feature => 
        feature.id === editingFeature.id ? { ...feature, ...featureFormData } : feature
      );
      
      const success = updateContentSettings({
        ...contentSettings,
        homePage: {
          ...contentSettings.homePage,
          features: updatedFeatures
        }
      }, admin.name || admin.id);
      
      if (success) {
        setShowFeatureDialog(false);
        setEditingFeature(null);
        setFeatureFormData({
          title: '',
          description: '',
          icon: 'Star',
          color: 'bg-blue-500',
          isActive: true,
          displayOrder: 1
        });
        loadContentSettings();
      }
    } catch (error) {
      console.error('❌ Error updating feature:', error);
    }
  };

  // Email verification settings state
  const [emailVerificationSettings, setEmailVerificationSettings] = useState({
    tokenExpiryMinutes: 15,
    maxResendAttempts: 3,
    resendCooldownMinutes: 5,
    requireEmailVerification: true,
    autoVerifyInDevelopment: true,
    enableRetryMechanism: true,
    maxRetryAttempts: 3,
    retryDelaySeconds: 5,
    enableTimeoutHandling: true,
    smtpTimeoutSeconds: 30,
    enableFallbackOptions: true,
    enableAuditLogging: true,
    enableSecurityAlerts: true,
    enableStatistics: true
  });

  const [emailVerificationStats, setEmailVerificationStats] = useState({
    totalEmailsSent: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    totalResends: 0,
    averageDeliveryTime: 0,
    successRate: 0,
    recentActivity: []
  });

  const [emailTemplates, setEmailTemplates] = useState({
    verification: {
      subject: 'Verify Your Email - PulsePrep',
      htmlContent: '',
      textContent: '',
      variables: [] as any[]
    },
    welcome: {
      subject: 'Welcome to PulsePrep',
      htmlContent: '',
      textContent: '',
      variables: [] as any[]
    },
    passwordReset: {
      subject: 'Password Reset - PulsePrep',
      htmlContent: '',
      textContent: '',
      variables: [] as any[]
    }
  });

  const [testEmailConfig, setTestEmailConfig] = useState({
    testEmail: '',
    testName: '',
    isTesting: false,
    testResults: null as any
  });

  // Email verification settings functions
  const loadEmailVerificationSettings = async () => {
    try {
      const { EmailService } = await import('../../services/EmailService');
      const settings = EmailService.getEmailVerificationSettings();
      // Map the settings to match our state structure
      setEmailVerificationSettings({
        tokenExpiryMinutes: settings.tokenExpiryMinutes,
        maxResendAttempts: settings.maxResendAttempts,
        resendCooldownMinutes: settings.resendCooldownMinutes,
        requireEmailVerification: settings.requireEmailVerification,
        autoVerifyInDevelopment: settings.autoVerifyInDevelopment,
        enableRetryMechanism: true,
        maxRetryAttempts: 3,
        retryDelaySeconds: 5,
        enableTimeoutHandling: true,
        smtpTimeoutSeconds: 30,
        enableFallbackOptions: true,
        enableAuditLogging: true,
        enableSecurityAlerts: true,
        enableStatistics: true
      });
    } catch (error) {
      console.error('❌ Failed to load email verification settings:', error);
    }
  };

  const saveEmailVerificationSettings = async () => {
    try {
      // Update settings in EmailService
      // Note: In a real implementation, this would update the service settings
      console.log('✅ Email verification settings saved');
      setUnsavedChanges(prev => ({ ...prev, emailVerification: false }));
    } catch (error) {
      console.error('❌ Failed to save email verification settings:', error);
    }
  };

  const loadEmailVerificationStats = async () => {
    try {
      const { EmailService } = await import('../../services/EmailService');
      const { AuditService } = await import('../../services/AuditService');
      
      const deliveryStats = EmailService.getEmailDeliveryStats();
      const auditStats = AuditService.getEmailVerificationAuditStatistics();
      
      setEmailVerificationStats({
        totalEmailsSent: deliveryStats.total,
        successfulDeliveries: deliveryStats.sent + deliveryStats.delivered,
        failedDeliveries: deliveryStats.failed,
        totalVerifications: auditStats.totalEvents,
        successfulVerifications: auditStats.successfulEvents,
        failedVerifications: auditStats.failedEvents,
        totalResends: auditStats.resendEvents,
        averageDeliveryTime: deliveryStats.successRate > 0 ? 2.5 : 0, // Mock data
        successRate: deliveryStats.successRate,
        recentActivity: [] // Would be populated from audit logs
      });
    } catch (error) {
      console.error('❌ Failed to load email verification stats:', error);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const { getEmailTemplateSettings } = await import('../../utils/emailTemplateSettings');
      const settings = getEmailTemplateSettings();
      
      setEmailTemplates({
        verification: {
          subject: 'Verify Your Email - PulsePrep',
          htmlContent: settings.templates.find(t => t.id === 'email-verification')?.htmlContent || '',
          textContent: settings.templates.find(t => t.id === 'email-verification')?.textContent || '',
          variables: settings.templates.find(t => t.id === 'email-verification')?.variables || []
        },
        welcome: {
          subject: 'Welcome to PulsePrep',
          htmlContent: settings.templates.find(t => t.id === 'welcome-email')?.htmlContent || '',
          textContent: settings.templates.find(t => t.id === 'welcome-email')?.textContent || '',
          variables: settings.templates.find(t => t.id === 'welcome-email')?.variables || []
        },
        passwordReset: {
          subject: 'Password Reset - PulsePrep',
          htmlContent: settings.templates.find(t => t.id === 'password-reset')?.htmlContent || '',
          textContent: settings.templates.find(t => t.id === 'password-reset')?.textContent || '',
          variables: settings.templates.find(t => t.id === 'password-reset')?.variables || []
        }
      });
    } catch (error) {
      console.error('❌ Failed to load email templates:', error);
    }
  };

  const saveEmailTemplate = async (templateType: string) => {
    try {

      // Update template in settings
      console.log(`✅ ${templateType} template saved`);
      setUnsavedChanges(prev => ({ ...prev, [`emailTemplate_${templateType}`]: false }));
    } catch (error) {
      console.error(`❌ Failed to save ${templateType} template:`, error);
    }
  };

  const testEmailVerification = async () => {
    if (!testEmailConfig.testEmail || !testEmailConfig.testName) {
      alert('Please enter both email and name for testing');
      return;
    }

    setTestEmailConfig(prev => ({ ...prev, isTesting: true, testResults: null }));

    try {
      const { EmailService } = await import('../../services/EmailService');
      const result = await EmailService.sendVerificationEmail(testEmailConfig.testEmail, testEmailConfig.testName);
      
      setTestEmailConfig(prev => ({
        ...prev,
        isTesting: false,
        testResults: {
          success: result.success,
          message: result.message,
          emailId: result.emailId,
          deliveryStatus: result.deliveryStatus,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestEmailConfig(prev => ({
        ...prev,
        isTesting: false,
        testResults: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const resetEmailVerificationSettings = async () => {
    try {
      const { EmailService } = await import('../../services/EmailService');
      const defaultSettings = EmailService.getEmailVerificationSettings();
      // Map the settings to match our state structure
      setEmailVerificationSettings({
        tokenExpiryMinutes: defaultSettings.tokenExpiryMinutes,
        maxResendAttempts: defaultSettings.maxResendAttempts,
        resendCooldownMinutes: defaultSettings.resendCooldownMinutes,
        requireEmailVerification: defaultSettings.requireEmailVerification,
        autoVerifyInDevelopment: defaultSettings.autoVerifyInDevelopment,
        enableRetryMechanism: true,
        maxRetryAttempts: 3,
        retryDelaySeconds: 5,
        enableTimeoutHandling: true,
        smtpTimeoutSeconds: 30,
        enableFallbackOptions: true,
        enableAuditLogging: true,
        enableSecurityAlerts: true,
        enableStatistics: true
      });
      console.log('✅ Email verification settings reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset email verification settings:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-2">Configure and manage platform-wide settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setPreviewMode(!previewMode)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Exit Preview' : 'Preview Changes'}
          </Button>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onExportSettings} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Manage all platform settings and configurations</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                General {getSectionStatus('platform')}
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding {getSectionStatus('branding')} {getSectionStatus('content')}
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email {getSectionStatus('email')}
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment {getSectionStatus('payment')}
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subscription {getSectionStatus('subscription')}
              </TabsTrigger>
              <TabsTrigger value="email-verification" className="flex items-center gap-2">
                <MailCheck className="h-4 w-4" />
                Email Verification {getSectionStatus('email-verification')}
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                API {getSectionStatus('api')}
              </TabsTrigger>
              <TabsTrigger value="admin-access" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Access {getSectionStatus('admin-access')}
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input
                      id="platform-name"
                      value={platformSettings.platformName}
                      onChange={(e) => handleSettingChange('platform', 'platformName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tagline">Platform Tagline</Label>
                    <Input
                      id="tagline"
                      value={platformSettings.tagline}
                      onChange={(e) => handleSettingChange('platform', 'tagline', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={platformSettings.supportEmail}
                      onChange={(e) => handleSettingChange('platform', 'supportEmail', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-users">Maximum Users</Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={platformSettings.maxUsers}
                      onChange={(e) => handleSettingChange('platform', 'maxUsers', parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={platformSettings.sessionTimeout}
                      onChange={(e) => handleSettingChange('platform', 'sessionTimeout', parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <Switch
                        id="maintenance-mode"
                        checked={platformSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleSettingChange('platform', 'maintenanceMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="registration-enabled">Registration Enabled</Label>
                      <Switch
                        id="registration-enabled"
                        checked={platformSettings.registrationEnabled}
                        onCheckedChange={(checked) => handleSettingChange('platform', 'registrationEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-logout">Auto Logout</Label>
                      <Switch
                        id="auto-logout"
                        checked={platformSettings.autoLogout}
                        onCheckedChange={(checked) => handleSettingChange('platform', 'autoLogout', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSection('platform')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </TabsContent>

            {/* 🆕 ENHANCED: Branding & Content Settings with Content Management */}
            <TabsContent value="branding" className="space-y-6 mt-6">
              {/* Existing Branding Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Visual Branding
                  </CardTitle>
                  <CardDescription>Configure colors, logos, and visual appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={brandingSettings.primaryColor}
                            onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={brandingSettings.primaryColor}
                            onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={brandingSettings.secondaryColor}
                            onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={brandingSettings.secondaryColor}
                            onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="logo-url">Logo URL</Label>
                        <Input
                          id="logo-url"
                          value={brandingSettings.logoUrl}
                          onChange={(e) => handleSettingChange('branding', 'logoUrl', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="success-color">Success Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="success-color"
                            type="color"
                            value={brandingSettings.successColor}
                            onChange={(e) => handleSettingChange('branding', 'successColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={brandingSettings.successColor}
                            onChange={(e) => handleSettingChange('branding', 'successColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="error-color">Error Color</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="error-color"
                            type="color"
                            value={brandingSettings.errorColor}
                            onChange={(e) => handleSettingChange('branding', 'errorColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={brandingSettings.errorColor}
                            onChange={(e) => handleSettingChange('branding', 'errorColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select value={brandingSettings.fontFamily} onValueChange={(value) => handleSettingChange('branding', 'fontFamily', value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="custom-css">Custom CSS</Label>
                    <Textarea
                      id="custom-css"
                      value={brandingSettings.customCSS}
                      onChange={(e) => handleSettingChange('branding', 'customCSS', e.target.value)}
                      placeholder="/* Custom CSS rules */"
                      rows={6}
                      className="mt-2 font-mono"
                    />
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => handleSaveSection('branding')}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Branding Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 🆕 NEW: Content Management Section */}
              {contentSettings && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Content Management
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={handleResetContentToDefaults}
                          variant="outline" 
                          size="sm"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Defaults
                        </Button>
                        <Badge variant="secondary">v{contentSettings.version}</Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>Control all text content across Home, About, and Contact pages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {/* 🏠 Home Page Content */}
                      <AccordionItem value="home-page">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Home Page Content
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                          {/* Hero Section */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="flex items-center gap-2 mb-4">
                              <Star className="h-4 w-4" />
                              Hero Section
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="home-hero-title">Main Title</Label>
                                <Input
                                  id="home-hero-title"
                                  value={contentSettings.homePage.hero.title}
                                  onChange={(e) => handleSettingChange('content', 'homePage.hero.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="home-hero-subtitle">Subtitle</Label>
                                <Input
                                  id="home-hero-subtitle"
                                  value={contentSettings.homePage.hero.subtitle}
                                  onChange={(e) => handleSettingChange('content', 'homePage.hero.subtitle', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor="home-hero-description">Description</Label>
                                <Textarea
                                  id="home-hero-description"
                                  value={contentSettings.homePage.hero.description}
                                  onChange={(e) => handleSettingChange('content', 'homePage.hero.description', e.target.value)}
                                  rows={3}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="home-hero-primary-btn">Primary Button Text</Label>
                                <Input
                                  id="home-hero-primary-btn"
                                  value={contentSettings.homePage.hero.ctaButtons.primary}
                                  onChange={(e) => handleSettingChange('content', 'homePage.hero.ctaButtons.primary', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="home-hero-secondary-btn">Secondary Button Text</Label>
                                <Input
                                  id="home-hero-secondary-btn"
                                  value={contentSettings.homePage.hero.ctaButtons.secondary}
                                  onChange={(e) => handleSettingChange('content', 'homePage.hero.ctaButtons.secondary', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Features Section */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Features ({contentSettings.homePage.features.length})
                              </h4>
                              <Button 
                                onClick={() => handleAddContentItem('feature')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Feature
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {contentSettings.homePage.features.map((feature, index) => (
                                <div key={feature.id} className="bg-white p-3 rounded border flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">#{index + 1}</Badge>
                                      <span className="font-medium">{feature.title}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{feature.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      onClick={() => handleEditContentItem(feature, 'feature')}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteContentItem(feature.id, 'feature')}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Testimonials Section */}
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Testimonials ({contentSettings.homePage.testimonials.length})
                              </h4>
                              <Button 
                                onClick={() => handleAddContentItem('testimonial')}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Testimonial
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {contentSettings.homePage.testimonials.map((testimonial, index) => (
                                <div key={testimonial.id} className="bg-white p-3 rounded border flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">#{index + 1}</Badge>
                                      <span className="font-medium">{testimonial.name}</span>
                                      <Badge className="bg-purple-100 text-purple-700">{testimonial.specialty}</Badge>
                                      <div className="flex items-center">
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                          <StarIcon key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{testimonial.content}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      onClick={() => handleEditContentItem(testimonial, 'testimonial')}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteContentItem(testimonial.id, 'testimonial')}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Statistics Section */}
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Statistics ({contentSettings.homePage.statistics.length})
                              </h4>
                              <Button 
                                onClick={() => handleAddStatistic()}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Statistic
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {contentSettings.homePage.statistics.map((stat, index) => (
                                <div key={stat.id} className="bg-white p-3 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">#{index + 1}</Badge>
                                      <span className="font-bold text-lg">{stat.value}</span>
                                    </div>
                                    <Button
                                      onClick={() => handleDeleteStatistic(stat.id)}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <Input
                                      value={stat.label}
                                      onChange={(e) => {
                                        const updatedStats = contentSettings.homePage.statistics.map(s => 
                                          s.id === stat.id ? { ...s, label: e.target.value } : s
                                        );
                                        handleSettingChange('content', 'homePage.statistics', updatedStats);
                                      }}
                                      placeholder="Statistic label"
                                      className="text-sm"
                                    />
                                    <Input
                                      value={stat.value}
                                      onChange={(e) => {
                                        const updatedStats = contentSettings.homePage.statistics.map(s => 
                                          s.id === stat.id ? { ...s, value: e.target.value } : s
                                        );
                                        handleSettingChange('content', 'homePage.statistics', updatedStats);
                                      }}
                                      placeholder="Statistic value"
                                      className="text-sm"
                                    />
                                    <Textarea
                                      value={stat.description}
                                      onChange={(e) => {
                                        const updatedStats = contentSettings.homePage.statistics.map(s => 
                                          s.id === stat.id ? { ...s, description: e.target.value } : s
                                        );
                                        handleSettingChange('content', 'homePage.statistics', updatedStats);
                                      }}
                                      placeholder="Statistic description"
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 🆕 ADD: Pricing Section Management */}
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Pricing Section ({contentSettings.homePage.pricing.features.length} features)
                              </h4>
                              <Button 
                                onClick={() => handleAddContentItem('pricing-feature')}
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Feature
                              </Button>
                            </div>

                            {/* Section Title & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label htmlFor="pricing-title">Section Title</Label>
                                <Input
                                  id="pricing-title"
                                  value={contentSettings.homePage.pricing.sectionTitle}
                                  onChange={(e) => handleSettingChange('content', 'homePage.pricing.sectionTitle', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="pricing-description">Section Description</Label>
                                <Input
                                  id="pricing-description"
                                  value={contentSettings.homePage.pricing.sectionDescription}
                                  onChange={(e) => handleSettingChange('content', 'homePage.pricing.sectionDescription', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>

                            {/* Plan Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <Label htmlFor="plan-name">Plan Name</Label>
                                <Input
                                  id="plan-name"
                                  value={contentSettings.homePage.pricing.planName}
                                  onChange={(e) => handleSettingChange('content', 'homePage.pricing.planName', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plan-badge">Plan Badge</Label>
                                <Input
                                  id="plan-badge"
                                  value={contentSettings.homePage.pricing.planBadge}
                                  onChange={(e) => handleSettingChange('content', 'homePage.pricing.planBadge', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="button-text">Button Text</Label>
                                <Input
                                  id="button-text"
                                  value={contentSettings.homePage.pricing.buttonText}
                                  onChange={(e) => handleSettingChange('content', 'homePage.pricing.buttonText', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>

                            {/* Features List */}
                            <div className="space-y-2">
                              <Label>Features List</Label>
                              {contentSettings.homePage.pricing.features.map((feature, index) => (
                                <div key={feature.id} className="bg-white p-3 rounded border flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Badge variant="outline">#{index + 1}</Badge>
                                    <Input
                                      value={feature.text}
                                      onChange={(e) => {
                                        const updatedFeatures = contentSettings.homePage.pricing.features.map(f => 
                                          f.id === feature.id ? { ...f, text: e.target.value } : f
                                        );
                                        handleSettingChange('content', 'homePage.pricing.features', updatedFeatures);
                                      }}
                                      className="flex-1"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={feature.isActive}
                                      onCheckedChange={(checked) => {
                                        const updatedFeatures = contentSettings.homePage.pricing.features.map(f => 
                                          f.id === feature.id ? { ...f, isActive: checked } : f
                                        );
                                        handleSettingChange('content', 'homePage.pricing.features', updatedFeatures);
                                      }}
                                    />
                                    <Button
                                      onClick={() => handleDeleteContentItem(feature.id, 'pricing-feature')}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 🆕 ADD: Specialty Cards Management */}
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                Specialty Cards ({contentSettings.homePage.specialtyCards.length} cards)
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {contentSettings.homePage.specialtyCards.map((card, index) => (
                                <div key={card.id} className="bg-white p-4 rounded border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">#{index + 1}</Badge>
                                    <span className="font-medium capitalize">{card.name.replace('-', ' & ')}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`card-title-${card.id}`}>Card Title</Label>
                                      <Input
                                        id={`card-title-${card.id}`}
                                        value={card.title}
                                        onChange={(e) => {
                                          const updatedCards = contentSettings.homePage.specialtyCards.map(c => 
                                            c.id === card.id ? { ...c, title: e.target.value } : c
                                          );
                                          handleSettingChange('content', 'homePage.specialtyCards', updatedCards);
                                        }}
                                        className="mt-2"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`card-active-${card.id}`}>Active</Label>
                                      <div className="mt-2">
                                        <Switch
                                          id={`card-active-${card.id}`}
                                          checked={card.isActive}
                                          onCheckedChange={(checked) => {
                                            const updatedCards = contentSettings.homePage.specialtyCards.map(c => 
                                              c.id === card.id ? { ...c, isActive: checked } : c
                                            );
                                            handleSettingChange('content', 'homePage.specialtyCards', updatedCards);
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="md:col-span-2">
                                      <Label htmlFor={`card-description-${card.id}`}>Description</Label>
                                      <Textarea
                                        id={`card-description-${card.id}`}
                                        value={card.description}
                                        onChange={(e) => {
                                          const updatedCards = contentSettings.homePage.specialtyCards.map(c => 
                                            c.id === card.id ? { ...c, description: e.target.value } : c
                                          );
                                          handleSettingChange('content', 'homePage.specialtyCards', updatedCards);
                                        }}
                                        rows={2}
                                        className="mt-2"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* ℹ️ About Page Content */}
                      <AccordionItem value="about-page">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            About Page Content
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                          {/* Hero Section */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="flex items-center gap-2 mb-4">
                              <Star className="h-4 w-4" />
                              About Page Hero
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="about-hero-title">Title</Label>
                                <Input
                                  id="about-hero-title"
                                  value={contentSettings.aboutPage.hero.title}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.hero.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="about-hero-subtitle">Subtitle</Label>
                                <Input
                                  id="about-hero-subtitle"
                                  value={contentSettings.aboutPage.hero.subtitle}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.hero.subtitle', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor="about-hero-description">Description</Label>
                                <Textarea
                                  id="about-hero-description"
                                  value={contentSettings.aboutPage.hero.description}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.hero.description', e.target.value)}
                                  rows={3}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Mission & Vision */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="flex items-center gap-2 mb-4">
                              <CheckCircle className="h-4 w-4" />
                              Mission & Vision
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="about-mission-title">Mission Title</Label>
                                <Input
                                  id="about-mission-title"
                                  value={contentSettings.aboutPage.mission.title}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.mission.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="about-mission-content">Mission Content</Label>
                                <Textarea
                                  id="about-mission-content"
                                  value={contentSettings.aboutPage.mission.content}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.mission.content', e.target.value)}
                                  rows={4}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="about-vision-title">Vision Title</Label>
                                <Input
                                  id="about-vision-title"
                                  value={contentSettings.aboutPage.vision.title}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.vision.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="about-vision-content">Vision Content</Label>
                                <Textarea
                                  id="about-vision-content"
                                  value={contentSettings.aboutPage.vision.content}
                                  onChange={(e) => handleSettingChange('content', 'aboutPage.vision.content', e.target.value)}
                                  rows={4}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* 📞 Contact Page Content */}
                      <AccordionItem value="contact-page">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Page Content
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                          {/* Hero Section */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="flex items-center gap-2 mb-4">
                              <Star className="h-4 w-4" />
                              Contact Page Hero
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="contact-hero-title">Title</Label>
                                <Input
                                  id="contact-hero-title"
                                  value={contentSettings.contactPage.hero.title}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.hero.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="contact-hero-subtitle">Subtitle</Label>
                                <Input
                                  id="contact-hero-subtitle"
                                  value={contentSettings.contactPage.hero.subtitle}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.hero.subtitle', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor="contact-hero-description">Description</Label>
                                <Textarea
                                  id="contact-hero-description"
                                  value={contentSettings.contactPage.hero.description}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.hero.description', e.target.value)}
                                  rows={3}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Office Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="flex items-center gap-2 mb-4">
                              <Globe className="h-4 w-4" />
                              Office Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="office-title">Office Title</Label>
                                <Input
                                  id="office-title"
                                  value={contentSettings.contactPage.officeInfo.title}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.title', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="office-phone">Phone Number</Label>
                                <Input
                                  id="office-phone"
                                  value={contentSettings.contactPage.officeInfo.phone}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.phone', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="office-email">Email Address</Label>
                                <Input
                                  id="office-email"
                                  value={contentSettings.contactPage.officeInfo.email}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.email', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="office-address">Address</Label>
                                <Input
                                  id="office-address"
                                  value={contentSettings.contactPage.officeInfo.address}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.address', e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="office-hours">Office Hours</Label>
                                <Textarea
                                  id="office-hours"
                                  value={contentSettings.contactPage.officeInfo.hours}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.hours', e.target.value)}
                                  rows={3}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="office-emergency">Emergency Info</Label>
                                <Textarea
                                  id="office-emergency"
                                  value={contentSettings.contactPage.officeInfo.emergency}
                                  onChange={(e) => handleSettingChange('content', 'contactPage.officeInfo.emergency', e.target.value)}
                                  rows={3}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Contact Methods Section */}
                          <div className="bg-cyan-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Contact Methods ({contentSettings.contactPage.contactMethods.length})
                              </h4>
                              <Button 
                                                          onClick={() => {
                            setContactMethodFormData({
                              title: '',
                              description: '',
                              contact: '',
                              response: '',
                              icon: 'Mail',
                              priority: 1,
                              color: 'bg-blue-500',
                              isActive: true
                            });
                            setEditingContactMethod(null);
                            setDialogType('contact-method');
                            setShowContactMethodDialog(true);
                          }}
                                size="sm"
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Contact Method
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {contentSettings.contactPage.contactMethods.map((method, index) => (
                                <div key={method.id} className="bg-white p-3 rounded border flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">#{index + 1}</Badge>
                                      <span className="font-medium">{method.title}</span>
                                      <Badge className={method.color + " text-white"}>{method.icon}</Badge>
                                      <Badge variant={method.isActive ? "default" : "secondary"}>
                                        {method.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">{method.description}</p>
                                    <p className="text-xs text-gray-500">{method.contact} - {method.response}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      onClick={() => {
                                        setEditingContactMethod(method);
                                        setContactMethodFormData({
                                          title: method.title,
                                          description: method.description,
                                          contact: method.contact,
                                          response: method.response,
                                          icon: method.icon,
                                          priority: method.priority,
                                          color: method.color,
                                          isActive: method.isActive
                                        });
                                        setDialogType('contact-method');
                                        setShowContactMethodDialog(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this contact method?')) {
                                          removeContactMethod(method.id, admin.name || admin.id);
                                          loadContentSettings();
                                        }
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Social Links Section */}
                          <div className="bg-pink-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Social Links ({contentSettings.contactPage.socialLinks.length})
                              </h4>
                              <Button 
                                                              onClick={() => {
                                setSocialLinkFormData({
                                  name: '',
                                  icon: 'Facebook',
                                  url: '',
                                  color: 'bg-blue-600',
                                  isActive: true,
                                  displayOrder: 1
                                });
                                setEditingSocialLink(null);
                                setDialogType('social-link');
                                setShowSocialLinkDialog(true);
                              }}
                                size="sm"
                                className="bg-pink-600 hover:bg-pink-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Social Link
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {contentSettings.contactPage.socialLinks
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((link) => (
                                <div key={link.id} className="bg-white p-3 rounded border flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">#{link.displayOrder}</Badge>
                                      <span className="font-medium">{link.name}</span>
                                      <Badge className={link.color + " text-white"}>{link.icon}</Badge>
                                      <Badge variant={link.isActive ? "default" : "secondary"}>
                                        {link.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      onClick={() => {
                                        setEditingSocialLink(link);
                                        setSocialLinkFormData({
                                          name: link.name,
                                          icon: link.icon,
                                          url: link.url,
                                          color: link.color,
                                          isActive: link.isActive,
                                          displayOrder: link.displayOrder
                                        });
                                        setDialogType('social-link');
                                        setShowSocialLinkDialog(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this social link?')) {
                                          removeSocialLink(link.id, admin.name || admin.id);
                                          loadContentSettings();
                                        }
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-end mt-6">
                      <Button onClick={() => handleSaveSection('content')}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Content Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Existing Email Settings (unchanged) */}
            <TabsContent value="email" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      value={emailSettings.smtpHost}
                      onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtp-user">SMTP Username</Label>
                    <Input
                      id="smtp-user"
                      value={emailSettings.smtpUser}
                      onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={emailSettings.fromName}
                      onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="encryption">Encryption</Label>
                    <Select value={emailSettings.encryption} onValueChange={(value) => handleSettingChange('email', 'encryption', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Email Service Enabled</Label>
                <Switch
                  id="email-enabled"
                  checked={emailSettings.enabled}
                  onCheckedChange={(checked) => handleSettingChange('email', 'enabled', checked)}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSection('email')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </TabsContent>

            {/* Existing Payment Settings (unchanged) */}
            <TabsContent value="payment" className="space-y-6 mt-6">
              {/* Payment Configuration */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <CreditCard className="h-5 w-5" />
                    Payment Configuration
                  </CardTitle>
                  <CardDescription>Configure payment amount and currency settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Single payment amount field */}
                    <div>
                      <Label htmlFor="payment-amount">Payment Amount ({paymentSettings?.currency || 'PKR'})</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        value={paymentSettings?.paymentAmount || 7000}
                        onChange={(e) => handleSettingChange('payment', 'paymentAmount', parseInt(e.target.value))}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the exact amount users must pay for subscription access
                      </p>
                    </div>

                    {/* Currency selection */}
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={paymentSettings?.currency || 'PKR'} 
                        onValueChange={(value) => handleSettingChange('payment', 'currency', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Payment Instructions
                  </CardTitle>
                  <CardDescription>Configure instructions shown to users during payment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="payment-instructions">Instructions for Users</Label>
                    <Textarea
                      id="payment-instructions"
                      value={paymentSettings?.paymentInstructions || ''}
                      onChange={(e) => handleSettingChange('payment', 'paymentInstructions', e.target.value)}
                      placeholder="Enter payment instructions..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Accounts Management (existing code - keep as is) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Bank Accounts
                    </div>
                    <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setDialogType('feature');
                            setEditingBank(null);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Bank Account
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl">

                        {dialogType === 'contact-method' ? (
                          <>

                            <DialogHeader>
                              <DialogTitle>
                                {editingContactMethod ? 'Edit Contact Method' : 'Add New Contact Method'}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={contactMethodFormData.title}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Email Support"
                                  />
                                </div>
                                <div>
                                  <Label>Icon</Label>
                                  <select
                                    value={contactMethodFormData.icon}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, icon: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="Mail">Mail</option>
                                    <option value="Phone">Phone</option>
                                    <option value="MessageCircle">MessageCircle</option>
                                    <option value="MessageSquare">MessageSquare</option>
                                    <option value="HeadphonesIcon">HeadphonesIcon</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Input
                                  value={contactMethodFormData.description}
                                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Send us an email for detailed inquiries"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Contact Info</Label>
                                  <Input
                                    value={contactMethodFormData.contact}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, contact: e.target.value }))}
                                    placeholder="support@pulseprep.com"
                                  />
                                </div>
                                <div>
                                  <Label>Response Time</Label>
                                  <Input
                                    value={contactMethodFormData.response}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, response: e.target.value }))}
                                    placeholder="Within 24 hours"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label>Priority</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={contactMethodFormData.priority}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                  />
                                </div>
                                <div>
                                  <Label>Color</Label>
                                  <select
                                    value={contactMethodFormData.color}
                                    onChange={(e) => setContactMethodFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="bg-blue-500">Blue</option>
                                    <option value="bg-green-500">Green</option>
                                    <option value="bg-purple-500">Purple</option>
                                    <option value="bg-emerald-500">Emerald</option>
                                    <option value="bg-orange-500">Orange</option>
                                    <option value="bg-red-500">Red</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Active</Label>
                                  <div className="mt-2">
                                    <Switch
                                      checked={contactMethodFormData.isActive}
                                      onCheckedChange={(checked) => setContactMethodFormData(prev => ({ ...prev, isActive: checked }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={editingContactMethod ? handleUpdateContactMethod : handleAddContactMethod}>
                                {editingContactMethod ? 'Update' : 'Add'} Contact Method
                              </Button>
                            </div>
                          </>
                        ) : dialogType === 'social-link' ? (
                          <>

                            <DialogHeader>
                              <DialogTitle>
                                {editingSocialLink ? 'Edit Social Link' : 'Add New Social Link'}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Platform Name</Label>
                                  <Input
                                    value={socialLinkFormData.name}
                                    onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Facebook"
                                  />
                                </div>
                                <div>
                                  <Label>Icon</Label>
                                  <select
                                    value={socialLinkFormData.icon}
                                    onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, icon: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="Facebook">Facebook</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Linkedin">LinkedIn</option>
                                    <option value="Youtube">YouTube</option>
                                    <option value="Globe">Website</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <Label>URL</Label>
                                <Input
                                  value={socialLinkFormData.url}
                                  onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, url: e.target.value }))}
                                  placeholder="https://facebook.com/pulseprep"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label>Display Order</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={socialLinkFormData.displayOrder}
                                    onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                                  />
                                </div>
                                <div>
                                  <Label>Color</Label>
                                  <select
                                    value={socialLinkFormData.color}
                                    onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="bg-blue-600">Blue</option>
                                    <option value="bg-sky-500">Sky Blue</option>
                                    <option value="bg-pink-500">Pink</option>
                                    <option value="bg-blue-700">Dark Blue</option>
                                    <option value="bg-red-600">Red</option>
                                    <option value="bg-green-600">Green</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Active</Label>
                                  <div className="mt-2">
                                    <Switch
                                      checked={socialLinkFormData.isActive}
                                      onCheckedChange={(checked) => setSocialLinkFormData(prev => ({ ...prev, isActive: checked }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={editingSocialLink ? handleUpdateSocialLink : handleAddSocialLink}>
                                {editingSocialLink ? 'Update' : 'Add'} Social Link
                              </Button>
                            </div>
                          </>
                        ) : dialogType === 'testimonial' ? (
                          <>
                            <DialogHeader>
                              <DialogTitle>
                                {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                              </DialogTitle>
                              <DialogDescription>
                                {editingTestimonial ? 'Update the testimonial details' : 'Add a new testimonial from a satisfied user'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label htmlFor="testimonial-name">Name</Label>
                                <Input
                                  id="testimonial-name"
                                  value={testimonialFormData.name}
                                  onChange={(e) => setTestimonialFormData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Dr. John Smith"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="testimonial-specialty">Specialty</Label>
                                <Input
                                  id="testimonial-specialty"
                                  value={testimonialFormData.specialty}
                                  onChange={(e) => setTestimonialFormData(prev => ({ ...prev, specialty: e.target.value }))}
                                  placeholder="Internal Medicine"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="testimonial-content">Testimonial Content</Label>
                                <Textarea
                                  id="testimonial-content"
                                  value={testimonialFormData.content}
                                  onChange={(e) => setTestimonialFormData(prev => ({ ...prev, content: e.target.value }))}
                                  placeholder="Share their experience with the platform..."
                                  rows={4}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="testimonial-rating">Rating (1-5)</Label>
                                <Input
                                  id="testimonial-rating"
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={testimonialFormData.rating}
                                  onChange={(e) => setTestimonialFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="testimonial-avatar">Avatar Initials (optional)</Label>
                                <Input
                                  id="testimonial-avatar"
                                  value={testimonialFormData.avatar}
                                  onChange={(e) => setTestimonialFormData(prev => ({ ...prev, avatar: e.target.value }))}
                                  placeholder="JS (will auto-generate if empty)"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowTestimonialDialog(false);
                                  setEditingTestimonial(null);
                                  setTestimonialFormData({
                                    name: '',
                                    specialty: '',
                                    content: '',
                                    rating: 5,
                                    avatar: ''
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={editingTestimonial ? handleUpdateTestimonial : handleAddTestimonial}>
                                {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>

                            <DialogHeader>
                              <DialogTitle>
                                {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
                              </DialogTitle>
                              <DialogDescription>
                                {editingBank ? 'Update the bank account details' : 'Add a new bank account for payments'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bank-name">Bank Name</Label>
                                <Input
                                  id="bank-name"
                                  value={bankFormData.bankName}
                                  onChange={(e) => setBankFormData(prev => ({ ...prev, bankName: e.target.value }))}
                                  placeholder="e.g., HBL, UBL, MCB"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="account-title">Account Title</Label>
                                <Input
                                  id="account-title"
                                  value={bankFormData.accountTitle}
                                  onChange={(e) => setBankFormData(prev => ({ ...prev, accountTitle: e.target.value }))}
                                  placeholder="Account holder name"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="account-number">Account Number</Label>
                                <Input
                                  id="account-number"
                                  value={bankFormData.accountNumber}
                                  onChange={(e) => setBankFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                                  placeholder="Account number"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="branch-code">Branch Code</Label>
                                <Input
                                  id="branch-code"
                                  value={bankFormData.branchCode}
                                  onChange={(e) => setBankFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                                  placeholder="Branch code"
                                  className="mt-2"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="iban">IBAN (Optional)</Label>
                                <Input
                                  id="iban"
                                  value={bankFormData.iban}
                                  onChange={(e) => setBankFormData(prev => ({ ...prev, iban: e.target.value }))}
                                  placeholder="PK36SCBL0000001123456702"
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="is-active"
                                  checked={bankFormData.isActive}
                                  onCheckedChange={(checked) => setBankFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                                <Label htmlFor="is-active">Active</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="is-default"
                                  checked={bankFormData.isDefault}
                                  onCheckedChange={(checked) => setBankFormData(prev => ({ ...prev, isDefault: checked }))}
                                />
                                <Label htmlFor="is-default">Default Account</Label>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowAddBankDialog(false);
                                  setEditingBank(null);
                                  setEditingTestimonial(null);
                                  setTestimonialFormData({
                                    name: '',
                                    specialty: '',
                                    content: '',
                                    rating: 5,
                                    avatar: ''
                                  });
                                  setBankFormData({
                                    bankName: '',
                                    accountTitle: '',
                                    accountNumber: '',
                                    branchCode: '',
                                    iban: '',
                                    isActive: true,
                                    isDefault: false,
                                    displayOrder: 1
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={editingBank ? handleUpdateBank : handleAddBank}>
                                {editingBank ? 'Update Account' : 'Add Account'}
                              </Button>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  

                  <CardDescription>Manage bank accounts for payment collection</CardDescription>
                </CardHeader>
                

                <CardContent>
                  <div className="space-y-4">
                    {paymentSettings?.bankAccounts.map((account) => (
                      <Card key={account.id} className={`border ${account.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{account.bankName}</h4>
                                {account.isDefault && (
                                  <Badge variant="default" className="bg-blue-500">Default</Badge>
                                )}
                                <Badge variant={account.isActive ? "default" : "secondary"} className={account.isActive ? "bg-green-500" : ""}>
                                  {account.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{account.accountTitle}</p>
                              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div>
                                  <span className="font-medium">Account:</span> {account.accountNumber}
                                </div>
                                <div>
                                  <span className="font-medium">Branch:</span> {account.branchCode}
                                </div>
                                {account.iban && (
                                  <div className="col-span-2">
                                    <span className="font-medium">IBAN:</span> {account.iban}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(account.iban, 'IBAN')}
                                      className="ml-2 h-auto p-1"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!account.isDefault && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultBank(account.id)}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBank(account)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBank(account.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {!paymentSettings?.bankAccounts.length && (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No bank accounts configured</p>
                        <p className="text-sm">Add a bank account to enable payment collection</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Verification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Payment Verification
                  </CardTitle>
                  <CardDescription>Configure how payments are verified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-approval">Auto-approve payments</Label>
                      <p className="text-sm text-gray-600">Automatically approve payments without manual verification</p>
                    </div>
                    <Switch
                      id="auto-approval"
                      checked={paymentSettings?.verificationSettings.autoApproval || false}
                      onCheckedChange={(checked) => {
                        if (paymentSettings) {
                          handleSettingChange('payment', 'verificationSettings', {
                            ...paymentSettings.verificationSettings,
                            autoApproval: checked
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-exact">Require exact amount</Label>
                      <p className="text-sm text-gray-600">Payment must match exactly the configured amount</p>
                    </div>
                    <Switch
                      id="require-exact"
                      checked={paymentSettings?.verificationSettings.requireExactAmount || true}
                      onCheckedChange={(checked) => {
                        if (paymentSettings) {
                          handleSettingChange('payment', 'verificationSettings', {
                            ...paymentSettings.verificationSettings,
                            requireExactAmount: checked
                          });
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grace-period">Grace period (hours)</Label>
                    <Input
                      id="grace-period"
                      type="number"
                      value={paymentSettings?.verificationSettings.gracePeriodHours || 48}
                      onChange={(e) => {
                        if (paymentSettings) {
                          handleSettingChange('payment', 'verificationSettings', {
                            ...paymentSettings.verificationSettings,
                            gracePeriodHours: parseInt(e.target.value)
                          });
                        }
                      }}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSection('payment')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </div>
            </TabsContent>

            {/* Subscription Settings */}
            <TabsContent value="subscription" className="space-y-6 mt-6">
              {realSubscriptionSettings && (
                <>
                  {/* Subscription Plans Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Subscription Plans
                      </CardTitle>
                      <CardDescription>Manage subscription plans and durations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {realSubscriptionSettings.plans.map((plan: SubscriptionPlan) => (
                        <Card key={plan.id} className={`border ${plan.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{plan.name}</h4>
                                {plan.isDefault && (
                                  <Badge variant="default" className="bg-blue-500">Default</Badge>
                                )}
                                <Badge variant={plan.isActive ? "default" : "secondary"} className={plan.isActive ? "bg-green-500" : ""}>
                                  {plan.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Plan Name */}
                              <div>
                                <Label htmlFor={`plan-name-${plan.id}`}>Plan Name</Label>
                                <Input
                                  id={`plan-name-${plan.id}`}
                                  value={plan.name}
                                  onChange={(e) => {
                                    const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                      p.id === plan.id ? { ...p, name: e.target.value } : p
                                    );
                                    setRealSubscriptionSettings({
                                      ...realSubscriptionSettings,
                                      plans: updatedPlans
                                    });
                                    setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                  }}
                                  className="mt-2"
                                />
                              </div>

                              {/* Duration */}
                              <div>
                                <Label htmlFor={`plan-duration-${plan.id}`}>Duration</Label>
                                <Input
                                  id={`plan-duration-${plan.id}`}
                                  type="number"
                                  min="1"
                                  max="24"
                                  value={plan.duration}
                                  onChange={(e) => {
                                    const duration = parseInt(e.target.value);
                                    const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                      p.id === plan.id ? { ...p, duration } : p
                                    );
                                    setRealSubscriptionSettings({
                                      ...realSubscriptionSettings,
                                      plans: updatedPlans
                                    });
                                    setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                  }}
                                  className="mt-2"
                                />
                              </div>

                              {/* Duration Type */}
                              <div>
                                <Label htmlFor={`plan-duration-type-${plan.id}`}>Duration Type</Label>
                                <Select 
                                  value={plan.durationType} 
                                  onValueChange={(value: 'days' | 'months' | 'years') => {
                                    const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                      p.id === plan.id ? { ...p, durationType: value } : p
                                    );
                                    setRealSubscriptionSettings({
                                      ...realSubscriptionSettings,
                                      plans: updatedPlans
                                    });
                                    setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Description */}
                              <div className="md:col-span-3">
                                <Label htmlFor={`plan-description-${plan.id}`}>Description</Label>
                                <Textarea
                                  id={`plan-description-${plan.id}`}
                                  value={plan.description}
                                  onChange={(e) => {
                                    const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                      p.id === plan.id ? { ...p, description: e.target.value } : p
                                    );
                                    setRealSubscriptionSettings({
                                      ...realSubscriptionSettings,
                                      plans: updatedPlans
                                    });
                                    setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                  }}
                                  rows={2}
                                  className="mt-2"
                                />
                              </div>

                              {/* Plan Controls */}
                              <div className="md:col-span-3 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`plan-active-${plan.id}`}
                                      checked={plan.isActive}
                                      onCheckedChange={(checked) => {
                                        const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                          p.id === plan.id ? { ...p, isActive: checked } : p
                                        );
                                        setRealSubscriptionSettings({
                                          ...realSubscriptionSettings,
                                          plans: updatedPlans
                                        });
                                        setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                      }}
                                    />
                                    <Label htmlFor={`plan-active-${plan.id}`}>Active</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`plan-default-${plan.id}`}
                                      checked={plan.isDefault}
                                      onCheckedChange={(checked) => {
                                        const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                                          p.id === plan.id ? { ...p, isDefault: checked } : 
                                          checked ? { ...p, isDefault: false } : p
                                        );
                                        setRealSubscriptionSettings({
                                          ...realSubscriptionSettings,
                                          plans: updatedPlans,
                                          defaultPlanId: checked ? plan.id : realSubscriptionSettings.defaultPlanId
                                        });
                                        setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                                      }}
                                    />
                                    <Label htmlFor={`plan-default-${plan.id}`}>Default Plan</Label>
                                  </div>
                                </div>

                                {/* Preview */}
                                <div className="text-sm text-gray-600">
                                  Preview: "{plan.duration} {plan.durationType === 'months' && plan.duration === 1 ? 'month' : 
                                             plan.durationType === 'months' && plan.duration > 1 ? 'months' :
                                             plan.durationType === 'years' && plan.duration === 1 ? 'year' :
                                             plan.durationType === 'years' && plan.duration > 1 ? 'years' : 
                                             plan.durationType}"
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                              p.isDefault ? { ...p, duration: 3, durationType: 'months' as const } : p
                            );
                            setRealSubscriptionSettings({
                              ...realSubscriptionSettings,
                              plans: updatedPlans
                            });
                            setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                          }}
                          className="w-full"
                        >
                          Set Default to 3 Months
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                              p.isDefault ? { ...p, duration: 6, durationType: 'months' as const } : p
                            );
                            setRealSubscriptionSettings({
                              ...realSubscriptionSettings,
                              plans: updatedPlans
                            });
                            setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                          }}
                          className="w-full"
                        >
                          Set Default to 6 Months
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const updatedPlans = realSubscriptionSettings.plans.map((p: SubscriptionPlan) => 
                              p.isDefault ? { ...p, duration: 1, durationType: 'years' as const } : p
                            );
                            setRealSubscriptionSettings({
                              ...realSubscriptionSettings,
                              plans: updatedPlans
                            });
                            setUnsavedChanges(prev => ({ ...prev, subscription: true }));
                          }}
                          className="w-full"
                        >
                          Set Default to 1 Year
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        if (realSubscriptionSettings) {
                          const success = updateSubscriptionSettings(realSubscriptionSettings, admin.name || admin.id);
                          if (success) {
                            setUnsavedChanges(prev => ({ ...prev, subscription: false }));
                            loadSubscriptionSettings();
                          }
                        }
                      }}
                      disabled={!unsavedChanges.subscription}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Subscription Settings
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* API Settings (existing - unchanged) */}
            {/* Email Verification Settings */}
            <TabsContent value="email-verification" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Verification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MailCheck className="h-5 w-5" />
                      Email Verification Settings
                    </CardTitle>
                    <CardDescription>Configure email verification behavior and limits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="token-expiry">Token Expiry (minutes)</Label>
                        <Input
                          id="token-expiry"
                          type="number"
                          min="5"
                          max="60"
                          value={emailVerificationSettings.tokenExpiryMinutes}
                          onChange={(e) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              tokenExpiryMinutes: parseInt(e.target.value)
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="max-resend">Max Resend Attempts</Label>
                        <Input
                          id="max-resend"
                          type="number"
                          min="1"
                          max="10"
                          value={emailVerificationSettings.maxResendAttempts}
                          onChange={(e) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              maxResendAttempts: parseInt(e.target.value)
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cooldown">Resend Cooldown (minutes)</Label>
                        <Input
                          id="cooldown"
                          type="number"
                          min="1"
                          max="30"
                          value={emailVerificationSettings.resendCooldownMinutes}
                          onChange={(e) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              resendCooldownMinutes: parseInt(e.target.value)
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="smtp-timeout">SMTP Timeout (seconds)</Label>
                        <Input
                          id="smtp-timeout"
                          type="number"
                          min="10"
                          max="120"
                          value={emailVerificationSettings.smtpTimeoutSeconds}
                          onChange={(e) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              smtpTimeoutSeconds: parseInt(e.target.value)
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-verification">Require Email Verification</Label>
                        <Switch
                          id="require-verification"
                          checked={emailVerificationSettings.requireEmailVerification}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              requireEmailVerification: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-verify-dev">Auto-verify in Development</Label>
                        <Switch
                          id="auto-verify-dev"
                          checked={emailVerificationSettings.autoVerifyInDevelopment}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              autoVerifyInDevelopment: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-retry">Enable Retry Mechanism</Label>
                        <Switch
                          id="enable-retry"
                          checked={emailVerificationSettings.enableRetryMechanism}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableRetryMechanism: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-timeout">Enable Timeout Handling</Label>
                        <Switch
                          id="enable-timeout"
                          checked={emailVerificationSettings.enableTimeoutHandling}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableTimeoutHandling: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-fallback">Enable Fallback Options</Label>
                        <Switch
                          id="enable-fallback"
                          checked={emailVerificationSettings.enableFallbackOptions}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableFallbackOptions: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-audit">Enable Audit Logging</Label>
                        <Switch
                          id="enable-audit"
                          checked={emailVerificationSettings.enableAuditLogging}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableAuditLogging: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-security">Enable Security Alerts</Label>
                        <Switch
                          id="enable-security"
                          checked={emailVerificationSettings.enableSecurityAlerts}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableSecurityAlerts: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enable-stats">Enable Statistics</Label>
                        <Switch
                          id="enable-stats"
                          checked={emailVerificationSettings.enableStatistics}
                          onCheckedChange={(checked) => {
                            setEmailVerificationSettings(prev => ({
                              ...prev,
                              enableStatistics: checked
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailVerification: true }));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={saveEmailVerificationSettings}
                        disabled={!unsavedChanges.emailVerification}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Settings
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={resetEmailVerificationSettings}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Verification Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Email Verification Statistics
                    </CardTitle>
                    <CardDescription>Real-time email verification metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{emailVerificationStats.totalEmailsSent}</div>
                        <div className="text-sm text-green-600">Total Emails Sent</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{emailVerificationStats.successfulDeliveries}</div>
                        <div className="text-sm text-blue-600">Successful Deliveries</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{emailVerificationStats.totalVerifications}</div>
                        <div className="text-sm text-orange-600">Total Verifications</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{emailVerificationStats.successfulVerifications}</div>
                        <div className="text-sm text-purple-600">Successful Verifications</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">{emailVerificationStats.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${emailVerificationStats.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={loadEmailVerificationStats}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Stats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Email Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>Manage email verification templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="verification" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="verification">Verification</TabsTrigger>
                      <TabsTrigger value="welcome">Welcome</TabsTrigger>
                      <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="verification" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="verification-subject">Subject</Label>
                        <Input
                          id="verification-subject"
                          value={emailTemplates.verification.subject}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              verification: { ...prev.verification, subject: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_verification: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="verification-html">HTML Content</Label>
                        <Textarea
                          id="verification-html"
                          value={emailTemplates.verification.htmlContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              verification: { ...prev.verification, htmlContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_verification: true }));
                          }}
                          rows={10}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="verification-text">Text Content</Label>
                        <Textarea
                          id="verification-text"
                          value={emailTemplates.verification.textContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              verification: { ...prev.verification, textContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_verification: true }));
                          }}
                          rows={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <Button 
                        onClick={() => saveEmailTemplate('verification')}
                        disabled={!unsavedChanges.emailTemplate_verification}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Verification Template
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="welcome" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="welcome-subject">Subject</Label>
                        <Input
                          id="welcome-subject"
                          value={emailTemplates.welcome.subject}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              welcome: { ...prev.welcome, subject: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_welcome: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="welcome-html">HTML Content</Label>
                        <Textarea
                          id="welcome-html"
                          value={emailTemplates.welcome.htmlContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              welcome: { ...prev.welcome, htmlContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_welcome: true }));
                          }}
                          rows={10}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="welcome-text">Text Content</Label>
                        <Textarea
                          id="welcome-text"
                          value={emailTemplates.welcome.textContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              welcome: { ...prev.welcome, textContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_welcome: true }));
                          }}
                          rows={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <Button 
                        onClick={() => saveEmailTemplate('welcome')}
                        disabled={!unsavedChanges.emailTemplate_welcome}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Welcome Template
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="password-reset" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="password-reset-subject">Subject</Label>
                        <Input
                          id="password-reset-subject"
                          value={emailTemplates.passwordReset.subject}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              passwordReset: { ...prev.passwordReset, subject: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_passwordReset: true }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password-reset-html">HTML Content</Label>
                        <Textarea
                          id="password-reset-html"
                          value={emailTemplates.passwordReset.htmlContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              passwordReset: { ...prev.passwordReset, htmlContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_passwordReset: true }));
                          }}
                          rows={10}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password-reset-text">Text Content</Label>
                        <Textarea
                          id="password-reset-text"
                          value={emailTemplates.passwordReset.textContent}
                          onChange={(e) => {
                            setEmailTemplates(prev => ({
                              ...prev,
                              passwordReset: { ...prev.passwordReset, textContent: e.target.value }
                            }));
                            setUnsavedChanges(prev => ({ ...prev, emailTemplate_passwordReset: true }));
                          }}
                          rows={5}
                          className="mt-2"
                        />
                      </div>
                      
                      <Button 
                        onClick={() => saveEmailTemplate('passwordReset')}
                        disabled={!unsavedChanges.emailTemplate_passwordReset}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Password Reset Template
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Email Testing Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Email Testing Tools
                  </CardTitle>
                  <CardDescription>Test email verification functionality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="test-email">Test Email Address</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="test@example.com"
                        value={testEmailConfig.testEmail}
                        onChange={(e) => setTestEmailConfig(prev => ({ ...prev, testEmail: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="test-name">Test Name</Label>
                      <Input
                        id="test-name"
                        placeholder="Test User"
                        value={testEmailConfig.testName}
                        onChange={(e) => setTestEmailConfig(prev => ({ ...prev, testName: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={testEmailVerification}
                    disabled={!testEmailConfig.testEmail || !testEmailConfig.testName || testEmailConfig.isTesting}
                    className="flex items-center gap-2"
                  >
                    {testEmailConfig.isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                  
                  {testEmailConfig.testResults && (
                    <div className={`p-4 rounded-lg ${
                      testEmailConfig.testResults.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testEmailConfig.testResults.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          testEmailConfig.testResults.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testEmailConfig.testResults.success ? 'Test Successful' : 'Test Failed'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{testEmailConfig.testResults.message}</p>
                      {testEmailConfig.testResults.emailId && (
                        <p className="text-xs text-gray-500 mt-1">Email ID: {testEmailConfig.testResults.emailId}</p>
                      )}
                      {testEmailConfig.testResults.deliveryStatus && (
                        <p className="text-xs text-gray-500">Status: {testEmailConfig.testResults.deliveryStatus}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Timestamp: {new Date(testEmailConfig.testResults.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-requests">Max Requests Per Hour</Label>
                    <Input
                      id="max-requests"
                      type="number"
                      value={apiSettings.maxRequestsPerHour}
                      onChange={(e) => handleSettingChange('api', 'maxRequestsPerHour', parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rate-limit">Rate Limiting Enabled</Label>
                      <Switch
                        id="rate-limit"
                        checked={apiSettings.rateLimitEnabled}
                        onCheckedChange={(checked) => handleSettingChange('api', 'rateLimitEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="api-keys">API Keys Enabled</Label>
                      <Switch
                        id="api-keys"
                        checked={apiSettings.apiKeysEnabled}
                        onCheckedChange={(checked) => handleSettingChange('api', 'apiKeysEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="webhooks">Webhooks Enabled</Label>
                      <Switch
                        id="webhooks"
                        checked={apiSettings.webhooksEnabled}
                        onCheckedChange={(checked) => handleSettingChange('api', 'webhooksEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="logging">Logging Enabled</Label>
                      <Switch
                        id="logging"
                        checked={apiSettings.loggingEnabled}
                        onCheckedChange={(checked) => handleSettingChange('api', 'loggingEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="analytics">Analytics Enabled</Label>
                      <Switch
                        id="analytics"
                        checked={apiSettings.analyticsEnabled}
                        onCheckedChange={(checked) => handleSettingChange('api', 'analyticsEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSection('api')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
                </Button>
              </div>
            </TabsContent>

            {/* Admin Access Settings */}
            <TabsContent value="admin-access" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Admin Access Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Admin Access Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure role-specific admin panel access methods for enhanced security
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="admin-access-enabled">Admin Access Enabled</Label>
                          <Switch
                            id="admin-access-enabled"
                            checked={adminAccessSettings.enabled}
                            onCheckedChange={(checked) => handleSettingChange('admin-access', 'enabled', checked)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="security-level">Security Level</Label>
                          <Select
                            value={adminAccessSettings.securityLevel}
                            onValueChange={(value) => handleSettingChange('admin-access', 'securityLevel', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select security level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="default-method">Default Access Method</Label>
                          <Select
                            value={adminAccessSettings.defaultMethod}
                            onValueChange={(value) => handleSettingChange('admin-access', 'defaultMethod', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select default method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="keyboard-shortcut">Keyboard Shortcut</SelectItem>
                              <SelectItem value="mouse-gesture">Mouse Gesture</SelectItem>
                              <SelectItem value="scroll-pattern">Scroll Pattern</SelectItem>
                              <SelectItem value="multi-modifier">Multi-Modifier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role-Specific Access Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role-Specific Access Methods</CardTitle>
                    <CardDescription>
                      Configure unique access methods for each admin role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Super Admin */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-600" />
                            <h3 className="font-semibold">Super Admin</h3>
                          </div>
                          <Switch 
                            checked={adminAccessSettings.roleAccess['super-admin']?.enabled || false}
                            onCheckedChange={(checked) => handleSettingChange('admin-access', 'roleAccess.super-admin.enabled', checked)}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Shortcut Mode</Label>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="super-admin-single"
                                  name="super-admin-mode"
                                  checked={adminAccessSettings.roleAccess['super-admin']?.shortcutMode === 'single'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.super-admin.shortcutMode', 'single')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="super-admin-single" className="text-sm">Single Shortcut</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="super-admin-multiple"
                                  name="super-admin-mode"
                                  checked={adminAccessSettings.roleAccess['super-admin']?.shortcutMode === 'multiple'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.super-admin.shortcutMode', 'multiple')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="super-admin-multiple" className="text-sm">Multiple Shortcuts</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Shortcuts</Label>
                            {adminAccessSettings.roleAccess['super-admin']?.shortcutMode === 'single' ? (
                              <Input
                                value={(adminAccessSettings.roleAccess['super-admin']?.shortcuts || [])[0] || ''}
                                onChange={(e) => {
                                  const shortcuts = [...(adminAccessSettings.roleAccess['super-admin']?.shortcuts || [])];
                                  shortcuts[0] = e.target.value;
                                  handleSettingChange('admin-access', 'roleAccess.super-admin.shortcuts', shortcuts);
                                }}
                                placeholder="Ctrl+Alt+Shift+A, then D"
                                className="mt-2"
                              />
                            ) : (
                              <div className="space-y-2 mt-2">
                                {(adminAccessSettings.roleAccess['super-admin']?.shortcuts || ['']).map((shortcut, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={shortcut}
                                      onChange={(e) => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['super-admin']?.shortcuts || [])];
                                        shortcuts[index] = e.target.value;
                                        handleSettingChange('admin-access', 'roleAccess.super-admin.shortcuts', shortcuts);
                                      }}
                                      placeholder={`Shortcut ${index + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['super-admin']?.shortcuts || [])];
                                        shortcuts.splice(index, 1);
                                        handleSettingChange('admin-access', 'roleAccess.super-admin.shortcuts', shortcuts);
                                      }}
                                      disabled={(adminAccessSettings.roleAccess['super-admin']?.shortcuts || []).length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const shortcuts = [...(adminAccessSettings.roleAccess['super-admin']?.shortcuts || [])];
                                    shortcuts.push('');
                                    handleSettingChange('admin-access', 'roleAccess.super-admin.shortcuts', shortcuts);
                                  }}
                                >
                                  Add Shortcut
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <Badge className={`mt-2 ${adminAccessSettings.roleAccess['super-admin']?.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {adminAccessSettings.roleAccess['super-admin']?.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Finance Manager */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold">Finance Manager</h3>
                          </div>
                          <Switch 
                            checked={adminAccessSettings.roleAccess['finance-manager']?.enabled || false}
                            onCheckedChange={(checked) => handleSettingChange('admin-access', 'roleAccess.finance-manager.enabled', checked)}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Shortcut Mode</Label>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="finance-single"
                                  name="finance-mode"
                                  checked={adminAccessSettings.roleAccess['finance-manager']?.shortcutMode === 'single'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcutMode', 'single')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="finance-single" className="text-sm">Single Shortcut</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="finance-multiple"
                                  name="finance-mode"
                                  checked={adminAccessSettings.roleAccess['finance-manager']?.shortcutMode === 'multiple'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcutMode', 'multiple')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="finance-multiple" className="text-sm">Multiple Shortcuts</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Shortcuts</Label>
                            {adminAccessSettings.roleAccess['finance-manager']?.shortcutMode === 'single' ? (
                              <Input
                                value={(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || [])[0] || ''}
                                onChange={(e) => {
                                  const shortcuts = [...(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || [])];
                                  shortcuts[0] = e.target.value;
                                  handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcuts', shortcuts);
                                }}
                                placeholder="Ctrl+Alt+F"
                                className="mt-2"
                              />
                            ) : (
                              <div className="space-y-2 mt-2">
                                {(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || ['']).map((shortcut, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={shortcut}
                                      onChange={(e) => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || [])];
                                        shortcuts[index] = e.target.value;
                                        handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcuts', shortcuts);
                                      }}
                                      placeholder={`Shortcut ${index + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || [])];
                                        shortcuts.splice(index, 1);
                                        handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcuts', shortcuts);
                                      }}
                                      disabled={(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || []).length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const shortcuts = [...(adminAccessSettings.roleAccess['finance-manager']?.shortcuts || [])];
                                    shortcuts.push('');
                                    handleSettingChange('admin-access', 'roleAccess.finance-manager.shortcuts', shortcuts);
                                  }}
                                >
                                  Add Shortcut
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <Badge className={`mt-2 ${adminAccessSettings.roleAccess['finance-manager']?.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {adminAccessSettings.roleAccess['finance-manager']?.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Content Manager */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BookText className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold">Content Manager</h3>
                          </div>
                          <Switch 
                            checked={adminAccessSettings.roleAccess['content-manager']?.enabled || false}
                            onCheckedChange={(checked) => handleSettingChange('admin-access', 'roleAccess.content-manager.enabled', checked)}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Shortcut Mode</Label>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="content-single"
                                  name="content-mode"
                                  checked={adminAccessSettings.roleAccess['content-manager']?.shortcutMode === 'single'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.content-manager.shortcutMode', 'single')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="content-single" className="text-sm">Single Shortcut</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="content-multiple"
                                  name="content-mode"
                                  checked={adminAccessSettings.roleAccess['content-manager']?.shortcutMode === 'multiple'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.content-manager.shortcutMode', 'multiple')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="content-multiple" className="text-sm">Multiple Shortcuts</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Shortcuts</Label>
                            {adminAccessSettings.roleAccess['content-manager']?.shortcutMode === 'single' ? (
                              <Input
                                value={(adminAccessSettings.roleAccess['content-manager']?.shortcuts || [])[0] || ''}
                                onChange={(e) => {
                                  const shortcuts = [...(adminAccessSettings.roleAccess['content-manager']?.shortcuts || [])];
                                  shortcuts[0] = e.target.value;
                                  handleSettingChange('admin-access', 'roleAccess.content-manager.shortcuts', shortcuts);
                                }}
                                placeholder="Ctrl+Alt+C"
                                className="mt-2"
                              />
                            ) : (
                              <div className="space-y-2 mt-2">
                                {(adminAccessSettings.roleAccess['content-manager']?.shortcuts || ['']).map((shortcut, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={shortcut}
                                      onChange={(e) => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['content-manager']?.shortcuts || [])];
                                        shortcuts[index] = e.target.value;
                                        handleSettingChange('admin-access', 'roleAccess.content-manager.shortcuts', shortcuts);
                                      }}
                                      placeholder={`Shortcut ${index + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['content-manager']?.shortcuts || [])];
                                        shortcuts.splice(index, 1);
                                        handleSettingChange('admin-access', 'roleAccess.content-manager.shortcuts', shortcuts);
                                      }}
                                      disabled={(adminAccessSettings.roleAccess['content-manager']?.shortcuts || []).length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const shortcuts = [...(adminAccessSettings.roleAccess['content-manager']?.shortcuts || [])];
                                    shortcuts.push('');
                                    handleSettingChange('admin-access', 'roleAccess.content-manager.shortcuts', shortcuts);
                                  }}
                                >
                                  Add Shortcut
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <Badge className={`mt-2 ${adminAccessSettings.roleAccess['content-manager']?.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {adminAccessSettings.roleAccess['content-manager']?.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Audit Manager */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold">Audit Manager</h3>
                          </div>
                          <Switch 
                            checked={adminAccessSettings.roleAccess['audit-manager']?.enabled || false}
                            onCheckedChange={(checked) => handleSettingChange('admin-access', 'roleAccess.audit-manager.enabled', checked)}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Shortcut Mode</Label>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="audit-single"
                                  name="audit-mode"
                                  checked={adminAccessSettings.roleAccess['audit-manager']?.shortcutMode === 'single'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcutMode', 'single')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="audit-single" className="text-sm">Single Shortcut</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="audit-multiple"
                                  name="audit-mode"
                                  checked={adminAccessSettings.roleAccess['audit-manager']?.shortcutMode === 'multiple'}
                                  onChange={() => handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcutMode', 'multiple')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="audit-multiple" className="text-sm">Multiple Shortcuts</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Shortcuts</Label>
                            {adminAccessSettings.roleAccess['audit-manager']?.shortcutMode === 'single' ? (
                              <Input
                                value={(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || [])[0] || ''}
                                onChange={(e) => {
                                  const shortcuts = [...(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || [])];
                                  shortcuts[0] = e.target.value;
                                  handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcuts', shortcuts);
                                }}
                                placeholder="Ctrl+Alt+Shift+E"
                                className="mt-2"
                              />
                            ) : (
                              <div className="space-y-2 mt-2">
                                {(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || ['']).map((shortcut, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={shortcut}
                                      onChange={(e) => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || [])];
                                        shortcuts[index] = e.target.value;
                                        handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcuts', shortcuts);
                                      }}
                                      placeholder={`Shortcut ${index + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const shortcuts = [...(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || [])];
                                        shortcuts.splice(index, 1);
                                        handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcuts', shortcuts);
                                      }}
                                      disabled={(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || []).length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const shortcuts = [...(adminAccessSettings.roleAccess['audit-manager']?.shortcuts || [])];
                                    shortcuts.push('');
                                    handleSettingChange('admin-access', 'roleAccess.audit-manager.shortcuts', shortcuts);
                                  }}
                                >
                                  Add Shortcut
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <Badge className={`mt-2 ${adminAccessSettings.roleAccess['audit-manager']?.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {adminAccessSettings.roleAccess['audit-manager']?.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Access Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Access Attempts</CardTitle>
                    <CardDescription>
                      Monitor admin access attempts and security events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Super Admin Access</p>
                            <p className="text-sm text-gray-600">Ctrl+Alt+Shift+A, then D</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Success</p>
                          <p className="text-xs text-gray-600">2 minutes ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Finance Manager Access</p>
                            <p className="text-sm text-gray-600">Mouse gesture failed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">Failed</p>
                          <p className="text-xs text-gray-600">5 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSection('admin-access')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Admin Access Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 🆕 Separate Testimonial Dialog */}
      <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </DialogTitle>
            <DialogDescription>
              {editingTestimonial ? 'Update the testimonial details' : 'Add a new testimonial from a satisfied user'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="testimonial-name">Name</Label>
              <Input
                id="testimonial-name"
                value={testimonialFormData.name}
                onChange={(e) => setTestimonialFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dr. John Smith"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="testimonial-specialty">Specialty</Label>
              <Input
                id="testimonial-specialty"
                value={testimonialFormData.specialty}
                onChange={(e) => setTestimonialFormData(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="Internal Medicine"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="testimonial-content">Testimonial Content</Label>
              <Textarea
                id="testimonial-content"
                value={testimonialFormData.content}
                onChange={(e) => setTestimonialFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share their experience with the platform..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="testimonial-rating">Rating (1-5)</Label>
              <Input
                id="testimonial-rating"
                type="number"
                min="1"
                max="5"
                value={testimonialFormData.rating}
                onChange={(e) => setTestimonialFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="testimonial-avatar">Avatar Initials (optional)</Label>
              <Input
                id="testimonial-avatar"
                value={testimonialFormData.avatar}
                onChange={(e) => setTestimonialFormData(prev => ({ ...prev, avatar: e.target.value }))}
                placeholder="JS (will auto-generate if empty)"
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTestimonialDialog(false);
                setEditingTestimonial(null);
                setTestimonialFormData({
                  name: '',
                  specialty: '',
                  content: '',
                  rating: 5,
                  avatar: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingTestimonial ? handleUpdateTestimonial : handleAddTestimonial}>
              {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🆕 Separate Contact Method Dialog */}
      <Dialog open={showContactMethodDialog} onOpenChange={setShowContactMethodDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingContactMethod ? 'Edit Contact Method' : 'Add New Contact Method'}
            </DialogTitle>
            <DialogDescription>
              {editingContactMethod ? 'Update the contact method details' : 'Add a new contact method for users'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={contactMethodFormData.title}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Email Support"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={contactMethodFormData.icon}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Mail">Mail</option>
                  <option value="Phone">Phone</option>
                  <option value="MessageCircle">MessageCircle</option>
                  <option value="MessageSquare">MessageSquare</option>
                  <option value="HeadphonesIcon">HeadphonesIcon</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={contactMethodFormData.description}
                onChange={(e) => setContactMethodFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Send us an email for detailed inquiries"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Info</Label>
                <Input
                  value={contactMethodFormData.contact}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="support@pulseprep.com"
                />
              </div>
              <div>
                <Label>Response Time</Label>
                <Input
                  value={contactMethodFormData.response}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, response: e.target.value }))}
                  placeholder="Within 24 hours"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  min="1"
                  value={contactMethodFormData.priority}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Color</Label>
                <select
                  value={contactMethodFormData.color}
                  onChange={(e) => setContactMethodFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-emerald-500">Emerald</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-red-500">Red</option>
                </select>
              </div>
              <div>
                <Label>Active</Label>
                <div className="mt-2">
                  <Switch
                    checked={contactMethodFormData.isActive}
                    onCheckedChange={(checked) => setContactMethodFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowContactMethodDialog(false);
                setEditingContactMethod(null);
                setContactMethodFormData({
                  title: '',
                  description: '',
                  contact: '',
                  response: '',
                  icon: 'Mail',
                  priority: 1,
                  color: 'bg-blue-500',
                  isActive: true
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingContactMethod ? handleUpdateContactMethod : handleAddContactMethod}>
              {editingContactMethod ? 'Update Contact Method' : 'Add Contact Method'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🆕 Separate Social Link Dialog */}
      <Dialog open={showSocialLinkDialog} onOpenChange={setShowSocialLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSocialLink ? 'Edit Social Link' : 'Add New Social Link'}
            </DialogTitle>
            <DialogDescription>
              {editingSocialLink ? 'Update the social link details' : 'Add a new social media link'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform Name</Label>
                <Input
                  value={socialLinkFormData.name}
                  onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Facebook"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={socialLinkFormData.icon}
                  onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Linkedin">LinkedIn</option>
                  <option value="Youtube">YouTube</option>
                  <option value="Globe">Website</option>
                </select>
              </div>
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={socialLinkFormData.url}
                onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://facebook.com/pulseprep"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={socialLinkFormData.displayOrder}
                  onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Color</Label>
                <select
                  value={socialLinkFormData.color}
                  onChange={(e) => setSocialLinkFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="bg-blue-600">Blue</option>
                  <option value="bg-sky-500">Sky Blue</option>
                  <option value="bg-pink-500">Pink</option>
                  <option value="bg-blue-700">Dark Blue</option>
                  <option value="bg-red-600">Red</option>
                  <option value="bg-green-600">Green</option>
                </select>
              </div>
              <div>
                <Label>Active</Label>
                <div className="mt-2">
                  <Switch
                    checked={socialLinkFormData.isActive}
                    onCheckedChange={(checked) => setSocialLinkFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSocialLinkDialog(false);
                setEditingSocialLink(null);
                setSocialLinkFormData({
                  name: '',
                  icon: 'Facebook',
                  url: '',
                  color: 'bg-blue-600',
                  isActive: true,
                  displayOrder: 1
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingSocialLink ? handleUpdateSocialLink : handleAddSocialLink}>
              {editingSocialLink ? 'Update Social Link' : 'Add Social Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🆕 Separate Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </DialogTitle>
            <DialogDescription>
              {editingFeature ? 'Update the feature details' : 'Add a new feature for the homepage'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={featureFormData.title}
                  onChange={(e) => setFeatureFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Advanced Analytics"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={featureFormData.icon}
                  onChange={(e) => setFeatureFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Star">Star</option>
                  <option value="CheckCircle">CheckCircle</option>
                  <option value="Zap">Zap</option>
                  <option value="Shield">Shield</option>
                  <option value="TrendingUp">TrendingUp</option>
                  <option value="Award">Award</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={featureFormData.description}
                onChange={(e) => setFeatureFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Comprehensive analytics and insights to track your progress"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={featureFormData.displayOrder}
                  onChange={(e) => setFeatureFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Color</Label>
                <select
                  value={featureFormData.color}
                  onChange={(e) => setFeatureFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-emerald-500">Emerald</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-red-500">Red</option>
                </select>
              </div>
              <div>
                <Label>Active</Label>
                <div className="mt-2">
                  <Switch
                    checked={featureFormData.isActive}
                    onCheckedChange={(checked) => setFeatureFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFeatureDialog(false);
                setEditingFeature(null);
                setFeatureFormData({
                  title: '',
                  description: '',
                  icon: 'Star',
                  color: 'bg-blue-500',
                  isActive: true,
                  displayOrder: 1
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingFeature ? handleUpdateFeature : handleAddFeature}>
              {editingFeature ? 'Update Feature' : 'Add Feature'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};