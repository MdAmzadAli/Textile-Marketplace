import { Button, Input } from "../ui";
import { Popover } from "../ui/Popover";
import { SupplierStatsRange } from "../../services/orders.api";

interface DateRangeControlProps {
  range: SupplierStatsRange;
  from: string;
  to: string;
  onRangeChange: (range: SupplierStatsRange) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function DateRangeControl({ range, from, to, onRangeChange, onFromChange, onToChange }: DateRangeControlProps) {
  return <div className="flex flex-wrap items-center gap-1">
    {(["today", "7d", "30d"] as SupplierStatsRange[]).map((value) => <Button key={value} size="sm" variant={range === value ? "primary" : "secondary"} onClick={() => onRangeChange(value)}>{value === "today" ? "Today" : value.toUpperCase()}</Button>)}
    <Popover label="Custom" active={range === "custom"} align="end" panelClassName="w-72">
      {(close) => <div className="flex flex-col gap-3"><p className="text-sm font-500">Custom date range</p><div className="grid grid-cols-2 gap-3"><Input label="From" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} /><Input label="To" type="date" value={to} onChange={(e) => onToChange(e.target.value)} /></div><Button size="sm" className="w-full" disabled={!from || !to} onClick={() => { onRangeChange("custom"); close(); }}>Apply range</Button></div>}
    </Popover>
  </div>;
}
