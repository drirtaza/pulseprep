import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateNumericOtp,
  getSupabaseAdmin,
  handleCors,
  hashOtp,
  normalizeEmail,
  parseJsonBody,
  sendSignupOtpEmail
} from './lib/shared';

const EXPIRE_MIN = 15;
const RESEND_COOLDOWN_SEC = 60;
const MAX_RESEND = 3;

type Body = { email: string; name?: string };

function bad(res: VercelResponse, code: number, message: string, extra?: Record<string, unknown>) {
  return res.status(code).json({ ok: false, error: message, ...(extra || {}) });
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
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'User';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');

  const now = new Date();
  const supabase = getSupabaseAdmin();
  const { data: row, error: selectErr } = await supabase
    .from('signup_email_otp')
    .select('email, resend_count, last_sent_at, consumed_at')
    .eq('email', email)
    .maybeSingle();

  if (selectErr) return bad(res, 500, `Failed to read verification state: ${selectErr.message}`);
  if (!row) return bad(res, 400, 'No active verification. Request an OTP first.');
  if (row.consumed_at) return bad(res, 400, 'This email is already verified.');
  if (row.resend_count >= MAX_RESEND) return bad(res, 429, 'Maximum resend limit reached.');

  if (row.last_sent_at) {
    const last = new Date(row.last_sent_at).getTime();
    if (now.getTime() - last < RESEND_COOLDOWN_SEC * 1000) {
      const wait = Math.ceil(RESEND_COOLDOWN_SEC - (now.getTime() - last) / 1000);
      return bad(res, 429, `Please wait ${wait} seconds before resending.`, { retryAfterSec: wait });
    }
  }

  const code = generateNumericOtp();
  const codeHash = hashOtp(email, code);
  const expires = new Date(now.getTime() + EXPIRE_MIN * 60 * 1000);
  const nextResendCount = (row.resend_count ?? 0) + 1;

  const { error: upsertErr } = await supabase.from('signup_email_otp').upsert(
    {
      email,
      code_hash: codeHash,
      expires_at: expires.toISOString(),
      attempt_count: 0,
      resend_count: nextResendCount,
      last_sent_at: now.toISOString(),
      consumed_at: null,
      updated_at: now.toISOString()
    },
    { onConflict: 'email' }
  );
  if (upsertErr) return bad(res, 500, `Failed to save OTP: ${upsertErr.message}`);

  try {
    await sendSignupOtpEmail(email, name, code, EXPIRE_MIN);
  } catch (e) {
    return bad(res, 502, e instanceof Error ? e.message : 'Failed to send email');
  }

  return res.status(200).json({
    ok: true,
    message: 'Verification code resent',
    expiresInSeconds: EXPIRE_MIN * 60,
    resendCount: nextResendCount,
    maxResends: MAX_RESEND
  });
}
