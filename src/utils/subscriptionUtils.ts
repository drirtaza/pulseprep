import { UserData, SubscriptionSettings, SubscriptionPlan } from '../types';

// Legacy interface for backward compatibility
interface LegacySubscriptionPlan {
  name: string;
  duration: number;
  price: number;
  currency: string;
  description: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
}

interface LegacySubscriptionSettings {
  plans: {
    [key: string]: LegacySubscriptionPlan;
  };
  expirySettings: {
    warningDays: number[];
    gracePeriodDays: number;
    autoRenewal?: boolean;
    autoDisable?: boolean;
  };
  defaultPlan: string;
  lastUpdated: string;
  updatedBy: string;
}



// Default subscription settings using the correct type structure
const defaultSubscriptionSettings: SubscriptionSettings = {
  plans: [
    {
      id: 'plan-3month',
      name: '3-Month FCPS Preparation',
      description: 'Complete 3-month access to your chosen specialty',
      price: 7000,
      currency: 'PKR',
      duration: 3,
      durationType: 'months',
      features: [
        'Access to all practice questions',
        'Mock exams with detailed analytics',
        'Progress tracking and performance insights',
        'Expert explanations and references',
        'Bookmark and review system'
      ],
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  defaultPlanId: 'plan-3month',
  trialPeriod: 0,
  gracePeriod: 3,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: 1
};

// Fallback plan for when everything else fails
const FALLBACK_PLAN: SubscriptionPlan = {
  id: 'plan-fallback',
  name: '3-Month FCPS Preparation',
  description: 'Complete 3-month access to your chosen specialty',
  price: 7000,
  currency: 'PKR',
  duration: 3,
  durationType: 'months',
  features: [
    'Access to all practice questions',
    'Mock exams with detailed analytics',
    'Progress tracking and performance insights'
  ],
  isActive: true,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Migration function to convert legacy format to modern format
const migrateLegacySettings = (legacySettings: LegacySubscriptionSettings): SubscriptionSettings => {
  console.log('🔄 Migrating legacy subscription settings to new format...');
  
  const plans: SubscriptionPlan[] = [];
  
  // Convert object-based plans to array-based plans
  Object.entries(legacySettings.plans).forEach(([key, plan]) => {
    plans.push({
      id: `plan-${key}`,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      durationType: 'months' as const,
      features: plan.features || [],
      isActive: plan.isActive,
      isDefault: key === legacySettings.defaultPlan,
      createdAt: legacySettings.lastUpdated,
      updatedAt: legacySettings.lastUpdated
    });
  });

  // Sort by display order if available
  plans.sort((a, b) => {
    const aOrder = (legacySettings.plans[a.id.replace('plan-', '')] as any)?.displayOrder || 0;
    const bOrder = (legacySettings.plans[b.id.replace('plan-', '')] as any)?.displayOrder || 0;
    return aOrder - bOrder;
  });

  const migratedSettings: SubscriptionSettings = {
    plans,
    defaultPlanId: `plan-${legacySettings.defaultPlan}`,
    trialPeriod: 0,
    gracePeriod: (legacySettings.expirySettings?.gracePeriodDays || 3),
    lastUpdated: legacySettings.lastUpdated,
    updatedBy: legacySettings.updatedBy,
    version: 2 // Mark as migrated
  };

  console.log('✅ Migration completed:', migratedSettings);
  return migratedSettings;
};

// Check if settings are in legacy format
const isLegacyFormat = (settings: any): settings is LegacySubscriptionSettings => {
  return settings && 
         settings.plans && 
         typeof settings.plans === 'object' && 
         !Array.isArray(settings.plans) &&
         settings.defaultPlan &&
         typeof settings.defaultPlan === 'string';
};

// 🔧 FIXED: More forgiving validation function
const isValidModernSettings = (settings: any): settings is SubscriptionSettings => {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // Check for required fields with more lenient validation
  const hasPlans = settings.plans && Array.isArray(settings.plans);
  const hasDefaultPlanId = typeof settings.defaultPlanId === 'string' || 
                          settings.plans?.length > 0; // If we have plans, we can fix the defaultPlanId

  return hasPlans && hasDefaultPlanId;
};

// 🔧 FIXED: Enhanced repair function for partially corrupted settings
const repairSubscriptionSettings = (settings: any): SubscriptionSettings => {
  console.log('🔧 Attempting to repair subscription settings...');
  
  try {
    // Start with default settings as base
    const repairedSettings: SubscriptionSettings = { ...defaultSubscriptionSettings };
    
    // Try to preserve valid plans if they exist
    if (settings.plans && Array.isArray(settings.plans) && settings.plans.length > 0) {
      const validPlans = settings.plans.filter((plan: any) => isValidPlan(plan));
      if (validPlans.length > 0) {
        repairedSettings.plans = validPlans;
        console.log(`✅ Preserved ${validPlans.length} valid plans`);
      }
    }
    
    // Try to preserve other valid settings
    if (typeof settings.defaultPlanId === 'string' && 
        repairedSettings.plans.some(p => p.id === settings.defaultPlanId)) {
      repairedSettings.defaultPlanId = settings.defaultPlanId;
    } else if (repairedSettings.plans.length > 0) {
      // Set first plan as default if current default is invalid
      repairedSettings.defaultPlanId = repairedSettings.plans[0].id;
      // Mark first plan as default
      repairedSettings.plans[0].isDefault = true;
    }
    
    if (typeof settings.trialPeriod === 'number') {
      repairedSettings.trialPeriod = settings.trialPeriod;
    }
    
    if (typeof settings.gracePeriod === 'number') {
      repairedSettings.gracePeriod = settings.gracePeriod;
    }
    
    if (typeof settings.lastUpdated === 'string') {
      repairedSettings.lastUpdated = settings.lastUpdated;
    }
    
    if (typeof settings.updatedBy === 'string') {
      repairedSettings.updatedBy = settings.updatedBy;
    }
    
    // Update metadata
    repairedSettings.lastUpdated = new Date().toISOString();
    repairedSettings.updatedBy = 'System (Auto-repair)';
    repairedSettings.version = (settings.version || 0) + 1;
    
    console.log('✅ Subscription settings repaired successfully');
    return repairedSettings;
    
  } catch (error) {
    console.error('❌ Failed to repair subscription settings:', error);
    return defaultSubscriptionSettings;
  }
};

// Initialize subscription settings in localStorage
export const initializeSubscriptionSettings = (): SubscriptionSettings => {
  try {
    const existing = localStorage.getItem('pulseprep_subscription_settings');
    
    if (existing) {
      let parsed;
      try {
        parsed = JSON.parse(existing);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse subscription settings, using defaults');
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
        return defaultSubscriptionSettings;
      }
      
      // Check if it's legacy format and migrate
      if (isLegacyFormat(parsed)) {
        console.log('🔄 Detected legacy subscription format, migrating...');
        const migrated = migrateLegacySettings(parsed);
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(migrated));
        return migrated;
      }
      
      // Validate modern format with enhanced checking
      if (!isValidModernSettings(parsed)) {
        console.log('🔧 Invalid subscription settings detected, attempting repair...');
        const repaired = repairSubscriptionSettings(parsed);
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(repaired));
        return repaired;
      }
      
      // Additional validation: ensure plans array has valid content
      if (!parsed.plans || !Array.isArray(parsed.plans) || parsed.plans.length === 0) {
        console.log('🔧 Empty or invalid plans array detected, using defaults');
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
        return defaultSubscriptionSettings;
      }
      
      // Validate each plan and repair if needed
      const validPlans = parsed.plans.filter((plan: any) => isValidPlan(plan));
      if (validPlans.length !== parsed.plans.length) {
        console.log(`🔧 Found ${parsed.plans.length - validPlans.length} invalid plans, cleaning up...`);
        parsed.plans = validPlans;
        
        if (validPlans.length === 0) {
          // No valid plans, use defaults
          console.log('🔧 No valid plans remaining, using defaults');
          localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
          return defaultSubscriptionSettings;
        }
        
        // Ensure default plan is still valid
        if (!validPlans.find((p: SubscriptionPlan) => p.id === parsed.defaultPlanId)) {
          console.log('🔧 Default plan invalid, updating to first valid plan');
          parsed.defaultPlanId = validPlans[0].id;
          validPlans[0].isDefault = true;
        }
        
        parsed.lastUpdated = new Date().toISOString();
        parsed.updatedBy = 'System (Cleanup)';
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(parsed));
      }
      
      // Ensure version is set
      if (typeof parsed.version !== 'number') {
        parsed.version = 2;
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(parsed));
      }
      
      console.log('✅ Subscription settings validated and loaded successfully');
      return parsed;
    }
    
    // No existing settings, use defaults
    localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
    console.log('💰 Subscription settings initialized with defaults');
    return defaultSubscriptionSettings;
    
  } catch (error) {
    console.error('❌ Error initializing subscription settings:', error);
    localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
    return defaultSubscriptionSettings;
  }
};

