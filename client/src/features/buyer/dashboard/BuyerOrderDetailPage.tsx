import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Badge, Button, Card, EmptyState, Skeleton } from "../../../components/ui";
import { BUYER_SIDEBAR_LINKS } from "../buyerNav";
import { getOrder } from "../../../services/orders.api";
import { formatCurrency } from "../../../utils/formatCurrency";
import { Order } from "../../../types";
import { OrderProgress } from "./BuyerOrdersPage";

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderQuery = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id!), enabled: !!id });

  if (orderQuery.isLoading) return <DashboardShell links={BUYER_SIDEBAR_LINKS}><Skeleton variant="card" count={3} /></DashboardShell>;
  if (orderQuery.isError || !orderQuery.data) return <DashboardShell links={BUYER_SIDEBAR_LINKS}><EmptyState title="Couldn't load this order" action={<Button onClick={() => orderQuery.refetch()}>Retry</Button>} /></DashboardShell>;

  const order = orderQuery.data;
  const total = order.items.reduce((sum, item) => sum + Number(item.priceAtOrder) * item.quantity, 0);
  const stage = order.status === "pending" || order.status === "accepted" ? 0 : order.status === "preparing" ? 1 : order.status === "ready" ? 2 : 3;
  const supplierGroups = order.items.reduce<Array<{
    supplierId: string;
    supplier: Order["items"][number]["product"]["supplier"];
    items: Order["items"];
  }>>((groups, item) => {
    const group = groups.find((entry) => entry.supplierId === item.supplierId);
    if (group) group.items.push(item);
    else groups.push({ supplierId: item.supplierId, supplier: item.product.supplier, items: [item] });
    return groups;
  }, []);

  return <DashboardShell links={BUYER_SIDEBAR_LINKS}><div className="flex flex-col gap-5">
    <div className="flex items-start justify-between gap-4"><div><h1 className="font-display text-2xl">Order details</h1><p className="text-sm text-text-muted mt-1">Order {order.id.slice(0, 8)} &middot; Placed {new Date(order.createdAt).toLocaleDateString()}</p></div><Badge status={order.status}>{order.status}</Badge></div>
    <Card><h2 className="font-500 mb-4">Order status</h2><OrderProgress current={stage} /></Card>
    <Card header={<h2 className="font-500">Ordered products</h2>}><div className="flex flex-col">{supplierGroups.map((group) => <div key={group.supplierId} className="first:pt-0 pt-4"><p className="text-xs font-500 text-text-muted mb-1">{group.supplier?.businessName ?? "Verified supplier"}</p>{group.items.map((item) => <div key={item.id} className="flex gap-3 py-3 border-b border-border last:border-0"><div className="h-16 w-16 shrink-0 bg-bg rounded-sm overflow-hidden">{item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><Link to={`/products/${item.productId}`} className="font-500 line-clamp-1 hover:text-primary transition-fast">{item.product.name}</Link><p className="text-xs text-text-muted mt-1">Qty: {item.quantity} &middot; {item.product.unit}</p><p className="text-sm font-500 mt-2">{formatCurrency(Number(item.priceAtOrder) * item.quantity)}</p></div></div>)}</div>)}</div></Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><h2 className="font-500 flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-primary" /> Shipping information</h2><div className="text-sm text-text-muted space-y-1"><p>{order.shippingInfo.fullName}</p><p>{order.shippingInfo.countryCode} {order.shippingInfo.phone}</p><p>{order.shippingInfo.addressLine}</p><p>{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}</p></div></Card><Card><h2 className="font-500 mb-3">Payment summary</h2><div className="flex justify-between text-sm"><span className="text-text-muted">Grand total</span><span className="font-500">{formatCurrency(total)}</span></div><p className="text-xs text-text-muted mt-3">Payment is finalized during fulfillment.</p></Card></div>
    <section><h2 className="font-500 mb-3">Suppliers</h2><div className="flex flex-col gap-4">{supplierGroups.map((group) => { const supplierName = group.supplier?.businessName ?? "Verified supplier"; const initials = supplierName.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); return <Card key={group.supplierId}><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-600 shrink-0">{initials || <Building2 className="h-4 w-4" />}</div><div className="min-w-0"><h3 className="font-500">{supplierName}</h3><p className="text-xs text-text-muted mt-0.5">Fulfilling {group.items.length} product{group.items.length === 1 ? "" : "s"}</p></div></div><p className="text-sm text-text-muted mt-3 line-clamp-1">{group.items.map((item) => item.product.name).join(", ")}</p></Card>; })}</div></section>
  </div></DashboardShell>;
}
