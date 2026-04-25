// Enhanced Payment Settings Management with Single Source of Truth
import { BankAccount, ExtendedPaymentSettings } from '../types';

// Payment settings versioning for change detection
let paymentSettingsVersion = 0;
let paymentSettingsCache: ExtendedPaymentSettings | null = null;

// Event system for payment settings changes
const paymentSettingsListeners: Array<(settings: ExtendedPaymentSettings) => void> = [];

// 🔥 FIXED: Updated default payment settings structure with single payment amount
const defaultPaymentSettings: ExtendedPaymentSettings = {
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'HBL Bank',
      accountTitle: 'PulsePrep Education Services',
      accountNumber: '12345678901234',
      iban: 'PK36HABB0000000012345678',
      branchCode: '1234',
      isActive: true,
      isDefault: true,
      displayOrder: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    {
      id: 'bank-2', 
      bankName: 'UBL Bank',
      accountTitle: 'PulsePrep Education Services',
      accountNumber: '98765432109876',
      iban: 'PK45UNIL0000000098765432',
      branchCode: '5678',
      isActive: true,
      isDefault: false,
      displayOrder: 2,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    }
  ],
  paymentInstructions: 'Please transfer the exact amount and upload a clear screenshot of your payment confirmation for verification.',
  paymentAmount: 7000,          // 🔥 ADDED: Single source of truth for payment amount
  currency: 'PKR',              // 🔥 ADDED: Currency for payment amount
  verificationSettings: {
    autoApproval: false,
    requireExactAmount: true,
    gracePeriodHours: 48,
    allowPartialPayments: false,
    requireTransactionId: false,
    requireManualVerification: true,
    autoApprovalEnabled: false,
    maxRetries: 3
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: 1
};

// Subscribe to payment settings changes
export const subscribeToPaymentSettingsChanges = (callback: (settings: ExtendedPaymentSettings) => void) => {
  paymentSettingsListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = paymentSettingsListeners.indexOf(callback);
    if (index > -1) {
      paymentSettingsListeners.splice(index, 1);
    }
  };
};

// 🔧 FIXED: Notify all listeners with infinite loop prevention
const notifyPaymentSettingsChange = (settings: ExtendedPaymentSettings) => {
  paymentSettingsVersion++;
  paymentSettingsCache = settings;
  
  paymentSettingsListeners.forEach(callback => {
    try {
      callback(settings);
    } catch (error) {
      // Silent error handling for payment settings listeners
    }
  });
  
  // 🔧 COMMENTED OUT: This was causing infinite loop with App.tsx refresh system
  // window.dispatchEvent(new CustomEvent('paymentSettingsChanged', { 
  //   detail: { settings, version: paymentSettingsVersion } 
  // }));
};

// 🔥 ADDED: Migration function to handle existing data
const migratePaymentSettingsToNewFormat = (settings: any): ExtendedPaymentSettings => {
  if (!settings.paymentAmount || !settings.currency) {

    
    // Get current amount from subscription settings if available
    let defaultAmount = 7000;
    let defaultCurrency = 'PKR';
    
    try {
      const subscriptionSettings = JSON.parse(localStorage.getItem('pulseprep_subscription_settings') || '{}');
      if (subscriptionSettings.plans && Array.isArray(subscriptionSettings.plans)) {
        const currentPlan = subscriptionSettings.plans.find((p: any) => p.isDefault) || subscriptionSettings.plans[0];
        if (currentPlan?.price) {
          defaultAmount = currentPlan.price;
          defaultCurrency = currentPlan.currency || 'PKR';
        }
      }
    } catch (error) {
      console.error('Error reading subscription settings during migration:', error);
    }
    
    settings.paymentAmount = settings.paymentAmount || defaultAmount;
    settings.currency = settings.currency || defaultCurrency;
    
    console.log('✅ Payment settings migrated with amount:', defaultAmount, defaultCurrency);
  }
  
  return settings;
};

