import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          "relative flex max-h-[calc(100dvh-2rem)] w-full flex-col bg-surface rounded-md shadow-modal transition-base",
          sizeClasses[size]
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
        <div className="min-h-0 overflow-y-auto p-4 [&>form>button:last-child]:sticky [&>form>button:last-child]:bottom-0 [&>form>button:last-child]:shadow-modal">{children}</div>
        {footer && <div className="p-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
