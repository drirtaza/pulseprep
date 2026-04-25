import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

import { getSubscriptionSettings, updateSubscriptionSettings, initializeSubscriptionSettings } from '../utils/subscriptionUtils';
import { 
  getBankAccountSettings, 
  updateBankAccountSettings, 
  addBankAccount, 
  updateBankAccount, 
  deleteBankAccount,
  validateBankAccount,
  BankAccount,
  BankAccountSettings
} from '../utils/bankAccountSettings';
import { AdminData, SubscriptionSettings } from '../types';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Building2 } from 'lucide-react';

interface SubscriptionSettingsManagerProps {
  admin: AdminData;
  onClose: () => void;
  isOpen: boolean;
}

const SubscriptionSettingsManager: React.FC<SubscriptionSettingsManagerProps> = ({ 
  admin, 
  onClose, 
  isOpen 
}) => {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [bankSettings, setBankSettings] = useState<BankAccountSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasBankChanges, setHasBankChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('plans');
  
  // Bank account form state
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankFormData, setBankFormData] = useState<Partial<BankAccount>>({
    name: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    branchCode: '',
    bankCode: '',
    swiftCode: '',
    isActive: true,
    displayOrder: 1,
    instructions: ''
  });
  const [bankFormErrors, setBankFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading subscription and bank settings...');
        
        // Load subscription settings
        const currentSettings = getSubscriptionSettings();
        console.log('🔄 Loaded subscription settings:', currentSettings);
        
        if (!currentSettings || !currentSettings.plans || !Array.isArray(currentSettings.plans)) {
          throw new Error('Invalid subscription settings structure');
        }
        
        if (currentSettings.plans.length === 0) {
          console.warn('⚠️ Plans array is empty, initializing with default plan...');
          const reinitialized = initializeSubscriptionSettings();
          setSettings(reinitialized);
        } else {
          setSettings(currentSettings);
        }
        
        // Load bank account settings
        const currentBankSettings = getBankAccountSettings();
        console.log('🏦 Loaded bank settings:', currentBankSettings);
        setBankSettings(currentBankSettings);
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error loading settings:', error);
        setError(error instanceof Error ? error.message : 'Unknown error loading settings');
        
        try {
          console.log('🔧 Attempting to reinitialize with default settings...');
          const defaultSettings = initializeSubscriptionSettings();
          const defaultBankSettings = getBankAccountSettings();
          setSettings(defaultSettings);
          setBankSettings(defaultBankSettings);
          setError(null);
        } catch (reinitError) {
          console.error('❌ Failed to reinitialize settings:', reinitError);
          setError('Failed to load or initialize settings');
        }
        
        setIsLoading(false);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!settings) return;
    
    try {
      updateSubscriptionSettings(settings, admin.email);
      setHasChanges(false);
      showSuccessNotification('Subscription settings updated successfully!');
      
      // Sync payment settings
      import('../utils/paymentSettings').then(() => {
        console.log('🔄 Payment settings synced after subscription update');
      }).catch(error => {
        console.error('Error syncing payment settings:', error);
      });
      
    } catch (error) {
      console.error('❌ Error saving subscription settings:', error);
      setError('Failed to save subscription settings');
    }
  };

  const handleBankSave = () => {
    if (!bankSettings) return;
    
    try {
      updateBankAccountSettings(bankSettings, admin.email);
      setHasBankChanges(false);
      showSuccessNotification('Bank account settings updated successfully!');
    } catch (error) {
      console.error('❌ Error saving bank settings:', error);
      setError('Failed to save bank account settings');
    }
  };

  const showSuccessNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = `✅ ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 4000);
  };

  const handleResetToDefaults = () => {
    try {
      localStorage.removeItem('pulseprep_subscription_settings');
      localStorage.removeItem('pulseprep_bank_account_settings');
      const defaultSettings = initializeSubscriptionSettings();
      const defaultBankSettings = getBankAccountSettings();
      setSettings(defaultSettings);
      setBankSettings(defaultBankSettings);
      setHasChanges(true);
      setHasBankChanges(true);
      setError(null);
      
      console.log('🔄 Reset to default settings');
    } catch (error) {
      console.error('❌ Error resetting to defaults:', error);
      setError('Failed to reset to default settings');
    }
  };

  // Bank account management functions
  const handleAddBank = () => {
    const errors = validateBankAccount(bankFormData);
    if (errors.length > 0) {
      setBankFormErrors(errors);
      return;
    }

    if (!bankSettings) return;

    try {
      const newAccount = addBankAccount(bankFormData as Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Update local state
      const updatedBankSettings = {
        ...bankSettings,
        accounts: [...bankSettings.accounts, newAccount]
      };
      setBankSettings(updatedBankSettings);
      setHasBankChanges(true);
      
      // Reset form
      setBankFormData({
        name: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        branchCode: '',
        bankCode: '',
        swiftCode: '',
        isActive: true,
        displayOrder: bankSettings.accounts.length + 1,
        instructions: ''
      });
      setBankFormErrors([]);
      setShowAddBankForm(false);
      
      showSuccessNotification('Bank account added successfully!');
    } catch (error) {
      console.error('Error adding bank account:', error);
      setBankFormErrors(['Failed to add bank account']);
    }
  };

  const handleEditBank = (account: BankAccount) => {
    setBankFormData(account);
    setEditingBankId(account.id);
    setShowAddBankForm(true);
    setBankFormErrors([]);
  };

  const handleUpdateBank = () => {
    if (!editingBankId || !bankSettings) return;

    const errors = validateBankAccount(bankFormData);
    if (errors.length > 0) {
      setBankFormErrors(errors);
      return;
    }

    try {
      updateBankAccount(editingBankId, bankFormData);
      
      // Update local state
      const updatedAccounts = bankSettings.accounts.map(acc => 
        acc.id === editingBankId ? { ...acc, ...bankFormData, updatedAt: new Date().toISOString() } : acc
      );
      
      setBankSettings({
        ...bankSettings,
        accounts: updatedAccounts
      });
      setHasBankChanges(true);
      
      // Reset form
      setBankFormData({
        name: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        branchCode: '',
        bankCode: '',
        swiftCode: '',
        isActive: true,
        displayOrder: 1,
        instructions: ''
      });
      setBankFormErrors([]);
      setShowAddBankForm(false);
      setEditingBankId(null);
      
      showSuccessNotification('Bank account updated successfully!');
    } catch (error) {
      console.error('Error updating bank account:', error);
      setBankFormErrors(['Failed to update bank account']);
    }
  };

  const handleDeleteBank = (accountId: string) => {
    if (!bankSettings) return;
    
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      deleteBankAccount(accountId);
      
      // Update local state
      const updatedAccounts = bankSettings.accounts.filter(acc => acc.id !== accountId);
      setBankSettings({
        ...bankSettings,
        accounts: updatedAccounts
      });
      setHasBankChanges(true);
      
      showSuccessNotification('Bank account deleted successfully!');
    } catch (error) {
      console.error('Error deleting bank account:', error);
      setError('Failed to delete bank account');
    }
  };

  const handleMoveBankAccount = (accountId: string, direction: 'up' | 'down') => {
    if (!bankSettings) return;

    const accounts = [...bankSettings.accounts];
    const currentIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= accounts.length) return;

    // Swap display orders
    const temp = accounts[currentIndex].displayOrder;
    accounts[currentIndex].displayOrder = accounts[newIndex].displayOrder;
    accounts[newIndex].displayOrder = temp;

    // Sort by display order
    accounts.sort((a, b) => a.displayOrder - b.displayOrder);

    setBankSettings({
      ...bankSettings,
      accounts: accounts
    });
    setHasBankChanges(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessNotification(`${label} copied to clipboard!`);
    }).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings && !bankSettings) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 p-6">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Error Loading Settings
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-3 justify-center">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleResetToDefaults} className="bg-blue-600 hover:bg-blue-700">
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings || !bankSettings) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              🔄 Subscription & Payment Settings
            </h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetToDefaults}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                Reset to Defaults
              </Button>
              <Button variant="outline" onClick={onClose}>
                ✕ Close
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800 text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
              <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
              <TabsTrigger value="expiry">Expiry Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Subscription Plans Tab */}
            <TabsContent value="plans" className="space-y-4">
              <h3 className="text-lg font-semibold">Available Plans</h3>
              
              {settings.plans && Array.isArray(settings.plans) && settings.plans.length > 0 ? (
                settings.plans.map((plan, index) => (
                <Card key={plan.id || index} className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Plan Name</label>
                      <Input
                        value={plan.name || ''}
                        onChange={(e) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = [...settings.plans];
                            newPlans[index] = { ...newPlans[index], name: e.target.value };
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Duration (Months)</label>
                      <Input
                        type="number"
                        value={plan.duration || 3}
                        onChange={(e) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = [...settings.plans];
                            newPlans[index] = { ...newPlans[index], duration: Number(e.target.value) };
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        type="number"
                        value={plan.price || 0}
                        onChange={(e) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = [...settings.plans];
                            newPlans[index] = { ...newPlans[index], price: Number(e.target.value) };
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Input
                        value={plan.currency || 'PKR'}
                        onChange={(e) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = [...settings.plans];
                            newPlans[index] = { ...newPlans[index], currency: e.target.value };
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={plan.isDefault || false}
                        onCheckedChange={(checked) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = settings.plans.map((p, i) => ({
                              ...p,
                              isDefault: i === index ? !!checked : false
                            }));
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                      <label className="text-sm">Default Plan</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={plan.isActive || false}
                        onCheckedChange={(checked) => {
                          if (settings.plans && Array.isArray(settings.plans)) {
                            const newPlans = [...settings.plans];
                            newPlans[index] = { ...newPlans[index], isActive: !!checked };
                            setSettings({...settings, plans: newPlans});
                            setHasChanges(true);
                          }
                        }}
                      />
                      <label className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={plan.description || ''}
                      onChange={(e) => {
                        if (settings.plans && Array.isArray(settings.plans)) {
                          const newPlans = [...settings.plans];
                          newPlans[index] = { ...newPlans[index], description: e.target.value };
                          setSettings({...settings, plans: newPlans});
                          setHasChanges(true);
                        }
                      }}
                      placeholder="Plan description..."
                    />
                  </div>
                </Card>
                ))
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>No subscription plans found.</p>
                  <p className="text-sm mt-2">Click "Reset to Defaults" to create default plans.</p>
                </div>
              )}
            </TabsContent>

            {/* Bank Accounts Tab */}
            <TabsContent value="bank-accounts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bank Account Management
                </h3>
                <Button 
                  onClick={() => setShowAddBankForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>

              {/* Add/Edit Bank Form */}
              {showAddBankForm && (
                <Card className="p-6 border-blue-200 bg-blue-50">
                  <h4 className="text-lg font-semibold mb-4">
                    {editingBankId ? 'Edit Bank Account' : 'Add New Bank Account'}
                  </h4>
                  
                  {bankFormErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {bankFormErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        value={bankFormData.name || ''}
                        onChange={(e) => setBankFormData({...bankFormData, name: e.target.value})}
                        placeholder="e.g., HBL Bank"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountTitle">Account Title *</Label>
                      <Input
                        id="accountTitle"
                        value={bankFormData.accountTitle || ''}
                        onChange={(e) => setBankFormData({...bankFormData, accountTitle: e.target.value})}
                        placeholder="e.g., PulsePrep Education Services"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        value={bankFormData.accountNumber || ''}
                        onChange={(e) => setBankFormData({...bankFormData, accountNumber: e.target.value})}
                        placeholder="e.g., 12345678901234"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="iban">IBAN (Optional)</Label>
                      <Input
                        id="iban"
                        value={bankFormData.iban || ''}
                        onChange={(e) => setBankFormData({...bankFormData, iban: e.target.value})}
                        placeholder="e.g., PK36HABB0012345678901234"
                        maxLength={24}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="branchCode">Branch Code (Optional)</Label>
                      <Input
                        id="branchCode"
                        value={bankFormData.branchCode || ''}
                        onChange={(e) => setBankFormData({...bankFormData, branchCode: e.target.value})}
                        placeholder="e.g., 1586"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bankCode">Bank Code (Optional)</Label>
                      <Input
                        id="bankCode"
                        value={bankFormData.bankCode || ''}
                        onChange={(e) => setBankFormData({...bankFormData, bankCode: e.target.value})}
                        placeholder="e.g., HABB"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                      <Input
                        id="swiftCode"
                        value={bankFormData.swiftCode || ''}
                        onChange={(e) => setBankFormData({...bankFormData, swiftCode: e.target.value})}
                        placeholder="e.g., HABBPKKA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="displayOrder">Display Order *</Label>
                      <Input
                        id="displayOrder"
                        type="number"
                        min="1"
                        value={bankFormData.displayOrder || 1}
                        onChange={(e) => setBankFormData({...bankFormData, displayOrder: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="instructions">Payment Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      value={bankFormData.instructions || ''}
                      onChange={(e) => setBankFormData({...bankFormData, instructions: e.target.value})}
                      placeholder="e.g., Please use the exact account title when making the transfer."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      checked={bankFormData.isActive || false}
                      onCheckedChange={(checked) => setBankFormData({...bankFormData, isActive: !!checked})}
                    />
                    <Label>Active (visible to users)</Label>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddBankForm(false);
                        setEditingBankId(null);
                        setBankFormData({
                          name: '',
                          accountTitle: '',
                          accountNumber: '',
                          iban: '',
                          branchCode: '',
                          bankCode: '',
                          swiftCode: '',
                          isActive: true,
                          displayOrder: bankSettings.accounts.length + 1,
                          instructions: ''
                        });
                        setBankFormErrors([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingBankId ? handleUpdateBank : handleAddBank}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editingBankId ? 'Update Account' : 'Add Account'}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Bank Accounts List */}
              <div className="space-y-4">
                {bankSettings.accounts
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((account, index) => (
                  <Card key={account.id} className={`p-4 ${account.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold">{account.name}</h4>
                          <Badge variant={account.isActive ? 'default' : 'secondary'}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">Order: {account.displayOrder}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Account Title:</span>
                            <div className="flex items-center space-x-2">
                              <p className="text-gray-800 font-mono">{account.accountTitle}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(account.accountTitle, 'Account Title')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">Account Number:</span>
                            <div className="flex items-center space-x-2">
                              <p className="text-gray-800 font-mono">{account.accountNumber}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(account.accountNumber, 'Account Number')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {account.iban && (
                            <div>
                              <span className="font-medium text-gray-600">IBAN:</span>
                              <div className="flex items-center space-x-2">
                                <p className="text-gray-800 font-mono">{account.iban}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(account.iban!, 'IBAN')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {account.branchCode && (
                            <div>
                              <span className="font-medium text-gray-600">Branch:</span>
                              <p className="text-gray-800 font-mono">{account.branchCode}</p>
                            </div>
                          )}
                          
                          {account.swiftCode && (
                            <div>
                              <span className="font-medium text-gray-600">SWIFT:</span>
                              <p className="text-gray-800 font-mono">{account.swiftCode}</p>
                            </div>
                          )}
                        </div>
                        
                        {account.instructions && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <span className="font-medium text-blue-800">Instructions: </span>
                            <span className="text-blue-700">{account.instructions}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveBankAccount(account.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveBankAccount(account.id, 'down')}
                            disabled={index === bankSettings.accounts.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBank(account)}
                            className="h-8 px-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBank(account.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {bankSettings.accounts.length === 0 && (
                  <div className="text-center p-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No bank accounts configured.</p>
                    <p className="text-sm mt-2">Add your first bank account to get started.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Expiry Settings Tab */}
            <TabsContent value="expiry" className="space-y-4">
              <h3 className="text-lg font-semibold">Expiry & Renewal Settings</h3>
              
              <Card className="p-4">
                <h4 className="font-medium mb-4">Warning Notifications</h4>
                <div className="space-y-2">
                  <label className="text-sm">Send warnings before expiry (days):</label>
                  <div className="flex space-x-2">
                    {settings.expirySettings && Array.isArray(settings.expirySettings.warningDays) ? 
                      settings.expirySettings.warningDays.map((days, index) => (
                      <Input
                        key={index}
                        type="number"
                        value={days}
                        onChange={(e) => {
                          const newWarningDays = [...(settings.expirySettings?.warningDays || [])];
                          newWarningDays[index] = Number(e.target.value);
                          setSettings({
                            ...settings,
                            expirySettings: {
                              warningDays: newWarningDays || [7, 3, 1],
                              reminderIntervals: settings.expirySettings?.reminderIntervals || [24, 72, 168],
                              gracePeriodDays: settings.expirySettings?.gracePeriodDays || 7,
                              autoSuspendAfterDays: settings.expirySettings?.autoSuspendAfterDays || 30
                            }
                          });
                          setHasChanges(true);
                        }}
                        className="w-20"
                      />
                      )) : (
                        <div className="text-sm text-gray-500">No warning days configured</div>
                      )}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-4">Grace Period</h4>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={settings.expirySettings?.gracePeriodDays || 3}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        expirySettings: {
                          warningDays: settings.expirySettings?.warningDays || [7, 3, 1],
                          reminderIntervals: settings.expirySettings?.reminderIntervals || [24, 72, 168],
                          gracePeriodDays: Number(e.target.value),
                          autoSuspendAfterDays: settings.expirySettings?.autoSuspendAfterDays || 30
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="w-20"
                  />
                  <span className="text-sm">days after expiry before cutting access</span>
                </div>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Page Preview</h3>
              
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="text-xl font-bold text-blue-900 mb-4">💰 Subscription Plan</h4>
                {settings.plans && Array.isArray(settings.plans) ? 
                  settings.plans.filter(p => p.isActive && p.isDefault).map(plan => (
                  <div key={plan.id} className="bg-white p-4 rounded border mb-4">
                    <h5 className="text-lg font-semibold text-blue-800">
                      {plan.name}: {plan.currency} {plan.price.toLocaleString()}
                    </h5>
                    <p className="text-blue-700 text-sm">
                      {plan.description}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Subscription automatically expires after {plan.duration} months
                    </p>
                  </div>
                  )) : (
                    <div className="text-center p-4 text-gray-500">
                      <p>No active default plans configured</p>
                    </div>
                  )}
                
                <h4 className="text-xl font-bold text-blue-900 mb-4 mt-6">🏦 Bank Account Details</h4>
                <div className="space-y-3">
                  {bankSettings.accounts
                    .filter(acc => acc.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((account, index) => (
                    <div key={account.id} className="bg-white p-4 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-lg font-semibold text-gray-800">{account.name}</h5>
                        <Badge variant="outline">Option {index + 1}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Account Title:</span>
                          <p className="text-gray-800 font-mono">{account.accountTitle}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Account Number:</span>
                          <p className="text-gray-800 font-mono">{account.accountNumber}</p>
                        </div>
                        {account.iban && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">IBAN:</span>
                            <p className="text-gray-800 font-mono">{account.iban}</p>
                          </div>
                        )}
                      </div>
                      
                      {account.instructions && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <span className="text-yellow-700">{account.instructions}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {(hasChanges || hasBankChanges) && (
              <span className="text-orange-600 font-medium">
                ⚠️ You have unsaved changes
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {hasChanges && (
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                💾 Save Subscription Settings
              </Button>
            )}
            {hasBankChanges && (
              <Button 
                onClick={handleBankSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🏦 Save Bank Settings
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettingsManager;