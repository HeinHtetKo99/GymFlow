"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type PlanTemplateListItem = {
  id: number;
  name: string;
};

export type TemplatePickerProps = {
  templates: PlanTemplateListItem[];
  selectedTemplateId: number | "";
  onSelectTemplateId: (id: number | "") => void;
  onApply: () => void;
  onSaveAs: (name: string) => void;
  onDelete: () => void;
  busy?: boolean;
  className?: string;
};

export function TemplatePicker({
  templates,
  selectedTemplateId,
  onSelectTemplateId,
  onApply,
  onSaveAs,
  onDelete,
  busy,
  className,
}: TemplatePickerProps) {
  const [name, setName] = React.useState("");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          className="sm:col-span-2"
          value={selectedTemplateId === "" ? "" : String(selectedTemplateId)}
          disabled={busy}
          onChange={(e) => onSelectTemplateId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Select template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          disabled={busy || selectedTemplateId === ""}
          onClick={onApply}
        >
          Apply
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          className="sm:col-span-2"
          placeholder="Save current as template..."
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          disabled={busy || name.trim().length < 2}
          onClick={() => {
            const n = name.trim();
            if (n.length < 2) return;
            onSaveAs(n);
            setName("");
          }}
        >
          Save
        </Button>
      </div>

      <div>
        <Button
          variant="danger"
          size="sm"
          className="h-9 rounded-xl px-3 text-xs"
          disabled={busy || selectedTemplateId === ""}
          onClick={onDelete}
        >
          Delete template
        </Button>
      </div>
    </div>
  );
}

