import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, CheckCircle2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { StatCard } from "../../../components/dashboard/StatCard";
import { Card, Badge, Skeleton, EmptyState, Button } from "../../../components/ui";
import { BUYER_SIDEBAR_LINKS } from "../buyerNav";
import { getBuyerOrders } from "../../../services/orders.api";
import { getOwnProfile } from "../../../services/buyer-profile.api";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function BuyerDashboardPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders", "mine", "dashboard"],
    queryFn: () => getBuyerOrders({ limit: 5 }),
  });
  const profileQuery = useQuery({ queryKey: ["buyer-profile"], queryFn: getOwnProfile });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.pagination.total ?? 0;
  const pending = orders.filter((o) => o.status === "pending" || o.status === "accepted").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  return (
    <DashboardShell links={BUYER_SIDEBAR_LINKS}>
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>

      {ordersQuery.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Skeleton variant="card" count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total orders" value={total} icon={ClipboardList} to="/buyer/orders" />
          <StatCard label="In progress" value={pending} icon={Clock} to="/buyer/orders" />
          <StatCard label="Completed" value={completed} icon={CheckCircle2} to="/buyer/orders" />
        </div>
      )}

      {profileQuery.data && (
        <Card className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-500 flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" /> Business profile
              </h3>
              <p className="text-sm text-text-muted">
                {profileQuery.data.businessType} · {profileQuery.data.industry}
              </p>
              <p className="text-sm text-text-muted">Budget: {profileQuery.data.budgetRange}</p>
            </div>
          </div>
        </Card>
      )}

      <Card header={<h3 className="font-500">Recent orders</h3>}>
        {ordersQuery.isLoading && <Skeleton variant="row" count={3} />}

        {ordersQuery.isError && (
          <EmptyState
            title="Couldn't load orders"
            action={<Button size="sm" onClick={() => ordersQuery.refetch()}>Retry</Button>}
          />
        )}

        {ordersQuery.isSuccess && orders.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Your placed orders will show up here."
            action={<Link to="/discover"><Button size="sm">Start browsing</Button></Link>}
          />
        )}

        {ordersQuery.isSuccess && orders.length > 0 && (
          <div className="flex flex-col">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/buyer/orders/${order.id}`}
                className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-bg transition-fast -mx-4 px-4"
              >
                <div>
                  <p className="text-sm font-500 text-text-primary">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-500">
                    {formatCurrency(
                      order.items.reduce((s, i) => s + Number(i.priceAtOrder) * i.quantity, 0)
                    )}
                  </span>
                  <Badge status={order.status}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
