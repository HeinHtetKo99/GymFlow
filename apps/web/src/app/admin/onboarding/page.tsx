"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type GymResponse = {
  id: number;
  name: string;
  code: string;
  owner_user_id: number | null;
  attendance_retention_days?: number | null;
};

type UserRow = { id: number; name: string; email: string; role: string };
type UsersResponse = { data: UserRow[] };

type Trainer = { id: number; name: string; email: string };
type TrainersResponse = { data: Trainer[] };

type MemberRow = {
  id: number;
  user_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  assigned_trainer_user_id: number | null;
};
type MembersResponse = { data: MemberRow[] };

type MembershipPlanRow = {
  id: number;
  name: string;
  duration_days: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
};
type MembershipPlansResponse = { data: MembershipPlanRow[] };

type MembershipPlanDraft = MembershipPlanRow & {
  duration_display: string;
  price_display: string;
};

function toDollarsString(cents: number): string {
  const n = cents / 100;
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

function dollarsStringToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(/,/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gym, setGym] = useState<GymResponse | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [plans, setPlans] = useState<MembershipPlanDraft[]>([]);

  const me = useMemo(() => getUser(), []);

  const isOwner = useMemo(() => {
    if (!me) return false;
    if (me.role === "owner") return true;
    return gym?.owner_user_id !== null && me.id === gym?.owner_user_id;
  }, [gym?.owner_user_id, me]);

  const cashierCount = useMemo(() => users.filter((u) => u.role === "cashier").length, [users]);
  const trainerCount = useMemo(() => users.filter((u) => u.role === "trainer").length, [users]);
  const activePlanCount = useMemo(() => plans.filter((p) => p.is_active).length, [plans]);

  const staffDone = cashierCount > 0 && trainerCount > 0;
  const plansDone = activePlanCount > 0;
  const memberDone = members.length > 0;

  const loadAll = useCallback(async () => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [gymRes, usersRes, trainersRes, membersRes, plansRes] = await Promise.all([
        apiFetch<GymResponse>("/api/v1/gym", { token }),
        apiFetch<UsersResponse>("/api/v1/users", { token }),
        apiFetch<TrainersResponse>("/api/v1/trainers", { token }),
        apiFetch<MembersResponse>("/api/v1/members", { token }),
        apiFetch<MembershipPlansResponse>("/api/v1/membership-plans?include_inactive=1", { token }),
      ]);
      setGym(gymRes);
      setRetentionDays((gymRes.attendance_retention_days ?? 90) === 30 ? 30 : 90);
      setUsers(usersRes.data);
      setTrainers(trainersRes.data);
      setMembers(membersRes.data);
      setPlans(
        plansRes.data
          .filter((p) => !(p.name === "One-time" && p.is_active === false))
          .map((p) => ({
          ...p,
          duration_display: String(p.duration_days),
          price_display: toDollarsString(p.price_cents),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function saveRetention() {
    const token = getToken();
    if (!token) return;
    setSavingRetention(true);
    setError(null);
    try {
      const res = await apiFetch<GymResponse>("/api/v1/gym", {
        method: "PATCH",
        token,
        body: JSON.stringify({ name: gym?.name ?? "", attendance_retention_days: retentionDays }),
      });
      setGym(res);
      setRetentionDays((res.attendance_retention_days ?? 90) === 30 ? 30 : 90);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update retention.");
    } finally {
      setSavingRetention(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const [creatingUser, setCreatingUser] = useState(false);
  const [newRole, setNewRole] = useState<"cashier" | "trainer">("cashier");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function createStaff() {
    const token = getToken();
    if (!token) return;
    setCreatingUser(true);
    setError(null);
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        token,
        body: JSON.stringify({
          role: newRole,
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
        }),
      });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  }

  const [creatingPlan, setCreatingPlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDuration, setPlanDuration] = useState("30");
  const [planPrice, setPlanPrice] = useState("50.00");

  async function createPlan() {
    const token = getToken();
    if (!token) return;
    const cents = dollarsStringToCents(planPrice);
    if (cents === null) {
      setError("Plan price must be a number.");
      return;
    }
    setCreatingPlan(true);
    setError(null);
    try {
      await apiFetch("/api/v1/membership-plans", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: planName.trim(),
          duration_days: Number(planDuration),
          price_cents: cents,
          currency: "USD",
          is_active: true,
          sort_order: 100,
        }),
      });
      setPlanName("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan.");
    } finally {
      setCreatingPlan(false);
    }
  }

  const [savingPlanId, setSavingPlanId] = useState<number | null>(null);

  const [retentionDays, setRetentionDays] = useState<30 | 90>(90);
  const [savingRetention, setSavingRetention] = useState(false);

  async function savePlan(p: MembershipPlanDraft) {
    const token = getToken();
    if (!token) return;
    const priceCents = dollarsStringToCents(p.price_display);
    if (priceCents === null) {
      setError("Plan price must be a number.");
      return;
    }
    const durationDays = Number(p.duration_display);
    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      setError("Duration days must be a positive number.");
      return;
    }

    setSavingPlanId(p.id);
    setError(null);
    try {
      await apiFetch(`/api/v1/membership-plans/${p.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: p.name,
          duration_days: durationDays,
          price_cents: priceCents,
          currency: p.currency,
          is_active: p.is_active,
          sort_order: p.sort_order,
        }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setSavingPlanId(null);
    }
  }

  const [creatingMember, setCreatingMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberTrainerId, setMemberTrainerId] = useState<number | "">("");
  const [createMemberLogin, setCreateMemberLogin] = useState(true);
  const [memberLoginPassword, setMemberLoginPassword] = useState("password");

  async function createFirstMember() {
    const token = getToken();
    if (!token) return;
    setCreatingMember(true);
    setError(null);
    try {
      const memberRes = await apiFetch<{ data: MemberRow }>("/api/v1/members", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: memberName.trim(),
          email: memberEmail.trim() === "" ? null : memberEmail.trim(),
          phone: memberPhone.trim() === "" ? null : memberPhone.trim(),
          status: "active",
          assigned_trainer_user_id: memberTrainerId === "" ? null : memberTrainerId,
        }),
      });

      if (createMemberLogin) {
        const email = (memberEmail || memberRes.data.email || "").trim();
        if (email === "") {
          setError("Member email is required to create a login.");
          setCreatingMember(false);
          return;
        }
        await apiFetch("/api/v1/users", {
          method: "POST",
          token,
          body: JSON.stringify({
            role: "member",
            member_id: memberRes.data.id,
            name: memberName.trim(),
            email,
            password: memberLoginPassword,
          }),
        });
      }

      setMemberName("");
      setMemberEmail("");
      setMemberPhone("");
      setMemberTrainerId("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member.");
    } finally {
      setCreatingMember(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        Loading onboarding...
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="text-lg font-semibold">Onboarding</div>
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Only the owner can run onboarding.
        </div>
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

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Welcome, Owner</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {gym ? (
                <>
                  {gym.name} • gym code <span className="font-medium">{gym.code}</span>
                </>
              ) : (
                "Loading gym..."
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={staffDone ? "success" : "neutral"}>Staff {staffDone ? "done" : "todo"}</Badge>
            <Badge variant={plansDone ? "success" : "neutral"}>Plans {plansDone ? "done" : "todo"}</Badge>
            <Badge variant={memberDone ? "success" : "neutral"}>
              First member {memberDone ? "done" : "todo"}
            </Badge>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
          Attendance: only owner and cashier can mark check-in / check-out. Members cannot.
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Attendance retention</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Auto-prune attendance records older than this.
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Keep for</span>
            <Select
              value={String(retentionDays)}
              onChange={(e) => setRetentionDays(e.target.value === "30" ? 30 : 90)}
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </Select>
          </label>
          <Button
            variant="neutral"
            type="button"
            disabled={savingRetention || !gym}
            onClick={() => void saveRetention()}
          >
            {savingRetention ? "Saving..." : "Save"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Step 1 — Create staff</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Create at least 1 cashier and 1 trainer.
            </div>
          </div>
          <div className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            Cashiers: {cashierCount} • Trainers: {trainerCount}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">New staff account</div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Role</span>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "cashier" | "trainer")}
                >
                  <option value="cashier">Cashier</option>
                  <option value="trainer">Trainer</option>
                </Select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</span>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Password</span>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                />
              </label>
              <Button
                type="button"
                disabled={
                  creatingUser ||
                  newName.trim() === "" ||
                  newEmail.trim() === "" ||
                  newPassword.trim() === ""
                }
                onClick={() => void createStaff()}
              >
                {creatingUser ? "Creating..." : "Create staff"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Current staff</div>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Cashiers</div>
                <div className="grid gap-2">
                  {users
                    .filter((u) => u.role === "cashier")
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-black"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{u.name}</div>
                          <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">{u.email}</div>
                        </div>
                        <Badge variant="success">cashier</Badge>
                      </div>
                    ))}
                  {cashierCount === 0 ? (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">No cashiers yet.</div>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Trainers</div>
                <div className="grid gap-2">
                  {users
                    .filter((u) => u.role === "trainer")
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-black"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{u.name}</div>
                          <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">{u.email}</div>
                        </div>
                        <Badge variant="success">trainer</Badge>
                      </div>
                    ))}
                  {trainerCount === 0 ? (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">No trainers yet.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Step 2 — Membership plans</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Edit, activate, or add plans. Payments can only use active plans.
            </div>
          </div>
          <div className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            Active: {activePlanCount}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Add a plan</div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Weekly"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Duration (days)</span>
                  <Input
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Price (USD)</span>
                  <Input
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </label>
              </div>
              <Button
                type="button"
                disabled={
                  creatingPlan ||
                  planName.trim() === "" ||
                  planDuration.trim() === "" ||
                  planPrice.trim() === ""
                }
                onClick={() => void createPlan()}
              >
                {creatingPlan ? "Creating..." : "Create plan"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Existing plans</div>
            <div className="mt-3 grid gap-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black"
                >
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Name
                      </div>
                      <Input
                        value={p.name}
                        onChange={(e) =>
                          setPlans((all) =>
                            all.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Duration (days)
                        </span>
                        <Input
                          value={p.duration_display}
                          onChange={(e) =>
                            setPlans((all) =>
                              all.map((x) =>
                                x.id === p.id ? { ...x, duration_display: e.target.value } : x,
                              ),
                            )
                          }
                          inputMode="numeric"
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Price (USD)
                        </span>
                        <Input
                          value={p.price_display}
                          onChange={(e) =>
                            setPlans((all) =>
                              all.map((x) =>
                                x.id === p.id ? { ...x, price_display: e.target.value } : x,
                              ),
                            )
                          }
                          inputMode="decimal"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={p.is_active}
                          onChange={(e) =>
                            setPlans((all) =>
                              all.map((x) =>
                                x.id === p.id ? { ...x, is_active: e.target.checked } : x,
                              ),
                            )
                          }
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <Button
                        variant="neutral"
                        size="sm"
                        type="button"
                        disabled={savingPlanId === p.id}
                        onClick={() => void savePlan(p)}
                      >
                        {savingPlanId === p.id ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {plans.length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">No plans yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Step 3 — Create your first member</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Add a member and optionally create their login.
            </div>
          </div>
          <div className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            Members: {members.length}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">New member</div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
                <Input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</span>
                <Input
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Phone</span>
                <Input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Assign trainer (optional)
                </span>
                <Select
                  value={memberTrainerId === "" ? "" : String(memberTrainerId)}
                  onChange={(e) => setMemberTrainerId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">No trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} • {t.email}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="rounded-xl border border-black/10 bg-white p-3 text-sm dark:border-white/10 dark:bg-black">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createMemberLogin}
                    onChange={(e) => setCreateMemberLogin(e.target.checked)}
                  />
                  <span>Create login now</span>
                </label>
                {createMemberLogin ? (
                  <div className="mt-3 grid gap-2">
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Login password
                    </div>
                    <Input
                      value={memberLoginPassword}
                      onChange={(e) => setMemberLoginPassword(e.target.value)}
                      type="password"
                    />
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                disabled={creatingMember || memberName.trim() === ""}
                onClick={() => void createFirstMember()}
              >
                {creatingMember ? "Creating..." : "Create member"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold">Recent members</div>
            <div className="mt-3 grid gap-2">
              {members.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.name}</div>
                    <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {m.email ?? "—"}
                    </div>
                  </div>
                <Badge variant={m.user_id ? "success" : "neutral"}>
                  {m.user_id ? "has login" : "no login"}
                </Badge>
                </div>
              ))}
              {members.length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">No members yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Finish</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Once you have staff, plans, and at least one member, you’re ready.
            </div>
          </div>
          <Button
            variant="neutral"
            type="button"
            disabled={!staffDone || !plansDone || !memberDone}
            onClick={() => router.push("/admin/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
