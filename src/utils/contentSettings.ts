// Dynamic Content Management System
// Enables SuperAdmin to control all page content from the dashboard
import { safeSetItem, safeGetItem } from './storageUtils';

// Content Settings Interface
export interface ContentSettings {
  version: number;
  lastUpdated: string;
  updatedBy: string;
  platformName: string;
  description: string;
  homePage: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      ctaButtons: {
        primary: string;
        secondary: string;
      };
    };
    features: Array<{
      id: string;
      title: string;
      description: string;
      icon: string; // For future icon customization
    }>;
    testimonials: Array<{
      id: string;
      name: string;
      specialty: string;
      content: string;
      rating: number;
      avatar: string;
    }>;
    faq: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
    statistics: Array<{
      id: string;
      value: string;
      label: string;
      description: string;
    }>;
    pricing: {
      sectionTitle: string;
      sectionDescription: string;
      planName: string;
      planDescription: string;
      planBadge: string;
      buttonText: string;
      features: Array<{
        id: string;
        text: string;
        isActive: boolean;
      }>;
      paymentInfo: {
        method: string;
        activationTime: string;
      };
      trustIndicators: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
      }>;
    };
    specialtyCards: Array<{
      id: string;
      name: string;
      title: string;
      description: string;
      isActive: boolean;
    }>;
  };
  
  aboutPage: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
    };
    mission: {
      title: string;
      content: string;
    };
    vision: {
      title: string;
      content: string;
    };
    values: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
    team: Array<{
      id: string;
      name: string;
      role: string;
      specialty: string;
      description: string;
      image: string;
      linkedin?: string;
      email?: string;
    }>;
    milestones: Array<{
      id: string;
      year: string;
      title: string;
      description: string;
    }>;
    features: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  
  contactPage: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
    };
    contactMethods: Array<{
      id: string;
      title: string;
      description: string;
      contact: string;
      response: string;
      icon: string;
      priority: number;
      color: string;
      isActive: boolean;
    }>;
    socialLinks: Array<{
      id: string;
      name: string;
      icon: string;
      url: string;
      color: string;
      isActive: boolean;
      displayOrder: number;
    }>;
    officeInfo: {
      title: string;
      address: string;
      hours: string;
      emergency: string;
      phone: string;
      email: string;
    };
    supportCategories: Array<{
      id: string;
      title: string;
      description: string;
      examples: string[];
      priority: number;
    }>;
    faq: Array<{
      id: string;
      question: string;
      answer: string;
      category: string;
    }>;
  };
}

