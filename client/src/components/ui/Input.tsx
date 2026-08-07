import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-500 text-text-primary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            "h-10 px-3 rounded-sm border bg-surface text-text-primary text-base",
            "transition-fast focus:outline-none focus:ring-2 focus:ring-primary",
            error ? "border-error" : "border-border",
            className
          )}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="text-xs text-error">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
