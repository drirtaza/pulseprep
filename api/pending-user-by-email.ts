import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from './lib/shared';

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'POST') return bad(res, 405, 'Method not allowed');

  let emailRaw = '';
  if (req.method === 'GET') {
    emailRaw = typeof req.query.email === 'string' ? req.query.email : '';
  } else {
    try {
      const body = parseJsonBody<{ email?: string }>(req.body);
      emailRaw = typeof body.email === 'string' ? body.email : '';
    } catch {
      return bad(res, 400, 'Invalid JSON payload');
    }
  }

  const email = normalizeEmail(emailRaw || '');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pending_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) return bad(res, 500, `Failed to fetch pending user: ${error.message}`);
  if (!data) return bad(res, 404, 'Pending user not found');

  return res.status(200).json({ ok: true, pendingUser: data });
}
