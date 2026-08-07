import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, LayoutGrid, List as ListIcon, Plus, Search, Trash2 } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Button, Skeleton, EmptyState, Modal, Input, Select, Card, Drawer, Popover } from "../../../components/ui";
import { InventoryTable } from "../../../components/dashboard/InventoryTable";
import { ProductCard } from "../../../components/product/ProductCard";
import { ProductFormModal } from "./ProductFormModal";
import { SUPPLIER_SIDEBAR_LINKS } from "../supplierNav";
import * as productsApi from "../../../services/products.api";
import { listCategories } from "../../../services/categories.api";
import { useToastStore } from "../../../store/toastStore";
import { Product, ProductStatus } from "../../../types";
import { GroupedCategorySelect } from "../../../components/supplier/GroupedCategorySelect";
import { buildCategoryTree } from "../../../utils/categoryTree";

const PAGE_SIZE = 12;
const STATUS_OPTIONS = [{ label: "Active", value: "active" }, { label: "Out of stock", value: "out_of_stock" }, { label: "Inactive", value: "inactive" }];
const STOCK_HEALTH_OPTIONS = [{ label: "Low stock", value: "low" }, { label: "Near MOQ", value: "near" }];
const SORT_OPTIONS = [{ label: "Date added (newest)", value: "date_desc" }, { label: "Date added (oldest)", value: "date_asc" }, { label: "Stock (low to high)", value: "stock_asc" }, { label: "Stock (high to low)", value: "stock_desc" }, { label: "Price (low to high)", value: "price_asc" }, { label: "Price (high to low)", value: "price_desc" }];
type StockHealth = "" | "low" | "near";

