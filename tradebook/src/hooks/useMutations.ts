import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import type { TradeInsert, MissedTradeInsert } from "../types/trade";
import type { JournalEntry } from "../types/journal";

export function useSaveTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, editTradeId }: { payload: TradeInsert; editTradeId?: string }) => {
      const { error } = editTradeId
        ? await supabase.from("trades").update(payload).eq("id", editTradeId)
        : await supabase.from("trades").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });
}

export function useDeleteTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tradeId, screenshotUrl }: { tradeId: string; screenshotUrl?: string | null }) => {
      // Clean up screenshot from storage if present
      if (screenshotUrl) {
        const match = screenshotUrl.match(/\/screenshots\/(.+)$/);
        if (match) {
          const { error: storageErr } = await supabase.storage
            .from("screenshots")
            .remove([match[1]]);
          if (storageErr) console.warn("Failed to delete screenshot:", storageErr.message);
        }
      }
      const { error } = await supabase.from("trades").delete().eq("id", tradeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });
}

export function useSaveMissedTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MissedTradeInsert) => {
      const { error } = await supabase.from("missed_trades").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missedTrades.all });
    },
  });
}

export function useDeleteMissedTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missed_trades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missedTrades.all });
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entry, updates }: { entry: JournalEntry; updates: Partial<JournalEntry> }) => {
      if (!entry.id) {
        // First edit — INSERT
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({ entry_date: entry.entry_date, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data as JournalEntry;
      } else {
        // Update existing
        const { error } = await supabase
          .from("journal_entries")
          .update(updates)
          .eq("id", entry.id);
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.entry(variables.entry.entry_date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.dates });
    },
  });
}

export function useImportTrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trades: Record<string, unknown>[]) => {
      const { error } = await supabase.from("trades").insert(trades);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });
}
