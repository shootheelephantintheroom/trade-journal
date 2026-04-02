-- ============================================================
-- profiles table & subscription infrastructure
-- ============================================================

-- 1. profiles table
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  display_name  text,
  plan          text not null default 'free' check (plan in ('free', 'pro')),

  stripe_customer_id     text,
  stripe_subscription_id text,
  subscription_status    text not null default 'none'
    check (subscription_status in ('active', 'canceled', 'past_due', 'none')),

  trial_ends_at timestamptz default null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3. RLS — users can only read / update their own row
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, plan, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'free',
    'none',
    NULL
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Backfill: create profile rows for any existing users that don't have one
insert into public.profiles (id, email, display_name, plan, subscription_status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)),
  'free',
  'none'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
