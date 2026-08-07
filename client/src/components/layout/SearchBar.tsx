import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

interface SearchBarProps {
  className?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}

// Single source of truth for "search" as a CTA — used in Navbar (every page)
// and the homepage hero. Always routes to /discover so results, filters and
// AI/visual search entry points live in one place (§11 pipeline reuse).
export function SearchBar({ className, size = "md", autoFocus }: SearchBarProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("search") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    navigate(trimmed ? `/discover?search=${encodeURIComponent(trimmed)}` : "/discover");
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={cn("w-full", className)}>
      <label htmlFor="global-search" className="sr-only">
        Search fabrics, suppliers, categories
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-sm border border-border bg-surface transition-fast",
          "focus-within:ring-2 focus-within:ring-primary",
          size === "lg" ? "h-14 px-5" : "h-10 px-3"
        )}
      >
        <Search className={cn("shrink-0 text-text-muted", size === "lg" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
        <input
          id="global-search"
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search fabrics, e.g. cotton poplin, denim, silk blend..."
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none text-text-primary placeholder:text-text-muted",
            size === "lg" ? "text-lg" : "text-base"
          )}
        />
        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "shrink-0 rounded-sm bg-primary text-white hover:bg-primary-dark transition-fast flex items-center justify-center",
            size === "lg" ? "h-10 w-10" : "h-7 w-7"
          )}
        >
          <Search className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
        </button>
      </div>
    </form>
  );
}
