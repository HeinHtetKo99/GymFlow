"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { buttonClassName } from "@/components/ui/button-classes";
import { Button } from "@/components/ui/button";

type GymResponse = {
  id: number;
  name: string;
  code: string;
};

type PaymentShowResponse = {
  data: {
    id: number;
    member_id: number;
    membership_plan_id: number | null;
    amount_cents: number;
    currency: string;
    method: string;
    status: string;
    paid_at: string;
    reference: string | null;
    notes: string | null;
    member?: { id: number; name: string };
    recorded_by?: { id: number; name: string };
    membership_plan?: {
      id: number;
      name: string;
      duration_days: number;
      price_cents: number;
      currency: string;
    };
  };
};

export default function PaymentReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const paymentId = useMemo(() => Number(params.id), [params.id]);

  const [gym, setGym] = useState<GymResponse | null>(null);
  const [payment, setPayment] = useState<PaymentShowResponse["data"] | null>(null);
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      setError("Invalid payment id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [gymRes, paymentRes] = await Promise.all([
          apiFetch<GymResponse>("/api/v1/gym", { token }),
          apiFetch<PaymentShowResponse>(`/api/v1/payments/${paymentId}`, { token }),
        ]);
        setGym(gymRes);
        setPayment(paymentRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load receipt.");
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentId, router]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        Loading receipt...
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

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Receipt</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Payment #{payment?.id ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className={buttonClassName({ variant: "outline", size: "sm" })}
            href="/admin/payments"
          >
            Back
          </Link>
          <Button size="sm" type="button" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
        <div className="border-b border-black/10 bg-zinc-50 px-6 py-4 dark:border-white/10 dark:bg-zinc-900">
          <div className="text-lg font-semibold">{gym?.name ?? "Gym"}</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Gym code: {gym?.code ?? "—"}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
              <div className="text-sm font-semibold">Payment</div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Receipt #</span>
                  <span className="font-medium">{payment?.id ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Paid at</span>
                  <span className="font-medium">{formatDateTime(payment?.paid_at ?? null)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                  <span className="font-medium">{payment?.status ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Method</span>
                  <span className="font-medium">{payment?.method ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Reference</span>
                  <span className="font-medium">{payment?.reference ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Recorded by</span>
                  <span className="font-medium">{payment?.recorded_by?.name ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
              <div className="text-sm font-semibold">Member & Plan</div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Member</span>
                  <span className="font-medium">
                    {payment?.member?.name ?? (payment ? `Member #${payment.member_id}` : "—")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Plan</span>
                  <span className="font-medium">{payment?.membership_plan?.name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Duration</span>
                  <span className="font-medium">
                    {payment?.membership_plan?.duration_days
                      ? `${payment.membership_plan.duration_days} days`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Amount</span>
                  <span className="text-base font-semibold">
                    {payment ? formatMoney(payment.amount_cents, payment.currency) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {payment?.notes ? (
            <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
              <div className="text-sm font-semibold">Notes</div>
              <div className="mt-2 whitespace-pre-wrap">{payment.notes}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
