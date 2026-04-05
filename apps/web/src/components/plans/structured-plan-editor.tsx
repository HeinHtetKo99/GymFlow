"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import type { StructuredPlan, StructuredPlanSection } from "@/lib/plan-schema";
import { createPlanId } from "@/lib/plan-schema";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type StructuredPlanEditorProps = {
  value: StructuredPlan;
  onChange: (next: StructuredPlan) => void;
  disabled?: boolean;
  className?: string;
};

function move<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return next;
  next.splice(to, 0, item);
  return next;
}

export function StructuredPlanEditor({ value, onChange, disabled, className }: StructuredPlanEditorProps) {
  function updatePlan(patch: Partial<StructuredPlan>) {
    onChange({ ...value, ...patch, schema_version: 1, type: value.type });
  }

  function updateSection(sectionId: string, patch: Partial<StructuredPlanSection>) {
    updatePlan({
      sections: value.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    });
  }

  function addSection() {
    updatePlan({
      sections: [
        ...value.sections,
        { id: createPlanId(), label: `Section ${value.sections.length + 1}`, items: [] },
      ],
    });
  }

  function removeSection(sectionId: string) {
    updatePlan({ sections: value.sections.filter((s) => s.id !== sectionId) });
  }

  function moveSection(sectionId: string, dir: -1 | 1) {
    const idx = value.sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= value.sections.length) return;
    updatePlan({ sections: move(value.sections, idx, nextIdx) });
  }

  function addItem(sectionId: string) {
    const section = value.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { items: [...section.items, ""] });
  }

  function updateItem(sectionId: string, index: number, text: string) {
    const section = value.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const next = section.items.slice();
    next[index] = text;
    updateSection(sectionId, { items: next });
  }

  function removeItem(sectionId: string, index: number) {
    const section = value.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { items: section.items.filter((_, i) => i !== index) });
  }

  function moveItem(sectionId: string, index: number, dir: -1 | 1) {
    const section = value.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= section.items.length) return;
    updateSection(sectionId, { items: move(section.items, index, nextIdx) });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Title (optional)"
          value={value.title ?? ""}
          disabled={disabled}
          onChange={(e) => updatePlan({ title: e.target.value })}
        />
        <Input
          placeholder="Update note (optional)"
          value={value.updated_note ?? ""}
          disabled={disabled}
          onChange={(e) => updatePlan({ updated_note: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        {value.sections.map((s) => (
          <div key={s.id} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Input
                className="min-w-56 flex-1"
                placeholder="Section label"
                value={s.label}
                disabled={disabled}
                onChange={(e) => updateSection(s.id, { label: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 rounded-xl px-0"
                  disabled={disabled}
                  onClick={() => moveSection(s.id, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 rounded-xl px-0"
                  disabled={disabled}
                  onClick={() => moveSection(s.id, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Move down</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="h-9 w-9 rounded-xl px-0"
                  disabled={disabled}
                  onClick={() => removeSection(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove section</span>
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {s.items.map((it, idx) => (
                <div key={`${s.id}-${idx}`} className="flex items-center gap-2">
                  <Input
                    value={it}
                    disabled={disabled}
                    placeholder={`Item ${idx + 1}`}
                    onChange={(e) => updateItem(s.id, idx, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-xl px-0"
                      disabled={disabled || idx === 0}
                      onClick={() => moveItem(s.id, idx, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Move item up</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-xl px-0"
                      disabled={disabled || idx === s.items.length - 1}
                      onClick={() => moveItem(s.id, idx, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Move item down</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl px-0"
                      disabled={disabled}
                      onClick={() => removeItem(s.id, idx)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs"
                disabled={disabled}
                onClick={() => addItem(s.id)}
              >
                Add item
              </Button>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-xl px-4 text-sm"
          disabled={disabled}
          onClick={addSection}
        >
          Add section
        </Button>
      </div>
    </div>
  );
}
