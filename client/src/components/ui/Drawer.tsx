import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ open, onClose, title, children, footer, side = "right" }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-text-primary/40 transition-fast"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex flex-col w-full max-w-sm bg-surface shadow-modal transition-base h-full",
          side === "right" ? "ml-auto" : "mr-auto"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && <h3 className="font-display text-xl">{title}</h3>}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto text-text-muted hover:text-text-primary transition-fast"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="p-4 border-t border-border">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
