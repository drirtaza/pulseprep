import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Heart, 
  Scissors, 
  Baby, 
  Brain, 
  BarChart3, 
  Clock, 
  Target, 
  Star,
  CheckCircle,
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Shield,
  Headphones,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { SpecialtyType, SpecialtySelectionProps, SpecialtyData } from '../types';
import { getPaymentSettings, formatPaymentAmount, getCurrentPaymentAmount } from '../utils/paymentSettings';
import { getSubscriptionSettings } from '../utils/subscriptionUtils';
import { getContentSettings, subscribeToContentChanges } from '../utils/contentSettings';
// FIXED: Removed 'accent' properties to match SpecialtyData interface
const specialties: SpecialtyData[] = [
  {
    id: 'medicine',
    name: 'medicine',
    title: 'Internal Medicine',
    description: 'Comprehensive preparation for internal medicine examinations',
    icon: Heart,
    gradient: 'from-emerald-500 to-teal-600',
    systems: ['Cardiovascular', 'Respiratory', 'Gastroenterology', 'Endocrinology', 'Nephrology', 'Infectious Diseases'],
    stats: { questions: '2,500+', passRate: '94%', avgScore: '87%' }
  },
  {
    id: 'surgery',
    name: 'surgery',
    title: 'Surgery',
    description: 'Advanced surgical knowledge and clinical decision making',
    icon: Scissors,
    gradient: 'from-blue-500 to-indigo-600',
    systems: ['General Surgery', 'Orthopedics', 'Neurosurgery', 'Cardiothoracic', 'Vascular', 'Trauma'],
    stats: { questions: '2,200+', passRate: '91%', avgScore: '85%' }
  },
  {
    id: 'gynae-obs',
    name: 'gynae-obs',
    title: 'Gynecology & Obstetrics',
    description: 'Women\'s health and reproductive medicine expertise',
    icon: Baby,
    gradient: 'from-pink-500 to-rose-600',
    systems: ['Obstetrics', 'Gynecology', 'Reproductive Endocrinology', 'Maternal-Fetal Medicine', 'Gynecologic Oncology', 'Pediatric Gynecology'],
    stats: { questions: '1,800+', passRate: '93%', avgScore: '88%' }
  }
];

const features = [
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description: 'AI-powered system that adapts to your learning pace and identifies knowledge gaps',
    color: 'text-purple-600'
  },
  {
    icon: Clock,
    title: 'Timed Practice',
    description: 'Realistic exam conditions with customizable time limits and instant feedback',
    color: 'text-blue-600'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Detailed insights into your progress with strengths and weakness analysis',
    color: 'text-emerald-600'
  },
  {
    icon: Target,
    title: 'Expert Explanations',
    description: 'Comprehensive explanations written by board-certified specialists',
    color: 'text-orange-600'
  }
];

// Testimonials now come from contentSettings.homePage.testimonials - no hardcoded array needed



const faqItems = [
  {
    question: 'How many questions are available on the platform?',
    answer: 'We have over 6,500 high-quality questions across all specialties, with new questions added monthly by our team of expert physicians.'
  },
  {
    question: 'Can I access the platform on mobile devices?',
    answer: 'Yes! PulsePrep works seamlessly on all devices - desktop, tablet, and mobile. Your progress syncs automatically across all devices.'
  },
  {
    question: 'What is the pass rate for students using PulsePrep?',
    answer: 'Our students have a 93% average pass rate, which is significantly higher than the national average. Most students see improvement within the first week.'
  },
  {
    question: 'Do you offer refunds if I don\'t pass my exam?',
    answer: 'Yes, our Premium plan includes a pass guarantee. If you don\'t pass after completing our recommended study plan, we\'ll refund your subscription.'
  },
  {
    question: 'How often is the content updated?',
    answer: 'We update our question bank monthly and review all content annually to ensure it reflects the latest medical guidelines and exam patterns.'
  }
];

