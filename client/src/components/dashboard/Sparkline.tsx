import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "var(--color-primary)", height = 48 }: SparklineProps) {
  if (data.length === 0) {
    return <div className="h-12 flex items-center text-xs text-text-muted">No data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