export default function SupplierInventoryPage() {
  const [searchParams] = useSearchParams();
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"table" | "card">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState<ProductStatus | "">(() => searchParams.get("status") as ProductStatus | "" ?? "");
  const [stockHealth, setStockHealth] = useState<StockHealth>(() => searchParams.get("stock") === "low" ? "low" : searchParams.get("stock") === "near" ? "near" : "");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("inactive");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openDrawerFilter, setOpenDrawerFilter] = useState<"status" | "stock" | "sort" | null>(null);
  const push = useToastStore((s) => s.push);
  const queryClient = useQueryClient();
  const { data: products, isLoading, isError } = useQuery({ queryKey: ["products", "mine"], queryFn: productsApi.listOwnProducts, refetchInterval: 30_000 });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const categoryGroups = useMemo(() => buildCategoryTree(categories), [categories]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products", "mine"] });

  const createMutation = useMutation({ mutationFn: productsApi.createProduct, onSuccess: () => { push("Product created", "success"); setFormOpen(false); invalidate(); }, onError: (err: any) => push(err?.response?.data?.error?.message || "Could not create product", "error") });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<productsApi.ProductInput> }) => productsApi.updateProduct(id, input), onSuccess: () => { push("Product updated", "success"); setFormOpen(false); setEditing(null); invalidate(); }, onError: (err: any) => push(err?.response?.data?.error?.message || "Could not update product", "error") });
  const deleteMutation = useMutation({ mutationFn: async (ids: string[]) => Promise.all(ids.map(productsApi.deleteProduct)), onSuccess: (_result, ids) => { push(ids.length === 1 ? "Product deleted" : `${ids.length} products deleted`, "success"); setDeleting([]); setSelectedIds((selected) => selected.filter((id) => !ids.includes(id))); invalidate(); }, onError: (err: any) => push(err?.response?.data?.error?.message || "Could not delete products", "error") });
  const bulkStatusMutation = useMutation({ mutationFn: async ({ ids, status: nextStatus }: { ids: string[]; status: ProductStatus }) => Promise.all(ids.map((id) => productsApi.updateProduct(id, { status: nextStatus }))), onSuccess: (_result, variables) => { push(`${variables.ids.length} products updated`, "success"); setSelectedIds([]); invalidate(); }, onError: (err: any) => push(err?.response?.data?.error?.message || "Could not update selected products", "error") });

  const filteredProducts = useMemo(() => filterAndSort(products ?? [], search, status, stockHealth, categoryId, sort), [products, search, status, stockHealth, categoryId, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedOnPage = pageProducts.filter((product) => selectedIds.includes(product.id));

  function setFilter(update: () => void) { update(); setPage(1); }
  function toggleSelection(id: string) { setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]); }
  function togglePageSelection() { setSelectedIds((ids) => selectedOnPage.length === pageProducts.length ? ids.filter((id) => !pageProducts.some((product) => product.id === id)) : [...new Set([...ids, ...pageProducts.map((product) => product.id)])]); }
  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(product: Product) { setEditing(product); setFormOpen(true); }
  function handleSubmit(input: productsApi.ProductInput) { editing ? updateMutation.mutate({ id: editing.id, input }) : createMutation.mutate(input); }
  function quickUpdate(id: string, patch: Partial<productsApi.ProductInput>) { updateMutation.mutate({ id, input: patch }); }

  return <DashboardShell links={SUPPLIER_SIDEBAR_LINKS} seller>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl">Inventory</h1><div className="flex items-center gap-2"><div className="flex overflow-hidden rounded-sm border border-border"><button onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-primary text-white" : "bg-surface text-text-muted"}`} aria-label="Table view"><ListIcon className="h-4 w-4" /></button><button onClick={() => setView("card")} className={`p-2 ${view === "card" ? "bg-primary text-white" : "bg-surface text-text-muted"}`} aria-label="Card view"><LayoutGrid className="h-4 w-4" /></button></div><Button onClick={openCreate}><Plus className="h-4 w-4" /> Add product</Button></div></div>
    <div className="relative mb-2 md:hidden"><Input ref={mobileSearchRef} aria-label="Search inventory" placeholder="Search name or category" value={search} onChange={(e) => setFilter(() => setSearch(e.target.value))} className="pr-11" /><button type="button" aria-label="Search inventory" onClick={() => { setFilter(() => setSearch(search.trim())); mobileSearchRef.current?.focus(); }} className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-text-muted transition-fast hover:text-primary"><Search className="h-5 w-5" /></button></div>
    <div className="mb-4 grid grid-cols-4 gap-1.5 md:hidden"><CompactFilter label="Status" active={!!status} options={[{ label: "All statuses", value: "" }, ...STATUS_OPTIONS]} value={status} onChange={(value) => setFilter(() => setStatus(value as ProductStatus | ""))} /><CompactFilter label="Stock" active={!!stockHealth} options={[{ label: "All stock levels", value: "" }, ...STOCK_HEALTH_OPTIONS]} value={stockHealth} onChange={(value) => setFilter(() => setStockHealth(value as StockHealth))} /><Popover label="Category" active={!!categoryId} align="end" triggerClassName="w-full justify-between !h-9 !px-2 text-xs" panelClassName="!w-72 !max-w-[calc(100vw-2rem)]">{(close) => <div className="-m-1 max-h-64 overflow-y-auto"><button type="button" onClick={() => { setFilter(() => setCategoryId("")); close(); }} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-bg ${!categoryId ? "bg-primary/10 text-primary" : "text-text-primary"}`}><span className="flex-1">All categories</span>{!categoryId && <Check className="h-4 w-4" />}</button>{categoryGroups.map((group) => <section key={group.id} className="border-t border-border"><p className="bg-bg px-3 py-2 text-xs font-600 uppercase tracking-wide text-text-muted">{group.name}</p>{group.children.map((category) => <button key={category.id} type="button" onClick={() => { setFilter(() => setCategoryId(category.id)); close(); }} className={`flex w-full items-center gap-2 px-3 py-2.5 pl-5 text-left text-sm hover:bg-bg ${categoryId === category.id ? "bg-primary/10 text-primary" : "text-text-primary"}`}><span className="flex-1">{category.name}</span>{categoryId === category.id && <Check className="h-4 w-4" />}</button>)}</section>)}</div>}</Popover><CompactFilter label="Sort" active={sort !== "date_desc"} options={SORT_OPTIONS} value={sort} onChange={(value) => setFilter(() => setSort(value))} align="end" /></div>
    <Card className="mb-4 hidden md:block" style={{ overflow: "visible" }}><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5"><Input aria-label="Search inventory" placeholder="Search name or category" value={search} onChange={(e) => setFilter(() => setSearch(e.target.value))} /><Select aria-label="Filter by status" placeholder="All statuses" value={status} options={STATUS_OPTIONS} onChange={(e) => setFilter(() => setStatus(e.target.value as ProductStatus | ""))} /><Select aria-label="Filter by stock health" placeholder="All stock levels" value={stockHealth} options={STOCK_HEALTH_OPTIONS} onChange={(e) => setFilter(() => setStockHealth(e.target.value as StockHealth))} /><GroupedCategorySelect categories={categories} value={categoryId} allowClear placeholder="All categories" onChange={(value) => setFilter(() => setCategoryId(value))} /><Select aria-label="Sort inventory" value={sort} options={SORT_OPTIONS} onChange={(e) => setFilter(() => setSort(e.target.value))} /></div></Card>
    {selectedIds.length > 0 && <Card className="mb-4"><div className="flex flex-wrap items-center gap-3"><p className="text-sm font-500">{selectedIds.length} selected</p><div className="flex flex-1 flex-wrap items-center gap-2"><Select aria-label="Bulk status" value={bulkStatus} options={STATUS_OPTIONS} onChange={(e) => setBulkStatus(e.target.value as ProductStatus)} className="w-44" /><Button size="sm" loading={bulkStatusMutation.isPending} onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: bulkStatus })}>Update status</Button><Button variant="destructive" size="sm" onClick={() => setDeleting((products ?? []).filter((product) => selectedIds.includes(product.id)))}><Trash2 className="h-4 w-4" /> Delete selected</Button><Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Clear</Button></div></div></Card>}
    {isLoading && <Skeleton variant="row" count={5} />}
    {isError && <EmptyState title="Couldn't load inventory" description="Something went wrong fetching your products. Try refreshing." action={<Button onClick={invalidate}>Retry</Button>} />}
    {!isLoading && !isError && products?.length === 0 && <EmptyState title="No products yet" description="Add your first product so buyers can discover it." action={<Button onClick={openCreate}>Add product</Button>} />}
    {!isLoading && !isError && products && products.length > 0 && filteredProducts.length === 0 && <EmptyState icon={Search} title="No matching products" description="Try changing your search or filters." action={<Button variant="secondary" onClick={() => { setSearch(""); setStatus(""); setStockHealth(""); setCategoryId(""); setPage(1); }}>Clear filters</Button>} />}
    {!isLoading && !isError && pageProducts.length > 0 && view === "table" && <InventoryTable products={pageProducts} selectedIds={selectedIds} onToggleSelection={toggleSelection} onTogglePageSelection={togglePageSelection} pageAllSelected={pageProducts.length > 0 && selectedOnPage.length === pageProducts.length} onQuickUpdate={quickUpdate} onEdit={openEdit} onDelete={(product) => setDeleting([product])} />}
    {!isLoading && !isError && pageProducts.length > 0 && view === "card" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{pageProducts.map((product) => <div key={product.id} className={`relative rounded-md ${selectedIds.includes(product.id) ? "ring-2 ring-primary" : ""}`}><label className="absolute left-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm bg-surface shadow"><input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedIds.includes(product.id)} onChange={() => toggleSelection(product.id)} /></label><ProductCard product={product} productLink={`/supplier/products/${product.id}/preview`} actions={<><Button variant="ghost" size="sm" onClick={() => openEdit(product)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting([product])}>Delete</Button></>} /></div>)}</div>}
    {filteredProducts.length > PAGE_SIZE && <div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm text-text-muted">Page {safePage} of {totalPages}</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Next</Button></div></div>}
    <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} submitting={createMutation.isPending || updateMutation.isPending} initial={editing} />
    <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Inventory filters" side="left" footer={<Button className="w-full" onClick={() => setFiltersOpen(false)}>Show products</Button>}><div className="flex flex-col gap-5"><DrawerFilterChoices label="Status" clearLabel="All statuses" value={status} options={STATUS_OPTIONS} open={openDrawerFilter === "status"} onToggle={() => setOpenDrawerFilter((current) => current === "status" ? null : "status")} onChange={(value) => setFilter(() => setStatus(value as ProductStatus | ""))} /><DrawerFilterChoices label="Stock health" clearLabel="All stock levels" value={stockHealth} options={STOCK_HEALTH_OPTIONS} open={openDrawerFilter === "stock"} onToggle={() => setOpenDrawerFilter((current) => current === "stock" ? null : "stock")} onChange={(value) => setFilter(() => setStockHealth(value as StockHealth))} /><GroupedCategorySelect label="Category" categories={categories} value={categoryId} allowClear placeholder="All categories" onChange={(value) => setFilter(() => setCategoryId(value))} /><DrawerFilterChoices label="Sort by" value={sort} options={SORT_OPTIONS} open={openDrawerFilter === "sort"} onToggle={() => setOpenDrawerFilter((current) => current === "sort" ? null : "sort")} onChange={(value) => setFilter(() => setSort(value))} /><Button variant="ghost" onClick={() => { setSearch(""); setStatus(""); setStockHealth(""); setCategoryId(""); setSort("date_desc"); setPage(1); }}>Clear all filters</Button></div></Drawer>
    <Modal open={deleting.length > 0} onClose={() => setDeleting([])} title={deleting.length === 1 ? "Delete product" : "Delete products"} footer={<><Button variant="secondary" onClick={() => setDeleting([])}>Cancel</Button><Button variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.map((product) => product.id))}>Delete</Button></>}><p className="text-sm text-text-primary">{deleting.length === 1 ? <>Delete <span className="font-500">{deleting[0]?.name}</span>? This cannot be undone.</> : <>Delete {deleting.length} selected products? This cannot be undone.</>}</p></Modal>
  </DashboardShell>;
}

