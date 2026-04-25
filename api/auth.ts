import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';
import {
  assertEqualHash,
  generateNumericOtp,
  getSiteUrl,
  getSupabaseAdmin,
  getSupabaseAnonUserClient,
  handleCors,
  hashOtp,
  normalizeEmail,
  parseJsonBody,
  sendSignupOtpEmail,
  sendTransactionalEmail,
  signEmailVerifiedToken
} from './lib/shared';
import { mapDatabaseUserToClient } from './lib/mapUserRow';

type LoginBody = { email: string; password: string };
type RegisterBody = { email: string; password: string; fullName?: string };
type ResetBody = { email: string };
type RequestOtpBody = { email: string; name?: string; resend?: boolean };
type VerifyOtpBody = { email: string; code: string };

const OTP_EXPIRE_MIN = 15;
const RESEND_COOLDOWN_SEC = 60;
const MAX_RESEND = 3;
const MAX_VERIFY_ATTEMPTS = 5;

function bad(res: VercelResponse, code: number, error: string, extra?: Record<string, unknown>) {
  return res.status(code).json({ ok: false, error, ...(extra || {}) });
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function looksLikeAlreadyExists(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('registered') || m.includes('already exists') || m.includes('already been registered');
}

function getAction(req: VercelRequest): string {
  const q = req.query.action;
  if (typeof q === 'string') return q.trim().toLowerCase();
  if (Array.isArray(q) && typeof q[0] === 'string') return q[0].trim().toLowerCase();
  return '';
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  let body: LoginBody;
  try {
    body = parseJsonBody<LoginBody>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return bad(res, 400, 'Email and password are required');

  const supabaseAuth = getSupabaseAnonUserClient();
  const { data: signData, error: signErr } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (signErr || !signData.session) return bad(res, 401, 'Invalid email or password');

  const suid = signData.user?.id;
  const admin = getSupabaseAdmin();
  const { data: urow, error: uErr } = await admin.from('users').select('*').eq('email', email).maybeSingle();
  if (uErr) return bad(res, 500, 'Could not load profile');

  let prow: typeof urow = null;
  if (!urow) {
    const p = await admin.from('pending_users').select('*').eq('email', email).maybeSingle();
    if (p.error) return bad(res, 500, 'Could not load profile');
    prow = p.data;
  }

  if (!urow && !prow) {
    return res.status(200).json({
      ok: true,
      session: {
        access_token: signData.session.access_token,
        refresh_token: signData.session.refresh_token,
        expires_in: signData.session.expires_in
      },
      user: {
        id: suid,
        name: signData.user?.user_metadata?.full_name || '',
        fullName: signData.user?.user_metadata?.full_name || '',
        email: signData.user?.email || email,
        specialty: 'medicine',
        studyMode: 'regular',
        registrationDate: new Date().toISOString(),
        paymentStatus: 'pending' as const,
        emailVerified: true,
        emailVerificationAttempts: 0,
        emailVerificationStatus: 'verified' as const
      }
    });
  }

  const row = (urow || prow) as Record<string, unknown>;
  const user = mapDatabaseUserToClient(row, suid);
  return res.status(200).json({
    ok: true,
    session: {
      access_token: signData.session.access_token,
      refresh_token: signData.session.refresh_token,
      expires_in: signData.session.expires_in
    },
    user
  });
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  let body: RegisterBody;
  try {
    body = parseJsonBody<RegisterBody>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');
  if (!password || password.length < 8) return bad(res, 400, 'Password must be at least 8 characters');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName, name: fullName } : {}
  });
  if (error) {
    const msg = error.message || 'Failed to create auth user';
    if (looksLikeAlreadyExists(msg)) return res.status(200).json({ ok: true, alreadyExists: true, message: msg });
    return bad(res, 400, msg);
  }
  return res.status(200).json({ ok: true, userId: data.user?.id, message: 'Auth user created' });
}

