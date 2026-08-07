import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
}

export function Card({ header, footer, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-md shadow-card overflow-hidden",
        className
      )}
      {...props}
    >
      {header && <div className="p-4 border-b border-border">{header}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="p-4 border-t border-border">{footer}</div>}
    </div>
  );
}
