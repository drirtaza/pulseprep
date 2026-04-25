import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, normalizeEmail, parseJsonBody } from './lib/shared';
import { supabaseAdmin } from './_supabaseAdmin';

type Body = { email: string; verified?: boolean };

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
    return bad(res, 400, 'Invalid JSON payload');
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const verified = body.verified !== false;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');

  const patch = { email_verified: verified, updated_at: new Date().toISOString() };
  const supabase = supabaseAdmin();

  const [pendingResult, usersResult] = await Promise.all([
    supabase.from('pending_users').update(patch).eq('email', email).select('id').maybeSingle(),
    supabase.from('users').update(patch).eq('email', email).select('id').maybeSingle()
  ]);

  if (pendingResult.error) return bad(res, 500, `Failed pending_users update: ${pendingResult.error.message}`);
  if (usersResult.error) return bad(res, 500, `Failed users update: ${usersResult.error.message}`);

  const pendingHit = Boolean(pendingResult.data?.id);
  const usersHit = Boolean(usersResult.data?.id);
  if (!pendingHit && !usersHit) return bad(res, 404, 'No matching email in pending_users or users');

  return res.status(200).json({
    ok: true,
    message: verified ? 'Email marked verified' : 'Email verification reset',
    updated: { pendingUsers: pendingHit, users: usersHit }
  });
}
