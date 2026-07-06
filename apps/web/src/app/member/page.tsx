"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { parsePlanContent } from "@/lib/plan-schema";
import { StructuredPlanPreview } from "@/components/plans/structured-plan-preview";
import {
  MemberProgressPanel,
  type MemberProgressData,
} from "@/components/progress/member-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataDesktop,
  DataField,
  DataMobile,
  DataPanel,
  DataRow,
} from "@/components/ui/responsive-data";
import { includesPersonalTraining, tierBadgeVariant, tierLabel } from "@/lib/membership-tier";
import { formatMoney } from "@/lib/money";

type Trainer = { id: number; name: string; email: string };

type MemberMeResponse = {
  data: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    assigned_trainer_user_id: number | null;
    membership: {
      id: number;
      membership_plan_id: number;
      plan_name: string | null;
      tier?: string;
      starts_at: string;
      ends_at: string;
      status: string;
      cancel_requested_at: string | null;
      days_remaining: number;
    } | null;
    personal_training?: {
      eligible: boolean;
      active: boolean;
      tier: string | null;
    };
  };
};

type AttendanceMeResponse = {
  data: Array<{
    id: number;
    checked_in_at: string;
    checked_out_at: string | null;
  }>;
};

type PaymentsMeResponse = {
  data: Array<{
    id: number;
    amount_cents: number;
    currency: string;
    method: string;
    status: string;
    paid_at: string;
    reference: string | null;
  }>;
};

type TrainersResponse = { data: Trainer[] };

type MemberPlansResponse = {
  data: Array<{
    id: number;
    type: "workout" | "food" | string;
    content: string;
    updated_at: string;
  }>;
};

