-- =============================================================
-- TradeBook Auth Migration
-- Paste this into your Supabase SQL Editor and run it
-- =============================================================

-- ─── Add user_id to trades ─────────────────────────────────
alter table trades
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- ─── Add user_id to missed_trades ──────────────────────────
alter table missed_trades
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- ─── Drop old permissive policies ──────────────────────────
drop policy if exists "Allow all access" on trades;
drop policy if exists "Allow all access" on missed_trades;

-- ─── Trades RLS policies ───────────────────────────────────
create policy "Users can view own trades"
  on trades for select
  using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own trades"
  on trades for delete
  using (auth.uid() = user_id);

-- ─── Missed trades RLS policies ────────────────────────────
create policy "Users can view own missed trades"
  on missed_trades for select
  using (auth.uid() = user_id);

create policy "Users can insert own missed trades"
  on missed_trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own missed trades"
  on missed_trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own missed trades"
  on missed_trades for delete
  using (auth.uid() = user_id);

-- ─── Backfill existing rows ──────────────────────────────
-- Assigns all orphaned rows to your current logged-in user.
-- Run this while signed in as yourself in the SQL Editor.
update trades       set user_id = auth.uid() where user_id is null;
update missed_trades set user_id = auth.uid() where user_id is null;
