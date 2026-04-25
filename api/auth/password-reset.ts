import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getSiteUrl, handleCors, normalizeEmail, parseJsonBody, sendTransactionalEmail } from '../lib/shared';

type Body = { email: string };

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }

  const supabase = getSupabaseAdmin();
  const site = getSiteUrl();
  const redirectTo = `${site}/`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo }
  });

  if (error) {
    console.error('auth.admin.generateLink', error);
    return res.status(200).json({
      ok: true,
      message: 'If an account exists for this address, a reset link was sent.'
    });
  }

  const actionLink =
    (data as { properties?: { action_link?: string; hashed_token?: string } })?.properties
      ?.action_link || '';

  if (!actionLink) {
    console.error('password-reset: missing action_link', data);
    return res.status(200).json({
      ok: true,
      message: 'If an account exists for this address, a reset link was sent.'
    });
  }

  const appName = process.env.EMAIL_APP_NAME || 'PulsePrep';
  const subject = `${appName}: password reset`;
  const html = `
    <p>Hi,</p>
    <p>We received a request to reset your ${esc(appName)} password.</p>
    <p><a href="${esc(actionLink)}">Set a new password</a></p>
    <p>If you did not request this, you can ignore this message.</p>
  `;
  const text = `We received a request to reset your ${appName} password. Open: ${actionLink}\n\nIf you did not request this, you can ignore this message.`;

  try {
    await sendTransactionalEmail({
      to: email,
      subject,
      htmlContent: html,
      textContent: text
    });
  } catch (e) {
    console.error('Resend password reset', e);
    return bad(res, 502, 'Could not send reset email. Try again later.');
  }

  return res.status(200).json({ ok: true, message: 'If an account exists, check your email for a reset link.' });
}