// Get current subscription settings with defensive checks
export const getSubscriptionSettings = (): SubscriptionSettings => {
  try {
    const settings = localStorage.getItem('pulseprep_subscription_settings');
    if (settings) {
      let parsed;
      try {
        parsed = JSON.parse(settings);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse subscription settings in getter, reinitializing...');
        return initializeSubscriptionSettings();
      }
      
      // 🔧 FIXED: More forgiving validation
      if (!isValidModernSettings(parsed)) {
        console.log('🔧 Invalid subscription settings detected in getter, attempting repair...');
        const repaired = repairSubscriptionSettings(parsed);
        localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(repaired));
        return repaired;
      }
      
      // Quick validation of critical fields
      if (!parsed.plans || !Array.isArray(parsed.plans) || parsed.plans.length === 0) {
        console.log('🔧 Critical validation failed in getter, reinitializing...');
        return initializeSubscriptionSettings();
      }
      
      return parsed;
    }
    
    return initializeSubscriptionSettings();
  } catch (error) {
    console.error('❌ Error getting subscription settings:', error);
    return initializeSubscriptionSettings();
  }
};

// Update subscription settings (used by admin)
export const updateSubscriptionSettings = (settings: SubscriptionSettings, updatedBy: string): boolean => {
  try {
    // Validate settings before saving
    if (!isValidModernSettings(settings)) {
      console.error('❌ Cannot update subscription settings: invalid structure');
      return false;
    }
    
    if (!settings.plans || !Array.isArray(settings.plans) || settings.plans.length === 0) {
      console.error('❌ Cannot update subscription settings: invalid plans array');
      return false;
    }
    
    const updated = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy,
      version: (settings.version || 0) + 1
    };
    
    localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pulseprep_subscription_settings',
      newValue: JSON.stringify(updated),
      storageArea: localStorage
    }));
    console.log('✅ Subscription settings updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating subscription settings:', error);
    return false;
  }
};

