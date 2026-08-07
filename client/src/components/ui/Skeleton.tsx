import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "row" | "text";
  count?: number;
}

export function Skeleton({ variant = "text", count = 1, className, ...props }: SkeletonProps) {
  const base = "animate-pulse bg-border rounded-sm";

  const variantClasses = {
    card: "h-56 w-full rounded-md",
    row: "h-12 w-full",
    text: "h-4 w-full",
  };

  return (
    <div className="flex flex-col gap-2" {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(base, variantClasses[variant], className)} />
      ))}
    </div>
  );
}
