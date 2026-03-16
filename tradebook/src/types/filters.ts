export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  ticker?: string;
  side?: "long" | "short";
  tags?: string[];
  grade?: string;
}
