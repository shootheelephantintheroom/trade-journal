export interface Trade {
  id: string;
  ticker: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number;
  shares: number;
  trade_date: string;
  entry_time: string;
  exit_time: string;
  setup: string;
  notes: string;
  emotions: string;
  stop_loss_price: number | null;
  tags: string[];
  grade: string;
  premarket_plan: string;
  screenshot_url: string | null;
  created_at: string;
}

export type TradeInsert = Omit<Trade, "id" | "created_at">;

export interface MissedTrade {
  id: string;
  ticker: string;
  trade_date: string;
  setup: string;
  tags: string[];
  reason: string;
  side: "long" | "short" | null;
  estimated_entry: number | null;
  estimated_exit: number | null;
  estimated_shares: number | null;
  hesitation_reasons: string[];
  created_at: string;
}

export type MissedTradeInsert = Omit<MissedTrade, "id" | "created_at">;
