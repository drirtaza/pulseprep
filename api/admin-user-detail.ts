import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, normalizeEmail } from './lib/shared';
import { supabaseAdmin } from './_supabaseAdmin';

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return bad(res, 405, 'Method not allowed');

  const emailQuery = typeof req.query.email === 'string' ? normalizeEmail(req.query.email) : '';
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!emailQuery && !userId) return bad(res, 400, 'Provide email or userId');

  const supabase = supabaseAdmin();
  const usersQuery = supabase.from('users').select('*');
  const pendingQuery = supabase.from('pending_users').select('*');

  const usersReq = emailQuery ? usersQuery.eq('email', emailQuery).maybeSingle() : usersQuery.eq('id', userId).maybeSingle();
  const pendingReq = emailQuery
    ? pendingQuery.eq('email', emailQuery).maybeSingle()
    : pendingQuery.eq('id', userId).maybeSingle();

  const [userRes, pendingRes, approvedPaymentsRes, attemptsRes] = await Promise.all([
    usersReq,
    pendingReq,
    emailQuery
      ? supabase.from('approved_payments').select('*').order('created_at', { ascending: false }).limit(20)
      : supabase.from('approved_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    emailQuery
      ? supabase.from('payment_attempts').select('*').eq('email', emailQuery).order('created_at', { ascending: false }).limit(20)
      : supabase.from('payment_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  ]);

  if (userRes.error) return bad(res, 500, `Failed to fetch users detail: ${userRes.error.message}`);
  if (pendingRes.error) return bad(res, 500, `Failed to fetch pending detail: ${pendingRes.error.message}`);
  if (approvedPaymentsRes.error) return bad(res, 500, `Failed to fetch approved payments: ${approvedPaymentsRes.error.message}`);
  if (attemptsRes.error) return bad(res, 500, `Failed to fetch payment attempts: ${attemptsRes.error.message}`);

  if (!userRes.data && !pendingRes.data) return bad(res, 404, 'User not found in users or pending_users');

  return res.status(200).json({
    ok: true,
    user: userRes.data ?? null,
    pendingUser: pendingRes.data ?? null,
    approvedPayments: approvedPaymentsRes.data ?? [],
    paymentAttempts: attemptsRes.data ?? []
  });
}
