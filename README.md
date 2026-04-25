
  # Replace App.tsx with PulsePrep Medical Education Platform (Copy)

  This is a code bundle for Replace App.tsx with PulsePrep Medical Education Platform (Copy). The original project is available at https://www.figma.com/design/l0kuDYONNsLG8Qs7j756k2/Replace-App.tsx-with-PulsePrep-Medical-Education-Platform--Copy-.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Signup + OTP backend endpoints

Environment variables used by API routes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM` (or `FROM_EMAIL` for transactional sender override)
- `OTP_PEPPER`
- `JWT_SECRET`

Endpoint purposes:

- `POST /api/pending-user-upsert`: idempotent upsert of signup profile into `pending_users`.
- `POST /api/admin-update-user`: fallback write path for `action="auth-signup-start"` to maintain `pending_users`.
- `POST /api/send-verification-email`: queues and sends verification email, then records provider outcome in tracking tables.
- `POST /api/admin-update-user-status`: sync status/payment updates across `pending_users` and `users`; supports `payment_approve` and `payment_attempt_review`.
  