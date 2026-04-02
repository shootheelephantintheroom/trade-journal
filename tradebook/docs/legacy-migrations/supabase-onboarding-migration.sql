-- ============================================================
-- Onboarding columns for profiles table
-- ============================================================

alter table public.profiles
  add column if not exists onboarded       boolean   not null default false,
  add column if not exists trading_styles  text[]    default '{}',
  add column if not exists default_shares  integer,
  add column if not exists default_commission numeric default 0,
  add column if not exists timezone        text;