// Default content structure with comprehensive defaults
const defaultContentSettings: ContentSettings = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  platformName: 'PulsePrep',
  description: 'Empowering medical professionals with AI-powered exam preparation and comprehensive study tools.',
  
  homePage: {
    hero: {
      title: "Master Your Medical Boards",
      subtitle: "FCPS Excellence Starts Here",
      description: "Join thousands of medical professionals who have successfully passed their FCPS exams with our comprehensive preparation platform. Get access to expert-curated questions, mock exams, and personalized study plans.",
      ctaButtons: {
        primary: "Start Your Journey",
        secondary: "Learn More"
      }
    },
    features: [
      {
        id: "feature-1",
        title: "Expert-Curated Questions",
        description: "Access thousands of high-quality MCQs developed by FCPS-certified professionals and subject matter experts.",
        icon: "BookOpen"
      },
      {
        id: "feature-2", 
        title: "Real-Time Progress Tracking",
        description: "Monitor your preparation with detailed analytics, performance insights, and personalized recommendations.",
        icon: "TrendingUp"
      },
      {
        id: "feature-3",
        title: "Mock Exams & Practice Tests",
        description: "Simulate real exam conditions with timed mock tests and comprehensive performance analysis.",
        icon: "Clock"
      },
      {
        id: "feature-4",
        title: "Multi-Specialty Support",
        description: "Comprehensive coverage for Medicine, Surgery, and Gynecology & Obstetrics specialties.",
        icon: "Stethoscope"
      }
    ],
    testimonials: [
      {
        id: "testimonial-1",
        name: "Dr. Sarah Ahmed",
        specialty: "Medicine",
        content: "PulsePrep was instrumental in my FCPS Medicine success. The question quality and detailed explanations helped me understand complex concepts thoroughly.",
        rating: 5,
        avatar: "/api/placeholder/64/64"
      },
      {
        id: "testimonial-2",
        name: "Dr. Muhammad Hassan",
        specialty: "Surgery",
        content: "The mock exams were incredibly realistic. I felt completely prepared for the actual FCPS Surgery exam thanks to PulsePrep's comprehensive platform.",
        rating: 5,
        avatar: "/api/placeholder/64/64"
      },
      {
        id: "testimonial-3",
        name: "Dr. Fatima Khan",
        specialty: "Gynecology & Obstetrics",
        content: "Excellent platform with up-to-date questions. The progress tracking helped me identify weak areas and focus my preparation effectively.",
        rating: 5,
        avatar: "/api/placeholder/64/64"
      }
    ],
    faq: [
      {
        id: "faq-1",
        question: "How many questions are available for each specialty?",
        answer: "We provide thousands of carefully curated questions for each specialty - Medicine, Surgery, and Gynecology & Obstetrics. Our question bank is regularly updated with new content."
      },
      {
        id: "faq-2",
        question: "Are the mock exams similar to actual FCPS exams?",
        answer: "Yes, our mock exams are designed to closely simulate the actual FCPS examination format, timing, and difficulty level. They include the same question types and subject distribution as the real exams."
      },
      {
        id: "faq-3",
        question: "Can I track my progress over time?",
        answer: "Absolutely! Our platform provides detailed analytics including performance trends, subject-wise scores, improvement areas, and personalized study recommendations."
      },
      {
        id: "faq-4",
        question: "Is there customer support available?",
        answer: "Yes, we provide 24/7 customer support through multiple channels including email, live chat, and phone support. Our team is always ready to help with any questions or technical issues."
      }
    ],
    statistics: [
      {
        id: "stat-1",
        value: "95%",
        label: "Success Rate",
        description: "Students who used PulsePrep passed their FCPS exams"
      },
      {
        id: "stat-2",
        value: "10,000+",
        label: "Questions",
        description: "High-quality MCQs across all specialties"
      },
      {
        id: "stat-3",
        value: "24/7",
        label: "Support",
        description: "Round-the-clock assistance when you need it"
      },
      {
        id: "stat-4",
        value: "3",
        label: "Specialties",
        description: "Medicine, Surgery, and Gynecology & Obstetrics"
      }
    ],
    pricing: {
      sectionTitle: "Simple, Transparent Pricing",
      sectionDescription: "One comprehensive plan with everything you need to excel in your medical boards",
      planName: "PulsePrep Premium",
      planDescription: "Complete access to all specialties and features",
      planBadge: "Complete Package",
      buttonText: "Get Started Now",
      features: [
        { id: "feature-1", text: "Access to all 3 specialties", isActive: true },
        { id: "feature-2", text: "6,500+ practice questions", isActive: true },
        { id: "feature-3", text: "AI-powered adaptive learning", isActive: true },
        { id: "feature-4", text: "Detailed performance analytics", isActive: true },
        { id: "feature-5", text: "Timed mock examinations", isActive: true },
        { id: "feature-6", text: "Expert explanations", isActive: true },
        { id: "feature-7", text: "Mobile & desktop access", isActive: true },
        { id: "feature-8", text: "Priority customer support", isActive: true }
      ],
      paymentInfo: {
        method: "💳 Secure bank transfer payment",
        activationTime: "Account activation within 24-48 hours after payment verification"
      },
      trustIndicators: [
        { id: "trust-1", title: "Secure Payment", description: "Bank-level security", icon: "Shield" },
        { id: "trust-2", title: "Expert Content", description: "Created by specialists", icon: "Award" },
        { id: "trust-3", title: "24/7 Support", description: "Always here to help", icon: "Headphones" }
      ]
    },
    specialtyCards: [
      { 
        id: "medicine", 
        name: "medicine",
        title: "Internal Medicine", 
        description: "Comprehensive preparation for internal medicine examinations",
        isActive: true 
      },
      { 
        id: "surgery", 
        name: "surgery",
        title: "Surgery", 
        description: "Advanced surgical knowledge and clinical decision making",
        isActive: true 
      },
      { 
        id: "gynae-obs", 
        name: "gynae-obs",
        title: "Gynecology & Obstetrics", 
        description: "Women's health and reproductive medicine expertise",
        isActive: true 
      }
    ]
  },
  
  aboutPage: {
    hero: {
      title: "About PulsePrep",
      subtitle: "Empowering Medical Excellence",
      description: "We are dedicated to helping medical professionals achieve their FCPS certification goals through innovative learning solutions and expert guidance."
    },
    mission: {
      title: "Our Mission",
      content: "To provide the most comprehensive, accessible, and effective FCPS preparation platform that empowers medical professionals to achieve excellence in their specialties and advance their careers with confidence."
    },
    vision: {
      title: "Our Vision", 
      content: "To become the leading global platform for medical education and certification preparation, setting the standard for quality, innovation, and student success in medical learning."
    },
    values: [
      {
        id: "value-1",
        title: "Excellence",
        description: "We strive for the highest standards in everything we do, from content quality to user experience.",
        icon: "Award"
      },
      {
        id: "value-2",
        title: "Innovation",
        description: "We continuously innovate to provide cutting-edge learning solutions and stay ahead of educational trends.",
        icon: "Lightbulb"
      },
      {
        id: "value-3",
        title: "Accessibility",
        description: "We believe quality medical education should be accessible to all, regardless of location or background.",
        icon: "Globe"
      },
      {
        id: "value-4",
        title: "Support",
        description: "We provide comprehensive support to ensure every student has the resources they need to succeed.",
        icon: "Users"
      }
    ],
    team: [
      {
        id: "team-1",
        name: "Dr. Ahmed Rahman",
        role: "Founder & CEO",
        specialty: "Internal Medicine",
        description: "FCPS Medicine with 15+ years of experience in medical education and curriculum development.",
        image: "/api/placeholder/300/300",
        linkedin: "#",
        email: "ahmed@pulseprep.com"
      },
      {
        id: "team-2",
        name: "Dr. Fatima Ali",
        role: "Chief Academic Officer",
        specialty: "Surgery",
        description: "FCPS Surgery specialist focused on creating comprehensive and effective learning materials.",
        image: "/api/placeholder/300/300",
        linkedin: "#",
        email: "fatima@pulseprep.com"
      },
      {
        id: "team-3",
        name: "Dr. Hassan Khan",
        role: "Head of Content",
        specialty: "Gynecology & Obstetrics",
        description: "Expert in women's health with extensive experience in medical examination preparation.",
        image: "/api/placeholder/300/300",
        linkedin: "#", 
        email: "hassan@pulseprep.com"
      }
    ],
    milestones: [
      {
        id: "milestone-1",
        year: "2020",
        title: "PulsePrep Founded",
        description: "Started with a vision to revolutionize FCPS preparation in Pakistan."
      },
      {
        id: "milestone-2",
        year: "2021",
        title: "1,000 Students",
        description: "Reached our first milestone of 1,000 active students across all specialties."
      },
      {
        id: "milestone-3", 
        year: "2022",
        title: "Platform Expansion",
        description: "Launched comprehensive mock exam system and advanced analytics features."
      },
      {
        id: "milestone-4",
        year: "2023",
        title: "10,000+ Questions",
        description: "Built the largest curated FCPS question bank with expert explanations."
      },
      {
        id: "milestone-5",
        year: "2024",
        title: "95% Success Rate",
        description: "Achieved industry-leading success rate for FCPS exam preparation."
      }
    ],
    features: [
      {
        id: "feature-1",
        title: "Expert Content Creation",
        description: "All our content is developed by FCPS-certified professionals with extensive teaching experience.",
        icon: "BookOpen"
      },
      {
        id: "feature-2",
        title: "Advanced Analytics",
        description: "Sophisticated tracking and reporting tools to monitor progress and identify improvement areas.",
        icon: "BarChart"
      },
      {
        id: "feature-3",
        title: "Adaptive Learning",
        description: "Personalized study plans that adapt to your learning pace and performance patterns.",
        icon: "Brain"
      },
      {
        id: "feature-4",
        title: "Community Support",
        description: "Connect with fellow students and mentors through our active learning community.",
        icon: "Users"
      }
    ]
  },
  
  contactPage: {
    hero: {
      title: "Get in Touch",
      subtitle: "We're Here to Help",
      description: "Have questions about our platform, need technical support, or want to learn more about our services? Our team is ready to assist you."
    },
    contactMethods: [
      {
        id: "method-1",
        title: "Email Support",
        description: "Send us an email for detailed inquiries",
        contact: "support@pulseprep.com",
        response: "Response within 24 hours",
        icon: "Mail",
        priority: 1,
        color: "bg-blue-500",
        isActive: true
      },
      {
        id: "method-2",
        title: "Live Chat",
        description: "Chat with our support team instantly",
        contact: "Available on website",
        response: "Immediate response during business hours",
        icon: "MessageCircle",
        priority: 2,
        color: "bg-purple-500",
        isActive: true
      },
      {
        id: "method-3",
        title: "Phone Support",
        description: "Call us for urgent matters",
        contact: "+92-300-1234567",
        response: "Available 9 AM - 6 PM (Mon-Fri)",
        icon: "Phone",
        priority: 3,
        color: "bg-green-500",
        isActive: true
      },
      {
        id: "method-4",
        title: "WhatsApp",
        description: "Quick support via WhatsApp",
        contact: "+92-300-1234567",
        response: "Available 24/7",
        icon: "MessageSquare",
        priority: 4,
        color: "bg-emerald-500",
        isActive: true
      }
    ],
    socialLinks: [
      {
        id: "social-1",
        name: "Facebook",
        icon: "Facebook",
        url: "https://facebook.com/pulseprep",
        color: "bg-blue-600",
        isActive: true,
        displayOrder: 1
      },
      {
        id: "social-2",
        name: "Twitter",
        icon: "Twitter",
        url: "https://twitter.com/pulseprep",
        color: "bg-sky-500",
        isActive: true,
        displayOrder: 2
      },
      {
        id: "social-3",
        name: "Instagram",
        icon: "Instagram",
        url: "https://instagram.com/pulseprep",
        color: "bg-pink-500",
        isActive: true,
        displayOrder: 3
      },
      {
        id: "social-4",
        name: "LinkedIn",
        icon: "Linkedin",
        url: "https://linkedin.com/company/pulseprep",
        color: "bg-blue-700",
        isActive: true,
        displayOrder: 4
      },
      {
        id: "social-5",
        name: "YouTube",
        icon: "Youtube",
        url: "https://youtube.com/pulseprep",
        color: "bg-red-600",
        isActive: true,
        displayOrder: 5
      }
    ],
    officeInfo: {
      title: "Office Information",
      address: "123 Medical Plaza, Gulberg III, Lahore, Pakistan",
      hours: "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed",
      emergency: "For urgent technical issues, please use our 24/7 live chat or WhatsApp support.",
      phone: "+92-42-3577-8900",
      email: "info@pulseprep.com"
    },
    supportCategories: [
      {
        id: "category-1",
        title: "Technical Support",
        description: "Help with platform issues, login problems, or technical difficulties",
        examples: ["Cannot access account", "Payment processing issues", "Website not loading", "Mobile app problems"],
        priority: 1
      },
      {
        id: "category-2",
        title: "Academic Support",
        description: "Questions about content, study plans, or exam preparation strategies",
        examples: ["Question explanations", "Study plan guidance", "Mock exam help", "Progress tracking"],
        priority: 2
      },
      {
        id: "category-3",
        title: "Account & Billing",
        description: "Account management, subscription, and billing related inquiries",
        examples: ["Subscription renewal", "Payment methods", "Account settings", "Billing history"],
        priority: 3
      },
      {
        id: "category-4",
        title: "General Information",
        description: "General questions about our services, features, or policies",
        examples: ["Platform features", "Pricing information", "Refund policy", "System requirements"],
        priority: 4
      }
    ],
    faq: [
      {
        id: "faq-1",
        question: "How can I contact customer support?",
        answer: "You can reach us through email (support@pulseprep.com), live chat on our website, phone (+92-300-1234567), or WhatsApp. Our support team is available 24/7 through multiple channels.",
        category: "general"
      },
      {
        id: "faq-2", 
        question: "What are your business hours?",
        answer: "Our office is open Monday-Friday 9 AM to 6 PM, and Saturday 10 AM to 4 PM. However, our online support through chat and WhatsApp is available 24/7.",
        category: "general"
      },
      {
        id: "faq-3",
        question: "How quickly will I receive a response?",
        answer: "Email responses are typically sent within 24 hours. Live chat and WhatsApp support provide immediate responses during business hours and quick responses outside business hours.",
        category: "technical"
      },
      {
        id: "faq-4",
        question: "Do you offer phone support?",
        answer: "Yes, we offer phone support at +92-300-1234567 during business hours (9 AM - 6 PM, Monday-Friday). For urgent matters outside these hours, please use our 24/7 chat or WhatsApp support.",
        category: "general"
      }
    ]
  }
};

