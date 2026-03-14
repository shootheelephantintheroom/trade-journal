-- =============================================================
-- MyTradeBook Schema
-- Run this in your Supabase SQL Editor
-- =============================================================

-- ─── Trades table ────────────────────────────────────────────

create table if not exists trades (
  id uuid default gen_random_uuid() primary key,
  ticker text not null,
  side text not null check (side in ('long', 'short')),
  entry_price numeric(12, 4) not null,
  exit_price numeric(12, 4) not null,
  shares integer not null,
  trade_date date not null,
  entry_time time,
  exit_time time,
  setup text default '',
  notes text default '',
  emotions text default '',
  stop_loss_price numeric(12, 4),
  tags text[] default '{}',
  grade text check (grade in ('A', 'B', 'C', 'D')),
  premarket_plan text default '',
  created_at timestamptz default now()
);

alter table trades enable row level security;

create policy "Allow all access" on trades
  for all
  using (true)
  with check (true);

-- ─── Missed trades table ────────────────────────────────────

create table if not exists missed_trades (
  id uuid default gen_random_uuid() primary key,
  ticker text not null,
  trade_date date not null,
  setup text default '',
  tags text[] default '{}',
  reason text default '',
  created_at timestamptz default now()
);

alter table missed_trades enable row level security;

create policy "Allow all access" on missed_trades
  for all
  using (true)
  with check (true);


-- =============================================================
-- MIGRATION: Run this if your trades table already exists
-- =============================================================
-- alter table trades add column if not exists stop_loss_price numeric(12, 4);
-- alter table trades add column if not exists tags text[] default '{}';
-- alter table trades add column if not exists grade text check (grade in ('A', 'B', 'C', 'D'));
-- alter table trades add column if not exists premarket_plan text default '';
