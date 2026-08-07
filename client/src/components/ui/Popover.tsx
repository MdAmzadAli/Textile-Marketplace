import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface PopoverProps {
  /** Default pill label, shown when no filter is active. */
  label: string;
  /** Pill styling switches to the "active" state (accent border/fill). */
  active?: boolean;
  /** Overrides `label` when a filter is active, e.g. "Price · ₹200–₹500". */
  activeLabel?: string;
  /** Render-prop so panel content can close itself (e.g. after "Apply"). */
  children: (close: () => void) => ReactNode;
  panelClassName?: string;
  triggerClassName?: string;
  /** Keep the panel attached to the trigger while choosing its horizontal edge. */
  align?: "start" | "end";
}

// Shared trigger+panel primitive for the discovery quick-filter bar (and any
// future compact filter UI): a pill button that reveals a floating panel
// below it, closes on outside click or Escape, and never navigates away —
// keeps the whole filtering interaction in place above the product grid.
export function Popover({ label, active, activeLabel, children, panelClassName, triggerClassName, align = "start" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative shrink-0", open && "z-40")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm whitespace-nowrap transition-fast",
          active
            ? "border-primary bg-primary/5 text-primary font-500"
            : "border-border bg-surface text-text-primary hover:border-primary/50",
          triggerClassName
        )}
      >
        {active && activeLabel ? activeLabel : label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-fast shrink-0", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute top-full mt-2 z-30 w-64 max-w-[85vw] rounded-md border border-border bg-surface shadow-modal p-4",
            align === "end" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