// Content settings versioning for change detection
let contentSettingsVersion = 0;
let contentSettingsCache: ContentSettings | null = null;

// Event system for content settings changes
const contentSettingsListeners: Array<(settings: ContentSettings) => void> = [];

// Subscribe to content settings changes
export const subscribeToContentChanges = (callback: (settings: ContentSettings) => void) => {
  contentSettingsListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = contentSettingsListeners.indexOf(callback);
    if (index > -1) {
      contentSettingsListeners.splice(index, 1);
    }
  };
};

// Notify all listeners of content settings changes
const notifyContentSettingsChange = (settings: ContentSettings) => {
  contentSettingsVersion++;
  contentSettingsCache = settings;
  
  contentSettingsListeners.forEach(callback => {
    try {
      callback(settings);
    } catch (error) {
      console.error('❌ Error in content settings change listener:', error);
    }
  });
  
  // Dispatch custom event for cross-tab communication
  window.dispatchEvent(new CustomEvent('contentSettingsChanged', { 
    detail: { settings, version: contentSettingsVersion } 
  }));
};

// 🔧 FIXED: Handle corrupted localStorage data and ensure proper JSON serialization
const cleanupCorruptedContentSettings = () => {
  try {
    console.log('🧹 Cleaning up corrupted content settings...');
    localStorage.removeItem('pulseprep_content_settings');
    localStorage.removeItem('pulseprep_content_settings_backup');
    console.log('✅ Corrupted content settings removed');
  } catch (error) {
    console.error('❌ Error cleaning up corrupted content settings:', error);
  }
};

