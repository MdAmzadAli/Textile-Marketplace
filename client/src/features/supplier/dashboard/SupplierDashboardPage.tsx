import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, ClipboardList, Boxes } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { StatCard } from "../../../components/dashboard/StatCard";
import { Badge, Button, Card, Skeleton, EmptyState } from "../../../components/ui";
import { DateRangeControl } from "../../../components/supplier/DateRangeControl";
import { SUPPLIER_SIDEBAR_LINKS } from "../supplierNav";
import * as productsApi from "../../../services/products.api";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getSupplierOpenOrderCount, getSupplierOrderStats, getSupplierOrders, SupplierStatsRange } from "../../../services/orders.api";

export default function SupplierDashboardPage() {
  const [range, setRange] = useState<SupplierStatsRange>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const productsQuery = useQuery({ queryKey: ["products", "mine"], queryFn: productsApi.listOwnProducts, refetchInterval: 30_000 });
  const ordersQuery = useQuery({ queryKey: ["orders", "supplier", "dashboard"], queryFn: () => getSupplierOrders({ limit: 5 }), refetchInterval: 30_000 });
  const statsQuery = useQuery({ queryKey: ["orders", "supplier", "stats", range, customFrom, customTo], queryFn: () => getSupplierOrderStats({ range, ...(range === "custom" ? { from: customFrom, to: customTo } : {}) }), enabled: range !== "custom" || (!!customFrom && !!customTo), refetchInterval: 30_000 });
  const openOrdersQuery = useQuery({ queryKey: ["orders", "supplier", "open-count"], queryFn: getSupplierOpenOrderCount, refetchInterval: 30_000 });
  const products = productsQuery.data;
  const lowStock = products?.filter((product) => product.stock < product.moq) ?? [];
  const outOfStock = products?.filter((product) => product.status === "out_of_stock" || product.stock === 0) ?? [];
  const hasDashboardError = productsQuery.isError || ordersQuery.isError || statsQuery.isError || openOrdersQuery.isError;

  return <DashboardShell links={SUPPLIER_SIDEBAR_LINKS} seller>
    <h1 className="mb-6 font-display text-2xl">Dashboard</h1>
    {hasDashboardError && <Card className="mb-4"><EmptyState title="Some dashboard data couldn't load" description="Retry to refresh your inventory, orders, and revenue metrics." action={<Button size="sm" onClick={() => { productsQuery.refetch(); ordersQuery.refetch(); statsQuery.refetch(); openOrdersQuery.refetch(); }}>Retry</Button>} /></Card>}
    <Card className="mb-4" style={{ overflow: "visible" }} header={<div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg">Revenue</h2><p className="text-sm text-text-muted">Seller-scoped completed and in-progress order value</p></div><DateRangeControl range={range} from={customFrom} to={customTo} onRangeChange={setRange} onFromChange={setCustomFrom} onToChange={setCustomTo} /></div>}>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]"><div><p className="font-display text-4xl text-text-primary">{formatCurrency(statsQuery.data?.totalRevenue ?? 0)}</p><p className="mt-2 text-sm text-text-muted">{statsQuery.data?.orderCount ?? 0} orders · {formatCurrency(statsQuery.data?.averageOrderValue ?? 0)} average order value</p></div><RevenueTrendChart data={statsQuery.data?.trend ?? []} loading={statsQuery.isLoading} /></div>
    </Card>
    {productsQuery.isLoading ? <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"><Skeleton variant="card" count={4} /></div> : <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5"><div className="lg:col-span-2"><StatCard label="Open orders" value={openOrdersQuery.data?.openOrderCount ?? 0} icon={ClipboardList} to="/supplier/orders?filter=open" /></div><StatCard label="Low stock" value={lowStock.length} icon={AlertTriangle} to="/supplier/inventory?stock=low" /><StatCard label="Out of stock" value={outOfStock.length} icon={Boxes} to="/supplier/inventory?status=out_of_stock" /><StatCard label="Total products" value={products?.length ?? 0} icon={Package} to="/supplier/inventory" /></div>}
    <Card header={<h3 className="font-display text-lg">Recent orders</h3>}>
      {ordersQuery.isLoading && <Skeleton variant="row" count={3} />}
      {ordersQuery.isError && <EmptyState title="Couldn't load recent orders" />}
      {ordersQuery.isSuccess && !ordersQuery.data?.items.length && <EmptyState title="No orders yet" description="Orders placed against your listings will show up here." />}
      {ordersQuery.data?.items.map((order) => <Link key={order.id} to={`/supplier/orders?search=${encodeURIComponent(order.id)}`} className="flex items-center justify-between gap-3 border-b border-border py-3 transition-colors hover:bg-bg/50 last:border-0"><div><p className="text-sm font-500">Order {order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-text-muted">{order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatCurrency(order.sellerTotal ?? 0)}</p></div><Badge status={order.status}>{order.status}</Badge></Link>)}
    </Card>
    {lowStock.length > 0 && <Card className="mt-4" header={<h3 className="font-display text-lg">Inventory alerts</h3>}><ul className="flex flex-col gap-2">{lowStock.map((product) => <li key={product.id}><Link to={`/supplier/inventory?stock=low&search=${encodeURIComponent(product.name)}`} className="flex justify-between rounded-sm py-1 text-sm transition-colors hover:bg-bg/50"><span>{product.name}</span><span className="font-500 text-warning">{product.stock} left</span></Link></li>)}</ul></Card>}
  </DashboardShell>;
}

function RevenueTrendChart({ data, loading }: { data: { date: string; revenue: number }[]; loading: boolean }) {
  if (loading) return <div className="h-44"><Skeleton variant="card" /></div>;
  if (data.length === 0) return <div className="flex h-44 items-center justify-center text-sm text-text-muted">No revenue data for this range.</div>;
  if (data.length === 1) {
    const point = data[0];
    const label = new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    return <div className="flex h-44 flex-col justify-center rounded-md border border-primary/20 bg-primary/5 p-5"><p className="text-xs font-500 uppercase tracking-wide text-text-muted">Revenue for {label}</p><p className="mt-1 font-display text-3xl text-text-primary">{formatCurrency(point.revenue)}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/15"><div className="h-full min-w-1 rounded-full bg-primary" style={{ width: point.revenue > 0 ? "100%" : "0%" }} /></div><p className="mt-2 text-xs text-text-muted">Single-day view</p></div>;
  }
  return <div className="h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} fontSize={11} /><YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={11} width={56} /><Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Date: ${label}`} /><Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.18} /></AreaChart></ResponsiveContainer></div>;
}
