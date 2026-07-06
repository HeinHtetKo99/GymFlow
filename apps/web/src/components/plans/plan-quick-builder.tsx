"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  createPlanId,
  makeEmptyPlan,
  type PlanType,
  type StructuredPlan,
  type StructuredPlanSection,
} from "@/lib/plan-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PlanQuickBuilderProps = {
  plan: StructuredPlan;
  onChange: (plan: StructuredPlan) => void;
  disabled?: boolean;
  blockNoun?: string;
};

function itemsToText(items: string[]) {
  return items.join("\n");
}

function textToItems(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function defaultSectionLabel(type: PlanType, index: number) {
  if (type === "food") {
    return ["Breakfast", "Lunch", "Dinner", "Snacks"][index] ?? `Meal ${index + 1}`;
  }
  return `Day ${index + 1}`;
}

export function ensurePlanSections(plan: StructuredPlan): StructuredPlan {
  if (plan.sections.length > 0) return plan;
  return makeEmptyPlan(plan.type);
}

export function PlanQuickBuilder({
  plan,
  onChange,
  disabled,
  blockNoun,
}: PlanQuickBuilderProps) {
  const noun = blockNoun ?? (plan.type === "food" ? "meal" : "day");

  function updateSections(sections: StructuredPlanSection[]) {
    onChange({ ...plan, schema_version: 1, type: plan.type, sections });
  }

  function updateSection(sectionId: string, patch: Partial<StructuredPlanSection>) {
    updateSections(plan.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  function addSection() {
    const index = plan.sections.length;
    updateSections([
      ...plan.sections,
      {
        id: createPlanId(),
        label: defaultSectionLabel(plan.type, index),
        items: [],
      },
    ]);
  }

  function removeSection(sectionId: string) {
    updateSections(plan.sections.filter((s) => s.id !== sectionId));
  }

  return (
    <div className="space-y-3">
      {plan.sections.map((section, index) => (
        <div
          key={section.id}
          className="group rounded-2xl border border-black/10 bg-gradient-to-b from-white to-zinc-50/80 p-4 shadow-sm dark:border-white/10 dark:from-zinc-950 dark:to-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {index + 1}
            </span>
            <Input
              className="h-9 flex-1 border-transparent bg-transparent px-1 font-medium shadow-none focus-visible:border-black/10 dark:focus-visible:border-white/10"
              value={section.label}
              disabled={disabled}
              placeholder={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} name`}
              onChange={(e) => updateSection(section.id, { label: e.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 rounded-lg p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              disabled={disabled || plan.sections.length <= 1}
              onClick={() => removeSection(section.id)}
              aria-label={`Remove ${noun}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <textarea
            className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm leading-relaxed outline-none ring-offset-2 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50 dark:border-white/10 dark:bg-black/40 dark:ring-offset-black"
            value={itemsToText(section.items)}
            disabled={disabled}
            placeholder={
              plan.type === "food"
                ? "One food item per line, e.g.\nOats with banana\nGreek yogurt\nBlack coffee"
                : "One exercise per line, e.g.\nBench press 4×8\nIncline DB press 3×10\nCable flyes 3×12"
            }
            onChange={(e) => updateSection(section.id, { items: textToItems(e.target.value) })}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        disabled={disabled}
        onClick={addSection}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add {noun}
      </Button>
    </div>
  );
}