async function handlePasswordReset(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  let body: ResetBody;
  try {
    body = parseJsonBody<ResetBody>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');

  const supabase = getSupabaseAdmin();
  const redirectTo = `${getSiteUrl()}/`;
  let { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo }
  });

  if (error) {
    const tempPassword = `${randomBytes(18).toString('hex')}A!9`;
    const created = await supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
    if (created.error && !looksLikeAlreadyExists(created.error.message || '')) {
      return res.status(200).json({ ok: true, message: 'If an account exists for this address, a reset link was sent.' });
    }
    const retry = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo }
    });
    data = retry.data;
    error = retry.error;
    if (error) return res.status(200).json({ ok: true, message: 'If an account exists for this address, a reset link was sent.' });
  }

  const actionLink = (data as { properties?: { action_link?: string } })?.properties?.action_link || '';
  if (!actionLink) return res.status(200).json({ ok: true, message: 'If an account exists for this address, a reset link was sent.' });

  const appName = process.env.EMAIL_APP_NAME || 'PulsePrep';
  try {
    await sendTransactionalEmail({
      to: email,
      subject: `${appName}: password reset`,
      htmlContent: `
        <p>Hi,</p>
        <p>We received a request to reset your ${esc(appName)} password.</p>
        <p><a href="${esc(actionLink)}">Set a new password</a></p>
        <p>If you did not request this, you can ignore this message.</p>
      `,
      textContent: `We received a request to reset your ${appName} password. Open: ${actionLink}\n\nIf you did not request this, you can ignore this message.`
    });
  } catch {
    return bad(res, 502, 'Could not send reset email. Try again later.');
  }
  return res.status(200).json({ ok: true, message: 'If an account exists, check your email for a reset link.' });
}

async function handleRequestSignupOtp(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  let body: RequestOtpBody;
  try {
    body = parseJsonBody<RequestOtpBody>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const name = typeof body.name === 'string' ? body.name.trim() : 'User';
  const isResend = body.resend === true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const { data: row, error: selectErr } = await supabase
    .from('signup_email_otp')
    .select('email, resend_count, last_sent_at, consumed_at')
    .eq('email', email)
    .maybeSingle();
  if (selectErr) return bad(res, 500, 'Failed to read verification state');
  if (row?.consumed_at) return bad(res, 400, 'This email is already verified. Continue to sign in or use a new email.');

  if (isResend) {
    if (!row) return bad(res, 400, 'No active verification. Request a new code from the sign-up form.');
    if (row.resend_count >= MAX_RESEND) return bad(res, 429, 'Maximum resend limit reached. Please start sign-up again or contact support.');
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
  const expires = new Date(now.getTime() + OTP_EXPIRE_MIN * 60 * 1000);
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
  if (upsertErr) return bad(res, 500, 'Failed to save verification code');
  try {
    await sendSignupOtpEmail(email, name, code, OTP_EXPIRE_MIN);
  } catch (e) {
    return bad(res, 502, e instanceof Error ? e.message : 'Failed to send email');
  }
  return res.status(200).json({
    ok: true,
    message: 'Verification code sent',
    expiresInSeconds: OTP_EXPIRE_MIN * 60,
    resendCount: isResend ? resendCount : 0,
    maxResends: MAX_RESEND
  });
}

async function handleVerifySignupOtp(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  let body: VerifyOtpBody;
  try {
    body = parseJsonBody<VerifyOtpBody>(req.body);
  } catch {
    return bad(res, 400, 'Invalid JSON');
  }
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');
  if (code.length !== 6) return bad(res, 400, 'Enter the 6-digit code');

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchErr } = await supabase
    .from('signup_email_otp')
    .select('email, code_hash, expires_at, attempt_count, consumed_at')
    .eq('email', email)
    .maybeSingle();
  if (fetchErr) return bad(res, 500, 'Verification failed');
  if (!row || row.consumed_at) return bad(res, 400, 'No active verification for this email. Request a new code.');
  if (new Date() > new Date(row.expires_at)) return bad(res, 400, 'This code has expired. Request a new one.');
  if (row.attempt_count >= MAX_VERIFY_ATTEMPTS) return bad(res, 429, 'Too many attempts. Request a new code.');

  const expectHash = hashOtp(email, code);
  const match = assertEqualHash(expectHash, row.code_hash);
  if (!match) {
    const next = row.attempt_count + 1;
    await supabase.from('signup_email_otp').update({ attempt_count: next, updated_at: new Date().toISOString() }).eq('email', email);
    return bad(res, 400, next >= MAX_VERIFY_ATTEMPTS ? 'Too many wrong attempts. Request a new code.' : 'Invalid code. Please try again.');
  }

  const { error: consumeErr } = await supabase
    .from('signup_email_otp')
    .update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('email', email);
  if (consumeErr) return bad(res, 500, 'Could not complete verification');

  const verificationJwt = await signEmailVerifiedToken(email);
  return res.status(200).json({ ok: true, email, verificationToken: verificationJwt });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const action = getAction(req);
  if (!action) return bad(res, 400, 'Missing action query parameter');

  if (action === 'login') return handleLogin(req, res);
  if (action === 'register') return handleRegister(req, res);
  if (action === 'password-reset') return handlePasswordReset(req, res);
  if (action === 'request-signup-otp') return handleRequestSignupOtp(req, res);
  if (action === 'verify-signup-otp') return handleVerifySignupOtp(req, res);
  return bad(res, 404, 'Unknown auth action');
}
