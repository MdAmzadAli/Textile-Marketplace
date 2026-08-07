import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Category } from "../../types";
import { buildCategoryTree } from "../../utils/categoryTree";

interface GroupedCategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
}

/**
 * A shared leaf-only category picker. Parent groups explain the taxonomy but
 * are intentionally not selectable; their sticky headings stay visible while
 * their leaf options scroll beneath them.
 */
export function GroupedCategorySelect({ categories, value, onChange, label, placeholder = "Select a category", allowClear = false, className = "" }: GroupedCategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((category) => category.id === value);
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return buildCategoryTree(categories).map((group) => ({
      ...group,
      children: group.children.filter((child) => !term || group.name.toLowerCase().includes(term) || child.name.toLowerCase().includes(term)),
    })).filter((group) => group.children.length > 0);
  }, [categories, search]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return <div ref={rootRef} className={`relative flex min-w-0 flex-col gap-1 ${open ? "z-40" : ""} ${className}`}>
    {label && <span className="text-sm font-500 text-text-primary">{label}</span>}
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-10 w-full items-center gap-2 rounded-sm border border-border bg-surface px-3 text-left text-base text-text-primary transition-fast focus:outline-none focus:ring-2 focus:ring-primary">
      <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-text-muted"}`}>{selected?.name ?? placeholder}</span>
      {allowClear && value && <span role="button" tabIndex={0} aria-label="Clear category" onClick={(event) => { event.stopPropagation(); select(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.stopPropagation(); select(""); } }} className="rounded-sm p-0.5 text-text-muted hover:bg-bg"><X className="h-3.5 w-3.5" /></span>}
      <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-modal">
      <div className="border-b border-border p-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="h-9 w-full rounded-sm border border-border bg-bg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></div></div>
      <div role="listbox" className="max-h-72 overflow-y-auto overscroll-contain">
        {allowClear && <button type="button" role="option" aria-selected={!value} onClick={() => select("")} className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-bg">All categories</button>}
        {groups.map((group) => <section key={group.id} className="relative">
          <p className="sticky top-0 z-10 border-y border-border bg-bg px-3 py-2 text-xs font-600 uppercase tracking-wide text-text-muted">{group.name}</p>
          {group.children.map((category) => <button key={category.id} type="button" role="option" aria-selected={value === category.id} onClick={() => select(category.id)} className={`flex w-full items-center gap-2 px-3 py-2.5 pl-6 text-left text-sm transition-fast hover:bg-primary/5 ${value === category.id ? "bg-primary/10 text-primary" : "text-text-primary"}`}><span className="min-w-0 flex-1">{category.name}</span>{value === category.id && <Check className="h-4 w-4 shrink-0" />}</button>)}
        </section>)}
        {groups.length === 0 && <p className="px-3 py-6 text-center text-sm text-text-muted">No categories match “{search}”.</p>}
      </div>
    </div>}
  </div>;
}
