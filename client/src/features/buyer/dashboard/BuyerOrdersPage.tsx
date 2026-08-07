import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Badge, Button, Card, EmptyState, Input, Skeleton } from "../../../components/ui";
import { BUYER_SIDEBAR_LINKS } from "../buyerNav";
import { getBuyerOrders } from "../../../services/orders.api";
import { formatCurrency } from "../../../utils/formatCurrency";
import { Order } from "../../../types";

type OrderTab = "current" | "delivered" | "cancelled";
const tabs: { key: OrderTab; label: string }[] = [{ key: "current", label: "Current" }, { key: "delivered", label: "Delivered" }, { key: "cancelled", label: "Cancelled" }];
const stages = ["Confirmed", "Preparing", "Ready", "Delivered"];
function total(order: Order) { return order.items.reduce((sum, item) => sum + Number(item.priceAtOrder) * item.quantity, 0); }

export default function BuyerOrdersPage() {
  const [tab, setTab] = useState<OrderTab>("current"); const [search, setSearch] = useState("");
  const ordersQuery = useQuery({ queryKey: ["orders", "mine", "buyer-list"], queryFn: () => getBuyerOrders({ limit: 50 }) });
  const orders = useMemo(() => (ordersQuery.data?.items ?? []).filter((order) => {
    const tabMatch = tab === "current" ? order.status !== "completed" : tab === "delivered" ? order.status === "completed" : false;
    const term = search.trim().toLowerCase();
    const searchMatch = !term || order.id.toLowerCase().includes(term) || order.items.some((item) => item.product.name.toLowerCase().includes(term) || item.product.supplier?.businessName.toLowerCase().includes(term));
    return tabMatch && searchMatch;
  }), [ordersQuery.data, search, tab]);
  return <DashboardShell links={BUYER_SIDEBAR_LINKS}>
    <h1 className="font-display text-2xl mb-5">Orders</h1>
    <div className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input aria-label="Search orders" placeholder="Search order ID, supplier, or product" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
    <div className="flex gap-1 border-b border-border mb-5 overflow-x-auto">{tabs.map(({ key, label }) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-fast ${tab === key ? "border-primary text-primary font-500" : "border-transparent text-text-muted hover:text-text-primary"}`}>{label}</button>)}</div>
    {ordersQuery.isLoading && <Skeleton variant="card" count={3} />}
    {ordersQuery.isError && <EmptyState title="Couldn't load orders" action={<Button onClick={() => ordersQuery.refetch()}>Retry</Button>} />}
    {ordersQuery.isSuccess && orders.length === 0 && <EmptyState icon={ClipboardList} title={tab === "cancelled" ? "No cancelled orders" : "No orders found"} description={search ? "Try a different search term." : tab === "current" ? "Your active orders will appear here." : "Your completed orders will appear here."} action={tab !== "cancelled" ? <Link to="/discover"><Button>Continue shopping</Button></Link> : undefined} />}
    <div className="flex flex-col gap-4">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
  </DashboardShell>;
}

function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0];
  const additionalItems = Math.max(0, order.items.length - 1);

  return <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div className="flex min-w-0 flex-1 gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-bg">{firstItem?.product.images[0] && <img src={firstItem.product.images[0]} alt={firstItem.product.name} className="h-full w-full object-cover" />}</div>
      <div className="min-w-0"><p className="font-500 line-clamp-1">{firstItem?.product.name ?? "Ordered products"}</p>{additionalItems > 0 && <p className="text-sm text-text-muted mt-0.5">+{additionalItems} more item{additionalItems === 1 ? "" : "s"}</p>}<p className="text-sm text-text-muted mt-1">Ordered {new Date(order.createdAt).toLocaleDateString()}</p><p className="text-xs text-text-muted mt-1">Order {order.id.slice(0, 8)}</p></div>
    </div>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
      <div><p className="text-xs text-text-muted">Total amount</p><p className="font-500">{formatCurrency(total(order))}</p></div>
      <Badge status={order.status}>{order.status}</Badge>
      <Link to={`/buyer/orders/${order.id}`}><Button size="sm">{order.status === "ready" ? "Track order" : "View details"}</Button></Link>
    </div>
  </div></Card>;
}

export function OrderProgress({ current }: { current: number }) { return <div className="grid grid-cols-4 gap-1">{stages.map((label, index) => <div key={label}><div className={`h-1.5 rounded-full ${index <= current ? "bg-success" : "bg-border"}`} /><p className={`text-[10px] mt-1 ${index <= current ? "text-text-primary" : "text-text-muted"}`}>{label}</p></div>)}</div>; }
