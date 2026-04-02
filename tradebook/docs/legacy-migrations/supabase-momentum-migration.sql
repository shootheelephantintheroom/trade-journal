-- Momentum trading fields for intraday small-cap trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS catalyst text DEFAULT '';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS catalyst_type text CHECK (catalyst_type IN ('earnings', 'news_pr', 'fda', 'sec_filing', 'short_squeeze', 'sympathy', 'technical', 'other'));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS float_shares numeric(14,0);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_cap numeric(14,0);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS rvol numeric(8,2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS commission numeric(10,4) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_scaled boolean DEFAULT false;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS avg_entry_price numeric(12,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS avg_exit_price numeric(12,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS total_shares integer;
