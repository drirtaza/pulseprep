import { useState, useEffect, type ComponentType } from 'react';
import { getContentSettings, subscribeToContentChanges } from '../utils/contentSettings';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
   
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  MessageSquare,
  HeadphonesIcon,
  Users,
  BookOpen,
  CreditCard,
  Bug,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  Share2,
  AtSign,
  Camera,
  Briefcase,
  Play,
  Globe
} from 'lucide-react';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contentSettings, setContentSettings] = useState(getContentSettings());

  useEffect(() => {
    const unsubscribe = subscribeToContentChanges((updatedSettings) => {
      setContentSettings(updatedSettings);
      console.log('📝 Content updated in ContactPage:', updatedSettings.version);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store inquiry in localStorage (in real app, would send to backend)
    const inquiry = {
      id: `inquiry-${Date.now()}`,
      ...formData,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const existingInquiries = JSON.parse(localStorage.getItem('contact_inquiries') || '[]');
    existingInquiries.push(inquiry);
    localStorage.setItem('contact_inquiries', JSON.stringify(existingInquiries));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: '',
        priority: 'medium'
      });
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const supportCategories = [
    {
      icon: Users,
      title: 'Account & Registration',
      description: 'Login issues, account settings, profile updates',
      examples: ['Can\'t log in', 'Email verification', 'Password reset']
    },
    {
      icon: CreditCard,
      title: 'Billing & Payments',
      description: 'Payment issues, subscription questions, refunds',
      examples: ['Payment failed', 'Subscription renewal', 'Invoice request']
    },
    {
      icon: BookOpen,
      title: 'Content & Learning',
      description: 'Questions about MCQs, study materials, progress tracking',
      examples: ['Wrong answers', 'Missing content', 'Performance analytics']
    },
    {
      icon: Bug,
      title: 'Technical Issues',
      description: 'App bugs, loading problems, browser compatibility',
      examples: ['App crashes', 'Slow loading', 'Feature not working']
    },
    {
      icon: Lightbulb,
      title: 'Feature Requests',
      description: 'Suggestions for new features or improvements',
      examples: ['New specialty request', 'UI improvements', 'Mobile app features']
    }
  ];

  // Fallback arrays for backward compatibility
  const fallbackContactMethods = [
    {
      id: "fallback-1",
      title: "Email Support",
      description: "Get help via email",
      contact: "support@pulseprep.com",
      response: "Within 24 hours",
      icon: "Mail",
      color: "bg-blue-500",
      priority: 1,
      isActive: true
    },
    {
      id: "fallback-2",
      title: "Phone Support", 
      description: "Speak with our team",
      contact: "+92-21-1234-5678",
      response: "Mon-Fri, 9AM-6PM",
      icon: "Phone",
      color: "bg-green-500",
      priority: 2,
      isActive: true
    },
    {
      id: "fallback-3",
      title: "WhatsApp",
      description: "Quick support via WhatsApp",
      contact: "+92-300-1234567",
      response: "Instant replies",
      icon: "MessageCircle",
      color: "bg-emerald-500", 
      priority: 3,
      isActive: true
    },
    {
      id: "fallback-4",
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available in app", 
      response: "Real-time support",
      icon: "HeadphonesIcon",
      color: "bg-purple-500",
      priority: 4,
      isActive: true
    }
  ];

  const fallbackSocialLinks = [
    { id: "fallback-social-1", name: "Facebook", icon: "Facebook", url: "#", color: "bg-blue-600", isActive: true, displayOrder: 1 },
    { id: "fallback-social-2", name: "Twitter", icon: "Twitter", url: "#", color: "bg-sky-500", isActive: true, displayOrder: 2 },
    { id: "fallback-social-3", name: "Instagram", icon: "Instagram", url: "#", color: "bg-pink-500", isActive: true, displayOrder: 3 },
    { id: "fallback-social-4", name: "LinkedIn", icon: "Linkedin", url: "#", color: "bg-blue-700", isActive: true, displayOrder: 4 },
    { id: "fallback-social-5", name: "YouTube", icon: "Youtube", url: "#", color: "bg-red-600", isActive: true, displayOrder: 5 }
  ];
  const socialIconMap: Record<string, ComponentType<{ className?: string }>> = {
    Facebook: Share2,
    Twitter: AtSign,
    Instagram: Camera,
    Linkedin: Briefcase,
    Youtube: Play,
    Globe
  };

  const faqs = [
    {
      question: 'How quickly do you respond to support inquiries?',
      answer: 'We aim to respond to all inquiries within 24 hours. Urgent technical issues are prioritized and typically resolved within 4-6 hours.'
    },
    {
      question: 'Can I get support in Urdu?',
      answer: 'Yes! Our support team is bilingual and can assist you in both English and Urdu.'
    },
    {
      question: 'Do you offer phone support for all users?',
      answer: 'Phone support is available for all premium subscribers. Free users can access email and chat support.'
    },
    {
      question: 'How can I report a bug or technical issue?',
      answer: 'Use the "Technical Issues" category in the contact form below, or email us directly at bugs@pulseprep.com with detailed information.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {contentSettings?.contactPage?.hero?.title || "Get in Touch"}
          </h1>
          {contentSettings?.contactPage?.hero?.subtitle && (
            <p className="text-2xl text-gray-700 mb-4">
              {contentSettings.contactPage.hero.subtitle}
            </p>
          )}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {contentSettings?.contactPage?.hero?.description || "We're here to help you with any questions or concerns."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-4 py-2">💬 24/7 Chat Support</Badge>
            <Badge variant="secondary" className="px-4 py-2">📞 Phone Support</Badge>
            <Badge variant="secondary" className="px-4 py-2">📧 Email Support</Badge>
            <Badge variant="secondary" className="px-4 py-2">🇺🇷 Urdu Support</Badge>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {(contentSettings?.contactPage?.contactMethods || fallbackContactMethods).map((method) => {
            console.log('🔍 Contact method icon:', method.icon, 'color:', method.color, 'for method:', method.title);
            return (
              <Card key={method.id} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className={`h-12 w-12 ${method.color || 'bg-blue-500'} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  {(() => {
                    switch (method.icon) {
                      case 'Mail':
                        return <Mail className="h-6 w-6 text-white fill-current" />;
                      case 'Phone':
                        return <Phone className="h-6 w-6 text-white fill-current" />;
                      case 'MessageCircle':
                        return <MessageCircle className="h-6 w-6 text-white fill-current" />;
                      case 'MessageSquare':
                        return <MessageSquare className="h-6 w-6 text-white fill-current" />;
                      case 'HeadphonesIcon':
                        return <HeadphonesIcon className="h-6 w-6 text-white fill-current" />;
                      default:
                        console.log('⚠️ Unknown icon:', method.icon, 'using default Mail icon');
                        return <Mail className="h-6 w-6 text-white fill-current" />;
                    }
                  })()}
                </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{method.description}</p>
              <p className="text-blue-600 font-medium mb-1">{method.contact}</p>
              <p className="text-gray-500 text-xs">{method.response}</p>
            </Card>
          );
        })}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                <p className="text-gray-600">We'll get back to you within 24 hours</p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">
                  Thank you for contacting us. We'll respond to your inquiry soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+92-300-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="account">Account & Registration</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="content">Content & Learning</option>
                      <option value="technical">Technical Issues</option>
                      <option value="feature">Feature Requests</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <div className="flex space-x-4">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="mr-2"
                        />
                        <span className="capitalize text-sm">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Please provide detailed information about your inquiry..."
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>

          {/* Office Information */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{contentSettings.contactPage.officeInfo.title}</h3>
              </div>
              <div className="whitespace-pre-line text-gray-600 mb-4">
                {contentSettings.contactPage.officeInfo.address}
              </div>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Google Maps
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Business Hours</h3>
              </div>
              <div className="whitespace-pre-line text-gray-600 mb-4">
                {contentSettings.contactPage.officeInfo.hours}
              </div>
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                💡 {contentSettings.contactPage.officeInfo.emergency}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Follow Us</h3>
              <p className="text-gray-600 mb-4">
                Stay updated with the latest news, tips, and updates from PulsePrep.
              </p>
              <div className="flex space-x-3">
                {(contentSettings?.contactPage?.socialLinks || fallbackSocialLinks).map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${social.color} hover:opacity-80 transition-opacity p-2 rounded-lg`}
                  >
                    {(() => {
                      const Icon = socialIconMap[social.icon] ?? Globe;
                      return <Icon className="h-5 w-5 text-white" />;
                    })()}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Support Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How Can We Help?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportCategories.map((category, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <category.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Common topics:</p>
                  {category.examples.map((example, exIndex) => (
                    <span key={exIndex} className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-1 mb-1">
                      {example}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <Card className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => onNavigate('about')}>
              View More FAQs
            </Button>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-8 bg-gradient-to-r from-red-500 to-orange-500 text-white text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">Emergency Support</h2>
          <p className="mb-6 opacity-90">
            For urgent technical issues during exams or time-sensitive problems, 
            contact our emergency support line.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-red-600 hover:bg-gray-100">
              <Phone className="h-4 w-4 mr-2" />
              Emergency: +92-21-URGENT
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Emergency
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}