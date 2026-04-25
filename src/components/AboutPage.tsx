import { useState, useEffect } from 'react';
import { getContentSettings, subscribeToContentChanges } from '../utils/contentSettings';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

// Custom SVG icon components to replace lucide-react
const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const Target = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Award = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const Heart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);



interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const [activeTab, setActiveTab] = useState('mission');
  const [contentSettings, setContentSettings] = useState(getContentSettings());

  useEffect(() => {
    const unsubscribe = subscribeToContentChanges((updatedSettings) => {
      setContentSettings(updatedSettings);
      console.log('📝 Content updated in AboutPage:', updatedSettings.version);
    });

    return unsubscribe;
  }, []);
  // Use dynamic statistics from contentSettings instead of hardcoded
  const stats = contentSettings.homePage.statistics.map((stat, index) => {
    const iconMap = [Users, BookOpen, Award, Brain]; // Keep existing icons
    const colorMap = ['text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500']; // Keep existing colors
    
    return {
      label: stat.label,
      value: stat.value,
      icon: iconMap[index % iconMap.length],
      color: colorMap[index % colorMap.length]
    };
  });

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Advanced algorithms personalize your study experience and identify knowledge gaps.',
      color: 'bg-purple-500'
    },
    {
      icon: Target,
      title: 'Specialty-Focused',
      description: 'Dedicated pathways for Medicine, Surgery, and Gynecology & Obstetrics.',
      color: 'bg-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Detailed insights into your progress with predictive success modeling.',
      color: 'bg-green-500'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Bank-level security with encrypted data and secure payment processing.',
      color: 'bg-red-500'
    },
    {
      icon: Clock,
      title: 'Flexible Learning',
      description: 'Study at your own pace with offline mode and cross-device synchronization.',
      color: 'bg-orange-500'
    },
    {
      icon: UserCheck,
      title: 'Expert Content',
      description: 'Questions crafted by medical professionals and validated by specialists.',
      color: 'bg-cyan-500'
    }
  ];

  const team = [
    {
      name: 'Dr. Ahmed Hassan',
      role: 'Chief Medical Officer',
      specialty: 'Internal Medicine',
      description: 'Former Professor of Medicine with 15+ years in medical education.',
      image: '👨‍⚕️'
    },
    {
      name: 'Dr. Fatima Khan',
      role: 'Head of Content',
      specialty: 'Surgery',
      description: 'Leading surgeon and medical examination specialist.',
      image: '👩‍⚕️'
    },
    {
      name: 'Dr. Sarah Ali',
      role: 'Gynecology Specialist',
      specialty: 'Gynae & Obstetrics',
      description: 'Board-certified specialist in women\'s health and medical education.',
      image: '👩‍⚕️'
    },
    {
      name: 'Muhammad Usman',
      role: 'Technology Director',
      specialty: 'EdTech Innovation',
      description: 'Expert in educational technology and AI-powered learning systems.',
      image: '👨‍💻'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'PulsePrep Founded',
      description: 'Started with a vision to revolutionize medical education in Pakistan.'
    },
    {
      year: '2021',
      title: 'First 1,000 Students',
      description: 'Reached our first milestone with students from top medical universities.'
    },
    {
      year: '2022',
      title: 'AI Integration',
      description: 'Launched AI-powered personalized learning and performance analytics.'
    },
    {
      year: '2023',
      title: 'Multi-Specialty Platform',
      description: 'Expanded to cover Medicine, Surgery, and Gynecology specialties.'
    },
    {
      year: '2024',
      title: 'Industry Leadership',
      description: 'Became Pakistan\'s leading medical exam preparation platform.'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Student-Centric',
      description: 'Every decision we make is guided by what\'s best for our students\' success.'
    },
    {
      icon: CheckCircle,
      title: 'Quality Excellence',
      description: 'We maintain the highest standards in content quality and platform reliability.'
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Making quality medical education accessible to students across Pakistan.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Continuously pushing the boundaries of educational technology.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate('home')}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PulsePrep</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {contentSettings.aboutPage.hero.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {contentSettings.aboutPage.hero.description}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-4 py-2">🇵🇰 Made in Pakistan</Badge>
            <Badge variant="secondary" className="px-4 py-2">🤖 AI-Powered</Badge>
            <Badge variant="secondary" className="px-4 py-2">📱 Mobile-First</Badge>
            <Badge variant="secondary" className="px-4 py-2">🔒 Secure</Badge>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg p-2 shadow-sm">
          {[
            { id: 'mission', label: 'Our Mission', icon: Target },
            { id: 'features', label: 'Features', icon: Zap },
            { id: 'team', label: 'Our Team', icon: Users },
            { id: 'story', label: 'Our Story', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="mb-16">
          {activeTab === 'mission' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission & Vision</h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                  To democratize access to world-class medical education and examination preparation, 
                  ensuring every Pakistani medical student has the tools and support needed to excel 
                  in their medical career and serve their communities with excellence.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{contentSettings.aboutPage.mission.title}</h3>
                  </div>
                  <p className="text-gray-600">
                    {contentSettings.aboutPage.mission.content}
                  </p>
                </Card>

                <Card className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{contentSettings.aboutPage.vision.title}</h3>
                  </div>
                  <p className="text-gray-600">
                    {contentSettings.aboutPage.vision.content}
                  </p>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h4>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Platform Features</h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                  Discover the powerful features that make PulsePrep the most comprehensive 
                  medical exam preparation platform in Pakistan.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className={`h-12 w-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                ))}
              </div>

              <Card className="p-8 bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Why Choose PulsePrep?</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">📊 Data-Driven</h4>
                      <p className="opacity-90">Performance analytics help you focus on weak areas</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">🎯 Personalized</h4>
                      <p className="opacity-90">AI adapts to your learning style and pace</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">🏆 Proven Results</h4>
                      <p className="opacity-90">92% of our students pass on their first attempt</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                  Our diverse team of medical professionals, educators, and technology experts 
                  work together to create the best learning experience for our students.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((member, index) => (
                  <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-4">{member.image}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-emerald-600 font-medium mb-2">{member.role}</p>
                    <Badge variant="outline" className="mb-3">{member.specialty}</Badge>
                    <p className="text-gray-600 text-sm">{member.description}</p>
                  </Card>
                ))}
              </div>

              <Card className="p-8 bg-gray-50">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Our Team</h3>
                  <p className="text-gray-600 mb-6">
                    We're always looking for passionate medical professionals and educators 
                    to join our mission of transforming medical education.
                  </p>
                  <Button onClick={() => onNavigate('contact')} className="bg-emerald-500 hover:bg-emerald-600">
                    View Open Positions
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Journey</h2>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                  From a small idea to Pakistan's leading medical exam preparation platform - 
                  discover how we've grown and evolved to serve thousands of medical students.
                </p>
              </div>

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <Card className="flex-1 p-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900">{milestone.title}</h3>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </Card>
                  </div>
                ))}
              </div>

              <Card className="p-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">What's Next?</h3>
                  <p className="mb-6 opacity-90">
                    We're continuously innovating and expanding our platform to serve more 
                    students and cover additional medical specialties and examination types.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">🌍 Global Expansion</h4>
                      <p className="opacity-90">Expanding to serve medical students across South Asia</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">🤖 Advanced AI</h4>
                      <p className="opacity-90">Next-generation personalization and predictive analytics</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">📚 More Content</h4>
                      <p className="opacity-90">Additional specialties and exam preparation modules</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="p-8 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of successful medical students who have achieved their dreams with PulsePrep.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => onNavigate('specialty-selection')} 
              className="bg-white text-emerald-600 hover:bg-gray-100"
              size="lg"
            >
              Start Learning Today
            </Button>
            <Button 
              onClick={() => onNavigate('contact')} 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-emerald-600"
              size="lg"
            >
              Contact Us
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}