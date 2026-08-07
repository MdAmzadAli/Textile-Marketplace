import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface AccordionSectionProps {
  title: string;
  /** Small trailing count/indicator shown next to the title, e.g. active selections. */
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

// Reusable collapsible section. Introduced for the importance-ordered
// FilterPanel sidebar (task 2b-2) — any future "several grouped fields,
// some collapsed by default" UI (supplier profile sections, PDP spec
// tables, etc.) should reuse this instead of hand-rolling open/close state.
export function AccordionSection({ title, badge, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-500 text-text-primary flex items-center gap-1.5">
          {title}
          {badge && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-600">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-fast shrink-0", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}
