"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, type AuthUser } from "@/lib/auth";
import { isOwnerUser, roleLabel } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type GymResponse = {
  owner_user_id: number | null;
};

type UsersResponse = {
  data: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
};

export default function AdminUsersPage() {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [gym, setGym] = useState<GymResponse | null>(null);
  const [users, setUsers] = useState<UsersResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");

  const isOwner = useMemo(() => {
    if (!gym || !me) return false;
    return me.role === "owner" || gym.owner_user_id === me.id;
  }, [gym, me]);

  const canCreateRoles = useMemo(() => {
    if (isOwner) return [];
    if (me?.role === "cashier") return ["member"];
    return [];
  }, [isOwner, me?.role]);

  async function loadAll() {
    const token = getToken();
    const u = getUser();
    if (!token || !u) return;
    setMe(u);
    setLoading(true);
    setError(null);
    try {
      const [gymRes, usersRes] = await Promise.all([
        apiFetch<GymResponse>("/api/v1/gym", { token }),
        apiFetch<UsersResponse>("/api/v1/users", { token }),
      ]);
      setGym(gymRes);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function createUser() {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password, role }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole(canCreateRoles.includes("member") ? "member" : canCreateRoles[0] ?? "member");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(userId: number, nextRole: string) {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/users/${userId}/role`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role: nextRole }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(userId: number) {
    const token = getToken();
    if (!token) return;
    if (!confirm("Delete this account?")) return;
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
          <div className="text-2xl font-semibold tracking-tight">Accounts</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Owner can manage all roles. Cashier can manage member accounts.
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {canCreateRoles.length > 0 ? (
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="text-lg font-semibold">Create account</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Input
              className="md:col-span-1"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="md:col-span-1"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="md:col-span-1"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
            <Select
              className="md:col-span-1"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {canCreateRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
            <div className="md:col-span-4">
              <Button
                variant="neutral"
                type="button"
                disabled={busy || name.trim() === "" || email.trim() === "" || password.trim().length < 8}
                onClick={() => void createUser()}
              >
                {busy ? "Saving..." : "Create"}
              </Button>
            </div>
          </div>
        </section>
      ) : isOwner ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-black dark:text-zinc-400">
          Use <span className="font-medium text-zinc-900 dark:text-zinc-50">Setup</span> to create staff and update membership plan prices.
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-black dark:text-zinc-400">
          You don’t have permission to create accounts.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {users.map((u) => {
                const ownerUser = isOwnerUser(u.id, gym?.owner_user_id ?? null);
                const isSelf = me?.id === u.id;
                const canOwnerManage = isOwner && !ownerUser;
                const canCashierDelete = me?.role === "cashier" && u.role === "member" && !isSelf;
                const canDelete = (canOwnerManage && !isSelf) || canCashierDelete;
                const canRoleChange = canOwnerManage && !isSelf;

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {u.name}
                        {ownerUser ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                            Owner
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {u.email} • #{u.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canRoleChange ? (
                        <select
                          className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-900 outline-none ring-offset-2 focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:ring-offset-black"
                          value={u.role}
                          disabled={busy}
                          onChange={(e) => void updateRole(u.id, e.target.value)}
                        >
                          <option value="member">{roleLabel("member")}</option>
                          <option value="trainer">{roleLabel("trainer")}</option>
                          <option value="cashier">{roleLabel("cashier")}</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-900/5 px-2 py-1 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                          {roleLabel(u.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete ? (
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/10"
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteUser(u.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-zinc-600 dark:text-zinc-400"
                    colSpan={3}
                  >
                    No users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
