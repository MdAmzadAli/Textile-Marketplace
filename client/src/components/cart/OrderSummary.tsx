import { ReactNode } from "react";
import { formatCurrency } from "../../utils/formatCurrency";

interface OrderSummaryProps {
  subtotal: number;
  itemCount: number;
  action?: ReactNode;
}

export function OrderSummary({ subtotal, itemCount, action }: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
        <span>Subtotal</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl text-text-primary">{formatCurrency(subtotal)}</span>
      </div>
      <p className="text-xs text-text-muted">Final pricing confirmed by supplier at fulfillment.</p>
      {action}
    </div>
  );
}
