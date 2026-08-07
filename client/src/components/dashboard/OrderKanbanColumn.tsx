import { ArrowRight } from "lucide-react";
import { Card, Badge, Button, EmptyState } from "../ui";
import { formatCurrency } from "../../utils/formatCurrency";
import { Order, OrderStatus } from "../../types";

interface OrderKanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  nextStatus?: OrderStatus;
  onAdvance: (orderId: string) => void;
  advancingOrderId?: string;
}

export function OrderKanbanColumn({
  status,
  orders,
  nextStatus,
  onAdvance,
  advancingOrderId,
}: OrderKanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Badge status={status}>{status}</Badge>
        <span className="text-xs text-text-muted">{orders.length}</span>
      </div>

      <div className="flex flex-col gap-3">
        {orders.length === 0 && (
          <Card className="border-dashed">
            <EmptyState title="No orders" />
          </Card>
        )}

        {orders.map((order) => {
          const value = order.sellerTotal ?? 0;
          return (
            <Card key={order.id} className="p-3">
              <p className="text-sm font-500 text-text-primary">Order #{order.id.slice(0, 8)}</p>
              <p className="text-xs text-text-muted mt-1">
                {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatCurrency(value)}
              </p>
              <p className="text-xs text-text-muted">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              {nextStatus && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  loading={advancingOrderId === order.id}
                  onClick={() => onAdvance(order.id)}
                >
                  Move to {nextStatus} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
