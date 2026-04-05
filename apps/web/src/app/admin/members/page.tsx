"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, type AuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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

type TrainersResponse = {
  data: Array<{ id: number; name: string; email: string }>;
};

export default function AdminMembersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [gym, setGym] = useState<GymResponse | null>(null);
  const [members, setMembers] = useState<MembersResponse["data"]>([]);
  const [trainers, setTrainers] = useState<TrainersResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForMember, setCreateForMember] = useState<MembersResponse["data"][number] | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [creatingMember, setCreatingMember] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTrainerId, setNewTrainerId] = useState<number | "">("");
  const [createLoginNow, setCreateLoginNow] = useState(true);
  const [newPassword, setNewPassword] = useState("password");

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
      const [gymRes, membersRes, trainersRes] = await Promise.all([
        apiFetch<GymResponse>("/api/v1/gym", { token }),
        apiFetch<MembersResponse>("/api/v1/members", { token }),
        apiFetch<TrainersResponse>("/api/v1/trainers", { token }),
      ]);
      setGym(gymRes);
      setMembers(membersRes.data);
      setTrainers(trainersRes.data);
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
    setPhone(member.phone ?? "");
    setPassword("");
  }

  function closeCreate() {
    setCreateForMember(null);
    setEmail("");
    setPhone("");
    setPassword("");
  }

  async function createLogin() {
    const token = getToken();
    if (!token) return;
    if (!createForMember) return;
    setBusy(true);
    setError(null);
    try {
      const trimmedPhone = phone.trim();
      if (trimmedPhone === "") {
        setError("Phone number is required.");
        setBusy(false);
        return;
      }

      if ((createForMember.phone ?? "").trim() !== trimmedPhone) {
        await apiFetch(`/api/v1/members/${createForMember.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ phone: trimmedPhone }),
        });
      }

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

  function openCreateMember() {
    setCreatingMember(true);
    setError(null);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewTrainerId("");
    setCreateLoginNow(true);
    setNewPassword("password");
  }

  function closeCreateMember() {
    setCreatingMember(false);
  }

  async function createMember() {
    const token = getToken();
    if (!token) return;
    const name = newName.trim();
    const phoneValue = newPhone.trim();
    const emailValue = newEmail.trim();
    if (name === "") {
      setError("Name is required.");
      return;
    }
    if (phoneValue === "") {
      setError("Phone number is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const memberRes = await apiFetch<{ data: MembersResponse["data"][number] }>("/api/v1/members", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          email: emailValue === "" ? null : emailValue,
          phone: phoneValue,
          status: "active",
          assigned_trainer_user_id: newTrainerId === "" ? null : newTrainerId,
        }),
      });

      if (createLoginNow) {
        const loginEmail = (emailValue || memberRes.data.email || "").trim();
        if (loginEmail === "") {
          setError("Email is required to create a login.");
          setBusy(false);
          return;
        }
        await apiFetch("/api/v1/users", {
          method: "POST",
          token,
          body: JSON.stringify({
            role: "member",
            member_id: memberRes.data.id,
            name,
            email: loginEmail,
            password: newPassword,
          }),
        });
      }

      closeCreateMember();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member.");
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
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Total: {members.length}</div>
          {canManageMemberAccounts ? (
            <Button variant="neutral" type="button" disabled={busy} onClick={openCreateMember}>
              New member
            </Button>
          ) : null}
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
                    <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {m.phone ? `Phone: ${m.phone}` : "Phone: —"}
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
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Phone
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0123"
                />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Password
                </div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" type="button" disabled={busy} onClick={closeCreate}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || phone.trim() === "" || email.trim() === "" || password.trim().length < 8}
                onClick={() => void createLogin()}
              >
                {busy ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {creatingMember ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
            <div className="text-lg font-semibold">New member</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Create a member profile (phone required), and optionally create their login.
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Name</div>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Phone</div>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +1 555-0123"
                />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Email (optional)</div>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </label>
              <label className="grid gap-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Assign trainer (optional)
                </div>
                <Select
                  value={newTrainerId === "" ? "" : String(newTrainerId)}
                  onChange={(e) => setNewTrainerId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">No trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} • {t.email}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createLoginNow}
                    onChange={(e) => setCreateLoginNow(e.target.checked)}
                  />
                  <span>Create login now</span>
                </label>
                {createLoginNow ? (
                  <div className="mt-3 grid gap-2">
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Login password
                    </div>
                    <Input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                    />
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Email is required for login.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" type="button" disabled={busy} onClick={closeCreateMember}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  busy ||
                  newName.trim() === "" ||
                  newPhone.trim() === "" ||
                  (createLoginNow && (newEmail.trim() === "" || newPassword.trim().length < 8))
                }
                onClick={() => void createMember()}
              >
                {busy ? "Creating..." : "Create member"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