// Initialize content settings with proper structure
export const initializeContentSettings = (): ContentSettings => {
  try {
    const existing = safeGetItem('pulseprep_content_settings', null);
    
    if (existing) {
      let parsed: ContentSettings;
      
      // Handle case where safeGetItem returns an object (if the data was corrupted)
      if (typeof existing === 'object' && existing !== null) {
        // If it's already an object, validate its structure
        if (validateContentSettings(existing)) {
          parsed = existing as ContentSettings;
        } else {
          console.warn('⚠️ Content settings object has invalid structure, reinitializing...');
          cleanupCorruptedContentSettings();
          throw new Error('Invalid content settings structure');
        }
      } else if (typeof existing === 'string') {
        // If it's a string, try to parse it
        try {
          parsed = JSON.parse(existing);
        } catch (parseError) {
          console.error('❌ Failed to parse content settings JSON:', parseError);
          cleanupCorruptedContentSettings();
          throw new Error('Invalid JSON in content settings');
        }
      } else {
        console.warn('⚠️ Content settings data type is unexpected:', typeof existing);
        cleanupCorruptedContentSettings();
        throw new Error('Unexpected content settings data type');
      }
      
      // Validate structure and merge with defaults to ensure all fields exist
      const mergedSettings = mergeWithDefaults(parsed, defaultContentSettings);
      
      // 🔧 FIXED: Ensure proper JSON serialization when saving back
      const success = safeSetItem('pulseprep_content_settings', mergedSettings);
      if (!success) {
        console.warn('⚠️ Could not save merged content settings to storage, using in-memory defaults');
      }
      
      // Update cache
      contentSettingsCache = mergedSettings;
      contentSettingsVersion = mergedSettings.version || 1;
      
      console.log('📝 Content settings loaded:', {
        version: mergedSettings.version,
        homePage: {
          features: mergedSettings.homePage.features.length,
          testimonials: mergedSettings.homePage.testimonials.length,
          faq: mergedSettings.homePage.faq.length
        },
        aboutPage: {
          team: mergedSettings.aboutPage.team.length,
          milestones: mergedSettings.aboutPage.milestones.length
        },
        contactPage: {
          contactMethods: mergedSettings.contactPage.contactMethods.length,
          supportCategories: mergedSettings.contactPage.supportCategories.length
        }
      });
      
      return mergedSettings;
    }
    
    // Initialize with defaults
    // 🔧 FIXED: Ensure proper JSON serialization
    const success = safeSetItem('pulseprep_content_settings', defaultContentSettings);
    if (success) {
      contentSettingsCache = defaultContentSettings;
      contentSettingsVersion = 1;
      console.log('📝 Content settings initialized with defaults');
      return defaultContentSettings;
    } else {
      console.warn('⚠️ Could not save content settings to storage, using in-memory defaults');
      contentSettingsCache = defaultContentSettings;
      return defaultContentSettings;
    }
    
  } catch (error) {
    console.error('❌ Error initializing content settings:', error);
    cleanupCorruptedContentSettings();
    contentSettingsCache = defaultContentSettings;
    contentSettingsVersion = 1;
    return defaultContentSettings;
  }
};

