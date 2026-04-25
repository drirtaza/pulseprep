import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './lib/shared';
import { supabaseAdmin } from './_supabaseAdmin';

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return bad(res, 405, 'Method not allowed');

  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const paymentStatus = typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim() : '';

  const supabase = supabaseAdmin();
  let query = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (paymentStatus) query = query.eq('payment_status', paymentStatus);
  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return bad(res, 500, `Failed to fetch users list: ${error.message}`);

  return res.status(200).json({
    ok: true,
    items: data ?? [],
    pagination: { page, pageSize, total: count ?? 0 }
  });
}
