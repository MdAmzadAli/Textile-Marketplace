import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

// Centralized status→color mapping. Add new statuses here only — never per-usage.
export type BadgeStatus =
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "active"
  | "out_of_stock"
  | "inactive";

const statusClasses: Record<BadgeStatus, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-border text-text-muted",
  pending: "bg-warning/10 text-warning",
  accepted: "bg-primary/10 text-primary",
  preparing: "bg-accent/10 text-accent",
  ready: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  out_of_stock: "bg-error/10 text-error",
  inactive: "bg-border text-text-muted",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

export function Badge({ status, children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-sm text-xs font-500 capitalize",
        statusClasses[status],
        className
      )}
      {...props}
    >
      {children ?? status.replace(/_/g, " ")}
    </span>
  );
}
