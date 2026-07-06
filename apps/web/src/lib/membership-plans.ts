import { formatMoney } from "@/lib/money";

export type MembershipPlanOption = {
  id: number;
  name: string;
  tier?: string;
  duration_days: number;
  price_cents: number;
  currency: string;
};

export function formatPlanLabel(plan: MembershipPlanOption) {
  const price = formatMoney(plan.price_cents, plan.currency);
  return `${plan.name} • ${plan.duration_days} days • ${price}/month`;
}

export function sortPlansByTier(plans: MembershipPlanOption[]) {
  const rank: Record<string, number> = { silver: 0, gold: 1 };
  return [...plans]
    .filter((p) => p.tier === "silver" || p.tier === "gold")
    .sort((a, b) => {
      const ar = rank[a.tier ?? "silver"] ?? 0;
      const br = rank[b.tier ?? "silver"] ?? 0;
      if (ar !== br) return ar - br;
      return a.name.localeCompare(b.name);
    });
}
