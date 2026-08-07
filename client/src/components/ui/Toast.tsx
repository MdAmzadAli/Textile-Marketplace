import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, ToastVariant } from "../../store/toastStore";
import { cn } from "../../utils/cn";

const variantConfig: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: "border-success text-success" },
  error: { icon: XCircle, classes: "border-error text-error" },
  info: { icon: Info, classes: "border-primary text-primary" },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => {
        const { icon: Icon, classes } = variantConfig[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "flex items-start gap-2 bg-surface border rounded-sm shadow-modal p-3 transition-base",
              classes
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <p className="text-sm text-text-primary flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
