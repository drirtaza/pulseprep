/**
 * Uploads a payment proof image to Supabase Storage (via server) and returns a public URL.
 * Falls back: if the server is not configured (500 with storage message), caller may handle.
 */
export async function uploadPaymentScreenshotDataUrl(
  email: string,
  dataUrl: string
): Promise<string> {
  const res = await fetch('/api/payment-screenshot-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, dataUrl })
  });
  const text = await res.text();
  let json: { ok?: boolean; publicUrl?: string; error?: string } = {};
  try {
    json = text ? (JSON.parse(text) as typeof json) : {};
  } catch {
    if (!res.ok) throw new Error(text || 'Upload failed');
  }
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || text || 'Upload failed');
  }
  const url = (json as { publicUrl?: string }).publicUrl;
  if (!url) throw new Error('Upload succeeded but no public URL was returned');
  return url;
}
