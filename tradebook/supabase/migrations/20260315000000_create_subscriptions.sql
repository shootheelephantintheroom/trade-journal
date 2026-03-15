create table if not exists public.subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id    text not null,
  user_id               uuid references auth.users(id) on delete cascade,
  status                text not null default 'incomplete',
  price_id              text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Index for quick lookups by user
create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

-- RLS: users can read their own subscription
alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
