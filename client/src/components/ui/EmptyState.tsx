import { ReactNode } from "react";
import { LucideIcon, PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
      <Icon className="h-10 w-10 text-text-muted" aria-hidden />
      <h4 className="font-display text-lg text-text-primary">{title}</h4>
      {description && <p className="text-sm text-text-muted max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
