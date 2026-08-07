import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, ArrowRight, List, LayoutGrid, Search } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Card, Badge, Skeleton, EmptyState, Select, Button, Input } from "../../../components/ui";
import { DateRangeControl } from "../../../components/supplier/DateRangeControl";
import { OrderKanbanColumn } from "../../../components/dashboard/OrderKanbanColumn";
import { SupplierOrderDetailDrawer } from "./SupplierOrderDetailDrawer";
import { SUPPLIER_SIDEBAR_LINKS } from "../supplierNav";
import { getSupplierOrders, advanceOrderStatus, SupplierStatsRange } from "../../../services/orders.api";
import { formatCurrency } from "../../../utils/formatCurrency";
import { ORDER_STATUSES } from "../../../utils/orderStatuses";
import { Order, OrderStatus } from "../../../types";
import { useToastStore } from "../../../store/toastStore";

const STATUS_OPTIONS = ORDER_STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }));
type ViewMode = "list" | "kanban";

export default function SupplierOrdersPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [openOnly, setOpenOnly] = useState(() => searchParams.get("filter") === "open");
  const [view, setView] = useState<ViewMode>("list");
  const [range, setRange] = useState<SupplierStatsRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);

  const ordersQuery = useQuery({
    queryKey: ["orders", "supplier", view === "list" ? status : "all"],
    queryFn: () => getSupplierOrders({ status: view === "list" ? status || undefined : undefined, limit: 100 }),
    refetchInterval: 30_000,
  });
  const advanceMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: string; nextStatus: OrderStatus }) => advanceOrderStatus(orderId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "supplier"] });
      push("Order status updated", "success");
    },
    onError: (err: any) => push(err?.response?.data?.error?.message || "Could not update status", "error"),
  });

  const orders = ordersQuery.data?.items ?? [];
  const visibleOrders = useMemo(() => orders.filter((order) => matchesListFilters(order, search, range, customFrom, customTo, openOnly)), [orders, search, range, customFrom, customTo, openOnly]);
  const advancingOrderId = advanceMutation.isPending ? advanceMutation.variables?.orderId : undefined;
  const hasActiveListFilter = Boolean(status || openOnly || search || range !== "30d" || customFrom || customTo);

  function advance(orderId: string, nextStatus: OrderStatus) {
    advanceMutation.mutate({ orderId, nextStatus });
  }

  return (
    <DashboardShell links={SUPPLIER_SIDEBAR_LINKS} seller>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Orders</h1>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-sm border border-border">
            <Button variant={view === "list" ? "primary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("list")} aria-label="List view"><List className="h-4 w-4" /></Button>
            <Button variant={view === "kanban" ? "primary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("kanban")} aria-label="Kanban view"><LayoutGrid className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {view === "list" && <Card className="mb-4" style={{ overflow: "visible" }}><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto_auto]"><Input aria-label="Search orders" placeholder="Search order ID or buyer name" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" /><Select aria-label="Filter by status" placeholder="All statuses" value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} /><Button variant={openOnly ? "primary" : "secondary"} onClick={() => setOpenOnly((value) => !value)}>Open orders</Button><DateRangeControl range={range} from={customFrom} to={customTo} onRangeChange={setRange} onFromChange={setCustomFrom} onToChange={setCustomTo} /></div></Card>}

      {ordersQuery.isLoading && <Card><Skeleton variant="row" count={5} /></Card>}
      {ordersQuery.isError && <Card><EmptyState title="Couldn't load orders" action={<Button size="sm" onClick={() => ordersQuery.refetch()}>Retry</Button>} /></Card>}
      {ordersQuery.isSuccess && visibleOrders.length === 0 && <Card><EmptyState icon={ClipboardList} title="No orders found" description={hasActiveListFilter && view === "list" ? "Try changing your search, date range, or filters." : "Orders placed against your products will show up here."} /></Card>}

      {ordersQuery.isSuccess && visibleOrders.length > 0 && view === "list" && (
        <Card><div className="flex flex-col">{visibleOrders.map((order) => {
          const currentIndex = ORDER_STATUSES.indexOf(order.status);
          const nextStatus = ORDER_STATUSES[currentIndex + 1];
          return <div key={order.id} className="border-b border-border last:border-0"><div role="button" tabIndex={0} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)} onKeyDown={(e) => e.key === "Enter" && setSelectedOrderId(selectedOrderId === order.id ? null : order.id)} className="flex cursor-pointer items-center justify-between gap-3 py-3 hover:bg-bg/50">
            <div className="min-w-0"><p className="text-sm font-500 text-text-primary">Order #{order.id.slice(0, 8)} <span className="font-normal text-text-muted">· {order.buyer?.name ?? "Buyer"}</span></p><p className="mt-1 text-xs text-text-muted">{order.items.length} item{order.items.length === 1 ? "" : "s"} · {new Date(order.createdAt).toLocaleDateString()} · {formatCurrency(order.sellerTotal ?? 0)}</p></div>
            <div className="flex shrink-0 items-center gap-2"><Badge status={order.status}>{order.status}</Badge>{nextStatus && <Button variant="secondary" size="sm" loading={advancingOrderId === order.id} onClick={(e) => { e.stopPropagation(); advance(order.id, nextStatus); }}>Mark as {nextStatus} <ArrowRight className="h-3.5 w-3.5" /></Button>}</div>
          </div>{selectedOrderId === order.id && <SupplierOrderDetailDrawer orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} onAdvance={advance} advancingOrderId={advancingOrderId} />}</div>;
        })}</div></Card>
      )}

      {ordersQuery.isSuccess && orders.length > 0 && view === "kanban" && <div className="flex gap-4 overflow-x-auto pb-4">{ORDER_STATUSES.map((columnStatus, i) => <OrderKanbanColumn key={columnStatus} status={columnStatus} orders={orders.filter((o) => o.status === columnStatus)} nextStatus={ORDER_STATUSES[i + 1]} onAdvance={(orderId) => advance(orderId, ORDER_STATUSES[i + 1])} advancingOrderId={advancingOrderId} />)}</div>}
    </DashboardShell>
  );
}

function matchesListFilters(order: Order, search: string, range: SupplierStatsRange, from: string, to: string, openOnly: boolean) {
  const normalized = search.trim().toLowerCase();
  if (normalized && !order.id.toLowerCase().includes(normalized) && !(order.buyer?.name ?? "").toLowerCase().includes(normalized)) return false;
  if (openOnly && order.status === "completed") return false;
  const createdAt = new Date(order.createdAt);
  const today = new Date();
  if (range === "custom") {
    if (from && createdAt < startOfDate(from)) return false;
    if (to && createdAt >= endOfDate(to)) return false;
    return true;
  }
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const start = new Date(today); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
  return createdAt >= start;
}

function startOfDate(value: string) { const date = new Date(`${value}T00:00:00`); return date; }
function endOfDate(value: string) { const date = startOfDate(value); date.setDate(date.getDate() + 1); return date; }