// Initialize payment settings with proper structure
export const initializePaymentSettings = (): ExtendedPaymentSettings => {
  try {
    const existing = localStorage.getItem('pulseprep_payment_settings');
    
    if (existing) {
      const parsed = JSON.parse(existing) as ExtendedPaymentSettings;
      
      // Validate structure
      if (!parsed.bankAccounts || !Array.isArray(parsed.bankAccounts)) {
        console.warn('⚠️ Invalid payment settings structure, reinitializing...');
        localStorage.setItem('pulseprep_payment_settings', JSON.stringify(defaultPaymentSettings));
        paymentSettingsCache = defaultPaymentSettings;
        return defaultPaymentSettings;
      }
      
      // Ensure version is set
      if (!parsed.version) {
        parsed.version = 1;
        localStorage.setItem('pulseprep_payment_settings', JSON.stringify(parsed));
      }
      
      // Update cache
      paymentSettingsCache = parsed;
      paymentSettingsVersion = parsed.version || 1;
      
      console.log('💰 Payment settings loaded:', {
        version: parsed.version,
        bankAccounts: parsed.bankAccounts.length,
        activeAccounts: parsed.bankAccounts.filter(b => b.isActive).length,
        paymentAmount: parsed.paymentAmount,
        currency: parsed.currency
      });
      
      return parsed;
    }
    
    // Initialize with defaults
    localStorage.setItem('pulseprep_payment_settings', JSON.stringify(defaultPaymentSettings));
    paymentSettingsCache = defaultPaymentSettings;
    paymentSettingsVersion = 1;
    
    console.log('💰 Payment settings initialized with defaults');
    return defaultPaymentSettings;
    
  } catch (error) {
    console.error('❌ Error initializing payment settings:', error);
    localStorage.setItem('pulseprep_payment_settings', JSON.stringify(defaultPaymentSettings));
    paymentSettingsCache = defaultPaymentSettings;
    paymentSettingsVersion = 1;
    return defaultPaymentSettings;
  }
};

// 🔥 FIXED: Enhanced getPaymentSettings with migration support
export const getPaymentSettings = (forceRefresh: boolean = false): ExtendedPaymentSettings => {
  try {
    // Check if we need to refresh from localStorage
    if (forceRefresh || !paymentSettingsCache) {
      const stored = localStorage.getItem('pulseprep_payment_settings');
      if (stored) {
        let parsed = JSON.parse(stored) as ExtendedPaymentSettings;
        
        // Validate structure
        if (!parsed.bankAccounts || !Array.isArray(parsed.bankAccounts)) {
          console.warn('⚠️ Invalid payment settings detected, reinitializing...');
          return initializePaymentSettings();
        }
        
        // 🔥 MIGRATION: Migrate to new format if needed
        parsed = migratePaymentSettingsToNewFormat(parsed);
        
        // Save migrated settings back to localStorage
        localStorage.setItem('pulseprep_payment_settings', JSON.stringify(parsed));
        
        // Check if version changed (updated by admin)
        const newVersion = parsed.version || 1;
        if (newVersion !== paymentSettingsVersion) {
          console.log(`🔄 Payment settings version changed: ${paymentSettingsVersion} → ${newVersion}`);
          paymentSettingsVersion = newVersion;
          paymentSettingsCache = parsed;
          
          // Don't notify on force refresh to avoid loops
          if (!forceRefresh) {
            notifyPaymentSettingsChange(parsed);
          }
        }
        
        return parsed;
      }
      
      return initializePaymentSettings();
    }
    
    return paymentSettingsCache;
    
  } catch (error) {
    console.error('❌ Error getting payment settings:', error);
    return initializePaymentSettings();
  }
};