// Deep merge function to ensure all default fields exist
const mergeWithDefaults = (current: any, defaults: any): ContentSettings => {
  const merged = { ...defaults };
  
  if (current && typeof current === 'object') {
    Object.keys(current).forEach(key => {
      if (key in defaults) {
        if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
          merged[key] = mergeWithDefaults(current[key], defaults[key]);
        } else {
          merged[key] = current[key];
        }
      }
    });
  }
  
  return merged as ContentSettings;
};

// Get content settings with optional force refresh
export const getContentSettings = (forceRefresh: boolean = false): ContentSettings => {
  try {
    // Check if we need to refresh from localStorage
    if (forceRefresh || !contentSettingsCache) {
      const stored = safeGetItem('pulseprep_content_settings', null);
      if (stored) {
        let parsed: ContentSettings;
        
        // Handle different data types that might be returned by safeGetItem
        if (typeof stored === 'object' && stored !== null) {
          if (validateContentSettings(stored)) {
            parsed = stored as ContentSettings;
          } else {
            console.warn('⚠️ Stored content settings have invalid structure, reinitializing...');
            return initializeContentSettings();
          }
        } else if (typeof stored === 'string') {
          try {
            parsed = JSON.parse(stored);
          } catch (parseError) {
            console.error('❌ Failed to parse stored content settings:', parseError);
            cleanupCorruptedContentSettings();
            return initializeContentSettings();
          }
        } else {
          console.warn('⚠️ Unexpected content settings data type:', typeof stored);
          return initializeContentSettings();
        }
        
        // Merge with defaults to ensure all fields exist
        const mergedSettings = mergeWithDefaults(parsed, defaultContentSettings);
        
        // Check if version changed (updated by admin)
        const newVersion = mergedSettings.version || 1;
        if (newVersion !== contentSettingsVersion) {
          console.log(`🔄 Content settings version changed: ${contentSettingsVersion} → ${newVersion}`);
          contentSettingsVersion = newVersion;
          contentSettingsCache = mergedSettings;
          
          // Don't notify on force refresh to avoid loops
          if (!forceRefresh) {
            notifyContentSettingsChange(mergedSettings);
          }
        }
        
        return mergedSettings;
      }
      
      return initializeContentSettings();
    }
    
    return contentSettingsCache;
    
  } catch (error) {
    console.error('❌ Error getting content settings:', error);
    return initializeContentSettings();
  }
};

