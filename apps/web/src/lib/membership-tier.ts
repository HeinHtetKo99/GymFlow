export type MembershipTier = "silver" | "gold";

export function tierLabel(tier: string | null | undefined): string {
  switch (tier) {
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    default:
      return "No plan";
  }
}

export function tierBadgeVariant(tier: string | null | undefined): "neutral" | "success" | "warning" {
  switch (tier) {
    case "gold":
      return "warning";
    case "silver":
      return "success";
    default:
      return "neutral";
  }
}

export function isGoldTier(tier: string | null | undefined): boolean {
  return tier === "gold";
}

export function includesPersonalTraining(tier: string | null | undefined): boolean {
  return tier === "gold";
}

export function hasActiveMembershipTier(tier: string | null | undefined): boolean {
  return tier === "silver" || tier === "gold";
}
