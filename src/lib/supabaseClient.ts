import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let browser: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key). Used to persist user sessions from /api/auth?action=login
 * and to update password after recovery links.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!url || !anon) {
    if (import.meta.env.DEV) {
      console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set; Supabase auth disabled');
    }
    return null;
  }
  if (!browser) {
    browser = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        storageKey: 'pp_sb_auth'
      }
    });
  }
  return browser;
}

export const SUPABASE_RECOVERY_FLAG = 'pulseprep_supabase_recovery';