interface DrawerFilterChoicesProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  clearLabel?: string;
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}

interface CompactFilterProps {
  label: string;
  active: boolean;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  align?: "start" | "end";
}

function CompactFilter({ label, active, value, options, onChange, align = "start" }: CompactFilterProps) {
  return <Popover label={label} active={active} align={align} triggerClassName="w-full justify-between !h-9 !px-2 text-xs" panelClassName="!w-48 !max-w-[calc(100vw-2rem)]">{(close) => <div className="-m-1 overflow-hidden rounded-sm">{options.map((option) => <button key={option.value || "all"} type="button" onClick={() => { onChange(option.value); close(); }} className={`flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm last:border-0 hover:bg-bg ${value === option.value ? "bg-primary/10 text-primary" : "text-text-primary"}`}><span className="flex-1">{option.label}</span>{value === option.value && <Check className="h-4 w-4" />}</button>)}</div>}</Popover>;
}

/** Mobile drawer options expand in place, avoiding browser select menus that can overflow the viewport. */
function DrawerFilterChoices({ label, value, options, clearLabel, open, onToggle, onChange }: DrawerFilterChoicesProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? clearLabel ?? options[0]?.label;
  function choose(nextValue: string) { onChange(nextValue); onToggle(); }
  return (
    <section className="border-b border-border pb-4 last:border-0">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={onToggle} aria-expanded={open}>
        <span><span className="block text-sm font-500 text-text-primary">{label}</span><span className="mt-0.5 block text-sm text-text-muted">{selectedLabel}</span></span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 overflow-hidden rounded-sm border border-border">
        {clearLabel && <button type="button" onClick={() => choose("")} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-bg ${!value ? "bg-primary/10 text-primary" : "text-text-primary"}`}>
          <span className="flex-1">{clearLabel}</span>{!value && <Check className="h-4 w-4" />}
        </button>}
        {options.map((option) => <button key={option.value} type="button" onClick={() => choose(option.value)} className={`flex w-full items-center gap-2 ${clearLabel ? "border-t border-border" : ""} px-3 py-2.5 text-left text-sm hover:bg-bg ${value === option.value ? "bg-primary/10 text-primary" : "text-text-primary"}`}>
          <span className="flex-1">{option.label}</span>{value === option.value && <Check className="h-4 w-4" />}
        </button>)}
      </div>}
    </section>
  );
}

function filterAndSort(products: Product[], search: string, status: ProductStatus | "", stockHealth: StockHealth, categoryId: string, sort: string) {
  const normalized = search.trim().toLowerCase();
  const filtered = products.filter((product) => (!normalized || product.name.toLowerCase().includes(normalized) || product.category?.name.toLowerCase().includes(normalized)) && (!status || product.status === status) && (!stockHealth || (stockHealth === "low" ? product.stock < product.moq : product.stock > product.moq && product.stock <= product.moq + Math.max(1, Math.ceil(product.moq * 0.2)))) && (!categoryId || product.categoryId === categoryId));
  return [...filtered].sort((a, b) => {
    if (sort === "stock_asc") return a.stock - b.stock;
    if (sort === "stock_desc") return b.stock - a.stock;
    if (sort === "price_asc") return Number(a.price) - Number(b.price);
    if (sort === "price_desc") return Number(b.price) - Number(a.price);
    const dateDiff = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    return sort === "date_asc" ? dateDiff : -dateDiff;
  });
}
