export const queryKeys = {
  trades: {
    all: ['trades'] as const,
    list: (filters: Record<string, unknown>, page: number) => ['trades', 'list', filters, page] as const,
    allUnpaginated: (from?: string, to?: string) => ['trades', 'all', { from, to }] as const,
    forDate: (date: string) => ['trades', 'date', date] as const,
  },
  missedTrades: {
    all: ['missedTrades'] as const,
  },
  journal: {
    entry: (date: string) => ['journal', 'entry', date] as const,
    dates: ['journal', 'dates'] as const,
  },
} as const;
