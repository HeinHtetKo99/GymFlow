"use client";

export type PlanType = "workout" | "food";

export type StructuredPlanSection = {
  id: string;
  label: string;
  items: string[];
};

export type StructuredPlan = {
  schema_version: 1;
  type: PlanType;
  title?: string;
  updated_note?: string;
  sections: StructuredPlanSection[];
};

export type ParsedPlan =
  | { kind: "structured"; plan: StructuredPlan }
  | { kind: "legacy"; text: string; plan: StructuredPlan };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createPlanId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function normalizePlanTextToSections(text: string): StructuredPlanSection[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [{ id: createPlanId(), label: "Notes", items: [] }];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return [{ id: createPlanId(), label: "Notes", items: lines.length > 0 ? lines : [trimmed] }];
}

export function makeEmptyPlan(type: PlanType): StructuredPlan {
  return {
    schema_version: 1,
    type,
    sections: [
      { id: createPlanId(), label: type === "workout" ? "Day 1" : "Day 1", items: [] },
    ],
  };
}

export function parsePlanContent(content: string, type: PlanType): ParsedPlan {
  const raw = content ?? "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return { kind: "structured", plan: makeEmptyPlan(type) };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!isRecord(parsed)) throw new Error("not object");
    if (parsed.schema_version !== 1) throw new Error("wrong schema");
    if (parsed.type !== type) throw new Error("type mismatch");
    const sectionsValue = parsed.sections;
    if (!Array.isArray(sectionsValue)) throw new Error("sections missing");

    const sections: StructuredPlanSection[] = sectionsValue
      .map((s) => {
        if (!isRecord(s)) return null;
        const id = typeof s.id === "string" && s.id.trim() ? s.id : createPlanId();
        const label = typeof s.label === "string" ? s.label : "Section";
        const items = Array.isArray(s.items)
          ? s.items.filter((i) => typeof i === "string").map((i) => i)
          : [];
        return { id, label, items };
      })
      .filter((s): s is StructuredPlanSection => s !== null);

    const title = typeof parsed.title === "string" ? parsed.title : undefined;
    const updated_note = typeof parsed.updated_note === "string" ? parsed.updated_note : undefined;

    const plan: StructuredPlan = {
      schema_version: 1,
      type,
      title,
      updated_note,
      sections: sections.length > 0 ? sections : [{ id: createPlanId(), label: "Notes", items: [] }],
    };

    return { kind: "structured", plan };
  } catch {
    const plan: StructuredPlan = {
      schema_version: 1,
      type,
      sections: normalizePlanTextToSections(trimmed),
    };
    return { kind: "legacy", text: raw, plan };
  }
}

export function serializePlanContent(plan: StructuredPlan): string {
  const normalized: StructuredPlan = {
    schema_version: 1,
    type: plan.type,
    title: plan.title?.trim() ? plan.title.trim() : undefined,
    updated_note: plan.updated_note?.trim() ? plan.updated_note.trim() : undefined,
    sections: (plan.sections ?? [])
      .map((s) => ({
        id: s.id?.trim() ? s.id : createPlanId(),
        label: s.label ?? "Section",
        items: (s.items ?? []).map((i) => i).filter((i) => typeof i === "string"),
      }))
      .filter((s) => typeof s.label === "string"),
  };

  return JSON.stringify(normalized);
}

/** Human-readable text for trainer editing (works with legacy or structured storage). */
export function structuredPlanToText(plan: StructuredPlan): string {
  const blocks = plan.sections
    .map((section) => {
      const label = section.label.trim();
      const items = section.items.map((i) => i.trim()).filter(Boolean);
      if (items.length === 0) {
        return label || "";
      }
      const body = items
        .map((item) => (item.startsWith("-") ? item : `- ${item}`))
        .join("\n");
      return label ? `${label}\n${body}` : body;
    })
    .filter((block) => block.trim().length > 0);

  const parts = [
    plan.title?.trim() || "",
    ...blocks,
    plan.updated_note?.trim() || "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

export function planContentToEditableText(content: string, type: PlanType): string {
  const parsed = parsePlanContent(content, type);
  if (parsed.kind === "legacy") {
    return parsed.text;
  }
  return structuredPlanToText(parsed.plan);
}

