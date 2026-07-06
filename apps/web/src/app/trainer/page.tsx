"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PlanType } from "@/lib/plan-schema";
import { TrainerMemberWorkspace } from "@/components/trainer/trainer-member-workspace";
import type { MemberProgressData } from "@/components/progress/member-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tierBadgeVariant, tierLabel } from "@/lib/membership-tier";

type MembersResponse = {
  data: Array<{
    id: number;
    name: string;
    email: string | null;
    status: string;
    membership?: {
      tier?: string;
      plan_name?: string | null;
    } | null;
  }>;
};

type MemberPlansResponse = {
  data: Array<{
    id: number;
    type: "workout" | "food" | string;
    content: string;
    updated_at: string;
  }>;
};

type PlanTemplatesResponse = {
  data: Array<{
    id: number;
    type: "workout" | "food" | string;
    name: string;
    content: string;
  }>;
};

export default function TrainerHomePage() {
  const [members, setMembers] = useState<MembersResponse["data"]>([]);
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [plans, setPlans] = useState<MemberPlansResponse["data"]>([]);
  const [templates, setTemplates] = useState<PlanTemplatesResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<MemberProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find((m) => m.id === selectedMemberId) ?? null;
  }, [members, selectedMemberId]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => `${m.name} ${m.email ?? ""}`.toLowerCase().includes(q));
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
    try {
      const res = await apiFetch<MemberPlansResponse>(`/api/v1/members/${memberId}/plans`, { token });
      setPlans(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
      setPlans([]);
    }
  }

  async function loadProgress(memberId: number) {
    const token = getToken();
    if (!token) return;
    setProgressLoading(true);
    try {
      const res = await apiFetch<{ data: MemberProgressData }>(`/api/v1/members/${memberId}/progress`, {
        token,
      });
      setProgress(res.data);
    } catch {
      setProgress(null);
    } finally {
      setProgressLoading(false);
    }
  }

  async function loadTemplates() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await apiFetch<PlanTemplatesResponse>("/api/v1/plan-templates", { token });
      setTemplates(res.data);
    } catch {
      setTemplates([]);
    }
  }

  useEffect(() => {
    void loadMembers();
    void loadTemplates();
  }, []);

  useEffect(() => {
    if (!selectedMemberId) return;
    void loadPlans(selectedMemberId);
    void loadProgress(selectedMemberId);
  }, [selectedMemberId]);

  async function savePlan(type: PlanType, content: string) {
    const token = getToken();
    if (!token || !selectedMemberId) return;
    setBusy(true);
    setError(null);
    try {
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
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Loading your members...
      </Card>
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
          <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Trainer hub
          </div>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Coach your members — programs, nutrition, and progress in one place.
          </p>
        </div>
        <Badge variant="neutral">{members.length} assigned</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                className="pl-9"
                placeholder="Search members..."
                value={search}
                disabled={busy}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ul className="max-h-[calc(100vh-14rem)] divide-y divide-black/10 overflow-auto dark:divide-white/10">
            {filteredMembers.map((m) => {
              const active = m.id === selectedMemberId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={busy}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all ${
                      active
                        ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20"
                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                    onClick={() => setSelectedMemberId(m.id)}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                      }`}
                    >
                      {m.name.trim().slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs text-zinc-500">
                          {m.email ?? `Member #${m.id}`}
                        </span>
                        {m.membership?.tier === "gold" || m.membership?.tier === "silver" ? (
                          <Badge variant={tierBadgeVariant(m.membership.tier)} className="px-1.5 py-0 text-[10px]">
                            {tierLabel(m.membership.tier)}
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        m.status === "active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
            {filteredMembers.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-zinc-500">
                No members match your search.
              </li>
            ) : null}
          </ul>
        </Card>

        <div>
          {!selectedMember ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
              <Users className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
              <div className="mt-4 text-lg font-medium">Select a member</div>
              <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                Choose someone from the list to edit their workout, nutrition, and track results.
              </p>
            </Card>
          ) : (
            <TrainerMemberWorkspace
              key={selectedMember.id}
              member={selectedMember}
              plans={plans}
              templates={templates}
              progress={progress}
              progressLoading={progressLoading}
              busy={busy}
              onSavePlan={savePlan}
              onProgressSaved={async () => {
                await loadProgress(selectedMember.id);
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
