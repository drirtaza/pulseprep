import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { SignJWT } from 'jose';

// --- env ---
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
function getSupabaseUrl() {
  return requireEnv('SUPABASE_URL');
}
function getSupabaseServiceKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}
function getOtpPepper() {
  return requireEnv('OTP_PEPPER');
}
function getJwtSecret() {
  return requireEnv('JWT_SECRET');
}
function getResendKey() {
  return requireEnv('RESEND_API_KEY');
}
function getFromAddress() {
  return process.env.RESEND_FROM || 'onboarding@resend.dev';
}
function getAppName() {
  return process.env.EMAIL_APP_NAME || 'PulsePrep';
}
function getFromEmail() {
  return process.env.FROM_EMAIL || getFromAddress();
}

// --- supabase (service role) ---
let supa: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!supa) {
    supa = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supa;
}

// --- OTP ---
const MAX_EXC = 10 ** 6;
export function generateNumericOtp(): string {
  return randomInt(0, MAX_EXC).toString().padStart(6, '0');
}
function hashOtpCode(email: string, code: string, pepper: string): string {
  const h = createHmac('sha256', pepper);
  h.update(`signup:${email.toLowerCase().trim()}:${code}`);
  return h.digest('hex');
}
export function hashOtp(email: string, code: string): string {
  return hashOtpCode(email, code, getOtpPepper());
}
export function assertEqualHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// --- resend ---
function resendClient() {
  return new Resend(getResendKey());
}
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
export async function sendSignupOtpEmail(
  to: string,
  displayName: string,
  code: string,
  minutesValid: number
) {
  const from = getFromAddress();
  const name = getAppName();
  const { data, error } = await resendClient().emails.send({
    from,
    to: [to],
    subject: `${name}: Your verification code is ${code}`,
    html: `
      <p>Hi ${esc(displayName || 'there')},</p>
      <p>Your one-time verification code is:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; font-family: system-ui, sans-serif;">${esc(
        code
      )}</p>
      <p>This code expires in <strong>${minutesValid} minutes</strong>. If you did not request it, you can ignore this message.</p>
    `,
    text: `Your ${name} verification code is: ${code}\n\nIt expires in ${minutesValid} minutes.`
  });
  if (error) throw new Error(error.message || 'Resend request failed');
  return data;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}) {
  const from = getFromEmail();
  const { data, error } = await resendClient().emails.send({
    from,
    to: [normalizeEmail(input.to)],
    subject: input.subject,
    html: input.htmlContent,
    text: input.textContent
  });
  if (error) throw new Error(error.message || 'Resend request failed');
  return data;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseJsonBody<T>(rawBody: unknown): T {
  if (typeof rawBody === 'string') return JSON.parse(rawBody) as T;
  if (rawBody && typeof rawBody === 'object') return rawBody as T;
  throw new Error('Invalid JSON');
}

// --- jwt ---
export async function signEmailVerifiedToken(email: string): Promise<string> {
  const key = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ purpose: 'email_verified' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email.toLowerCase().trim())
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

// --- cors ---
const localOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

function applyCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const o = (req.headers.origin as string) || '';
  const list = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const vercelPreview = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const allowList = new Set(list);
  if (vercelPreview) allowList.add(vercelPreview);
  const allowed = (o && localOrigins.has(o)) || (o && allowList.size > 0 && allowList.has(o));
  if (o && (allowed || process.env.VERCEL_ENV === 'development' || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', o);
  }
  if (o && (allowed || process.env.VERCEL_ENV === 'development' || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
