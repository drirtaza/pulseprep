import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  handleCors,
  normalizeEmail,
  parseJsonBody,
  sendTransactionalEmail
} from './lib/shared';

type Body = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  recipientUserId?: string | null;
  emailType?: string;
  templateId?: string | null;
  priority?: number;
};

function bad(res: VercelResponse, code: number, error: string, extra?: Record<string, unknown>) {
  return res.status(code).json({ ok: false, error, ...(extra || {}) });
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

  const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const htmlContent = typeof body.htmlContent === 'string' ? body.htmlContent : '';
  const textContent = typeof body.textContent === 'string' ? body.textContent : '';
  const emailType = typeof body.emailType === 'string' && body.emailType.trim() ? body.emailType.trim() : 'verification';
  const templateId = typeof body.templateId === 'string' && body.templateId.trim() ? body.templateId.trim() : null;
  const priority = Number.isInteger(body.priority) ? Math.max(1, Math.min(10, Number(body.priority))) : 5;
  const recipientUserId =
    typeof body.recipientUserId === 'string' && body.recipientUserId.trim() ? body.recipientUserId.trim() : null;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return bad(res, 400, '`to` must be a valid email');
  if (!subject) return bad(res, 400, '`subject` is required');
  if (!htmlContent) return bad(res, 400, '`htmlContent` is required');
  if (!textContent) return bad(res, 400, '`textContent` is required');

  const supabase = getSupabaseAdmin();
  const queueInsert = await supabase
    .from('email_queue')
    .insert({
      recipient_email: to,
      recipient_user_id: recipientUserId,
      email_type: emailType,
      subject,
      body_html: htmlContent,
      body_text: textContent,
      template_id: templateId,
      priority,
      status: 'queued'
    })
    .select('id')
    .maybeSingle();

  if (queueInsert.error) {
    console.error('email_queue insert failed (non-blocking)', queueInsert.error);
  }
  const queueId = queueInsert.data?.id || null;

  try {
    const providerResponse = await sendTransactionalEmail({ to, subject, htmlContent, textContent });
    const providerEmailId = (providerResponse as { id?: string })?.id || `queued-${queueId || Date.now()}`;
    const sentAt = new Date().toISOString();

    if (queueId) {
      const { error: queueUpdateErr } = await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: sentAt, error_message: null, updated_at: sentAt })
        .eq('id', queueId);
      if (queueUpdateErr) console.error('email_queue sent update', queueUpdateErr);
    }

    const { error: trackingErr } = await supabase.from('email_delivery_tracking').upsert(
      {
        email_id: providerEmailId,
        recipient_email: to,
        recipient_user_id: recipientUserId,
        email_type: emailType,
        subject,
        template_id: templateId,
        status: 'sent',
        sent_at: sentAt,
        delivery_status: providerResponse ?? {}
      },
      { onConflict: 'email_id' }
    );
    if (trackingErr) console.error('email_delivery_tracking sent insert', trackingErr);

    return res.status(200).json({
      ok: true,
      message: 'Verification email sent',
      emailId: providerEmailId,
      queueId
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to send verification email';
    const failedAt = new Date().toISOString();
    const failedEmailId = `failed-${queueId || Date.now()}`;

    if (queueId) {
      const { error: queueFailErr } = await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: errorMessage, updated_at: failedAt })
        .eq('id', queueId);
      if (queueFailErr) console.error('email_queue failed update', queueFailErr);
    }

    const { error: trackingErr } = await supabase.from('email_delivery_tracking').upsert(
      {
        email_id: failedEmailId,
        recipient_email: to,
        recipient_user_id: recipientUserId,
        email_type: emailType,
        subject,
        template_id: templateId,
        status: 'failed',
        sent_at: null,
        delivery_status: { error: errorMessage, provider: 'resend' }
      },
      { onConflict: 'email_id' }
    );
    if (trackingErr) console.error('email_delivery_tracking failed insert', trackingErr);

    return bad(res, 502, errorMessage, { queueId });
  }
}
