-- =============================================================
-- Missed Trades Upgrade Migration
-- Paste this into your Supabase SQL Editor and run it
-- =============================================================

alter table missed_trades add column if not exists side text check (side in ('long', 'short'));
alter table missed_trades add column if not exists estimated_entry numeric(12, 4);
alter table missed_trades add column if not exists estimated_exit numeric(12, 4);
alter table missed_trades add column if not exists estimated_shares integer;
alter table missed_trades add column if not exists hesitation_reasons text[] default '{}';
