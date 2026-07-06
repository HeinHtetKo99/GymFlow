"use client";

import { useMemo, useState } from "react";
import {
  Dumbbell,
  Eye,
  LineChart,
  Pencil,
  Save,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import {
  parsePlanContent,
  serializePlanContent,
  type PlanType,
  type StructuredPlan,
} from "@/lib/plan-schema";
import { ensurePlanSections, PlanQuickBuilder } from "@/components/plans/plan-quick-builder";
import { StructuredPlanPreview } from "@/components/plans/structured-plan-preview";
import {
  MemberProgressPanel,
  type MemberProgressData,
} from "@/components/progress/member-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { tierBadgeVariant, tierLabel } from "@/lib/membership-tier";

type Member = {
  id: number;
  name: string;
  email: string | null;
  status: string;
  membership?: {
    tier?: string;
    plan_name?: string | null;
  } | null;
};

type PlanRecord = {
  type: string;
  content: string;
  updated_at: string;
};

type Template = {
  id: number;
  type: string;
  name: string;
  content: string;
};

type WorkspaceTab = "workout" | "food" | "progress";

type TrainerMemberWorkspaceProps = {
  member: Member;
  plans: PlanRecord[];
  templates: Template[];
  progress: MemberProgressData | null;
  progressLoading: boolean;
  busy: boolean;
  onSavePlan: (type: PlanType, content: string) => Promise<void>;
  onProgressSaved: () => Promise<void>;
};

function formatRelative(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function planFromContent(content: string, type: PlanType): StructuredPlan {
  return ensurePlanSections(parsePlanContent(content, type).plan);
}

export function TrainerMemberWorkspace({
  member,
  plans,
  templates,
  progress,
  progressLoading,
  busy,
  onSavePlan,
  onProgressSaved,
}: TrainerMemberWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workout");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [workoutPlan, setWorkoutPlan] = useState<StructuredPlan>(() =>
    planFromContent(plans.find((p) => p.type === "workout")?.content ?? "", "workout"),
  );
  const [foodPlan, setFoodPlan] = useState<StructuredPlan>(() =>
    planFromContent(plans.find((p) => p.type === "food")?.content ?? "", "food"),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    workout: serializePlanContent(planFromContent(plans.find((p) => p.type === "workout")?.content ?? "", "workout")),
    food: serializePlanContent(planFromContent(plans.find((p) => p.type === "food")?.content ?? "", "food")),
  }));

  const workoutMeta = plans.find((p) => p.type === "workout") ?? null;
  const foodMeta = plans.find((p) => p.type === "food") ?? null;

  const currentType: PlanType = activeTab === "food" ? "food" : "workout";
  const currentPlan = activeTab === "food" ? foodPlan : workoutPlan;
  const currentSerialized = serializePlanContent(currentPlan);
  const isDirty =
    activeTab !== "progress" &&
    currentSerialized !== (activeTab === "food" ? savedSnapshot.food : savedSnapshot.workout);

  const typeTemplates = useMemo(
    () => templates.filter((t) => t.type === currentType),
    [templates, currentType],
  );

  const weightChange = progress?.changes["30d"]?.weight_kg ?? progress?.changes.all?.weight_kg ?? null;

  function setCurrentPlan(next: StructuredPlan) {
    if (activeTab === "food") setFoodPlan(next);
    else setWorkoutPlan(next);
  }

  async function handleSave() {
    if (activeTab === "progress") return;
    const type = currentType;
    const content = serializePlanContent(type === "workout" ? workoutPlan : foodPlan);
    await onSavePlan(type, content);
    setSavedSnapshot((prev) => ({
      ...prev,
      [type]: content,
    }));
  }

  function applyTemplate(templateId: number) {
    const template = typeTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setCurrentPlan(planFromContent(template.content, currentType));
    setMode("edit");
  }

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof Dumbbell }> = [
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "food", label: "Nutrition", icon: UtensilsCrossed },
    { id: "progress", label: "Progress", icon: LineChart },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600/10 via-transparent to-zinc-500/5 px-4 py-4 sm:px-6 sm:py-5 dark:from-emerald-500/15">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-lg shadow-emerald-600/20">
                {member.name.trim().slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="text-xl font-semibold tracking-tight">{member.name}</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {member.email ?? `Member #${member.id}`}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={member.status === "active" ? "success" : "neutral"}>
                    {member.status}
                  </Badge>
                  {member.membership?.tier ? (
                    <Badge variant={tierBadgeVariant(member.membership.tier)}>
                      {tierLabel(member.membership.tier)} plan
                    </Badge>
                  ) : null}
                  {workoutMeta ? <Badge variant="neutral">Workout set</Badge> : null}
                  {foodMeta ? <Badge variant="neutral">Nutrition set</Badge> : null}
                  {(progress?.series.length ?? 0) > 0 ? (
                    <Badge variant="success">
                      {progress?.series.length} check-ins
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-black/40">
                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Weight (30d)</div>
                <div className="mt-0.5 text-sm font-semibold">
                  {weightChange != null ? (
                    <span className={weightChange <= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700"}>
                      {weightChange > 0 ? "+" : ""}
                      {weightChange} kg
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-black/40">
                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Workout</div>
                <div className="mt-0.5 text-sm font-semibold">
                  {formatRelative(workoutMeta?.updated_at) ?? "Not set"}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-black/40">
                <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Nutrition</div>
                <div className="mt-0.5 text-sm font-semibold">
                  {formatRelative(foodMeta?.updated_at) ?? "Not set"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="border-t border-black/10 px-4 py-3 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "progress") setMode("edit");
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === "progress" ? (
        <Card>
          <CardContent className="pt-6">
            <MemberProgressPanel
              progress={progress}
              loading={progressLoading}
              memberId={member.id}
              showLogForm
              compact
              onMeasurementSaved={onProgressSaved}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-black/10 py-4 dark:border-white/10">
            <div>
              <div className="text-base font-semibold">
                {activeTab === "workout" ? "Workout program" : "Nutrition plan"}
              </div>
              <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                Build by day or meal — one item per line. Members see a clean formatted view.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isDirty ? (
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Unsaved</span>
              ) : null}
              {typeTemplates.length > 0 ? (
                <Select
                  className="h-9 w-full min-w-0 text-xs sm:min-w-[10rem] sm:w-auto"
                  disabled={busy}
                  defaultValue=""
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id > 0) applyTemplate(id);
                    e.target.value = "";
                  }}
                >
                  <option value="">Templates</option>
                  {typeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <div className="inline-flex rounded-xl border border-black/10 p-0.5 dark:border-white/10">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    mode === "edit"
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                  onClick={() => setMode("edit")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    mode === "preview"
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                  onClick={() => setMode("preview")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>
              <Button size="sm" disabled={busy || !isDirty} onClick={() => void handleSave()}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {busy ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            {typeTemplates.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Quick start:</span>
                {typeTemplates.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-medium transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:border-white/10 dark:bg-white/5"
                    onClick={() => applyTemplate(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : null}

            {mode === "edit" ? (
              <PlanQuickBuilder
                plan={currentPlan}
                onChange={setCurrentPlan}
                disabled={busy}
                blockNoun={activeTab === "food" ? "meal" : "day"}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 bg-zinc-50/50 p-4 dark:border-white/15 dark:bg-white/[0.02]">
                <div className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Member preview
                </div>
                <StructuredPlanPreview plan={currentPlan} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
