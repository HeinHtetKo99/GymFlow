export function currencyUsesMinorUnit(currency: string) {
  return currency.toUpperCase() !== "MMK";
}

export function formatMoney(amount: number, currency: string) {
  const code = currency.toUpperCase();
  if (code === "MIXED") {
    return `${amount.toLocaleString()} (mixed currencies)`;
  }
  const value = currencyUsesMinorUnit(code) ? amount / 100 : amount;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: currencyUsesMinorUnit(code) ? 2 : 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${code}`;
  }
}

export function parseMoneyInput(raw: string, currency: string): number | null {
  const parsed = Number(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return currencyUsesMinorUnit(currency) ? Math.round(parsed * 100) : Math.round(parsed);
}

export function amountInputFromStored(amount: number, currency: string): string {
  return currencyUsesMinorUnit(currency) ? (amount / 100).toFixed(2) : String(amount);
}

export function planDescription(tier: string | null | undefined) {
  if (tier === "gold") {
    return "Gym access + personal trainer, workout & meal plans, progress tracking";
  }
  if (tier === "silver") {
    return "Gym access only";
  }
  return "";
}
