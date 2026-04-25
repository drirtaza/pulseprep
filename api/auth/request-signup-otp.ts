import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  generateNumericOtp,
  hashOtp,
  sendSignupOtpEmail,
  handleCors
} from '../lib/shared';

const EXPIRE_MIN = 15;
const RESEND_COOLDOWN_SEC = 60;
const MAX_RESEND = 3;

type Body = { email: string; name?: string; resend?: boolean };

function bad(res: VercelResponse, code: number, message: string, extra?: object) {
  return res.status(code).json({ ok: false, error: message, ...extra });
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
  const name = typeof body.name === 'string' ? body.name.trim() : 'User';
  const isResend = body.resend === true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const { data: row, error: selectErr } = await supabase
    .from('signup_email_otp')
    .select('email, resend_count, last_sent_at, consumed_at')
    .eq('email', email)
    .maybeSingle();

  if (selectErr) {
    console.error('supabase select', selectErr);
    return bad(res, 500, 'Failed to read verification state');
  }

  if (row?.consumed_at) {
    return bad(res, 400, 'This email is already verified. Continue to sign in or use a new email.');
  }

  if (isResend) {
    if (!row) {
      return bad(res, 400, 'No active verification. Request a new code from the sign-up form.');
    }
    if (row.resend_count >= MAX_RESEND) {
      return bad(res, 429, 'Maximum resend limit reached. Please start sign-up again or contact support.');
    }
    if (row.last_sent_at) {
      const last = new Date(row.last_sent_at).getTime();
      if (now.getTime() - last < RESEND_COOLDOWN_SEC * 1000) {
        const wait = Math.ceil(RESEND_COOLDOWN_SEC - (now.getTime() - last) / 1000);
        return bad(res, 429, `Please wait ${wait} seconds before resending.`, { retryAfterSec: wait });
      }
    }
  }

  const code = generateNumericOtp();
  const codeHash = hashOtp(email, code);
  const expires = new Date(now.getTime() + EXPIRE_MIN * 60 * 1000);
  const resendCount = isResend ? (row?.resend_count ?? 0) + 1 : 0;

  const { error: upsertErr } = await supabase.from('signup_email_otp').upsert(
    {
      email,
      code_hash: codeHash,
      expires_at: expires.toISOString(),
      attempt_count: 0,
      resend_count: isResend ? resendCount : 0,
      last_sent_at: now.toISOString(),
      consumed_at: null,
      updated_at: now.toISOString()
    },
    { onConflict: 'email' }
  );

  if (upsertErr) {
    console.error('supabase upsert', upsertErr);
    return bad(res, 500, 'Failed to save verification code');
  }

  try {
    await sendSignupOtpEmail(email, name, code, EXPIRE_MIN);
  } catch (e) {
    console.error('resend', e);
    return bad(res, 502, e instanceof Error ? e.message : 'Failed to send email');
  }

  return res.status(200).json({
    ok: true,
    message: 'Verification code sent',
    expiresInSeconds: EXPIRE_MIN * 60,
    resendCount: isResend ? resendCount : 0,
    maxResends: MAX_RESEND
  });
}
