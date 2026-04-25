import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from './lib/shared';

type Body = {
  email: string;
  approvedAmount: number;
  approvedCurrency?: string;
  paymentMethod?: string;
  transactionReference?: string;
  metadata?: Record<string, unknown>;
};

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

async function getOrCreateUserId(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: user, error: userErr } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (userErr) throw new Error(userErr.message);
  if (user?.id) return user.id;

  const { data: pending, error: pendingErr } = await supabase.from('pending_users').select('*').eq('email', email).maybeSingle();
  if (pendingErr) throw new Error(pendingErr.message);
  if (!pending) throw new Error('Pending user not found');

  const { data: created, error: createErr } = await supabase
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
        status: 'active',
        payment_status: 'completed',
        registration_date: pending.registration_date,
        payment_details: pending.payment_details ?? {}
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();
  if (createErr) throw new Error(createErr.message);
  return created.id;
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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Valid email is required');
  if (typeof body.approvedAmount !== 'number' || !Number.isFinite(body.approvedAmount) || body.approvedAmount <= 0) {
    return bad(res, 400, 'approvedAmount must be a positive number');
  }

  const supabase = getSupabaseAdmin();
  try {
    const userId = await getOrCreateUserId(email);

    const { error: paymentErr } = await supabase.from('approved_payments').insert({
      user_id: userId,
      approved_amount: body.approvedAmount,
      approved_currency: body.approvedCurrency || 'PKR',
      payment_method: body.paymentMethod || null,
      transaction_reference: body.transactionReference || null,
      metadata: body.metadata ?? {}
    });
    if (paymentErr) return bad(res, 500, `Failed to insert approved payment: ${paymentErr.message}`);

    await Promise.all([
      supabase.from('users').update({ status: 'active', payment_status: 'completed' }).eq('id', userId),
      supabase.from('pending_users').update({ status: 'active', payment_status: 'completed' }).eq('email', email)
    ]);

    return res.status(200).json({ ok: true, message: 'User approved', userId });
  } catch (e) {
    return bad(res, 500, e instanceof Error ? e.message : 'Approval failed');
  }
}
