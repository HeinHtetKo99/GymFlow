"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type PaymentsResponse = {
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
  }>;
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function formatMoney(amountCents: number, currency: string) {
    const value = amountCents / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PaymentsResponse>("/api/v1/payments", { token });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold tracking-tight">Payments</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Recorded payments for members.
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
                <th className="px-4 py-3 font-medium">Paid at</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">
                    {p.member?.name ?? `Member #${p.member_id}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(p.paid_at)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(p.amount_cents, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.method}
                    {p.reference ? (
                      <div className="mt-1 text-xs">Ref: {p.reference}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-xs font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/10"
                      href={`/admin/payments/${p.id}/receipt`}
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
              {data.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-zinc-600 dark:text-zinc-400"
                    colSpan={6}
                  >
                    No payments yet.
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
