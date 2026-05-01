import type { Trade } from "../types/trade";
import TradeDetailContent from "./TradeDetailContent";

export default function TradeRowDetail({
  trade: t,
  deleting,
  onEdit,
  onDelete,
}: {
  trade: Trade;
  deleting: boolean;
  onEdit?: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}) {
  return (
    <tr key={`${t.id}-detail`}>
      <td colSpan={9} className="p-0 border-b border-white/[0.03]">
        <div className="bg-white/[0.02] p-3">
          <TradeDetailContent
            trade={t}
            deleting={deleting}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}
