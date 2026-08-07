import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function PageContainer({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-4 md:px-6 py-6", className)} {...props}>
      {children}
    </div>
  );
}
