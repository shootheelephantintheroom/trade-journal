import type { Trade } from "../types/trade";
import { calcRR } from "../lib/calc";
import { cn } from "../lib/utils";

export default function TradeDetailContent({
  trade: t,
  deleting,
  onEdit,
  onDelete,
  showSummary,
}: {
  trade: Trade;
  deleting?: boolean;
  onEdit?: (trade: Trade) => void;
  onDelete?: (tradeId: string) => void;
  showSummary?: boolean;
}) {
  const rr = calcRR(t);
  const showActions = !!(onEdit || onDelete);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
      {showSummary && (
        <>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              Date
            </span>
            <p className="text-secondary mt-0.5">{t.trade_date}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              Side
            </span>
            <p
              className={cn(
                "font-medium mt-0.5",
                t.side === "long" ? "text-profit" : "text-loss"
              )}
            >
              {t.side === "long" ? "Long" : "Short"}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              Entry / Exit
            </span>
            <p className="text-secondary font-mono mt-0.5 tabular-nums">
              ${t.entry_price.toFixed(2)} {"→"} ${t.exit_price.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              Shares
            </span>
            <p className="text-secondary font-mono mt-0.5 tabular-nums">
              {t.shares}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              R:R
            </span>
            <p className="text-secondary font-mono mt-0.5 tabular-nums">
              {rr !== null ? `${rr.toFixed(1)}R` : "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
              Setup
            </span>
            <p className="text-secondary mt-0.5">{t.setup || "—"}</p>
          </div>
        </>
      )}
      {t.entry_time && (
        <div>
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Time
          </span>
          <p className="text-secondary mt-0.5">
            {t.entry_time}
            {t.exit_time ? ` → ${t.exit_time}` : ""}
          </p>
        </div>
      )}
      {t.premarket_plan && (
        <div>
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Pre-market Plan
          </span>
          <p className="text-secondary mt-0.5">{t.premarket_plan}</p>
        </div>
      )}
      {t.notes && (
        <div className="md:col-span-2">
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Notes
          </span>
          <p className="text-secondary mt-0.5 whitespace-pre-wrap">{t.notes}</p>
        </div>
      )}
      {t.emotions && (
        <div>
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Emotions
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {t.emotions.split(",").map((e) => (
              <span
                key={e.trim()}
                className="px-1.5 py-0.5 rounded-[4px] text-[12px] font-medium bg-white/[0.06] text-secondary"
              >
                {e.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
      {t.stop_loss_price != null && (
        <div>
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Stop Loss
          </span>
          <p className="text-amber font-medium font-mono mt-0.5">
            ${Number(t.stop_loss_price).toFixed(2)}
          </p>
        </div>
      )}
      {t.screenshot_url && (
        <div className="md:col-span-2">
          <span className="text-[11px] font-medium text-tertiary uppercase tracking-[0.04em]">
            Chart Screenshot
          </span>
          <a
            href={t.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block mt-1"
          >
            <img
              src={t.screenshot_url}
              alt={`${t.ticker} chart`}
              className="max-h-[200px] rounded-[4px] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
            />
          </a>
        </div>
      )}
      {showActions && (
        <div className="md:col-span-2 flex gap-4 pt-2 border-t border-white/[0.04] justify-end sm:justify-start">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(t);
              }}
              className="text-[12px] text-tertiary hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t.id);
              }}
              className="text-[12px] text-tertiary hover:text-loss transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
