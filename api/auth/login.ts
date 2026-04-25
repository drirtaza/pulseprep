import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  getSupabaseAnonUserClient,
  handleCors,
  normalizeEmail,
  parseJsonBody
} from '../lib/shared';
import { mapDatabaseUserToClient } from '../lib/mapUserRow';

type Body = { email: string; password: string };

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
    return bad(res, 400, 'Invalid JSON');
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return bad(res, 400, 'Email and password are required');
  }

  const supabaseAuth = getSupabaseAnonUserClient();
  const { data: signData, error: signErr } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });

  if (signErr || !signData.session) {
    return bad(res, 401, 'Invalid email or password');
  }

  const suid = signData.user?.id;
  const admin = getSupabaseAdmin();
  const { data: urow, error: uErr } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (uErr) {
    console.error('users select', uErr);
    return bad(res, 500, 'Could not load profile');
  }

  let prow: typeof urow = null;
  if (!urow) {
    const p = await admin.from('pending_users').select('*').eq('email', email).maybeSingle();
    if (p.error) {
      console.error('pending_users select', p.error);
      return bad(res, 500, 'Could not load profile');
    }
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
