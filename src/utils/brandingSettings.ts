// Platform Branding Settings Interface
export interface PlatformBrandingSettings {
  // Basic Branding
  platformName: string;
  tagline: string;
  description: string;
  
  // Logo Management
  logo: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  favicon: {
    url: string;
  };
  
  // Color Scheme
  colors: {
    primary: string;        // Main brand color
    secondary: string;      // Secondary brand color
    accent: string;         // Accent color for highlights
    success: string;        // Success messages
    warning: string;        // Warning messages
    error: string;          // Error messages
    background: string;     // Background color
    text: string;           // Main text color
    textSecondary: string;  // Secondary text color
  };
  
  // Typography
  typography: {
    fontFamily: string;
    headingFont?: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  
  // Contact Information
  contact: {
    supportEmail: string;
    supportPhone: string;
    address: string;
    website: string;
    socialMedia: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      youtube?: string;
    };
  };
  
  // Footer Settings
  footer: {
    copyrightText: string;
    additionalLinks: {
      text: string;
      url: string;
    }[];
  };
  
  // Admin Metadata
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

// Default Platform Branding (Original PulsePrep)
export const defaultBrandingSettings: PlatformBrandingSettings = {
  platformName: 'PulsePrep',
  tagline: 'Your Medical Exam Success Partner',
  description: 'Comprehensive medical education platform for MBBS students preparing for specialty exams',
  
  logo: {
    url: '', // Will use built-in PulsePrep logo
    alt: 'PulsePrep Logo',
    width: 180,
    height: 40
  },
  
  favicon: {
    url: '/favicon.ico'
  },
  
  colors: {
    primary: '#3B82F6',      // Blue
    secondary: '#1E40AF',    // Dark Blue
    accent: '#10B981',       // Green
    success: '#10B981',      // Green
    warning: '#F59E0B',      // Yellow
    error: '#EF4444',        // Red
    background: '#FFFFFF',   // White
    text: '#1F2937',         // Dark Gray
    textSecondary: '#6B7280' // Medium Gray
  },
  
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFont: 'Inter, system-ui, sans-serif',
    fontSize: {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
  },
  
  contact: {
    supportEmail: 'support@pulseprep.com',
    supportPhone: '+92-300-1234567',
    address: 'Lahore, Pakistan',
    website: 'https://pulseprep.com',
    socialMedia: {
      facebook: 'https://facebook.com/pulseprep',
      twitter: 'https://twitter.com/pulseprep',
      linkedin: 'https://linkedin.com/company/pulseprep',
      instagram: 'https://instagram.com/pulseprep'
    }
  },
  
  footer: {
    copyrightText: '© 2024 PulsePrep. All rights reserved.',
    additionalLinks: [
      { text: 'Privacy Policy', url: '/privacy' },
      { text: 'Terms of Service', url: '/terms' },
      { text: 'Contact Us', url: '/contact' }
    ]
  },
  
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: 1
};

// Branding Settings Functions
export const initializeBrandingSettings = (): PlatformBrandingSettings => {
  const existingSettings = localStorage.getItem('pulseprep_branding_settings');
  
  if (existingSettings) {
    try {
      const parsed = JSON.parse(existingSettings);
      // Merge with defaults to ensure all new fields exist
      return {
        ...defaultBrandingSettings,
        ...parsed,
        // Ensure nested objects are properly merged
        logo: {
          ...defaultBrandingSettings.logo,
          ...parsed.logo
        },
        colors: {
          ...defaultBrandingSettings.colors,
          ...parsed.colors
        },
        typography: {
          ...defaultBrandingSettings.typography,
          ...parsed.typography
        },
        contact: {
          ...defaultBrandingSettings.contact,
          ...parsed.contact,
          socialMedia: {
            ...defaultBrandingSettings.contact.socialMedia,
            ...parsed.contact?.socialMedia
          }
        },
        footer: {
          ...defaultBrandingSettings.footer,
          ...parsed.footer
        }
      };
    } catch (error) {
      console.error('Error parsing branding settings, using defaults:', error);
      localStorage.setItem('pulseprep_branding_settings', JSON.stringify(defaultBrandingSettings));
      return defaultBrandingSettings;
    }
  }
  
  // Save default settings
  localStorage.setItem('pulseprep_branding_settings', JSON.stringify(defaultBrandingSettings));
  return defaultBrandingSettings;
};

export const updateBrandingSettings = (newSettings: PlatformBrandingSettings, updatedBy: string): void => {
  const updatedSettings = {
    ...newSettings,
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedBy,
    version: (newSettings.version || 0) + 1
  };
  
  localStorage.setItem('pulseprep_branding_settings', JSON.stringify(updatedSettings));
  
  // Apply branding to DOM immediately
  applyBrandingToDOM(updatedSettings);
  
  // Log the change for audit
  console.log('🎨 Branding settings updated by:', updatedBy, {
    version: updatedSettings.version,
    platformName: updatedSettings.platformName,
    primaryColor: updatedSettings.colors.primary
  });
};

export const getBrandingSettings = (): PlatformBrandingSettings => {
  return initializeBrandingSettings();
};

// Apply branding to DOM (dynamic CSS injection)
export const applyBrandingToDOM = (settings: PlatformBrandingSettings): void => {
  // Remove existing custom branding
  const existingStyle = document.getElementById('custom-branding-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new custom styles
  const style = document.createElement('style');
  style.id = 'custom-branding-styles';
  style.textContent = `
    :root {
      --brand-primary: ${settings.colors.primary};
      --brand-secondary: ${settings.colors.secondary};
      --brand-accent: ${settings.colors.accent};
      --brand-success: ${settings.colors.success};
      --brand-warning: ${settings.colors.warning};
      --brand-error: ${settings.colors.error};
      --brand-background: ${settings.colors.background};
      --brand-text: ${settings.colors.text};
      --brand-text-secondary: ${settings.colors.textSecondary};
      --brand-font-family: ${settings.typography.fontFamily};
      --brand-heading-font: ${settings.typography.headingFont || settings.typography.fontFamily};
    }
    
    /* Apply custom branding colors while preserving specialty themes */
    .brand-primary {
      background-color: var(--brand-primary) !important;
    }
    
    .brand-secondary {
      background-color: var(--brand-secondary) !important;
    }
    
    .brand-text {
      color: var(--brand-text) !important;
    }
    
    .brand-font {
      font-family: var(--brand-font-family) !important;
    }
    
    /* Update navigation colors (non-specialty pages) */
    .brand-navigation:not(.theme-medicine):not(.theme-surgery):not(.theme-gynae) {
      background-color: var(--brand-primary) !important;
    }
    
    /* Update button colors (non-specialty specific) */
    .brand-button {
      background-color: var(--brand-primary) !important;
      border-color: var(--brand-primary) !important;
    }
    
    .brand-button:hover {
      background-color: var(--brand-secondary) !important;
      border-color: var(--brand-secondary) !important;
    }
    
    /* Update link colors */
    .brand-link {
      color: var(--brand-primary) !important;
    }
    
    .brand-link:hover {
      color: var(--brand-secondary) !important;
    }
    
    /* Update form elements */
    .brand-input:focus {
      border-color: var(--brand-primary) !important;
      box-shadow: 0 0 0 1px var(--brand-primary) !important;
    }
    
    /* Update success/warning/error colors */
    .brand-success {
      background-color: var(--brand-success) !important;
    }
    
    .brand-warning {
      background-color: var(--brand-warning) !important;
    }
    
    .brand-error {
      background-color: var(--brand-error) !important;
    }
    
    /* IMPORTANT: Preserve specialty themes - DO NOT override */
    .theme-medicine .specialty-color {
      background-color: #3B82F6 !important; /* Keep medicine blue */
    }
    
    .theme-surgery .specialty-color {
      background-color: #EF4444 !important; /* Keep surgery red */
    }
    
    .theme-gynae .specialty-color {
      background-color: #8B5CF6 !important; /* Keep gynae purple */
    }
  `;
  
  document.head.appendChild(style);
  
  // Update document title
  document.title = `${settings.platformName} - Medical Exam Preparation`;
  
  // Update favicon if custom one is set
  if (settings.favicon.url && settings.favicon.url !== '/favicon.ico') {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = settings.favicon.url;
    }
  }
};

// Initialize branding on app load
export const initializeBrandingOnLoad = (): void => {
  const settings = getBrandingSettings();
  applyBrandingToDOM(settings);
};