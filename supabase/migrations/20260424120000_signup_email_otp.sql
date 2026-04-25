-- Email signup OTP (hashed) — Vercel API uses service role only. No public RLS.
create table if not exists public.signup_email_otp (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempt_count int not null default 0,
  resend_count int not null default 0,
  last_sent_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists signup_email_otp_email_key on public.signup_email_otp (email);

-- Service role (Vercel) only — lock down for anon/auth users
alter table public.signup_email_otp enable row level security;

-- Intentionally no policy for authenticated/anon; server uses service role which bypasses RLS.

create index if not exists signup_email_otp_expires_idx on public.signup_email_otp (expires_at);

comment on table public.signup_email_otp is 'Stores hashed signup OTP; never store plaintext codes.';
