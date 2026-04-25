import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  assertEqualHash,
  hashOtp,
  signEmailVerifiedToken,
  handleCors
} from '../lib/shared';

const MAX_ATTEMPTS = 5;

type Body = { email: string; code: string };

function bad(res: VercelResponse, code: number, message: string) {
  return res.status(code).json({ ok: false, error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body: Body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }
  if (code.length !== 6) {
    return bad(res, 400, 'Enter the 6-digit code');
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchErr } = await supabase
    .from('signup_email_otp')
    .select('email, code_hash, expires_at, attempt_count, consumed_at')
    .eq('email', email)
    .maybeSingle();

  if (fetchErr) {
    console.error('supabase select', fetchErr);
    return bad(res, 500, 'Verification failed');
  }
  if (!row || row.consumed_at) {
    return bad(res, 400, 'No active verification for this email. Request a new code.');
  }
  if (new Date() > new Date(row.expires_at)) {
    return bad(res, 400, 'This code has expired. Request a new one.');
  }
  if (row.attempt_count >= MAX_ATTEMPTS) {
    return bad(res, 429, 'Too many attempts. Request a new code.');
  }

  const expectHash = hashOtp(email, code);
  const match = assertEqualHash(expectHash, row.code_hash);
  if (!match) {
    const next = row.attempt_count + 1;
    await supabase
      .from('signup_email_otp')
      .update({ attempt_count: next, updated_at: new Date().toISOString() })
      .eq('email', email);
    return bad(
      res,
      400,
      next >= MAX_ATTEMPTS
        ? 'Too many wrong attempts. Request a new code.'
        : 'Invalid code. Please try again.'
    );
  }

  const { error: consumeErr } = await supabase
    .from('signup_email_otp')
    .update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('email', email);

  if (consumeErr) {
    console.error('consume', consumeErr);
    return bad(res, 500, 'Could not complete verification');
  }

  const verificationJwt = await signEmailVerifiedToken(email);
  return res.status(200).json({
    ok: true,
    email,
    verificationToken: verificationJwt
  });
}
