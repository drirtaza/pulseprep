import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from './lib/shared';

type Body = {
  action: string;
  email: string;
  fullName?: string;
  name?: string;
  phone?: string;
  cnic?: string;
  specialty?: string;
  status?: 'pending' | 'active' | 'rejected' | 'suspended';
  paymentStatus?: 'pending' | 'completed' | 'rejected';
  emailVerified?: boolean;
  paymentDetails?: Record<string, unknown>;
};

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
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

  const action = typeof body.action === 'string' ? body.action.trim() : '';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const fullName =
    typeof body.fullName === 'string' && body.fullName.trim()
      ? body.fullName.trim()
      : typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : '';

  if (action !== 'auth-signup-start') {
    return bad(res, 400, 'Unsupported action. Use action="auth-signup-start".');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }
  if (!fullName) {
    return bad(res, 400, 'fullName (or name) is required');
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const payload = {
    email,
    full_name: fullName,
    name: typeof body.name === 'string' ? body.name.trim() || null : null,
    phone: typeof body.phone === 'string' ? body.phone.trim() || null : null,
    cnic: typeof body.cnic === 'string' ? body.cnic.trim() || null : null,
    specialty: typeof body.specialty === 'string' && body.specialty.trim() ? body.specialty.trim() : 'medicine',
    status: body.status ?? 'pending',
    payment_status: body.paymentStatus ?? 'pending',
    email_verified: body.emailVerified ?? false,
    payment_details: body.paymentDetails ?? {},
    updated_at: now
  };

  const { data, error } = await supabase
    .from('pending_users')
    .upsert(payload, { onConflict: 'email' })
    .select('id, email, status, payment_status, email_verified')
    .single();

  if (error) {
    console.error('admin-update-user auth-signup-start', error);
    return bad(res, 500, `Failed to save pending user: ${error.message}`);
  }

  return res.status(200).json({
    ok: true,
    message: 'Fallback pending user upserted',
    pendingUser: data
  });
}
