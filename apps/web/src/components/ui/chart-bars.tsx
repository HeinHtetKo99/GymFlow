"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ChartBarPoint = {
  label: string;
  value: number;
};

export type ChartBarsProps = {
  data: ChartBarPoint[];
  className?: string;
  barClassName?: string;
};

function toNumber(value: unknown): number {
  if (typeof value !== "number") return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function ChartBars({ data, className, barClassName }: ChartBarsProps) {
  const values = data.map((d) => toNumber(d.value));
  const maxValue = Math.max(1, ...values);
  const n = Math.max(1, values.length);
  const width = 100 / n;

  return (
    <div className={cn("h-32 w-full", className)}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
        {values.map((v, i) => {
          const h = (v / maxValue) * 40;
          const x = i * width;
          const y = 40 - h;
          const pad = Math.min(0.8, width * 0.2);
          return (
            <rect
              key={data[i]?.label ?? String(i)}
              x={x + pad / 2}
              y={y}
              width={Math.max(0, width - pad)}
              height={h}
              className={cn("fill-emerald-500/35", barClassName)}
              rx={0.8}
              ry={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}

