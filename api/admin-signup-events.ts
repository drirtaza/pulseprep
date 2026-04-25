import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, normalizeEmail } from './lib/shared';
import { supabaseAdmin } from './_supabaseAdmin';

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

type SignupEvent = {
  type: string;
  at: string | null;
  detail: Record<string, unknown>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return bad(res, 405, 'Method not allowed');

  const email = typeof req.query.email === 'string' ? normalizeEmail(req.query.email) : '';
  if (!email) return bad(res, 400, 'email query param is required');

  const supabase = supabaseAdmin();
  const [pendingRes, otpRes, trackingRes, approvalsRes] = await Promise.all([
    supabase.from('pending_users').select('*').eq('email', email).maybeSingle(),
    supabase.from('signup_email_otp').select('*').eq('email', email).maybeSingle(),
    supabase.from('email_delivery_tracking').select('*').eq('recipient_email', email).order('created_at', { ascending: true }),
    supabase.from('approved_payments').select('*').order('created_at', { ascending: true })
  ]);

  if (pendingRes.error) return bad(res, 500, `Failed to fetch pending user: ${pendingRes.error.message}`);
  if (otpRes.error) return bad(res, 500, `Failed to fetch otp state: ${otpRes.error.message}`);
  if (trackingRes.error) return bad(res, 500, `Failed to fetch email tracking: ${trackingRes.error.message}`);
  if (approvalsRes.error) return bad(res, 500, `Failed to fetch approved payments: ${approvalsRes.error.message}`);

  const events: SignupEvent[] = [];
  if (pendingRes.data) {
    events.push({
      type: 'signup_started',
      at: pendingRes.data.created_at,
      detail: {
        status: pendingRes.data.status,
        payment_status: pendingRes.data.payment_status,
        email_verified: pendingRes.data.email_verified
      }
    });
  }
  if (otpRes.data) {
    events.push({
      type: 'otp_state',
      at: otpRes.data.updated_at || otpRes.data.created_at,
      detail: {
        resend_count: otpRes.data.resend_count,
        attempt_count: otpRes.data.attempt_count,
        consumed_at: otpRes.data.consumed_at,
        last_sent_at: otpRes.data.last_sent_at
      }
    });
  }
  for (const row of trackingRes.data ?? []) {
    events.push({
      type: row.status === 'sent' ? 'verification_email_sent' : 'verification_email_failed',
      at: row.created_at,
      detail: { email_id: row.email_id, email_type: row.email_type, subject: row.subject }
    });
  }

  const sorted = events.sort((a, b) => (a.at && b.at ? (a.at < b.at ? -1 : 1) : 0));
  return res.status(200).json({ ok: true, email, events: sorted });
}
