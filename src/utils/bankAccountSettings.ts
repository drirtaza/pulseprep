export interface BankAccount {
  id: string;
  name: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branchCode?: string;
  bankCode?: string;
  swiftCode?: string;
  isActive: boolean;
  displayOrder: number;
  instructions?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountSettings {
  accounts: BankAccount[];
  defaultAccountId?: string;
  supportedCurrencies: string[];
  enableQRCodes: boolean;
  enableCopyToClipboard: boolean;
  version: string;
  lastUpdated: string;
}

const BANK_SETTINGS_KEY = 'pulseprep_bank_account_settings';

export const getDefaultBankAccountSettings = (): BankAccountSettings => ({
  accounts: [
    {
      id: 'bank-001',
      name: 'HBL Bank',
      accountTitle: 'PulsePrep Education Services',
      accountNumber: '12345678901234',
      iban: 'PK36HABB0012345678901234',
      branchCode: '1586',
      bankCode: 'HABB',
      swiftCode: 'HABBPKKA',
      isActive: true,
      displayOrder: 1,
      instructions: 'Please use the exact account title when making the transfer.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bank-002',
      name: 'UBL Bank',
      accountTitle: 'PulsePrep Education Services',
      accountNumber: '09876543210987',
      iban: 'PK80UNIL0109876543210987',
      branchCode: '0125',
      bankCode: 'UNIL',
      swiftCode: 'UNILPKKA',
      isActive: true,
      displayOrder: 2,
      instructions: 'Mention "FCPS Subscription" in the payment remarks.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bank-003',
      name: 'Meezan Bank',
      accountTitle: 'PulsePrep Education Services',
      accountNumber: '01470112345678',
      iban: 'PK05MEZN0001470112345678',
      branchCode: '0147',
      bankCode: 'MEZN',
      swiftCode: 'MEZNPKKA',
      isActive: false,
      displayOrder: 3,
      instructions: 'Islamic banking compliant transfers only.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  defaultAccountId: 'bank-001',
  supportedCurrencies: ['PKR', 'USD'],
  enableQRCodes: true,
  enableCopyToClipboard: true,
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
});

export const initializeBankAccountSettings = (): BankAccountSettings => {
  try {
    const existingSettings = localStorage.getItem(BANK_SETTINGS_KEY);
    
    if (existingSettings) {
      const parsed = JSON.parse(existingSettings);
      
      // Validate structure
      if (parsed && Array.isArray(parsed.accounts) && parsed.version) {
        console.log('✅ Bank account settings loaded from localStorage');
        return parsed;
      }
    }
    
    console.log('🔧 Initializing default bank account settings...');
    const defaultSettings = getDefaultBankAccountSettings();
    localStorage.setItem(BANK_SETTINGS_KEY, JSON.stringify(defaultSettings));
    
    return defaultSettings;
  } catch (error) {
    console.error('❌ Error initializing bank account settings:', error);
    const defaultSettings = getDefaultBankAccountSettings();
    localStorage.setItem(BANK_SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
};

export const getBankAccountSettings = (): BankAccountSettings => {
  try {
    const settings = localStorage.getItem(BANK_SETTINGS_KEY);
    
    if (!settings) {
      return initializeBankAccountSettings();
    }
    
    const parsed = JSON.parse(settings);
    
    // Validate structure
    if (!parsed || !Array.isArray(parsed.accounts)) {
      console.warn('⚠️ Invalid bank account settings structure, reinitializing...');
      return initializeBankAccountSettings();
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Error loading bank account settings:', error);
    return initializeBankAccountSettings();
  }
};

export const updateBankAccountSettings = (settings: BankAccountSettings, updatedBy: string): void => {
  try {
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem(BANK_SETTINGS_KEY, JSON.stringify(updatedSettings));
    
    // Also sync with payment settings
    syncBankAccountsWithPaymentSettings();
    
    console.log('✅ Bank account settings updated successfully by:', updatedBy);
  } catch (error) {
    console.error('❌ Error updating bank account settings:', error);
    throw new Error('Failed to update bank account settings');
  }
};

export const addBankAccount = (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): BankAccount => {
  const settings = getBankAccountSettings();
  
  const newAccount: BankAccount = {
    ...account,
    id: `bank-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  settings.accounts.push(newAccount);
  updateBankAccountSettings(settings, 'System');
  
  return newAccount;
};

export const updateBankAccount = (accountId: string, updates: Partial<BankAccount>): void => {
  const settings = getBankAccountSettings();
  
  const accountIndex = settings.accounts.findIndex(acc => acc.id === accountId);
  if (accountIndex === -1) {
    throw new Error('Bank account not found');
  }
  
  settings.accounts[accountIndex] = {
    ...settings.accounts[accountIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  updateBankAccountSettings(settings, 'System');
};

export const deleteBankAccount = (accountId: string): void => {
  const settings = getBankAccountSettings();
  
  settings.accounts = settings.accounts.filter(acc => acc.id !== accountId);
  
  // If deleted account was default, set first active account as default
  if (settings.defaultAccountId === accountId) {
    const firstActive = settings.accounts.find(acc => acc.isActive);
    settings.defaultAccountId = firstActive?.id;
  }
  
  updateBankAccountSettings(settings, 'System');
};

export const getActiveBankAccounts = (): BankAccount[] => {
  const settings = getBankAccountSettings();
  return settings.accounts
    .filter(acc => acc.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const getDefaultBankAccount = (): BankAccount | null => {
  const settings = getBankAccountSettings();
  const defaultAccount = settings.accounts.find(acc => acc.id === settings.defaultAccountId);
  
  if (defaultAccount && defaultAccount.isActive) {
    return defaultAccount;
  }
  
  // Return first active account if default is not available
  return getActiveBankAccounts()[0] || null;
};

// Sync bank accounts with payment settings for backward compatibility
export const syncBankAccountsWithPaymentSettings = (): void => {
  try {
    const bankSettings = getBankAccountSettings();
    
    // Import payment settings to sync
    import('./paymentSettings').then(({ getPaymentSettings, updatePaymentSettings }) => {
      const paymentSettings = getPaymentSettings();
      
      // Convert bank accounts to payment settings format
      const banks = bankSettings.accounts.map(account => ({
        id: account.id,
        name: account.name,
        accountTitle: account.accountTitle,
        accountNumber: account.accountNumber,
        iban: account.iban || '',
        branchCode: account.branchCode || '',
        isActive: account.isActive,
        displayOrder: account.displayOrder
      }));
      
      const updatedPaymentSettings = {
        ...paymentSettings,
        banks: banks
      };
      
      updatePaymentSettings(updatedPaymentSettings, 'Bank Account Sync');
      console.log('🔄 Bank accounts synced with payment settings');
    });
  } catch (error) {
    console.error('❌ Error syncing bank accounts with payment settings:', error);
  }
};

export const validateBankAccount = (account: Partial<BankAccount>): string[] => {
  const errors: string[] = [];
  
  if (!account.name?.trim()) {
    errors.push('Bank name is required');
  }
  
  if (!account.accountTitle?.trim()) {
    errors.push('Account title is required');
  }
  
  if (!account.accountNumber?.trim()) {
    errors.push('Account number is required');
  } else if (account.accountNumber.length < 10) {
    errors.push('Account number must be at least 10 digits');
  }
  
  if (account.iban && account.iban.length !== 24) {
    errors.push('IBAN must be exactly 24 characters');
  }
  
  if (typeof account.displayOrder !== 'number' || account.displayOrder < 1) {
    errors.push('Display order must be a positive number');
  }
  
  return errors;
};

// Generate QR code data for bank transfer
export const generateBankTransferQR = (account: BankAccount, amount?: number): string => {
  const qrData = {
    bankName: account.name,
    accountTitle: account.accountTitle,
    accountNumber: account.accountNumber,
    iban: account.iban,
    amount: amount,
    purpose: 'FCPS Exam Preparation Subscription'
  };
  
  return JSON.stringify(qrData);
};

// Export all bank accounts for backup
export const exportBankAccountSettings = (): string => {
  const settings = getBankAccountSettings();
  return JSON.stringify(settings, null, 2);
};

// Import bank accounts from backup
export const importBankAccountSettings = (jsonData: string, updatedBy: string): void => {
  try {
    const importedSettings = JSON.parse(jsonData);
    
    // Validate structure
    if (!importedSettings.accounts || !Array.isArray(importedSettings.accounts)) {
      throw new Error('Invalid bank account settings structure');
    }
    
    // Validate each account
    for (const account of importedSettings.accounts) {
      const errors = validateBankAccount(account);
      if (errors.length > 0) {
        throw new Error(`Invalid account data: ${errors.join(', ')}`);
      }
    }
    
    updateBankAccountSettings(importedSettings, updatedBy);
    console.log('✅ Bank account settings imported successfully');
  } catch (error) {
    console.error('❌ Error importing bank account settings:', error);
    throw new Error('Failed to import bank account settings');
  }
};