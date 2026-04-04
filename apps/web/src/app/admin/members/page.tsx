"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, type AuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type GymResponse = {
  owner_user_id: number | null;
};

type MembersResponse = {
  data: Array<{
    id: number;
    user_id: number | null;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    membership: {
      plan_name: string | null;
      status: string;
      ends_at: string;
      days_remaining: number;
    } | null;
  }>;
};

export default function AdminMembersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [gym, setGym] = useState<GymResponse | null>(null);
  const [members, setMembers] = useState<MembersResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForMember, setCreateForMember] = useState<MembersResponse["data"][number] | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const isOwner = useMemo(() => {
    if (!gym || !user) return false;
    return gym.owner_user_id === user.id;
  }, [gym, user]);

  const canManageMemberAccounts = useMemo(() => {
    return user?.role === "cashier" || isOwner;
  }, [isOwner, user?.role]);

  function formatDate(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
    } catch {
      return d.toLocaleDateString();
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
      const [gymRes, membersRes] = await Promise.all([
        apiFetch<GymResponse>("/api/v1/gym", { token }),
        apiFetch<MembersResponse>("/api/v1/members", { token }),
      ]);
      setGym(gymRes);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function openCreate(member: MembersResponse["data"][number]) {
    setCreateForMember(member);
    setEmail(member.email ?? "");
    setPassword("");
  }

  function closeCreate() {
    setCreateForMember(null);
    setEmail("");
    setPassword("");
  }

  async function createLogin() {
    const token = getToken();
    if (!token) return;
    if (!createForMember) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: createForMember.name,
          email,
          password,
          role: "member",
          member_id: createForMember.id,
        }),
      });
      closeCreate();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member account.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(userId: number) {
    const token = getToken();
    if (!token) return;
    if (!confirm("Delete this member account? This removes login access but keeps history.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/users/${userId}`, { method: "DELETE", token });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelMembership(memberId: number) {
    const token = getToken();
    if (!token) return;
    if (!confirm("Cancel this membership at end of period?")) return;
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  async function undoCancelMembership(memberId: number) {
    const token = getToken();
    if (!token) return;
    setBusy(true);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Members</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage member profiles and login accounts.
          </div>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Total: {members.length}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Membership</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {m.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.membership ? (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">
                          {m.membership.plan_name ?? "Membership"}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {m.membership.status} • {m.membership.days_remaining} days • ends{" "}
                          {formatDate(m.membership.ends_at)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.user_id ? (
                      <Badge variant="success">Active (user #{m.user_id})</Badge>
                    ) : (
                      <Badge variant="neutral">No login</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManageMemberAccounts ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {m.membership && m.membership.days_remaining > 0 ? (
                          m.membership.status === "canceling" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs"
                              type="button"
                              disabled={busy}
                              onClick={() => void undoCancelMembership(m.id)}
                            >
                              Undo cancel
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs"
                              type="button"
                              disabled={busy}
                              onClick={() => void cancelMembership(m.id)}
                            >
                              Cancel membership
                            </Button>
                          )
                        ) : null}

                        {m.user_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs"
                            type="button"
                            disabled={busy}
                            onClick={() => void deleteAccount(m.user_id!)}
                          >
                            Delete account
                          </Button>
                        ) : (
                          <Button
                            variant="neutral"
                            size="sm"
                            className="h-9 px-3 text-xs"
                            type="button"
                            disabled={busy}
                            onClick={() => openCreate(m)}
                          >
                            Create login
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-zinc-600 dark:text-zinc-400"
                    colSpan={4}
                  >
                    No members yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {createForMember ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
            <div className="text-lg font-semibold">Create member login</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {createForMember.name}
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Email
                </div>
                <input
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Password
                </div>
                <input
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/10"
                type="button"
                disabled={busy}
                onClick={closeCreate}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                type="button"
                disabled={busy || email.trim() === "" || password.trim().length < 8}
                onClick={() => void createLogin()}
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
