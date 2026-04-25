create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.pending_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  name text,
  phone text,
  cnic text,
  specialty text not null default 'medicine',
  email_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'suspended')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'rejected')),
  registration_date timestamptz not null default now(),
  payment_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_users_email_lowercase check (email = lower(email))
);

create unique index if not exists pending_users_email_key on public.pending_users (email);
create index if not exists pending_users_status_idx on public.pending_users (status);
create index if not exists pending_users_payment_status_idx on public.pending_users (payment_status);

drop trigger if exists pending_users_set_updated_at on public.pending_users;
create trigger pending_users_set_updated_at
before update on public.pending_users
for each row
execute function public.set_updated_at();

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  name text,
  phone text,
  cnic text,
  specialty text not null default 'medicine',
  email_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'suspended')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'rejected')),
  registration_date timestamptz not null default now(),
  payment_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email))
);

create unique index if not exists users_email_key on public.users (email);
create index if not exists users_status_idx on public.users (status);
create index if not exists users_payment_status_idx on public.users (payment_status);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_user_id uuid,
  email_type text not null,
  subject text not null,
  body_html text not null,
  body_text text not null,
  template_id text,
  priority int not null default 5,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_queue_email_lowercase check (recipient_email = lower(recipient_email))
);

create index if not exists email_queue_recipient_idx on public.email_queue (recipient_email);
create index if not exists email_queue_status_idx on public.email_queue (status);
create index if not exists email_queue_created_at_idx on public.email_queue (created_at desc);

drop trigger if exists email_queue_set_updated_at on public.email_queue;
create trigger email_queue_set_updated_at
before update on public.email_queue
for each row
execute function public.set_updated_at();

create table if not exists public.email_delivery_tracking (
  id uuid primary key default gen_random_uuid(),
  email_id text not null,
  recipient_email text not null,
  recipient_user_id uuid,
  email_type text not null,
  subject text not null,
  template_id text,
  status text not null check (status in ('sent', 'failed')),
  sent_at timestamptz,
  delivery_status jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_delivery_tracking_email_lowercase check (recipient_email = lower(recipient_email))
);

create unique index if not exists email_delivery_tracking_email_id_key on public.email_delivery_tracking (email_id);
create index if not exists email_delivery_tracking_recipient_idx on public.email_delivery_tracking (recipient_email);
create index if not exists email_delivery_tracking_status_idx on public.email_delivery_tracking (status);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  amount numeric(12,2),
  currency text default 'PKR',
  payment_method text,
  transaction_reference text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_attempts_email_idx on public.payment_attempts (email);
create index if not exists payment_attempts_status_idx on public.payment_attempts (status);
create index if not exists payment_attempts_tx_ref_idx on public.payment_attempts (transaction_reference);

drop trigger if exists payment_attempts_set_updated_at on public.payment_attempts;
create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row
execute function public.set_updated_at();

create table if not exists public.approved_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  approved_amount numeric(12,2) not null,
  approved_currency text not null default 'PKR',
  payment_method text,
  transaction_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approved_payments_user_id_idx on public.approved_payments (user_id);
create index if not exists approved_payments_tx_ref_idx on public.approved_payments (transaction_reference);
create index if not exists approved_payments_created_at_idx on public.approved_payments (created_at desc);

drop trigger if exists approved_payments_set_updated_at on public.approved_payments;
create trigger approved_payments_set_updated_at
before update on public.approved_payments
for each row
execute function public.set_updated_at();