export default function MemberDashboardPage() {
  const [member, setMember] = useState<MemberMeResponse["data"] | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMeResponse["data"]>([]);
  const [payments, setPayments] = useState<PaymentsMeResponse["data"]>([]);
  const [plans, setPlans] = useState<MemberPlansResponse["data"]>([]);
  const [progress, setProgress] = useState<MemberProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trainerChoice, setTrainerChoice] = useState<number | "">("");
  const [cancelingMembership, setCancelingMembership] = useState(false);

  const selectedTrainer = useMemo(() => {
    if (!member) return null;
    return trainers.find((t) => t.id === member.assigned_trainer_user_id) ?? null;
  }, [member, trainers]);

  const selectedChoiceTrainer = useMemo(() => {
    if (trainerChoice === "") return null;
    return trainers.find((t) => t.id === trainerChoice) ?? null;
  }, [trainerChoice, trainers]);

  const workoutPlan = useMemo(() => {
    return plans.find((p) => p.type === "workout") ?? null;
  }, [plans]);

  const foodPlan = useMemo(() => {
    return plans.find((p) => p.type === "food") ?? null;
  }, [plans]);

  const workoutParsed = useMemo(() => {
    const raw = workoutPlan?.content ?? "";
    if (!raw.trim()) return null;
    return parsePlanContent(raw, "workout");
  }, [workoutPlan?.content]);

  const foodParsed = useMemo(() => {
    const raw = foodPlan?.content ?? "";
    if (!raw.trim()) return null;
    return parsePlanContent(raw, "food");
  }, [foodPlan?.content]);

  const ptEligible = member?.personal_training?.eligible ?? includesPersonalTraining(member?.membership?.tier);
  const ptActive = member?.personal_training?.active ?? false;
  const membershipTier = member?.membership?.tier ?? null;

  function formatDateTime(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  async function loadAll() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, trainersRes, attendanceRes, paymentsRes] = await Promise.all([
        apiFetch<MemberMeResponse>("/api/v1/members/me", { token }),
        apiFetch<TrainersResponse>("/api/v1/trainers", { token }),
        apiFetch<AttendanceMeResponse>("/api/v1/attendance/me", { token }),
        apiFetch<PaymentsMeResponse>("/api/v1/payments/me", { token }),
      ]);
      setMember(meRes.data);
      setTrainers(trainersRes.data);
      setAttendance(attendanceRes.data);
      setPayments(paymentsRes.data);
      setTrainerChoice(meRes.data.assigned_trainer_user_id ?? "");

      const canLoadCoaching =
        meRes.data.personal_training?.eligible ??
        includesPersonalTraining(meRes.data.membership?.tier);

      if (canLoadCoaching && meRes.data.personal_training?.active) {
        const [plansRes, progressRes] = await Promise.all([
          apiFetch<MemberPlansResponse>("/api/v1/members/me/plans", { token }),
          apiFetch<{ data: MemberProgressData }>("/api/v1/members/me/progress", { token }),
        ]);
        setPlans(plansRes.data);
        setProgress(progressRes.data);
      } else {
        setPlans([]);
        setProgress(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function saveTrainer(trainerUserId: number | null) {
    const token = getToken();
    if (!token) return;
    setUpdating(true);
    setError(null);
    try {
      await apiFetch("/api/v1/members/me", {
        method: "PATCH",
        token,
        body: JSON.stringify({ assigned_trainer_user_id: trainerUserId }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trainer.");
    } finally {
      setUpdating(false);
    }
  }

  async function cancelMyMembership() {
    const token = getToken();
    if (!token) return;
    if (!confirm("Cancel your membership at end of period?")) return;
    setCancelingMembership(true);
    setError(null);
    try {
      await apiFetch("/api/v1/members/me/membership/cancel", {
        method: "POST",
        token,
        body: JSON.stringify({}),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel membership.");
    } finally {
      setCancelingMembership(false);
    }
  }

  async function undoCancelMyMembership() {
    const token = getToken();
    if (!token) return;
    setCancelingMembership(true);
    setError(null);
    try {
      await apiFetch("/api/v1/members/me/membership/undo-cancel", {
        method: "POST",
        token,
        body: JSON.stringify({}),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to undo cancel.");
    } finally {
      setCancelingMembership(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
          <div className="text-lg font-semibold">My Profile</div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="grid gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Name
              </div>
              <div className="font-medium">{member?.name ?? "—"}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Email
              </div>
              <div className="font-medium">{member?.email ?? "—"}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Phone
              </div>
              <div className="font-medium">{member?.phone ?? "—"}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Status
              </div>
              <div>
                <Badge variant={member?.status === "active" ? "success" : "neutral"}>
                  {member?.status ?? "—"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {ptEligible ? (
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
          <div className="text-lg font-semibold">My Trainer</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Current:{" "}
            {selectedTrainer
              ? `${selectedTrainer.name} (${selectedTrainer.email})`
              : "Not selected"}
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Selected:{" "}
            {trainerChoice === ""
              ? "No trainer"
              : selectedChoiceTrainer
                ? `${selectedChoiceTrainer.name} (${selectedChoiceTrainer.email})`
                : "—"}
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition-colors ${
                  trainerChoice === ""
                    ? "border-black/30 bg-black/5 dark:border-white/20 dark:bg-white/10"
                    : "border-black/10 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
                }`}
                type="button"
                disabled={updating}
                onClick={() => setTrainerChoice("")}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  —
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    <span>No trainer</span>
                    {member?.assigned_trainer_user_id === null ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                        Current
                      </span>
                    ) : null}
                    {trainerChoice === "" ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-900/5 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                        Selected
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                    Choose later
                  </span>
                </span>
              </button>

              {trainers.map((t) => {
                const parts = t.name.trim().split(/\s+/).slice(0, 2);
                const avatar =
                  parts.map((p) => p[0]?.toUpperCase()).join("") || "T";
                const selected = trainerChoice !== "" && trainerChoice === t.id;
                const isCurrent = member?.assigned_trainer_user_id === t.id;
                return (
                  <button
                    key={t.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition-colors ${
                      selected
                        ? "border-black/30 bg-black/5 dark:border-white/20 dark:bg-white/10"
                        : "border-black/10 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
                    }`}
                    type="button"
                    disabled={updating}
                    onClick={() => setTrainerChoice(t.id)}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                      {avatar}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 truncate font-medium">
                        <span className="truncate">{t.name}</span>
                        {isCurrent ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                            Current
                          </span>
                        ) : null}
                        {selected ? (
                          <span className="inline-flex items-center rounded-full bg-zinc-900/5 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {t.email}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="neutral"
              type="button"
              disabled={
                updating ||
                (trainerChoice === "" && member?.assigned_trainer_user_id === null) ||
                (trainerChoice !== "" && member?.assigned_trainer_user_id === trainerChoice)
              }
              onClick={() =>
                void saveTrainer(trainerChoice === "" ? null : trainerChoice)
              }
            >
              {updating ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent p-6 shadow-sm dark:from-amber-500/15">
            <div className="text-lg font-semibold">Personal training</div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Upgrade to <span className="font-medium">Gold</span> to choose a personal trainer and unlock
              workout plans, nutrition, and progress tracking. Silver includes gym access only.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">My Membership</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {member?.membership
                ? `${member.membership.plan_name ?? "Membership"} • ends ${formatDateTime(
                    member.membership.ends_at,
                  )}`
                : "No active membership"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {member?.membership ? (
              <>
                <Badge
                  variant={
                    member.membership.status === "active"
                      ? "success"
                      : member.membership.status === "canceling"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {member.membership.status}
                </Badge>
                <Badge variant={tierBadgeVariant(membershipTier)}>
                  {tierLabel(membershipTier)} member
                </Badge>
                <Badge variant="neutral">
                  {member.membership.days_remaining} days remaining
                </Badge>
                {member.membership.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs"
                    type="button"
                    disabled={cancelingMembership}
                    onClick={() => void cancelMyMembership()}
                  >
                    {cancelingMembership ? "Canceling..." : "Cancel"}
                  </Button>
                ) : member.membership.status === "canceling" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs"
                    type="button"
                    disabled={cancelingMembership}
                    onClick={() => void undoCancelMyMembership()}
                  >
                    {cancelingMembership ? "Undoing..." : "Undo cancel"}
                  </Button>
                ) : null}
              </>
            ) : (
              <Badge variant="neutral">Inactive</Badge>
            )}
          </div>
        </div>
        {member?.membership?.status === "canceling" ? (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Cancel scheduled at end of period.
          </div>
        ) : null}
      </section>

      {ptEligible && !ptActive ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-sm text-zinc-700 dark:text-zinc-300">
          Select a personal trainer to unlock your workout plan, nutrition plan, and progress tracking.
        </section>
      ) : null}

      {ptActive ? (
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
        <MemberProgressPanel progress={progress} loading={loading} />
      </section>
      ) : null}

      {ptActive ? (
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">My Plans</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Workout and food plans from your trainer.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Workout Plan</div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
              {workoutParsed ? (
                workoutParsed.kind === "structured" ? (
                  <StructuredPlanPreview plan={workoutParsed.plan} />
                ) : (
                  <div className="whitespace-pre-wrap">{workoutParsed.text}</div>
                )
              ) : (
                <div className="whitespace-pre-wrap">No workout plan yet.</div>
              )}
            </div>
            {workoutPlan?.updated_at ? (
              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                Updated: {formatDateTime(workoutPlan.updated_at)}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Food Plan</div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
              {foodParsed ? (
                foodParsed.kind === "structured" ? (
                  <StructuredPlanPreview plan={foodParsed.plan} />
                ) : (
                  <div className="whitespace-pre-wrap">{foodParsed.text}</div>
                )
              ) : (
                <div className="whitespace-pre-wrap">No food plan yet.</div>
              )}
            </div>
            {foodPlan?.updated_at ? (
              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                Updated: {formatDateTime(foodPlan.updated_at)}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">My Attendance</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {attendance.length}
            </div>
          </div>
          <div className="mt-4">
            <DataPanel scrollClassName="max-h-96">
              <DataMobile>
                {attendance.slice(0, 20).map((a) => (
                  <DataRow key={a.id}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DataField label="Check-in">{formatDateTime(a.checked_in_at)}</DataField>
                      <DataField label="Check-out">{formatDateTime(a.checked_out_at)}</DataField>
                      <DataField label="Status">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            a.checked_out_at
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                          }`}
                        >
                          {a.checked_out_at ? "completed" : "open"}
                        </span>
                      </DataField>
                    </div>
                  </DataRow>
                ))}
                {attendance.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No attendance records yet.
                  </div>
                ) : null}
              </DataMobile>
              <DataDesktop>
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">Check-in</th>
                      <th className="px-3 py-2 font-medium">Check-out</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/10">
                    {attendance.slice(0, 20).map((a) => (
                      <tr key={a.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                          {formatDateTime(a.checked_in_at)}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {formatDateTime(a.checked_out_at)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              a.checked_out_at
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                            }`}
                          >
                            {a.checked_out_at ? "completed" : "open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-8 text-center text-zinc-600 dark:text-zinc-400"
                          colSpan={3}
                        >
                          No attendance records yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </DataDesktop>
            </DataPanel>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">My Payments</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {payments.length}
            </div>
          </div>
          <div className="mt-4">
            <DataPanel scrollClassName="max-h-96">
              <DataMobile>
                {payments.slice(0, 20).map((p) => (
                  <DataRow key={p.id}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DataField label="Paid at">{formatDateTime(p.paid_at)}</DataField>
                      <DataField label="Amount">{formatMoney(p.amount_cents, p.currency)}</DataField>
                      <DataField label="Method">
                        {p.method}
                        {p.reference ? <div className="mt-1 text-xs">Ref: {p.reference}</div> : null}
                      </DataField>
                      <DataField label="Status">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            p.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </DataField>
                    </div>
                  </DataRow>
                ))}
                {payments.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No payments recorded yet.
                  </div>
                ) : null}
              </DataMobile>
              <DataDesktop>
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">Paid at</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Method</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/10">
                    {payments.slice(0, 20).map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {formatDateTime(p.paid_at)}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {formatMoney(p.amount_cents, p.currency)}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {p.method}
                          {p.reference ? (
                            <div className="mt-1 text-xs">
                              Ref: {p.reference}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              p.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-8 text-center text-zinc-600 dark:text-zinc-400"
                          colSpan={4}
                        >
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </DataDesktop>
            </DataPanel>
          </div>
        </div>
      </section>
    </div>
  );
}
