/**
 * Maps Supabase `users` / `pending_users` rows to the shape the React app expects from login.
 */
export function mapDatabaseUserToClient(
  row: Record<string, unknown>,
  authUserId?: string
) {
  const spec = row.specialty;
  const specialty =
    spec === 'surgery' || spec === 'gynae-obs' ? spec : 'medicine';
  const ps = row.payment_status;
  const paymentStatus =
    ps === 'completed' || ps === 'approved'
      ? 'completed'
      : ps === 'rejected'
        ? 'rejected'
        : 'pending';
  return {
    id: (row.id as string) || authUserId || String(row.email || ''),
    name: (row.name as string) || (row.full_name as string) || '',
    fullName: (row.full_name as string) || (row.name as string) || '',
    email: String(row.email || ''),
    specialty,
    studyMode: 'regular' as const,
    registrationDate:
      (row.registration_date as string) ||
      (row.created_at as string) ||
      new Date().toISOString(),
    phone: (row.phone as string) || undefined,
    cnic: (row.cnic as string) || undefined,
    paymentStatus,
    paymentDetails: (row.payment_details as object) || undefined,
    status: (row.status as string) || 'pending',
    subscriptionExpiryDate: (row.subscription_expiry_date as string) || undefined,
    emailVerified: Boolean(row.email_verified),
    emailVerificationAttempts: 0,
    emailVerificationStatus: (row.email_verified ? 'verified' : 'pending') as
      | 'pending'
      | 'sent'
      | 'verified'
      | 'expired'
      | 'failed',
    emailVerificationToken: undefined,
    emailVerificationSentAt: undefined,
    emailVerificationExpiresAt: undefined,
    emailVerificationLastAttemptAt: undefined
  };
}
