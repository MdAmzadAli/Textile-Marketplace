import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../ui";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  to?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, to, trend }: StatCardProps) {
  const content = (
    <Card className="hover:shadow-modal transition-fast">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="font-display text-3xl text-text-primary mt-1">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1", trend.positive ? "text-success" : "text-error")}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}
