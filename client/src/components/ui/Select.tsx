import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, id, className, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-500 text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            className={cn(
              "h-10 w-full appearance-none pl-3 pr-9 rounded-sm border bg-surface text-text-primary text-base",
              "transition-fast focus:outline-none focus:ring-2 focus:ring-primary",
              error ? "border-error" : "border-border",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            aria-hidden
          />
        </div>
        {error && <span className="text-xs text-error">{error}</span>}
        {!error && helperText && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
