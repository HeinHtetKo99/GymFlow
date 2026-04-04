"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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

export default function TrainerHomePage() {
  const [members, setMembers] = useState<MembersResponse["data"]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [plans, setPlans] = useState<MemberPlansResponse["data"]>([]);
  const [workoutDraft, setWorkoutDraft] = useState("");
  const [foodDraft, setFoodDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<"workout" | "food" | null>(null);
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

  async function loadMembers() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<MembersResponse>("/api/v1/members", { token });
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
      const workout = res.data.find((p) => p.type === "workout")?.content ?? "";
      const food = res.data.find((p) => p.type === "food")?.content ?? "";
      setWorkoutDraft(workout);
      setFoodDraft(food);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
      setPlans([]);
      setWorkoutDraft("");
      setFoodDraft("");
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    if (!selectedMemberId) return;
    void loadPlans(selectedMemberId);
  }, [selectedMemberId]);

  async function savePlan(type: "workout" | "food") {
    const token = getToken();
    if (!token) return;
    if (!selectedMemberId) return;
    setSavingType(type);
    setError(null);
    try {
      const content = type === "workout" ? workoutDraft : foodDraft;
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
      if (type === "workout") setWorkoutDraft(res.data.content);
      if (type === "food") setFoodDraft(res.data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
    } finally {
      setSavingType(null);
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
            <div className="max-h-[70vh] overflow-auto">
              <ul className="divide-y divide-black/10 dark:divide-white/10">
                {members.map((m) => {
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
                        disabled={savingType !== null}
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
                {members.length === 0 ? (
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
                  <div className="text-lg font-semibold">Workout Plan</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedMember ? `For ${selectedMember.name}` : "Select a member"}
                  </div>
                </div>
                <Button
                  size="sm"
                  type="button"
                  disabled={!selectedMemberId || savingType !== null}
                  onClick={() => void savePlan("workout")}
                >
                  {savingType === "workout" ? "Saving..." : "Save"}
                </Button>
              </div>
              <textarea
                className="mt-4 min-h-64 w-full rounded-2xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
                value={workoutDraft}
                onChange={(e) => setWorkoutDraft(e.target.value)}
                placeholder="Write the full workout plan here..."
                disabled={!selectedMemberId || savingType === "workout"}
              />
              {workoutPlan ? (
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                  Last updated: {new Date(workoutPlan.updated_at).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Food Plan</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedMember ? `For ${selectedMember.name}` : "Select a member"}
                  </div>
                </div>
                <Button
                  size="sm"
                  type="button"
                  disabled={!selectedMemberId || savingType !== null}
                  onClick={() => void savePlan("food")}
                >
                  {savingType === "food" ? "Saving..." : "Save"}
                </Button>
              </div>
              <textarea
                className="mt-4 min-h-64 w-full rounded-2xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
                value={foodDraft}
                onChange={(e) => setFoodDraft(e.target.value)}
                placeholder="Write the full food plan here..."
                disabled={!selectedMemberId || savingType === "food"}
              />
              {foodPlan ? (
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                  Last updated: {new Date(foodPlan.updated_at).toLocaleString()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
