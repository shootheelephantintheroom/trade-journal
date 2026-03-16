-- =============================================================
-- MyTradeBook Journal Migration
-- Paste this into your Supabase SQL Editor and run it
-- =============================================================

-- ─── Create journal_entries table ────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  entry_date date NOT NULL,
  premarket_plan text DEFAULT '',
  postmarket_review text DEFAULT '',
  lessons text DEFAULT '',
  mood text CHECK (mood IN ('great', 'good', 'neutral', 'frustrated', 'tilted')),
  grade text CHECK (grade IN ('A', 'B', 'C', 'D')),
  goals_for_tomorrow text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- ─── Journal entries RLS policies ────────────────────────────
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Auto-update updated_at trigger ─────────────────────────
CREATE OR REPLACE FUNCTION update_journal_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_updated_at();