// Check if user's subscription is currently active
export const isSubscriptionActive = (user: UserData): boolean => {
  try {
    if (!user || !user.subscriptionExpiryDate) return false;
    
    const endDate = new Date(user.subscriptionExpiryDate);
    const now = new Date();
    
    return now <= endDate;
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return false;
  }
};

// Calculate how many days until subscription expires
export const getDaysUntilExpiry = (user: UserData): number => {
  try {
    if (!user || !user.subscriptionExpiryDate) return 0;
    
    const endDate = new Date(user.subscriptionExpiryDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.error('❌ Error calculating days until expiry:', error);
    return 0;
  }
};

// Add subscription to user when payment is approved
export const addSubscriptionToUser = (user: UserData, planId?: string): UserData => {
  try {
    const settings = getSubscriptionSettings();
    
    // Use safe plan retrieval
    const plan = planId ? 
      settings.plans.find(p => p.id === planId) || settings.plans[0] || FALLBACK_PLAN :
      settings.plans.find(p => p.isDefault) || settings.plans[0] || FALLBACK_PLAN;
    
    const startDate = new Date();
    const endDate = new Date();
    
    // Add duration based on plan type
    if (plan.durationType === 'days') {
      endDate.setDate(endDate.getDate() + plan.duration);
    } else if (plan.durationType === 'years') {
      endDate.setFullYear(endDate.getFullYear() + plan.duration);
    } else { // months (default)
      endDate.setMonth(endDate.getMonth() + plan.duration);
    }
    
    return {
      ...user,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionExpiryDate: endDate.toISOString(),
      subscriptionPlanAtPayment: plan,
      paymentStatus: 'completed'
    };
  } catch (error) {
    console.error('❌ Error adding subscription to user:', error);
    // Return user with basic subscription using fallback plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + FALLBACK_PLAN.duration);
    
    return {
      ...user,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionExpiryDate: endDate.toISOString(),
      subscriptionPlanAtPayment: FALLBACK_PLAN,
      paymentStatus: 'completed'
    };
  }
};

// Get the default subscription plan - FIXED with proper error handling
export const getDefaultSubscriptionPlan = (): SubscriptionPlan => {
  try {
    console.log('🔍 Getting default subscription plan...');
    
    const settings = getSubscriptionSettings();
    
    // Defensive check: ensure settings and plans exist
    if (!settings) {
      console.error('❌ No subscription settings found, using fallback plan');
      return FALLBACK_PLAN;
    }
    
    if (!settings.plans || !Array.isArray(settings.plans)) {
      console.error('❌ No plans array found in subscription settings, using fallback plan');
      return FALLBACK_PLAN;
    }
    
    if (settings.plans.length === 0) {
      console.error('❌ Empty plans array found, using fallback plan');
      return FALLBACK_PLAN;
    }
    
    // Try to find default plan by defaultPlanId
    const defaultPlan = settings.plans.find(p => p && p.id === settings.defaultPlanId);
    if (defaultPlan) {
      console.log('✅ Found default subscription plan:', defaultPlan.name);
      return defaultPlan;
    }
    
    // Try to find plan marked as default
    const markedDefaultPlan = settings.plans.find(p => p && p.isDefault);
    if (markedDefaultPlan) {
      console.log('✅ Found marked default subscription plan:', markedDefaultPlan.name);
      return markedDefaultPlan;
    }
    
    // If no default plan, use first plan
    const firstPlan = settings.plans[0];
    if (firstPlan) {
      console.log('✅ Using first subscription plan as default:', firstPlan.name);
      return firstPlan;
    }
    
    // If all else fails, use fallback
    console.error('❌ No valid plans found, using fallback plan');
    return FALLBACK_PLAN;
    
  } catch (error) {
    console.error('❌ Error getting default subscription plan:', error);
    return FALLBACK_PLAN;
  }
};

// Check if user needs subscription warning
export const shouldShowExpiryWarning = (user: UserData): boolean => {
  try {
    if (!isSubscriptionActive(user)) return false;
    
    const daysLeft = getDaysUntilExpiry(user);
    const settings = getSubscriptionSettings();
    
    // Use grace period as warning threshold if no specific warning days configured
    const warningThreshold = settings.gracePeriod || 7;
    return daysLeft <= warningThreshold;
  } catch (error) {
    console.error('❌ Error checking expiry warning:', error);
    return false;
  }
};

// Check if user is in grace period
export const isInGracePeriod = (user: UserData): boolean => {
  try {
    if (!user || !user.subscriptionExpiryDate) return false;
    if (isSubscriptionActive(user)) return false;
    
    const endDate = new Date(user.subscriptionExpiryDate);
    const now = new Date();
    const daysSinceExpiry = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const settings = getSubscriptionSettings();
    return daysSinceExpiry <= (settings.gracePeriod || 0);
  } catch (error) {
    console.error('❌ Error checking grace period:', error);
    return false;
  }
};

// Additional utility function to safely get all subscription plans
export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  try {
    const settings = getSubscriptionSettings();
    return settings.plans || [FALLBACK_PLAN];
  } catch (error) {
    console.error('❌ Error getting subscription plans:', error);
    return [FALLBACK_PLAN];
  }
};

