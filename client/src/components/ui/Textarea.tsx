import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-sm font-500 text-text-primary">
            {label}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            "min-h-24 px-3 py-2 rounded-sm border bg-surface text-text-primary text-base",
            "transition-fast focus:outline-none focus:ring-2 focus:ring-primary",
            error ? "border-error" : "border-border",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
        {!error && helperText && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
