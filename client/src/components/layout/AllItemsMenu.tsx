import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "../../services/categories.api";
import { buildCategoryTree } from "../../utils/categoryTree";
import { cn } from "../../utils/cn";
import { Drawer } from "../ui";

// The single entry point to the full catalog taxonomy. Grouped by parent
// category (Raw & Finished Fabrics, Trims & Notions, ...) so a buyer can
// jump straight to a specific leaf (e.g. "Zippers") without going through
// the category landing page first.
export function AllItemsMenu({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const tree = buildCategoryTree(categories);
  const menuContent = tree.map((parent) => (
    <div key={parent.id}>
      <Link to={`/category/${parent.id}`} onClick={() => setOpen(false)} className="block font-display text-sm text-primary font-600 mb-2 hover:underline">
        {parent.name}
      </Link>
      <ul className="flex flex-col gap-1.5">
        {parent.children.map((child) => <li key={child.id}><Link to={`/discover?category=${child.id}`} onClick={() => setOpen(false)} className="text-sm text-text-muted hover:text-primary transition-fast">{child.name}</Link></li>)}
      </ul>
    </div>
  ));

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", mobile && "shrink-0")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn("inline-flex items-center gap-1.5 h-9 px-2 md:px-3 rounded-sm text-sm font-500 text-text-primary hover:bg-bg transition-fast", mobile && "text-xs")}
      >
        <Menu className="h-4 w-4" aria-hidden />
        All Items
        <ChevronDown className={cn("h-3.5 w-3.5 transition-fast", open && "rotate-180")} aria-hidden />
      </button>

      {!mobile && open && tree.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-[min(90vw,760px)] rounded-md border border-border bg-surface shadow-modal p-6 grid grid-cols-2 lg:grid-cols-4 gap-6"
          role="menu"
        >
          {menuContent}
        </div>
      )}
      {mobile && <Drawer open={open} onClose={() => setOpen(false)} title="All items" side="left"><div className="grid grid-cols-1 gap-6">{menuContent}</div></Drawer>}
    </div>
  );
}