// Update content settings (used by admin)
export const updateContentSettings = (settings: ContentSettings, updatedBy: string): boolean => {
  try {
    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      console.error('❌ Cannot update content settings: invalid settings object');
      return false;
    }
    
    // Increment version for change detection
    const newVersion = (settings.version || 0) + 1;
    
    const updatedSettings: ContentSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy,
      version: newVersion
    };
    
    // 🔧 FIXED: Ensure proper JSON serialization when saving to localStorage
    const success = safeSetItem('pulseprep_content_settings', updatedSettings);
    if (!success) {
      console.error('❌ Failed to save content settings due to storage quota');
      return false;
    }
    
    // Update cache and notify listeners
    contentSettingsCache = updatedSettings;
    contentSettingsVersion = newVersion;
    
    // Notify all listeners of the change
    notifyContentSettingsChange(updatedSettings);
    
    console.log('✅ Content settings updated successfully:', {
      version: newVersion,
      updatedBy,
      homePageSections: Object.keys(updatedSettings.homePage).length,
      aboutPageSections: Object.keys(updatedSettings.aboutPage).length,
      contactPageSections: Object.keys(updatedSettings.contactPage).length
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating content settings:', error);
    return false;
  }
};

// Force refresh content settings across all components
export const forceRefreshContentSettings = (): ContentSettings => {
  console.log('🔄 Force refreshing content settings...');
  contentSettingsCache = null;
  const settings = getContentSettings(true);
  return settings;
};

