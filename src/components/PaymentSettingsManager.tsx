import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreditCard, Building2, Shield, AlertCircle } from 'lucide-react';

export default function PaymentSettingsManager() {
  const [settings, setSettings] = useState({
    bankName: 'HBL Bank',
    accountNumber: '1234567890',
    accountTitle: 'PulsePrep Medical Education',
    branchCode: 'HBL001',
    iban: 'PK36HABB0012345678901234',
    swiftCode: 'HABBPKKA',
    enabled: true,
    autoVerification: false,
    requireImageUpload: true,
    maxFileSize: '5MB',
    allowedFormats: ['JPG', 'PNG', 'PDF']
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Payment settings saved:', settings);
    alert('Payment settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Bank Account Details</span>
          </CardTitle>
          <CardDescription>Configure the bank account for payment collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={settings.bankName}
                onChange={(e) => handleSettingChange('bankName', e.target.value)}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={settings.accountNumber}
                onChange={(e) => handleSettingChange('accountNumber', e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="account-title">Account Title</Label>
              <Input
                id="account-title"
                value={settings.accountTitle}
                onChange={(e) => handleSettingChange('accountTitle', e.target.value)}
                placeholder="Enter account title"
              />
            </div>
            <div>
              <Label htmlFor="branch-code">Branch Code</Label>
              <Input
                id="branch-code"
                value={settings.branchCode}
                onChange={(e) => handleSettingChange('branchCode', e.target.value)}
                placeholder="Enter branch code"
              />
            </div>
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={settings.iban}
                onChange={(e) => handleSettingChange('iban', e.target.value)}
                placeholder="Enter IBAN"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Payment Processing</span>
          </CardTitle>
          <CardDescription>Configure payment verification settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Collection Enabled</Label>
              <p className="text-sm text-gray-500">Allow users to submit payment proofs</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Verification</Label>
              <p className="text-sm text-gray-500">Automatically approve payments (not recommended)</p>
            </div>
            <Switch
              checked={settings.autoVerification}
              onCheckedChange={(checked) => handleSettingChange('autoVerification', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Image Upload</Label>
              <p className="text-sm text-gray-500">Users must upload payment proof images</p>
            </div>
            <Switch
              checked={settings.requireImageUpload}
              onCheckedChange={(checked) => handleSettingChange('requireImageUpload', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span>File Upload Settings</span>
          </CardTitle>
          <CardDescription>Configure file upload requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max-file-size">Maximum File Size</Label>
            <Select value={settings.maxFileSize} onValueChange={(value) => handleSettingChange('maxFileSize', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select maximum file size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2MB">2 MB</SelectItem>
                <SelectItem value="5MB">5 MB</SelectItem>
                <SelectItem value="10MB">10 MB</SelectItem>
                <SelectItem value="20MB">20 MB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Allowed File Formats</Label>
            <p className="text-sm text-gray-500 mb-2">Currently: {settings.allowedFormats.join(', ')}</p>
            <div className="text-sm text-gray-600">
              Standard formats: JPG, PNG, PDF are recommended for payment proofs
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-4">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Payment Settings
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset to Defaults
        </Button>
      </div>
      
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Important Note</p>
              <p className="text-sm text-yellow-700">
                Changes to payment settings will affect all new payment submissions. 
                Existing pending payments will not be affected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}