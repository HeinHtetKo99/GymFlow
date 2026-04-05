"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartLineProps = {
  data: ChartPoint[];
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
};

function toNumber(value: unknown): number {
  if (typeof value !== "number") return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function ChartLine({
  data,
  className,
  strokeClassName,
  fillClassName,
}: ChartLineProps) {
  const values = data.map((d) => toNumber(d.value));
  const maxValue = Math.max(1, ...values);
  const n = Math.max(1, values.length);

  const points = values.map((v, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    const y = 40 - (v / maxValue) * 40;
    return { x, y };
  });

  const lineD =
    points.length === 0
      ? ""
      : points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

  const areaD =
    points.length === 0
      ? ""
      : `${lineD} L ${points[points.length - 1]!.x.toFixed(2)} 40 L ${points[0]!.x.toFixed(2)} 40 Z`;

  return (
    <div className={cn("h-32 w-full", className)}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
        <path
          d={areaD}
          className={cn("fill-emerald-500/15", fillClassName)}
        />
        <path
          d={lineD}
          className={cn("fill-none stroke-emerald-400", strokeClassName)}
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

