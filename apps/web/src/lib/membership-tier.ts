export type MembershipTier = "standard" | "silver" | "gold";

export function tierLabel(tier: string | null | undefined): string {
  switch (tier) {
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    default:
      return "Standard";
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

export function includesPersonalTraining(tier: string | null | undefined): boolean {
  return tier === "silver" || tier === "gold";
}
