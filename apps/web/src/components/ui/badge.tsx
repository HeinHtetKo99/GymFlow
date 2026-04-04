"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger";

export function badgeClassName({
  variant = "neutral",
  className,
}: {
  variant?: BadgeVariant;
  className?: ClassValue;
}) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
  const variants: Record<BadgeVariant, string> = {
    neutral:
      "bg-zinc-900/5 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "bg-red-500/10 text-red-700 dark:text-red-200",
  };
  return cn(base, variants[variant], className);
}

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={badgeClassName({ variant, className })} {...props} />;
}
