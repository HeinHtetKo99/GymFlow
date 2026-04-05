"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { StructuredPlan } from "@/lib/plan-schema";

export type StructuredPlanPreviewProps = {
  plan: StructuredPlan;
  className?: string;
};

export function StructuredPlanPreview({ plan, className }: StructuredPlanPreviewProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {plan.title?.trim() ? (
        <div className="text-sm font-semibold">{plan.title}</div>
      ) : null}
      {plan.updated_note?.trim() ? (
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{plan.updated_note}</div>
      ) : null}

      <div className="space-y-3">
        {plan.sections.map((s) => (
          <div key={s.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">{s.label || "Section"}</div>
            {s.items.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                {s.items.map((it, idx) => (
                  <li key={`${s.id}-${idx}`}>{it}</li>
                ))}
              </ol>
            ) : (
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No items.</div>
            )}
          </div>
        ))}
        {plan.sections.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No sections.</div>
        ) : null}
      </div>
    </div>
  );
}

