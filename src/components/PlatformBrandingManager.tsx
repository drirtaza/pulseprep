import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Palette, Upload, Eye, RotateCcw } from 'lucide-react';

export default function PlatformBrandingManager() {
  const [branding, setBranding] = useState({
    platformName: 'PulsePrep',
    tagline: 'Excellence in Medical Education',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#dc2626',
    secondaryColor: '#1e40af',
    accentColor: '#059669',
    headerBackground: '#ffffff',
    footerBackground: '#f8fafc',
    customCSS: '',
    showPoweredBy: true,
    customFooterText: '',
    emailSignature: 'Best regards,\nThe PulsePrep Team'
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleBrandingChange = (key: string, value: any) => {
    setBranding(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save branding settings logic here

    alert('Branding settings saved successfully!');
  };

  const handleReset = () => {
    setBranding({
      platformName: 'PulsePrep',
      tagline: 'Excellence in Medical Education',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#dc2626',
      secondaryColor: '#1e40af',
      accentColor: '#059669',
      headerBackground: '#ffffff',
      footerBackground: '#f8fafc',
      customCSS: '',
      showPoweredBy: true,
      customFooterText: '',
      emailSignature: 'Best regards,\nThe PulsePrep Team'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-purple-600" />
            <span>Platform Identity</span>
          </CardTitle>
          <CardDescription>Configure the platform name, logo, and basic branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={branding.platformName}
                onChange={(e) => handleBrandingChange('platformName', e.target.value)}
                placeholder="Enter platform name"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={branding.tagline}
                onChange={(e) => handleBrandingChange('tagline', e.target.value)}
                placeholder="Enter platform tagline"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo-url">Logo URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="logo-url"
                  value={branding.logoUrl}
                  onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="favicon-url">Favicon URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="favicon-url"
                  value={branding.faviconUrl}
                  onChange={(e) => handleBrandingChange('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Customize the platform colors and appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  placeholder="#dc2626"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  placeholder="#059669"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
          <CardDescription>Advanced customization options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-css">Custom CSS</Label>
            <Textarea
              id="custom-css"
              value={branding.customCSS}
              onChange={(e) => handleBrandingChange('customCSS', e.target.value)}
              placeholder="/* Add your custom CSS here */"
              rows={6}
            />
          </div>
          
          <div>
            <Label htmlFor="email-signature">Email Signature</Label>
            <Textarea
              id="email-signature"
              value={branding.emailSignature}
              onChange={(e) => handleBrandingChange('emailSignature', e.target.value)}
              placeholder="Email signature for automated emails"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Configure what appears on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show "Powered by PulsePrep"</Label>
              <p className="text-sm text-gray-500">Display attribution in footer</p>
            </div>
            <Switch
              checked={branding.showPoweredBy}
              onCheckedChange={(checked) => handleBrandingChange('showPoweredBy', checked)}
            />
          </div>
          
          <div>
            <Label htmlFor="custom-footer-text">Custom Footer Text</Label>
            <Input
              id="custom-footer-text"
              value={branding.customFooterText}
              onChange={(e) => handleBrandingChange('customFooterText', e.target.value)}
              placeholder="Additional text to show in footer"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-4">
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
          Save Branding Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Exit Preview' : 'Preview Changes'}
        </Button>
      </div>

      {previewMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Preview Mode</CardTitle>
            <CardDescription className="text-blue-600">
              This shows how your branding changes will appear (mockup)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border-2"
              style={{ 
                backgroundColor: branding.headerBackground,
                borderColor: branding.primaryColor 
              }}
            >
              <h3 
                className="text-xl font-medium"
                style={{ color: branding.primaryColor }}
              >
                {branding.platformName}
              </h3>
              <p 
                className="text-sm"
                style={{ color: branding.secondaryColor }}
              >
                {branding.tagline}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}