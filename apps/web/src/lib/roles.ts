export function roleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  if (role === "owner") return "Owner";
  if (role === "cashier") return "Cashier";
  if (role === "trainer") return "Trainer";
  if (role === "member") return "Member";
  return role;
}

export function isOwnerUser(
  userId: number | null | undefined,
  ownerUserId: number | null | undefined,
): boolean {
  if (!userId || !ownerUserId) return false;
  return userId === ownerUserId;
}

export function canViewBillingOrAttendance(params: {
  role: string | null | undefined;
  isOwner: boolean;
}): boolean {
  return params.isOwner || params.role === "owner" || params.role === "cashier";
}

export function canManageAccounts(params: {
  role: string | null | undefined;
  isOwner: boolean;
}): boolean {
  return params.isOwner || params.role === "owner" || params.role === "cashier";
}
