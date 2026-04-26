import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, handleCors, normalizeEmail, parseJsonBody } from './lib/shared';

const MAX_BYTES = 2.5 * 1024 * 1024; // keep under Vercel ~4.5MB JSON request limits with base64 overhead

type Body = {
  email: string;
  dataUrl: string;
};

function bad(res: VercelResponse, code: number, error: string) {
  return res.status(code).json({ ok: false, error });
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) throw new Error('Invalid data URL: expected data:image/...;base64,...');
  const contentType = m[1].split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('image/')) {
    throw new Error('Only image data URLs are allowed');
  }
  const b64 = m[2].replace(/\s/g, '');
  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length > MAX_BYTES) {
    throw new Error(`Image is too large (max ${Math.floor(MAX_BYTES / 1024 / 1024)}MB)`);
  }
  if (buffer.length < 32) {
    throw new Error('Image data is too small or invalid');
  }
  let ext = 'bin';
  if (contentType.includes('jpeg') || contentType === 'image/jpg') ext = 'jpg';
  else if (contentType.includes('png')) ext = 'png';
  else if (contentType.includes('webp')) ext = 'webp';
  else if (contentType.includes('gif')) ext = 'gif';
  return { buffer, contentType, ext };
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
  const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'Valid email is required');
  }
  if (!dataUrl) {
    return bad(res, 400, 'dataUrl is required');
  }

  let buffer: Buffer;
  let contentType: string;
  let ext: string;
  try {
    const parsed = dataUrlToBuffer(dataUrl);
    buffer = parsed.buffer;
    contentType = parsed.contentType;
    ext = parsed.ext;
  } catch (e) {
    return bad(res, 400, e instanceof Error ? e.message : 'Invalid image data');
  }

  const bucket = (process.env.PAYMENT_SCREENSHOTS_BUCKET || 'payment-proofs').trim();
  const safeEmail = email.replace(/[^a-z0-9@._-]/gi, '_');
  const objectPath = `pending/${safeEmail}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const supabase = getSupabaseAdmin();
  const existingBucket = await supabase.storage.getBucket(bucket);
  if (existingBucket.error) {
    const lower = (existingBucket.error.message || '').toLowerCase();
    const missing =
      lower.includes('not found') ||
      lower.includes('does not exist') ||
      lower.includes('404');
    if (!missing) {
      return bad(res, 500, `Failed to inspect storage bucket: ${existingBucket.error.message}`);
    }
    const created = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: `${Math.floor(MAX_BYTES / 1024 / 1024)}MB`
    });
    if (created.error) {
      return bad(
        res,
        500,
        `Failed to create storage bucket "${bucket}": ${created.error.message}`
      );
    }
  }

  const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType,
    upsert: false
  });
  if (upErr) {
    console.error('payment-screenshot-upload storage', upErr);
    return bad(
      res,
      500,
      `Storage upload failed: ${upErr.message}. Ensure Supabase Storage bucket "${bucket}" exists and service role can write.`
    );
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!pub?.publicUrl) {
    return bad(res, 500, 'Failed to resolve public URL for upload');
  }

  return res.status(200).json({ ok: true, publicUrl: pub.publicUrl, path: objectPath, bucket });
}