export function SpecialtySelection({ 
  onSpecialtySelect, 
  onNavigate
}: SpecialtySelectionProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [paymentSettings, setPaymentSettings] = useState(getPaymentSettings());
  const [subscriptionSettings, setSubscriptionSettings] = useState(getSubscriptionSettings());
  const [contentSettings, setContentSettings] = useState(getContentSettings());
  
  // Use content settings hook (component already has contentSettings state)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % contentSettings.homePage.testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [contentSettings.homePage.testimonials.length]);

  // Load payment settings on component mount and watch for changes
  useEffect(() => {
    const settings = getPaymentSettings();
    setPaymentSettings(settings);
    
    // Load subscription settings
    const subSettings = getSubscriptionSettings();
    setSubscriptionSettings(subSettings);
    
    // 🔍 DEBUG: Log current payment amount in SpecialtySelection
    const currentAmount = getCurrentPaymentAmount();

    
    // Listen for payment settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pulseprep_payment_settings') {
        const newSettings = getPaymentSettings();
        setPaymentSettings(newSettings);
        const newAmount = getCurrentPaymentAmount();

      }
      
      if (e.key === 'pulseprep_subscription_settings') {
        const newSubSettings = getSubscriptionSettings();
        setSubscriptionSettings(newSubSettings);

      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  useEffect(() => {
    const unsubscribe = subscribeToContentChanges((updatedSettings) => {
      setContentSettings(updatedSettings);
      
    });

    return unsubscribe;
  }, []);
  // Helper function to get dynamic duration text
  const getDurationText = () => {
    try {
      // Use state instead of calling getDefaultSubscriptionPlan() directly
      const defaultPlan = subscriptionSettings.plans.find(p => p.isDefault) || 
                         subscriptionSettings.plans.find(p => p.id === subscriptionSettings.defaultPlanId) || 
                         subscriptionSettings.plans[0];
      
      if (defaultPlan) {
        if (defaultPlan.durationType === 'months') {
          return `/${defaultPlan.duration} ${defaultPlan.duration === 1 ? 'month' : 'months'}`;
        } else if (defaultPlan.durationType === 'years') {
          return `/${defaultPlan.duration} ${defaultPlan.duration === 1 ? 'year' : 'years'}`;
        }
        return '/lifetime';
      }
      
      return '/3 months'; // Fallback
    } catch (error) {
      console.error('❌ Error getting duration text:', error);
      return '/3 months'; // Fallback if anything fails
    }
  };

  const scrollToSection = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
        <h1 className="mb-6">
        <span className="block text-4xl md:text-6xl mb-2">{contentSettings.homePage.hero.title}</span>
        <span className="block text-4xl md:text-6xl bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
        {contentSettings.homePage.hero.subtitle}
        </span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
        {contentSettings.homePage.hero.description}
         </p>  
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => scrollToSection('specialties')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
            >
              {contentSettings.homePage.hero.ctaButtons.primary}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('sample-mcq')}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              {contentSettings.homePage.hero.ctaButtons.secondary}
            </Button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {contentSettings.homePage.statistics.map((stat, index) => {
              const colorMap = ['text-emerald-600', 'text-blue-600', 'text-purple-600', 'text-orange-600'];
              const color = colorMap[index % colorMap.length];
              
              return (
                <div key={stat.id} className="text-center">
                  <div className={`text-3xl mb-2 ${color}`}>{stat.value}</div>
                  <div className="text-slate-600 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specialty Cards */}
      <section id="specialties" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Choose Your Specialty</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tailored preparation for your specific medical specialty with expert-curated content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {contentSettings.homePage.specialtyCards
              .filter(card => card.isActive)
              .map((card) => {
                const specialtyData = specialties.find(s => s.id === card.id);
                if (!specialtyData) return null;
                
                const IconComponent = specialtyData.icon;
                return (
                  <Card
                    key={card.id}
                    className="relative overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 bg-white/50 backdrop-blur-sm"
                    onClick={() => onSpecialtySelect(card.id as SpecialtyType)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${specialtyData.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${specialtyData.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                      <CardDescription className="text-slate-600">
                        {card.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Questions</span>
                        <span>{specialtyData.stats.questions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Pass Rate</span>
                        <span className="text-emerald-600">{specialtyData.stats.passRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Avg Score</span>
                        <span className="text-blue-600">{specialtyData.stats.avgScore}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-600 mb-3">Key Systems:</p>
                        <div className="flex flex-wrap gap-2">
                          {specialtyData.systems.slice(0, 3).map((system: any) => (
                            <Badge
                              key={system}
                              variant="secondary"
                              className="text-xs bg-slate-100 text-slate-700"
                            >
                              {system}
                            </Badge>
                          ))}
                          {specialtyData.systems.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                              +{specialtyData.systems.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Advanced tools designed to accelerate your learning and boost exam performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-white/70 backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">What Students Say</h2>
            <p className="text-xl text-slate-600">
              Join thousands of successful medical professionals
            </p>
          </div>

          <div className="relative">
            <Card className="border-0 bg-white/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-lg text-slate-700 mb-6 italic">
                  "{contentSettings.homePage.testimonials[currentTestimonial]?.content}"
                </p>
                
                <div className="flex items-center justify-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                      {contentSettings.homePage.testimonials[currentTestimonial]?.avatar || 
                       contentSettings.homePage.testimonials[currentTestimonial]?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="text-slate-900">{contentSettings.homePage.testimonials[currentTestimonial]?.name}</div>
                    <div className="text-slate-600 text-sm">{contentSettings.homePage.testimonials[currentTestimonial]?.specialty}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + contentSettings.homePage.testimonials.length) % contentSettings.homePage.testimonials.length)}
                className="border-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % contentSettings.homePage.testimonials.length)}
                className="border-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">{contentSettings.homePage.pricing.sectionTitle}</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {contentSettings.homePage.pricing.sectionDescription}
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="relative border-0 bg-white/70 backdrop-blur-sm ring-2 ring-emerald-500 shadow-2xl scale-105 max-w-md w-full">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                  {contentSettings.homePage.pricing.planBadge}
                </Badge>
              </div>

              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">{contentSettings.homePage.pricing.planName}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl">{formatPaymentAmount(getCurrentPaymentAmount().amount, getCurrentPaymentAmount().currency)}</span>
                  <span className="text-slate-600">{getDurationText()}</span>
                </div>
                <CardDescription className="mt-2 text-lg">
                  {contentSettings.homePage.pricing.planDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {contentSettings.homePage.pricing.features
                    .filter(feature => feature.isActive)
                    .map((feature) => (
                    <li key={feature.id} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-slate-700">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                  size="lg"
                  onClick={() => onNavigate('sign-up')}
                >
                  {contentSettings.homePage.pricing.buttonText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                {/* Payment Info */}
                <div className="pt-4 border-t border-slate-200 text-center">
                  <p className="text-sm text-slate-600 mb-2">
                    💳 Secure bank transfer payment
                  </p>
                  <p className="text-xs text-slate-500">
                    Account activation within 24-48 hours after payment verification
                  </p>
                  {paymentSettings.lastUpdated && paymentSettings.updatedBy !== 'System Initialization' && (
                    <p className="text-xs text-slate-400 mt-2">
                      Price last updated: {new Date(paymentSettings.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="text-center">
              <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm text-slate-700">Secure Payment</h4>
              <p className="text-xs text-slate-500">Bank-level security</p>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm text-slate-700">Expert Content</h4>
              <p className="text-xs text-slate-500">Created by specialists</p>
            </div>
            <div className="text-center">
              <Headphones className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm text-slate-700">24/7 Support</h4>
              <p className="text-xs text-slate-500">Always here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample MCQ */}
      <section id="sample-mcq" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Try a Sample Question</h2>
            <p className="text-xl text-slate-600">
              Experience our high-quality, board-style questions
            </p>
          </div>

          <Card className="border-0 bg-white/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Internal Medicine
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Cardiology
                </Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">
                A 65-year-old man presents with chest pain and shortness of breath. ECG shows ST-elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  'A) Left anterior descending artery',
                  'B) Left circumflex artery', 
                  'C) Right coronary artery',
                  'D) Left main coronary artery'
                ].map((option, index) => (
                  <button
                    key={index}
                    className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200 text-center">
                <p className="text-slate-600 mb-4">Sign up to see the answer and detailed explanation</p>
                <Button
                  onClick={() => onNavigate('sign-up')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about PulsePrep
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-0 bg-white/70 backdrop-blur-sm rounded-lg px-6"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <span className="text-left">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 to-teal-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl mb-6">
            Ready to Ace Your Medical Boards?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful medical professionals who trust PulsePrep
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => onNavigate('sign-up')}
              className="bg-white text-[rgba(29,181,132,1)] hover:bg-slate-100 border-0"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('specialties')}
              className="border-white text-[rgba(29,181,132,1)] hover:bg-white/10"
            >
              Browse Specialties
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="w-6 h-6" />
              <span>30-Day Money Back Guarantee</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Headphones className="w-6 h-6" />
              <span>24/7 Expert Support</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-6 h-6" />
              <span>Free Content Updates</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}