"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { parsePlanContent, serializePlanContent, type PlanType, type StructuredPlan } from "@/lib/plan-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StructuredPlanEditor } from "@/components/plans/structured-plan-editor";
import { StructuredPlanPreview } from "@/components/plans/structured-plan-preview";
import { TemplatePicker, type PlanTemplateListItem } from "@/components/plans/template-picker";

type MembersResponse = {
  data: Array<{
    id: number;
    name: string;
    email: string | null;
    status: string;
  }>;
};

type MemberPlansResponse = {
  data: Array<{
    id: number;
    type: "workout" | "food" | string;
    content: string;
    created_by_trainer_user_id: number | null;
    updated_at: string;
  }>;
};

type PlanTemplatesResponse = {
  data: Array<{
    id: number;
    type: "workout" | "food" | string;
    name: string;
    content: string;
    updated_at: string;
  }>;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function TrainerHomePage() {
  const [members, setMembers] = useState<MembersResponse["data"]>([]);
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [plans, setPlans] = useState<MemberPlansResponse["data"]>([]);
  const [activeType, setActiveType] = useState<PlanType>("workout");
  const [workoutValue, setWorkoutValue] = useState<StructuredPlan>({
    schema_version: 1,
    type: "workout",
    sections: [],
  });
  const [foodValue, setFoodValue] = useState<StructuredPlan>({
    schema_version: 1,
    type: "food",
    sections: [],
  });
  const [templatesWorkout, setTemplatesWorkout] = useState<PlanTemplatesResponse["data"]>([]);
  const [templatesFood, setTemplatesFood] = useState<PlanTemplatesResponse["data"]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find((m) => m.id === selectedMemberId) ?? null;
  }, [members, selectedMemberId]);

  const workoutPlan = useMemo(() => {
    return plans.find((p) => p.type === "workout") ?? null;
  }, [plans]);

  const foodPlan = useMemo(() => {
    return plans.find((p) => p.type === "food") ?? null;
  }, [plans]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = `${m.name} ${m.email ?? ""} ${m.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, search]);

  async function loadMembers() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<MembersResponse>("/api/v1/members?assigned_trainer=me", { token });
      setMembers(res.data);
      setSelectedMemberId((prev) => {
        if (prev && res.data.some((m) => m.id === prev)) return prev;
        return res.data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans(memberId: number) {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      const res = await apiFetch<MemberPlansResponse>(`/api/v1/members/${memberId}/plans`, {
        token,
      });
      setPlans(res.data);
      const workoutContent = res.data.find((p) => p.type === "workout")?.content ?? "";
      const foodContent = res.data.find((p) => p.type === "food")?.content ?? "";
      setWorkoutValue(parsePlanContent(workoutContent, "workout").plan);
      setFoodValue(parsePlanContent(foodContent, "food").plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
      setPlans([]);
      setWorkoutValue(parsePlanContent("", "workout").plan);
      setFoodValue(parsePlanContent("", "food").plan);
    }
  }

  async function loadTemplates(type: PlanType) {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      const res = await apiFetch<PlanTemplatesResponse>(`/api/v1/plan-templates?type=${type}`, { token });
      if (type === "workout") setTemplatesWorkout(res.data);
      if (type === "food") setTemplatesFood(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates.");
      if (type === "workout") setTemplatesWorkout([]);
      if (type === "food") setTemplatesFood([]);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    if (!selectedMemberId) return;
    void loadPlans(selectedMemberId);
  }, [selectedMemberId]);

  useEffect(() => {
    void loadTemplates("workout");
    void loadTemplates("food");
  }, []);

  useEffect(() => {
    setSelectedTemplateId("");
  }, [activeType, selectedMemberId]);

  const currentPlanValue = activeType === "workout" ? workoutValue : foodValue;
  const currentPlan = activeType === "workout" ? workoutPlan : foodPlan;
  const currentTemplates = activeType === "workout" ? templatesWorkout : templatesFood;

  const templateList: PlanTemplateListItem[] = useMemo(() => {
    return currentTemplates.map((t) => ({ id: t.id, name: t.name }));
  }, [currentTemplates]);

  const setCurrentPlanValue = useCallback(
    (next: StructuredPlan) => {
      if (activeType === "workout") setWorkoutValue(next);
      if (activeType === "food") setFoodValue(next);
    },
    [activeType],
  );

  async function savePlan(type: PlanType) {
    const token = getToken();
    if (!token) return;
    if (!selectedMemberId) return;
    setBusy(true);
    setError(null);
    try {
      const content = serializePlanContent(type === "workout" ? workoutValue : foodValue);
      const res = await apiFetch<{ data: MemberPlansResponse["data"][number] }>(
        `/api/v1/members/${selectedMemberId}/plans/${type}`,
        {
          method: "PUT",
          token,
          body: JSON.stringify({ content }),
        },
      );
      setPlans((prev) => {
        const next = prev.filter((p) => p.type !== type);
        next.push(res.data);
        next.sort((a, b) => String(a.type).localeCompare(String(b.type)));
        return next;
      });
      if (type === "workout") setWorkoutValue(parsePlanContent(res.data.content, "workout").plan);
      if (type === "food") setFoodValue(parsePlanContent(res.data.content, "food").plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAsTemplate(name: string) {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const content = serializePlanContent(currentPlanValue);
      await apiFetch(`/api/v1/plan-templates`, {
        method: "POST",
        token,
        body: JSON.stringify({ type: activeType, name, content }),
      });
      await loadTemplates(activeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setBusy(false);
    }
  }

  async function applyTemplate() {
    if (selectedTemplateId === "") return;
    const t = currentTemplates.find((x) => x.id === selectedTemplateId) ?? null;
    if (!t) return;
    setCurrentPlanValue(parsePlanContent(t.content, activeType).plan);
  }

  async function deleteTemplate() {
    if (selectedTemplateId === "") return;
    const t = currentTemplates.find((x) => x.id === selectedTemplateId) ?? null;
    if (!t) return;
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/plan-templates/${t.id}`, { method: "DELETE", token });
      setSelectedTemplateId("");
      await loadTemplates(activeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Plans</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Write workout and food plans for your members.
          </div>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Members: {members.length}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
            <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">
              Members
            </div>
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <Input
                placeholder="Search members..."
                value={search}
                disabled={busy}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <ul className="divide-y divide-black/10 dark:divide-white/10">
                {filteredMembers.map((m) => {
                  const active = m.id === selectedMemberId;
                  return (
                    <li key={m.id}>
                      <button
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          active
                            ? "bg-emerald-500/10"
                            : "hover:bg-zinc-50 dark:hover:bg-white/5"
                        }`}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelectedMemberId(m.id)}
                      >
                        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                          {m.name.trim().slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{m.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                            {m.email ?? `Member #${m.id}`} • {m.status}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filteredMembers.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No members yet.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Plan</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedMember ? `For ${selectedMember.name}` : "Select a member"}
                  </div>
                  {currentPlan?.updated_at ? (
                    <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      Last updated: {formatDateTime(currentPlan.updated_at)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={activeType}
                    disabled={busy}
                    onChange={(e) => setActiveType(e.target.value === "food" ? "food" : "workout")}
                  >
                    <option value="workout">Workout</option>
                    <option value="food">Food</option>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!selectedMemberId || busy}
                    onClick={() => void savePlan(activeType)}
                  >
                    {busy ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Templates</div>
                  <div className="mt-2">
                    <TemplatePicker
                      templates={templateList}
                      selectedTemplateId={selectedTemplateId}
                      onSelectTemplateId={setSelectedTemplateId}
                      onApply={applyTemplate}
                      onSaveAs={saveAsTemplate}
                      onDelete={deleteTemplate}
                      busy={busy}
                    />
                  </div>

                  <div className="mt-6 text-sm font-semibold">Editor</div>
                  <div className="mt-2">
                    <StructuredPlanEditor
                      value={currentPlanValue}
                      onChange={setCurrentPlanValue}
                      disabled={!selectedMemberId || busy}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">Preview</div>
                  <div className="mt-2">
                    <StructuredPlanPreview plan={currentPlanValue} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
