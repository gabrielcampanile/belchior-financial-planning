import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CurrencyCode } from "@/domain/currency";
import { formatCents } from "@/lib/format";

export interface DonutSlice {
  categoryId: string | null;
  name: string;
  total: number;
}

/** Paleta determinística: a mesma categoria recebe sempre a mesma cor. */
const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const MAX_SLICES = 6;

export function CategoryDonut({
  slices,
  currency,
  emptyLabel = "Sem dados no período",
}: {
  slices: DonutSlice[];
  currency: CurrencyCode;
  emptyLabel?: string;
}) {
  const data = useMemo(() => {
    const positive = slices.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
    if (positive.length <= MAX_SLICES) return positive;
    const head = positive.slice(0, MAX_SLICES - 1);
    const rest = positive.slice(MAX_SLICES - 1).reduce((sum, s) => sum + s.total, 0);
    return [...head, { categoryId: "__other__", name: "Outros", total: rest }];
  }, [slices]);

  const total = data.reduce((sum, s) => sum + s.total, 0);

  if (!total) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((slice, index) => (
              <Cell key={slice.categoryId ?? `slice-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--popover-foreground)",
              fontSize: "0.8rem",
            }}
            formatter={(value: number, name: string) => [
              `${formatCents(value, currency)} · ${((value / total) * 100).toFixed(1)}%`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