// 🔥 FIXED: Get current payment amount from payment settings FIRST
export const getCurrentPaymentAmount = (): { amount: number; currency: string } => {
  console.log('🔍 getCurrentPaymentAmount() called');
  
  try {
    // 🔥 FIXED: Check payment settings FIRST (this was the missing link!)
    const paymentSettings = getPaymentSettings();
    console.log('💰 Payment settings loaded:', paymentSettings);
    
    if (paymentSettings.paymentAmount) {
      console.log('✅ Using payment settings amount:', paymentSettings.paymentAmount, paymentSettings.currency);
      return {
        amount: paymentSettings.paymentAmount,
        currency: paymentSettings.currency || 'PKR'
      };
    }
    
    console.log('⚠️ No paymentAmount found, falling back to subscription settings');
    
    // Fallback to subscription settings (for backward compatibility)
    const subscriptionSettings = localStorage.getItem('pulseprep_subscription_settings');
    if (subscriptionSettings) {
      const parsed = JSON.parse(subscriptionSettings);
      if (parsed.plans && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
        const defaultPlan = parsed.plans.find((p: any) => p.isDefault) || parsed.plans[0];
        console.log('📋 Using subscription plan fallback:', defaultPlan.price, defaultPlan.currency);
        return {
          amount: defaultPlan.price || 7000,
          currency: defaultPlan.currency || 'PKR'
        };
      }
    }
    
    console.log('🔧 Using final fallback: 7000 PKR');
    // Final fallback
    return { amount: 7000, currency: 'PKR' };
  } catch (error) {
    console.error('❌ Error in getCurrentPaymentAmount:', error);
    return { amount: 7000, currency: 'PKR' };
  }
};

// 🔥 ADDED: Sync function to keep subscription settings in sync
export const syncSubscriptionWithPaymentSettings = (paymentSettings: ExtendedPaymentSettings): boolean => {
  try {
    const subscriptionSettings = JSON.parse(localStorage.getItem('pulseprep_subscription_settings') || '{}');
    
    if (subscriptionSettings.plans && Array.isArray(subscriptionSettings.plans)) {
      // Update all subscription plans to match payment settings
      subscriptionSettings.plans = subscriptionSettings.plans.map((plan: any) => ({
        ...plan,
        price: paymentSettings.paymentAmount,
        currency: paymentSettings.currency
      }));
      
      subscriptionSettings.lastUpdated = new Date().toISOString();
      subscriptionSettings.updatedBy = paymentSettings.updatedBy;
      subscriptionSettings.version = (subscriptionSettings.version || 0) + 1;
      
      localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(subscriptionSettings));
      
      console.log('✅ Subscription plans synced with payment settings:', {
        newAmount: paymentSettings.paymentAmount,
        currency: paymentSettings.currency
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error syncing subscription with payment settings:', error);
    return false;
  }
};

// 🔧 FIXED: Update payment settings with simplified notifications to prevent loops
export const updatePaymentSettings = (settings: ExtendedPaymentSettings, updatedBy: string): boolean => {
  try {
    // Validate settings structure
    if (!settings.bankAccounts || !Array.isArray(settings.bankAccounts)) {
      console.error('❌ Cannot update payment settings: invalid bankAccounts array');
      return false;
    }
    
    // Ensure at least one bank account exists
    if (settings.bankAccounts.length === 0) {
      console.error('❌ Cannot update payment settings: no bank accounts provided');
      return false;
    }
    
    // Increment version for change detection
    const newVersion = (settings.version || 0) + 1;
    
    const updatedSettings: ExtendedPaymentSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy,
      version: newVersion
    };
    
    // Save to localStorage
    localStorage.setItem('pulseprep_payment_settings', JSON.stringify(updatedSettings));
    
    // 🔥 SYNC: Sync with subscription system
    syncSubscriptionWithPaymentSettings(updatedSettings);
    
    // 🔧 SIMPLIFIED: Direct notification without triggering App.tsx refresh
    paymentSettingsCache = updatedSettings;
    paymentSettingsVersion = newVersion;

    paymentSettingsListeners.forEach(callback => {
      try {
        callback(updatedSettings);
      } catch (error) {
        console.error('❌ Error in payment settings change listener:', error);
      }
    });
    
    console.log('✅ Payment settings updated successfully:', {
      version: newVersion,
      updatedBy,
      paymentAmount: updatedSettings.paymentAmount,
      currency: updatedSettings.currency,
      bankAccounts: updatedSettings.bankAccounts.length
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating payment settings:', error);
    return false;
  }
};

// 🔧 FIXED: Force refresh without triggering notification loops
export const forceRefreshPaymentSettings = (): ExtendedPaymentSettings => {
  console.log('🔄 Force refreshing payment settings...');
  paymentSettingsCache = null;
  const settings = getPaymentSettings(true);
  // 🔧 REMOVED: Don't notify to prevent infinite loop
  // notifyPaymentSettingsChange(settings);
  return settings;
};

// Get active bank accounts
export const getActiveBankAccounts = (): BankAccount[] => {
  const settings = getPaymentSettings();
  return settings.bankAccounts.filter(account => account.isActive);
};

// Get default bank account
export const getDefaultBankAccount = (): BankAccount | null => {
  const settings = getPaymentSettings();
  return settings.bankAccounts.find(account => account.isDefault && account.isActive) || null;
};

// Format payment amount with currency and locale-specific formatting
export const formatPaymentAmount = (amount: number, currency: string = 'PKR'): string => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return `${currency} 0`;
    }
    
    // Format the number with commas for Pakistani Rupee
    if (currency === 'PKR') {
      return `PKR ${amount.toLocaleString('en-PK')}`;
    }
    
    // For other currencies, use standard locale formatting
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'PKR' ? 'USD' : currency, // Fallback for PKR since it may not be supported
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (currency === 'PKR') {
      // Custom formatting for PKR
      return `PKR ${amount.toLocaleString('en-US')}`;
    }
    
    return formatter.format(amount);
  } catch (error) {
    console.error('❌ Error formatting payment amount:', error);
    return `${currency} ${amount || 0}`;
  }
};

