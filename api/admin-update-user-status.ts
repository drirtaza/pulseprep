import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from './lib/shared';

type Status = 'pending' | 'active' | 'rejected' | 'suspended';
type PaymentStatus = 'pending' | 'completed' | 'rejected';
type DbPaymentStatus = 'pending' | 'approved' | 'rejected';

type Body = {
  email: string;
  adminRole?: string;
  status?: Status;
  paymentStatus?: PaymentStatus;
  paymentDetails?: Record<string, unknown>;
  emailVerified?: boolean;
  action?: 'payment_approve' | 'payment_attempt_review' | string;
  approvedAmount?: number;
  approvedCurrency?: string;
  paymentMethod?: string;
  transactionReference?: string;
  paymentAttemptId?: string;
  reviewNote?: string;
  reviewedBy?: string;
  metadata?: Record<string, unknown>;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
};

function bad(res: VercelResponse, code: number, error: string, extra?: Record<string, unknown>) {
  return res.status(code).json({ ok: false, error, ...(extra || {}) });
}

function looksLikeAlreadyExists(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('registered') || m.includes('already exists') || m.includes('already been registered');
}

async function ensureUserRowExists(supabase: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();
  if (userErr) throw new Error(`Failed to fetch users row: ${userErr.message}`);
  if (user?.id) return user.id;

  const { data: pending, error: pendingErr } = await supabase
    .from('pending_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (pendingErr) throw new Error(`Failed to fetch pending user for promotion: ${pendingErr.message}`);
  if (!pending) throw new Error('No pending_users row found for payment approval');

  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .upsert(
      {
        email: pending.email,
        full_name: pending.full_name,
        name: pending.name,
        phone: pending.phone,
        cnic: pending.cnic,
        specialty: pending.specialty ?? 'medicine',
        email_verified: pending.email_verified ?? false,
        status: pending.status ?? 'pending',
        payment_status: pending.payment_status ?? 'pending',
        registration_date: pending.registration_date,
        payment_details: pending.payment_details ?? {}
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();
  if (insertErr) throw new Error(`Failed to create users row from pending_users: ${insertErr.message}`);

  return inserted.id;
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

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }

  const supabase = getSupabaseAdmin();
  const actorRole = typeof body.adminRole === 'string' ? body.adminRole.toLowerCase() : '';
  const isDecisionAction = body.action === 'payment_approve' || body.status === 'rejected' || body.paymentStatus === 'rejected';
  if (isDecisionAction && actorRole !== 'finance-manager' && actorRole !== 'super-admin') {
    return bad(res, 403, 'Forbidden: only finance-manager or super-admin can approve/reject');
  }
  const patch: Record<string, unknown> = {};
  const normalizedPaymentStatus: DbPaymentStatus | undefined = body.paymentStatus
    ? body.paymentStatus === 'completed'
      ? 'approved'
      : body.paymentStatus
    : undefined;
  if (body.status) patch.status = body.status;
  if (normalizedPaymentStatus) patch.payment_status = normalizedPaymentStatus;
  if (typeof body.emailVerified === 'boolean') patch.email_verified = body.emailVerified;
  if (body.paymentDetails && typeof body.paymentDetails === 'object') patch.payment_details = body.paymentDetails;
  patch.updated_at = new Date().toISOString();

  const shouldPatchPending = body.action !== 'payment_approve';
  const pendingUpdate = shouldPatchPending
    ? await supabase.from('pending_users').update(patch).eq('email', email).select('id, email').maybeSingle()
    : { data: null, error: null };
  const usersUpdate = await supabase.from('users').update(patch).eq('email', email).select('id, email').maybeSingle();

  if (shouldPatchPending && pendingUpdate.error) return bad(res, 500, `Failed to update pending_users: ${pendingUpdate.error.message}`);
  if (usersUpdate.error) return bad(res, 500, `Failed to update users: ${usersUpdate.error.message}`);

  const pendingHit = Boolean(pendingUpdate.data?.id);
  const usersHit = Boolean(usersUpdate.data?.id);

  if (!pendingHit && !usersHit && body.action !== 'payment_attempt_review' && body.action !== 'payment_approve') {
    return bad(res, 404, 'No matching email found in pending_users or users');
  }

  if (body.action === 'payment_approve') {
    if (typeof body.approvedAmount !== 'number' || !Number.isFinite(body.approvedAmount) || body.approvedAmount <= 0) {
      return bad(res, 400, 'approvedAmount must be a positive number');
    }

    try {
      const userId = await ensureUserRowExists(supabase, email);
      const subscriptionStartDate = new Date();

      // Ensure there is a corresponding auth.users record for approved accounts.
      // If it already exists, we continue silently.
      const temporaryPassword = `${randomBytes(18).toString('hex')}A!9`;
      const created = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true
      });
      if (created.error && !looksLikeAlreadyExists(created.error.message || '')) {
        console.warn('Non-fatal: failed to ensure auth user on approval', created.error.message);
      }

      await supabase
        .from('users')
        .update({ payment_status: 'approved', status: body.status || 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);

      const { error: pendingDeleteErr } = await supabase.from('pending_users').delete().eq('email', email);
      if (pendingDeleteErr) return bad(res, 500, `Failed to delete pending_users after approval: ${pendingDeleteErr.message}`);

      const { error: paymentInsertErr } = await supabase.from('approved_payments').insert({
        user_id: userId,
        approved_amount: body.approvedAmount,
        approved_currency: body.approvedCurrency || 'PKR',
        payment_method: body.paymentMethod || null,
        transaction_reference: body.transactionReference || null,
        metadata: body.metadata ?? {},
        subscription_start_date: body.subscriptionStartDate ?? subscriptionStartDate.toISOString()
      });

      return res.status(200).json({
        ok: true,
        message: 'Payment approved and user updated',
        userId,
        movedFromPending: true,
        paymentRecordLogged: !paymentInsertErr,
        paymentRecordWarning: paymentInsertErr ? `approved_payments insert skipped: ${paymentInsertErr.message}` : null
      });
    } catch (e) {
      return bad(res, 500, e instanceof Error ? e.message : 'Payment approval failed');
    }
  }

  if (body.action === 'payment_attempt_review') {
    const attemptId = typeof body.paymentAttemptId === 'string' ? body.paymentAttemptId.trim() : '';
    if (!attemptId) {
      return bad(res, 400, 'paymentAttemptId is required for action=payment_attempt_review');
    }

    const reviewPatch = {
      status: body.paymentStatus === 'completed' ? 'approved' : body.paymentStatus === 'rejected' ? 'rejected' : 'pending',
      review_note: typeof body.reviewNote === 'string' ? body.reviewNote : null,
      reviewed_by: typeof body.reviewedBy === 'string' ? body.reviewedBy : null,
      reviewed_at: new Date().toISOString(),
      metadata: body.metadata ?? {},
      updated_at: new Date().toISOString()
    };

    const { data: attempt, error: attemptErr } = await supabase
      .from('payment_attempts')
      .update(reviewPatch)
      .eq('id', attemptId)
      .select('id, status')
      .maybeSingle();

    if (attemptErr) return bad(res, 500, `Failed to update payment_attempts: ${attemptErr.message}`);
    if (!attempt?.id) return bad(res, 404, 'No payment_attempts row matched paymentAttemptId');

    return res.status(200).json({
      ok: true,
      message: 'Payment attempt review updated',
      paymentAttempt: attempt
    });
  }

  const isRejectFlow = body.status === 'rejected' || body.paymentStatus === 'rejected';
  if (isRejectFlow) {
    const { error: pendingDeleteErr } = await supabase.from('pending_users').delete().eq('email', email);
    if (pendingDeleteErr) return bad(res, 500, `Failed to delete pending_users after rejection: ${pendingDeleteErr.message}`);
  }

  return res.status(200).json({
    ok: true,
    message: isRejectFlow ? 'User rejected and removed from pending' : 'User status updated',
    updated: {
      pendingUsers: pendingHit,
      users: usersHit
    },
    removedFromPending: isRejectFlow
  });
}