// Reset content settings to defaults
export const resetContentSettingsToDefaults = (updatedBy: string): boolean => {
  try {
    console.log('🔄 Resetting content settings to defaults...');
    
    const resetSettings: ContentSettings = {
      ...defaultContentSettings,
      lastUpdated: new Date().toISOString(),
      updatedBy,
      version: (contentSettingsVersion || 0) + 1
    };
    
    const success = updateContentSettings(resetSettings, updatedBy);
    
    if (success) {
      console.log('✅ Content settings reset to defaults successfully');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error resetting content settings to defaults:', error);
    return false;
  }
};

// Get specific page content
export const getHomePageContent = () => {
  const settings = getContentSettings();
  return settings.homePage;
};

export const getAboutPageContent = () => {
  const settings = getContentSettings();
  return settings.aboutPage;
};

export const getContactPageContent = () => {
  const settings = getContentSettings();
  return settings.contactPage;
};

// Update specific page content
export const updateHomePageContent = (content: ContentSettings['homePage'], updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    homePage: content
  }, updatedBy);
};

export const updateAboutPageContent = (content: ContentSettings['aboutPage'], updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    aboutPage: content
  }, updatedBy);
};

export const updateContactPageContent = (content: ContentSettings['contactPage'], updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    contactPage: content
  }, updatedBy);
};

// Utility to check if content settings have changed (for component optimization)
export const getContentSettingsVersion = (): number => {
  return contentSettingsVersion;
};

