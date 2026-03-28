import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import type { Trade, MissedTrade } from "../types/trade";
import type { TradeFilters } from "../types/filters";
import type { JournalEntry } from "../types/journal";

const PAGE_SIZE = 50;

export function usePaginatedTrades(filters: TradeFilters, page: number) {
  return useQuery({
    queryKey: queryKeys.trades.list(filters as Record<string, unknown>, page),
    queryFn: async () => {
      let query = supabase
        .from("trades")
        .select("*", { count: "exact" })
        .order("trade_date", { ascending: false })
        .order("entry_time", { ascending: false });

      if (filters.dateFrom) query = query.gte("trade_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("trade_date", filters.dateTo);
      if (filters.ticker) query = query.ilike("ticker", `%${filters.ticker}%`);
      if (filters.side) query = query.eq("side", filters.side);
      if (filters.grade) query = query.eq("grade", filters.grade);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { trades: (data as Trade[]) || [], totalCount: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllTrades(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.trades.allUnpaginated(from, to),
    queryFn: async () => {
      let query = supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .order("entry_time", { ascending: false });
      if (from) query = query.gte("trade_date", from);
      if (to) query = query.lte("trade_date", to);
      const { data, error } = await query;
      if (error) throw error;
      return (data as Trade[]) || [];
    },
  });
}

export function useTradesForDate(date: string) {
  return useQuery({
    queryKey: queryKeys.trades.forDate(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("trade_date", date)
        .order("entry_time", { ascending: true });
      if (error) throw error;
      return (data as Trade[]) || [];
    },
  });
}

export function useMissedTrades() {
  return useQuery({
    queryKey: queryKeys.missedTrades.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missed_trades")
        .select("*")
        .order("trade_date", { ascending: false });
      if (error) throw error;
      return (data as MissedTrade[]) || [];
    },
  });
}

export function useJournalEntry(date: string) {
  return useQuery({
    queryKey: queryKeys.journal.entry(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("entry_date", date)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as JournalEntry;
      // Return local empty shell
      return {
        id: "",
        user_id: "",
        entry_date: date,
        premarket_plan: "",
        postmarket_review: "",
        lessons: "",
        mood: null,
        grade: null,
        goals_for_tomorrow: "",
        created_at: "",
        updated_at: "",
      } as JournalEntry;
    },
  });
}

export function useJournalDates() {
  return useQuery({
    queryKey: queryKeys.journal.dates,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("entry_date");
      if (error) throw error;
      return new Set((data || []).map((d) => d.entry_date));
    },
  });
}