// 🔧 FIXED: More comprehensive plan validation
export const isValidPlan = (plan: any): plan is SubscriptionPlan => {
  if (!plan || typeof plan !== 'object') return false;
  
  // Required fields with type checking
  const hasId = typeof plan.id === 'string' && plan.id.length > 0;
  const hasName = typeof plan.name === 'string' && plan.name.length > 0;
  const hasDescription = typeof plan.description === 'string';
  const hasPrice = typeof plan.price === 'number' && plan.price >= 0;
  const hasCurrency = typeof plan.currency === 'string' && plan.currency.length > 0;
  const hasDuration = typeof plan.duration === 'number' && plan.duration > 0;
  const hasDurationType = typeof plan.durationType === 'string' && 
                         ['days', 'months', 'years'].includes(plan.durationType);
  const hasFeatures = Array.isArray(plan.features);
  const hasIsActive = typeof plan.isActive === 'boolean';
  const hasIsDefault = typeof plan.isDefault === 'boolean';
  
  // Optional fields validation
  const hasValidCreatedAt = !plan.createdAt || typeof plan.createdAt === 'string';
  const hasValidUpdatedAt = !plan.updatedAt || typeof plan.updatedAt === 'string';
  
  return hasId && hasName && hasDescription && hasPrice && hasCurrency && 
         hasDuration && hasDurationType && hasFeatures && hasIsActive && 
         hasIsDefault && hasValidCreatedAt && hasValidUpdatedAt;
};

// Force refresh subscription settings (clears cache and reinitializes)
export const forceRefreshSubscriptionSettings = (): SubscriptionSettings => {
  try {
    console.log('🔄 Force refreshing subscription settings...');
    localStorage.removeItem('pulseprep_subscription_settings');
    return initializeSubscriptionSettings();
  } catch (error) {
    console.error('❌ Error force refreshing subscription settings:', error);
    return defaultSubscriptionSettings;
  }
};

// 🆕 Utility function to clean and repair subscription storage
export const cleanupSubscriptionStorage = (): boolean => {
  try {
    console.log('🧹 Cleaning up subscription storage...');
    
    const settings = getSubscriptionSettings();
    
    // Force a cleanup and re-save
    const cleaned = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System (Cleanup)',
      version: (settings.version || 0) + 1
    };
    
    localStorage.setItem('pulseprep_subscription_settings', JSON.stringify(cleaned));
    console.log('✅ Subscription storage cleaned up successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error cleaning up subscription storage:', error);
    return false;
  }
};