import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentIndex: number;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({ steps, currentIndex, orientation = "horizontal" }: StepperProps) {
  return (
    <ol
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-center" : "flex-col gap-4"
      )}
    >
      {steps.map((step, i) => {
        const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li
            key={step.label}
            className={cn(
              "flex items-center gap-2",
              orientation === "horizontal" && i < steps.length - 1 && "flex-1"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-sm font-600 shrink-0",
                  status === "done" && "bg-success text-white",
                  status === "current" && "bg-primary text-white",
                  status === "upcoming" && "bg-border text-text-muted"
                )}
              >
                {status === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  status === "upcoming" ? "text-text-muted" : "text-text-primary font-500"
                )}
              >
                {step.label}
              </span>
            </div>
            {orientation === "horizontal" && i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-2",
                  status === "done" ? "bg-success" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
