"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, type AuthUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-classes";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type GymResponse = {
  id: number;
  name: string;
  code: string;
  owner_user_id: number | null;
  permissions: {
    can_update: boolean;
    can_manage_billing: boolean;
  };
};

type MemberListResponse = {
  data: Array<{
    id: number;
    user_id: number | null;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    assigned_trainer_user_id: number | null;
    created_at: string;
    membership: {
      id: number;
      membership_plan_id: number;
      plan_name: string | null;
      starts_at: string;
      ends_at: string;
      status: string;
      cancel_requested_at: string | null;
      days_remaining: number;
    } | null;
  }>;
};

type AttendanceListResponse = {
  data: Array<{
    id: number;
    member_id: number;
    checked_in_by_user_id: number | null;
    checked_in_at: string;
    checked_out_at: string | null;
    member?: { id: number; name: string };
    checked_in_by?: { id: number; name: string };
  }>;
};

type PaymentListResponse = {
  data: Array<{
    id: number;
    member_id: number;
    amount_cents: number;
    currency: string;
    method: string;
    status: string;
    paid_at: string;
    reference: string | null;
    member?: { id: number; name: string };
    recorded_by?: { id: number; name: string };
  }>;
};

type UsersListResponse = {
  data: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
};

type MembershipPlansResponse = {
  data: Array<{
    id: number;
    name: string;
    duration_days: number;
    price_cents: number;
    currency: string;
  }>;
};

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [gym, setGym] = useState<GymResponse | null>(null);
  const [members, setMembers] = useState<MemberListResponse["data"]>([]);
  const [attendance, setAttendance] = useState<AttendanceListResponse["data"]>([]);
  const [payments, setPayments] = useState<PaymentListResponse["data"]>([]);
  const [users, setUsers] = useState<UsersListResponse["data"]>([]);
  const [plans, setPlans] = useState<MembershipPlansResponse["data"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPaymentMemberId, setNewPaymentMemberId] = useState<number | "">("");
  const [newPaymentPlanId, setNewPaymentPlanId] = useState<number | "">("");
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("50.00");
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>("cash");
  const [newPaymentReference, setNewPaymentReference] = useState<string>("");
  const [newPaymentNotes, setNewPaymentNotes] = useState<string>("");

  const [checkInMemberId, setCheckInMemberId] = useState<number | "">("");

  const [staffName, setStaffName] = useState<string>("");
  const [staffEmail, setStaffEmail] = useState<string>("");
  const [staffPassword, setStaffPassword] = useState<string>("");
  const [staffRole, setStaffRole] = useState<string>("trainer");
  const [staffBusy, setStaffBusy] = useState<boolean>(false);

  const isOwner = useMemo(() => {
    if (!gym || !user) return false;
    return user.role === "owner" || gym.owner_user_id === user.id;
  }, [gym, user]);

  const canBilling = useMemo(() => {
    if (!user) return false;
    if (isOwner) return true;
    return user.role === "cashier";
  }, [isOwner, user]);

  const canCancelMembership = useMemo(() => {
    if (!user) return false;
    return isOwner || user.role === "cashier";
  }, [isOwner, user]);

  const openAttendances = useMemo(() => {
    return attendance.filter((a) => a.checked_out_at === null);
  }, [attendance]);

  const lastPaymentsTotalCents = useMemo(() => {
    return payments.slice(0, 20).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  }, [payments]);

  function formatMoney(amountCents: number, currency: string) {
    const value = amountCents / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

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
    const u = getUser();
    if (!token || !u) return;

    setUser(u);
    setLoading(true);
    setError(null);
    try {
      const gymRes = await apiFetch<GymResponse>("/api/v1/gym", { token });
      const membersRes = await apiFetch<MemberListResponse>("/api/v1/members", { token });

      const owner =
        u.role === "owner" || (gymRes.owner_user_id !== null && gymRes.owner_user_id === u.id);
      const canBillingNow = owner || u.role === "cashier";
      const needsUsers = owner;

      const [attendanceRes, paymentsRes, usersRes, plansRes] = await Promise.all([
        canBillingNow
          ? apiFetch<AttendanceListResponse>("/api/v1/attendance", { token })
          : Promise.resolve({ data: [] } as AttendanceListResponse),
        canBillingNow
          ? apiFetch<PaymentListResponse>("/api/v1/payments", { token })
          : Promise.resolve({ data: [] } as PaymentListResponse),
        needsUsers
          ? apiFetch<UsersListResponse>("/api/v1/users", { token })
          : Promise.resolve({ data: [] } as UsersListResponse),
        canBillingNow
          ? apiFetch<MembershipPlansResponse>("/api/v1/membership-plans", { token })
          : Promise.resolve({ data: [] } as MembershipPlansResponse),
      ]);
      setGym(gymRes);
      setMembers(membersRes.data);
      setAttendance(attendanceRes.data);
      setPayments(paymentsRes.data);
      setUsers(usersRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function createPayment() {
    const token = getToken();
    if (!token) return;
    if (newPaymentMemberId === "") return;

    const raw = newPaymentAmount.trim();
    const parsed = raw === "" ? NaN : Number(raw);
    const amountCents = Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;

    if (!Number.isFinite(amountCents) || amountCents < 1) {
      setError("Enter a valid amount.");
      return;
    }

    await apiFetch("/api/v1/payments", {
      method: "POST",
      token,
      body: JSON.stringify({
        member_id: newPaymentMemberId,
        membership_plan_id: newPaymentPlanId === "" ? null : newPaymentPlanId,
        amount_cents: amountCents,
        method: newPaymentMethod,
        reference: newPaymentReference.trim() === "" ? null : newPaymentReference.trim(),
        notes: newPaymentNotes.trim() === "" ? null : newPaymentNotes.trim(),
      }),
    });
    setNewPaymentPlanId("");
    setNewPaymentReference("");
    setNewPaymentNotes("");
    await loadAll();
  }

  async function doCheckIn() {
    const token = getToken();
    if (!token) return;
    if (checkInMemberId === "") return;

    await apiFetch("/api/v1/attendance/check-in", {
      method: "POST",
      token,
      body: JSON.stringify({ member_id: checkInMemberId }),
    });
    await loadAll();
  }

  async function doCheckOut(attendanceId: number) {
    const token = getToken();
    if (!token) return;
    await apiFetch(`/api/v1/attendance/${attendanceId}/check-out`, {
      method: "POST",
      token,
      body: JSON.stringify({}),
    });
    await loadAll();
  }

  async function createStaffUser() {
    const token = getToken();
    if (!token) return;
    setStaffBusy(true);
    setError(null);
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
        }),
      });
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffRole("trainer");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setStaffBusy(false);
    }
  }

  async function updateUserRole(userId: number, role: string) {
    const token = getToken();
    if (!token) return;
    setStaffBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/users/${userId}/role`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setStaffBusy(false);
    }
  }

  async function cancelMembership(memberId: number) {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/api/v1/members/${memberId}/membership/cancel`, {
        method: "POST",
        token,
        body: JSON.stringify({}),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel membership.");
    }
  }

  async function undoCancelMembership(memberId: number) {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/api/v1/members/${memberId}/membership/undo-cancel`, {
        method: "POST",
        token,
        body: JSON.stringify({}),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to undo cancel.");
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

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Gym</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {gym ? gym.name : "—"}
            </div>
            {gym?.code ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Gym code: {gym.code}</Badge>
                {isOwner ? <Badge variant="success">Owner</Badge> : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={gym?.permissions.can_update ? "success" : "neutral"}>
              Update gym: {gym?.permissions.can_update ? "yes" : "no"}
            </Badge>
            <Badge variant={gym?.permissions.can_manage_billing ? "success" : "neutral"}>
              Billing: {gym?.permissions.can_manage_billing ? "yes" : "no"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="text-lg font-semibold">Quick Actions</div>

          <div className="mt-4 grid gap-6">
            {canBilling ? (
              <>
                <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold">Check-in</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Select a member and mark attendance.
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={checkInMemberId === "" ? "" : String(checkInMemberId)}
                      onChange={(e) =>
                        setCheckInMemberId(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.email ? `${m.name} • ${m.email}` : m.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="neutral"
                      className="sm:w-auto"
                      type="button"
                      onClick={() => void doCheckIn()}
                      disabled={checkInMemberId === ""}
                    >
                      Check-in
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold">Check-out</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Open check-ins
                  </div>
                  <div className="mt-4 grid gap-2">
                    {openAttendances.length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        No open check-ins.
                      </div>
                    ) : (
                      openAttendances.slice(0, 5).map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-black"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {a.member?.name ?? `Member #${a.member_id}`}
                            </div>
                            <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                              In: {formatDateTime(a.checked_in_at)}
                            </div>
                          </div>
                          <Button
                            variant="neutral"
                            size="sm"
                            className="h-9 rounded-lg px-3 text-xs"
                            type="button"
                            onClick={() => void doCheckOut(a.id)}
                          >
                            Check-out
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold">Record payment</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Save payment and generate a receipt.
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Select
                      className="sm:col-span-2"
                      value={newPaymentMemberId === "" ? "" : String(newPaymentMemberId)}
                      onChange={(e) =>
                        setNewPaymentMemberId(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.email ? `${m.name} • ${m.email}` : m.name}
                        </option>
                      ))}
                    </Select>

                    <Select value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)}>
                      <option value="cash">cash</option>
                      <option value="card">card</option>
                      <option value="bank_transfer">bank_transfer</option>
                      <option value="other">other</option>
                    </Select>

                    <Select
                      className="sm:col-span-3"
                      value={newPaymentPlanId === "" ? "" : String(newPaymentPlanId)}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : "";
                        setNewPaymentPlanId(id);
                        const plan = plans.find((p) => p.id === id);
                        if (plan) {
                          setNewPaymentAmount((plan.price_cents / 100).toFixed(2));
                        }
                      }}
                    >
                      <option value="">One-time membership (30 days)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} • {p.duration_days} days • {formatMoney(p.price_cents, p.currency)}
                        </option>
                      ))}
                    </Select>

                    <Input
                      className="sm:col-span-2"
                      type="number"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      min={0.01}
                      step={0.01}
                    />
                    <Button
                      type="button"
                      onClick={() => void createPayment()}
                      disabled={newPaymentMemberId === ""}
                    >
                      Save
                    </Button>

                    <Input
                      className="sm:col-span-3"
                      placeholder="Reference (bank transfer id, receipt #, etc.)"
                      value={newPaymentReference}
                      onChange={(e) => setNewPaymentReference(e.target.value)}
                    />
                    <textarea
                      className="min-h-24 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:ring-offset-black sm:col-span-3"
                      placeholder="Notes (optional)"
                      value={newPaymentNotes}
                      onChange={(e) => setNewPaymentNotes(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Amount is entered in dollars (example: 50.00).
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                You don’t have permission to manage attendance or record payments.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="text-lg font-semibold">Summary</div>
          <div className="mt-4 grid gap-2 text-sm">
            <div>Members: {members.length}</div>
            {canBilling ? (
              <>
                <div>Attendance records: {attendance.length}</div>
                <div>Payments: {payments.length}</div>
                <div>
                  Last 20 payments total:{" "}
                  <span className="font-medium">
                    {formatMoney(lastPaymentsTotalCents, "USD")}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-zinc-600 dark:text-zinc-400">
                Billing and attendance are hidden for your role.
              </div>
            )}
          </div>
        </div>
      </section>

      {isOwner ? (
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Owner Controls</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Create trainers/cashiers and manage roles.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="text-sm font-semibold">Create Staff User</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Input
                  className="sm:col-span-2"
                  placeholder="Name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  autoComplete="email"
                />
                <Input
                  placeholder="Password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  type="password"
                />
                <Select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                >
                  <option value="trainer">{roleLabel("trainer")}</option>
                  <option value="cashier">{roleLabel("cashier")}</option>
                  <option value="member">{roleLabel("member")}</option>
                </Select>
                <Button
                  className="sm:col-span-2"
                  type="button"
                  disabled={
                    staffBusy ||
                    staffName.trim() === "" ||
                    staffEmail.trim() === "" ||
                    staffPassword.trim().length < 8
                  }
                  onClick={() => void createStaffUser()}
                >
                  {staffBusy ? "Saving..." : "Create"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="text-sm font-semibold">Users & Roles</div>
              <div className="mt-3 space-y-2 text-sm">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 px-3 py-2 dark:border-white/10"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {u.email} • #{u.id}
                      </div>
                    </div>
                    {(gym?.owner_user_id ?? -1) === u.id ? (
                      <Badge variant="success">Owner</Badge>
                    ) : (
                      <Select
                        className="h-9 w-auto rounded-lg px-2"
                        value={u.role}
                        disabled={staffBusy}
                        onChange={(e) => void updateUserRole(u.id, e.target.value)}
                      >
                        <option value="member">{roleLabel("member")}</option>
                        <option value="trainer">{roleLabel("trainer")}</option>
                        <option value="cashier">{roleLabel("cashier")}</option>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Members</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {members.length}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Membership</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {members.slice(0, 15).map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                      <td className="px-3 py-2 font-medium">{m.name}</td>
                      <td className="px-3 py-2">
                        {m.membership ? (
                          <div className="min-w-0">
                            <div className="truncate text-xs font-medium">
                              {m.membership.plan_name ?? "Membership"}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <Badge
                                variant={
                                  m.membership.status === "active"
                                    ? "success"
                                    : m.membership.status === "canceling"
                                      ? "warning"
                                      : "neutral"
                                }
                              >
                                {m.membership.status}
                              </Badge>
                              <span>{m.membership.days_remaining} days left</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canCancelMembership &&
                        m.membership &&
                        (m.membership.status === "active" ||
                          m.membership.status === "canceling") &&
                        m.membership.days_remaining > 0 ? (
                          m.membership.status === "canceling" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-xs"
                              type="button"
                              onClick={() => void undoCancelMembership(m.id)}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-xs"
                              type="button"
                              onClick={() => void cancelMembership(m.id)}
                            >
                              Cancel
                            </Button>
                          )
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-8 text-center text-zinc-600 dark:text-zinc-400"
                        colSpan={3}
                      >
                        No members yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Attendance</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Open {openAttendances.length}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Member</th>
                    <th className="px-3 py-2 font-medium">In</th>
                    <th className="px-3 py-2 font-medium">Out</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {attendance.slice(0, 15).map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                      <td className="px-3 py-2 font-medium">
                        {a.member?.name ?? `Member #${a.member_id}`}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(a.checked_in_at)}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(a.checked_out_at)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {a.checked_out_at === null ? (
                          <Button
                            variant="neutral"
                            size="sm"
                            className="h-8 rounded-lg px-3 text-xs"
                            type="button"
                            onClick={() => void doCheckOut(a.id)}
                          >
                            Check-out
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-8 text-center text-zinc-600 dark:text-zinc-400"
                        colSpan={4}
                      >
                        No attendance yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Payments</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {payments.length}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Member</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {payments.slice(0, 15).map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                      <td className="px-3 py-2 font-medium">
                        {p.member?.name ?? `Member #${p.member_id}`}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(p.amount_cents, p.currency)}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {p.method}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={p.status === "paid" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          className={buttonClassName({
                            variant: "outline",
                            size: "sm",
                            className: "h-8 rounded-lg px-2 text-xs",
                          })}
                          href={`/admin/payments/${p.id}/receipt`}
                        >
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-8 text-center text-zinc-600 dark:text-zinc-400"
                        colSpan={5}
                      >
                        No payments yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
            Bank transfers: put transaction id in Reference when recording.
          </div>
        </div>
      </section>
    </div>
  );
}
