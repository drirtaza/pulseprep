import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, normalizeEmail } from './lib/shared';

export function supabaseAdmin(): SupabaseClient {
  return getSupabaseAdmin();
}

export function normalizeUserEmail(email: string): string {
  return normalizeEmail(email);
}
