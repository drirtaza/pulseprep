import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors } from './lib/shared';

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return bad(res, 405, 'Method not allowed');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const supabase = getSupabaseAdmin();
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const paymentStatus = typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim() : '';

  let pendingQ = supabase.from('pending_users').select('*').order('registration_date', { ascending: false }).limit(500);
  let usersQ = supabase.from('users').select('*').order('registration_date', { ascending: false }).limit(500);

  if (search) {
    pendingQ = pendingQ.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    usersQ = usersQ.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (status) {
    pendingQ = pendingQ.eq('status', status);
    usersQ = usersQ.eq('status', status);
  }
  if (paymentStatus) {
    pendingQ = pendingQ.eq('payment_status', paymentStatus);
    usersQ = usersQ.eq('payment_status', paymentStatus);
  }

  const [pendingRes, usersRes] = await Promise.all([pendingQ, usersQ]);
  if (pendingRes.error) return bad(res, 500, `Failed to fetch pending users: ${pendingRes.error.message}`);
  if (usersRes.error) return bad(res, 500, `Failed to fetch users: ${usersRes.error.message}`);

  const byEmail = new Map<string, Record<string, unknown>>();
  for (const row of pendingRes.data ?? []) {
    byEmail.set(String(row.email).toLowerCase(), { ...row, source_table: 'pending_users' });
  }
  for (const row of usersRes.data ?? []) {
    byEmail.set(String(row.email).toLowerCase(), { ...row, source_table: 'users' });
  }

  const items = Array.from(byEmail.values()).sort((a, b) => {
    const aDate = String(a.registration_date || a.created_at || '');
    const bDate = String(b.registration_date || b.created_at || '');
    return aDate < bDate ? 1 : -1;
  });

  return res.status(200).json({ ok: true, items, count: items.length });
}