// Cross-tab synchronization (detect changes made in other tabs/windows)
export const initializeContentSettingsCrossTabSync = () => {
  // Listen for storage changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'pulseprep_content_settings' && event.newValue) {
      try {
        const newSettings = JSON.parse(event.newValue) as ContentSettings;
        const newVersion = newSettings.version || 1;
        
        if (newVersion !== contentSettingsVersion) {
          console.log('🔄 Content settings changed in another tab, syncing...');
          contentSettingsCache = newSettings;
          contentSettingsVersion = newVersion;
          notifyContentSettingsChange(newSettings);
        }
      } catch (error) {
        console.error('❌ Error syncing content settings from another tab:', error);
      }
    }
  });
  
  // Listen for custom events within the same tab
  window.addEventListener('contentSettingsChanged', ((event: CustomEvent) => {
    const { version } = event.detail;
    if (version && version !== contentSettingsVersion) {
      console.log('🔄 Content settings changed via custom event, syncing...');
      getContentSettings(true); // Force refresh
    }
  }) as EventListener);
  
  console.log('🔄 Content settings cross-tab synchronization initialized');
};

// Validate content settings structure
export const validateContentSettings = (settings: any): settings is ContentSettings => {
  return settings &&
         typeof settings === 'object' &&
         settings.homePage &&
         settings.aboutPage &&
         settings.contactPage &&
         typeof settings.version === 'number';
};

// Helper functions for admin UI
export const addHomePageFeature = (feature: Omit<ContentSettings['homePage']['features'][0], 'id'>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const newFeature = {
    ...feature,
    id: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  return updateContentSettings({
    ...settings,
    homePage: {
      ...settings.homePage,
      features: [...settings.homePage.features, newFeature]
    }
  }, updatedBy);
};

export const removeHomePageFeature = (featureId: string, updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    homePage: {
      ...settings.homePage,
      features: settings.homePage.features.filter(f => f.id !== featureId)
    }
  }, updatedBy);
};

export const addTestimonial = (testimonial: Omit<ContentSettings['homePage']['testimonials'][0], 'id'>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const newTestimonial = {
    ...testimonial,
    id: `testimonial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  return updateContentSettings({
    ...settings,
    homePage: {
      ...settings.homePage,
      testimonials: [...settings.homePage.testimonials, newTestimonial]
    }
  }, updatedBy);
};

export const removeTestimonial = (testimonialId: string, updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    homePage: {
      ...settings.homePage,
      testimonials: settings.homePage.testimonials.filter(t => t.id !== testimonialId)
    }
  }, updatedBy);
};

export const addContactMethod = (method: Omit<ContentSettings['contactPage']['contactMethods'][0], 'id'>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const newMethod = {
    ...method,
    id: `method-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      contactMethods: [...settings.contactPage.contactMethods, newMethod]
    }
  }, updatedBy);
};

export const updateContactMethod = (methodId: string, updates: Partial<ContentSettings['contactPage']['contactMethods'][0]>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const updatedMethods = settings.contactPage.contactMethods.map(method => 
    method.id === methodId ? { ...method, ...updates } : method
  );
  
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      contactMethods: updatedMethods
    }
  }, updatedBy);
};

export const removeContactMethod = (methodId: string, updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      contactMethods: settings.contactPage.contactMethods.filter(m => m.id !== methodId)
    }
  }, updatedBy);
};

export const addSocialLink = (link: Omit<ContentSettings['contactPage']['socialLinks'][0], 'id'>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const newLink = {
    ...link,
    id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      socialLinks: [...settings.contactPage.socialLinks, newLink]
    }
  }, updatedBy);
};

export const updateSocialLink = (linkId: string, updates: Partial<ContentSettings['contactPage']['socialLinks'][0]>, updatedBy: string): boolean => {
  const settings = getContentSettings();
  const updatedLinks = settings.contactPage.socialLinks.map(link => 
    link.id === linkId ? { ...link, ...updates } : link
  );
  
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      socialLinks: updatedLinks
    }
  }, updatedBy);
};

export const removeSocialLink = (linkId: string, updatedBy: string): boolean => {
  const settings = getContentSettings();
  return updateContentSettings({
    ...settings,
    contactPage: {
      ...settings.contactPage,
      socialLinks: settings.contactPage.socialLinks.filter(l => l.id !== linkId)
    }
  }, updatedBy);
};

// Initialize the cross-tab sync when this module loads
if (typeof window !== 'undefined') {
  initializeContentSettingsCrossTabSync();
}