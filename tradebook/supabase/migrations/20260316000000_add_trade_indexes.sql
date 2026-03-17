CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_missed_trades_user_date ON missed_trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
