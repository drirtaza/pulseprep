import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from '../lib/shared';

type Body = { email: string; password: string; fullName?: string };

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');

  let body: Body;
  try {
    body = parseJsonBody<Body>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }
  if (!password || password.length < 8) {
    return bad(res, 400, 'Password must be at least 8 characters');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName, name: fullName } : {}
  });

  if (error) {
    const msg = error.message || 'Failed to create auth user';
    if (msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('exists')) {
      return res.status(200).json({ ok: true, alreadyExists: true, message: msg });
    }
    return bad(res, 400, msg);
  }

  return res.status(200).json({
    ok: true,
    userId: data.user?.id,
    message: 'Auth user created'
  });
}
