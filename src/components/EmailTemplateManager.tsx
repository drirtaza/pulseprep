import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Mail, Eye, Send, Edit } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  lastModified: string;
}

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: 'Welcome Email',
      category: 'User Management',
      subject: 'Welcome to {{platformName}}!',
      content: `Dear {{userName}},

Welcome to {{platformName}}! We're excited to have you join our medical education platform.

Your account has been successfully created for {{specialty}} preparation.

You can now:
- Access practice questions
- Take mock exams
- Track your progress
- Review bookmarked questions

If you have any questions, feel free to contact our support team.

{{emailSignature}}`,
      variables: ['userName', 'platformName', 'specialty', 'emailSignature'],
      isActive: true,
      lastModified: '2024-01-15'
    },
    {
      id: 'payment-confirmation',
      name: 'Payment Confirmation',
      category: 'Payment',
      subject: 'Payment Received - Account Activated',
      content: `Dear {{userName}},

Great news! Your payment has been received and verified.

Payment Details:
- Amount: {{paymentAmount}}
- Date: {{paymentDate}}
- Reference: {{paymentReference}}

Your account is now fully activated. You can start using all features immediately.

{{emailSignature}}`,
      variables: ['userName', 'paymentAmount', 'paymentDate', 'paymentReference', 'emailSignature'],
      isActive: true,
      lastModified: '2024-01-15'
    },
    {
      id: 'payment-reminder',
      name: 'Payment Reminder',
      category: 'Payment',
      subject: 'Complete Your Payment - {{platformName}}',
      content: `Dear {{userName}},

We noticed your account registration is pending payment completion.

To activate your account and start accessing our premium features:

1. Make payment to our bank account
2. Upload payment proof in your account
3. Wait for verification (usually within 24 hours)

Bank Details:
{{bankDetails}}

{{emailSignature}}`,
      variables: ['userName', 'platformName', 'bankDetails', 'emailSignature'],
      isActive: true,
      lastModified: '2024-01-15'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(templates[0]);

  const [testVariables, setTestVariables] = useState({
    userName: 'Dr. John Smith',
    platformName: 'PulsePrep',
    specialty: 'Medicine',
    emailSignature: 'Best regards,\nThe PulsePrep Team',
    paymentAmount: 'Rs. 7,000',
    paymentDate: '2024-01-15',
    paymentReference: 'PAY123456',
    bankDetails: 'HBL Bank - Account: 1234567890'
  });

  const handleTemplateChange = (key: string, value: any) => {
    if (!selectedTemplate) return;
    
    const updatedTemplate = { ...selectedTemplate, [key]: value };
    setSelectedTemplate(updatedTemplate);
    
    setTemplates(prev => 
      prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
    );
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    const updatedTemplate = {
      ...selectedTemplate,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setTemplates(prev => 
      prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
    );
    
    alert('Email template saved successfully!');
  };

  const handleTestEmail = () => {
    if (!selectedTemplate) return;
    
    console.log('Sending test email with template:', selectedTemplate.id);
    alert('Test email would be sent to admin email address');
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;
    
    let previewSubject = selectedTemplate.subject;
    let previewContent = selectedTemplate.content;
    
    // Replace variables with test values
    Object.entries(testVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="border-b pb-2 mb-4">
          <Label className="text-sm font-medium">Subject:</Label>
          <p className="text-sm mt-1">{previewSubject}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Content:</Label>
          <div className="mt-2 text-sm whitespace-pre-wrap bg-white p-3 rounded border">
            {previewContent}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Email Template Manager</span>
          </CardTitle>
          <CardDescription>
            Manage automated email templates for user communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-500">{template.subject}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{template.category}</Badge>
                            <Badge variant={template.isActive ? 'default' : 'secondary'}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestEmail();
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-4">
              {selectedTemplate && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={selectedTemplate.name}
                        onChange={(e) => handleTemplateChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Category</Label>
                      <Select value={selectedTemplate.category} onValueChange={(value) => handleTemplateChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User Management">User Management</SelectItem>
                          <SelectItem value="Payment">Payment</SelectItem>
                          <SelectItem value="System">System</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="template-subject">Email Subject</Label>
                    <Input
                      id="template-subject"
                      value={selectedTemplate.subject}
                      onChange={(e) => handleTemplateChange('subject', e.target.value)}
                      placeholder="Use {{variableName}} for dynamic content"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-content">Email Content</Label>
                    <Textarea
                      id="template-content"
                      value={selectedTemplate.content}
                      onChange={(e) => handleTemplateChange('content', e.target.value)}
                      rows={12}
                      placeholder="Use {{variableName}} for dynamic content"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedTemplate.isActive}
                        onCheckedChange={(checked) => handleTemplateChange('isActive', checked)}
                      />
                      <Label>Template Active</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleTestEmail}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </Button>
                      <Button onClick={handleSaveTemplate}>
                        Save Template
                      </Button>
                    </div>
                  </div>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Available Variables</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="bg-white">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedTemplate && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Email Preview</span>
                      </CardTitle>
                      <CardDescription>
                        Preview how the email will look to recipients
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderPreview()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Test Variables</CardTitle>
                      <CardDescription>
                        Modify these values to test different scenarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(testVariables).map(([key, value]) => (
                          <div key={key}>
                            <Label htmlFor={`test-${key}`}>{key}</Label>
                            <Input
                              id={`test-${key}`}
                              value={value}
                              onChange={(e) => setTestVariables(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}