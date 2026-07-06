"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatPlanLabel, sortPlansByTier, type MembershipPlanOption } from "@/lib/membership-plans";
import { isGoldTier, tierBadgeVariant, tierLabel } from "@/lib/membership-tier";
import {
  amountInputFromStored,
  formatMoney,
  parseMoneyInput,
  planDescription,
} from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type TrainerOption = { id: number; name: string; email: string };

type MemberForPayment = {
  id: number;
  name: string;
  email: string | null;
  membership: {
    plan_name: string | null;
    tier?: string;
    status: string;
    days_remaining: number;
  } | null;
};

type RecordMembershipModalProps = {
  member: MemberForPayment;
  plans: MembershipPlanOption[];
  trainers: TrainerOption[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function RecordMembershipModal({
  member,
  plans,
  trainers,
  onClose,
  onSuccess,
}: RecordMembershipModalProps) {
  const [planId, setPlanId] = useState<number | "">("");
  const [trainerId, setTrainerId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedPlans = useMemo(() => sortPlansByTier(plans), [plans]);
  const currentTier = member.membership?.tier ?? null;
  const selectedPlan = sortedPlans.find((p) => p.id === planId) ?? null;
  const currency = selectedPlan?.currency ?? "MMK";
  const isGold = isGoldTier(selectedPlan?.tier);

  useEffect(() => {
    const pick = sortedPlans[0];
    if (!pick) return;
    setPlanId(pick.id);
    setAmount(amountInputFromStored(pick.price_cents, pick.currency));
    setTrainerId("");
  }, [sortedPlans]);

  useEffect(() => {
    if (!isGold) {
      setTrainerId("");
    }
  }, [isGold]);

  const planChangeNote = useMemo(() => {
    if (!selectedPlan) return null;
    const nextTier = selectedPlan.tier ?? "silver";
    if (!currentTier) return "New membership starts today.";
    if (nextTier === currentTier) return "Renews after the current period ends.";
    if (nextTier === "gold" && currentTier === "silver") {
      return "Gold starts today. Member can choose a personal trainer.";
    }
    if (nextTier === "silver" && currentTier === "gold") {
      return "Silver starts today. Trainer assignment and coaching plans will be removed.";
    }
    return "Plan change starts today.";
  }, [currentTier, selectedPlan]);

  async function submit() {
    const token = getToken();
    if (!token || planId === "") return;

    const amountCents = parseMoneyInput(amount, currency);
    if (amountCents === null) {
      setError("Enter a valid amount in kyat.");
      return;
    }

    if (isGold && trainerId === "" && trainers.length > 0) {
      setError("Choose a personal trainer for Gold membership.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/v1/payments", {
        method: "POST",
        token,
        body: JSON.stringify({
          member_id: member.id,
          membership_plan_id: planId,
          assigned_trainer_user_id: isGold && trainerId !== "" ? trainerId : null,
          amount_cents: amountCents,
          currency,
          method,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Record membership payment</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{member.name}</div>
          </div>
          {currentTier ? (
            <Badge variant={tierBadgeVariant(currentTier)}>{tierLabel(currentTier)}</Badge>
          ) : (
            <Badge variant="neutral">No membership</Badge>
          )}
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Collect payment and activate the member&apos;s monthly plan. Silver is gym access only.
          Gold includes a personal trainer.
        </p>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Plan</span>
            <Select
              value={planId === "" ? "" : String(planId)}
              disabled={busy}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : "";
                setPlanId(id);
                const plan = sortedPlans.find((p) => p.id === id);
                if (plan) setAmount(amountInputFromStored(plan.price_cents, plan.currency));
              }}
            >
              <option value="">Select plan</option>
              {sortedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPlanLabel(p)}
                </option>
              ))}
            </Select>
          </label>

          {selectedPlan ? (
            <div className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
              <div>{planDescription(selectedPlan.tier)}</div>
              {planChangeNote ? <div className="mt-1 font-medium text-emerald-800 dark:text-emerald-200">{planChangeNote}</div> : null}
            </div>
          ) : null}

          {isGold ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">Personal trainer</span>
              <Select
                value={trainerId === "" ? "" : String(trainerId)}
                disabled={busy || trainers.length === 0}
                onChange={(e) => setTrainerId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              {trainers.length === 0 ? (
                <span className="text-xs text-amber-700 dark:text-amber-200">
                  No trainers available. Add a trainer account first.
                </span>
              ) : null}
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Amount ({currency})</span>
              <Input
                type="number"
                min={1}
                step={1}
                value={amount}
                disabled={busy}
                onChange={(e) => setAmount(e.target.value)}
              />
              {selectedPlan ? (
                <span className="text-xs text-zinc-500">
                  Listed price: {formatMoney(selectedPlan.price_cents, selectedPlan.currency)}
                </span>
              ) : null}
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Payment method</span>
              <Select value={method} disabled={busy} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </Select>
            </label>
          </div>

          <Input placeholder="Reference (optional)" value={reference} disabled={busy} onChange={(e) => setReference(e.target.value)} />
          <Input placeholder="Notes (optional)" value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || planId === ""} onClick={() => void submit()}>
            {busy ? "Saving..." : "Confirm payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