// Add a new bank account
export const addBankAccount = (bankAccount: Omit<BankAccount, 'id' | 'lastUpdated'>, updatedBy: string): boolean => {
  try {
    const settings = getPaymentSettings();
    
    // Generate new ID
    const newId = `bank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new bank account
    const newBankAccount: BankAccount = {
      ...bankAccount,
      id: newId,
      lastUpdated: new Date().toISOString(),
      updatedBy,
      displayOrder: bankAccount.displayOrder || (settings.bankAccounts.length + 1)
    };
    
    // If this is set as default, remove default from others
    if (newBankAccount.isDefault) {
      settings.bankAccounts.forEach(account => {
        account.isDefault = false;
      });
    }
    
    // Add to bank accounts array
    settings.bankAccounts.push(newBankAccount);
    
    // Update settings
    const success = updatePaymentSettings(settings, updatedBy);
    
    if (success) {
      console.log('✅ Bank account added successfully:', newBankAccount.bankName);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error adding bank account:', error);
    return false;
  }
};

// Update an existing bank account
export const updateBankAccount = (accountId: string, updates: Partial<BankAccount>, updatedBy: string): boolean => {
  try {
    const settings = getPaymentSettings();
    
    // Find the account to update
    const accountIndex = settings.bankAccounts.findIndex(account => account.id === accountId);
    
    if (accountIndex === -1) {
      console.error('❌ Bank account not found:', accountId);
      return false;
    }
    
    // If setting as default, remove default from others
    if (updates.isDefault) {
      settings.bankAccounts.forEach(account => {
        account.isDefault = false;
      });
    }
    
    // Update the account
    settings.bankAccounts[accountIndex] = {
      ...settings.bankAccounts[accountIndex],
      ...updates,
      id: accountId, // Preserve original ID
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    
    // Update settings
    const success = updatePaymentSettings(settings, updatedBy);
    
    if (success) {
      console.log('✅ Bank account updated successfully:', accountId);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error updating bank account:', error);
    return false;
  }
};

// Delete a bank account
export const deleteBankAccount = (accountId: string, updatedBy: string): boolean => {
  try {
    const settings = getPaymentSettings();
    
    // Find the account to delete
    const accountIndex = settings.bankAccounts.findIndex(account => account.id === accountId);
    
    if (accountIndex === -1) {
      console.error('❌ Bank account not found:', accountId);
      return false;
    }
    
    // Check if it's the last account
    if (settings.bankAccounts.length <= 1) {
      console.error('❌ Cannot delete the last bank account');
      return false;
    }
    
    const accountToDelete = settings.bankAccounts[accountIndex];
    
    // Remove the account
    settings.bankAccounts.splice(accountIndex, 1);
    
    // If the deleted account was default, set the first remaining account as default
    if (accountToDelete.isDefault && settings.bankAccounts.length > 0) {
      settings.bankAccounts[0].isDefault = true;
    }
    
    // Update display orders
    settings.bankAccounts.forEach((account, index) => {
      account.displayOrder = index + 1;
    });
    
    // Update settings
    const success = updatePaymentSettings(settings, updatedBy);
    
    if (success) {
      console.log('✅ Bank account deleted successfully:', accountId);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error deleting bank account:', error);
    return false;
  }
};

// Validate payment settings structure
export const validatePaymentSettings = (settings: any): settings is ExtendedPaymentSettings => {
  return settings &&
         typeof settings === 'object' &&
         Array.isArray(settings.bankAccounts) &&
         settings.bankAccounts.length > 0 &&
         settings.bankAccounts.every((account: any) => 
           account.id && 
           account.bankName && 
           account.accountTitle && 
           account.accountNumber
         );
};

// Manual sync payment with subscription (called from App.tsx initialization)
export const manualSyncPaymentWithSubscription = () => {
  try {
    console.log('🔄 Manual sync: Payment settings with subscription settings...');
    
    // Get current payment settings
    const paymentSettings = getPaymentSettings();
    
    // Get subscription settings to check for plan changes
    const subscriptionSettings = localStorage.getItem('pulseprep_subscription_settings');
    if (subscriptionSettings) {
      const parsed = JSON.parse(subscriptionSettings);
      
      // Log the sync status
      console.log('✅ Payment-Subscription sync check completed:', {
        paymentVersion: paymentSettings.version,
        subscriptionVersion: parsed.version,
        bankAccounts: paymentSettings.bankAccounts.length,
        subscriptionPlans: parsed.plans ? parsed.plans.length : 0
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in manual payment-subscription sync:', error);
    return false;
  }
};

// Utility to check if payment settings have changed (for component optimization)
export const getPaymentSettingsVersion = (): number => {
  return paymentSettingsVersion;
};



// Cross-tab synchronization (detect changes made in other tabs/windows)
export const initializePaymentSettingsCrossTabSync = () => {
  // Listen for storage changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'pulseprep_payment_settings' && event.newValue) {
      try {
        const newSettings = JSON.parse(event.newValue) as ExtendedPaymentSettings;
        const newVersion = newSettings.version || 1;
        
        if (newVersion !== paymentSettingsVersion) {
          console.log('🔄 Payment settings changed in another tab, syncing...');
          paymentSettingsCache = newSettings;
          paymentSettingsVersion = newVersion;
          notifyPaymentSettingsChange(newSettings);
        }
      } catch (error) {
        console.error('❌ Error syncing payment settings from another tab:', error);
      }
    }
  });
  
  // 🔧 COMMENTED OUT: This was causing conflicts with the new notification system
  // window.addEventListener('paymentSettingsChanged', ((event: CustomEvent) => {
  //   const { version } = event.detail;
  //   if (version && version !== paymentSettingsVersion) {
  //     console.log('🔄 Payment settings changed via custom event, syncing...');
  //     getPaymentSettings(true); // Force refresh
  //   }
  // }) as EventListener);
  
  console.log('🔄 Payment settings cross-tab synchronization initialized');
};

// Initialize the cross-tab sync when this module loads
if (typeof window !== 'undefined') {
  initializePaymentSettingsCrossTabSync();
}

export type { ExtendedPaymentSettings } from '../types';