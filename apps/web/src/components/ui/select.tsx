"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";

export function selectClassName(className?: ClassValue) {
  return cn(
    "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-2",
    "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
    "disabled:opacity-50",
    "dark:border-white/10 dark:bg-black dark:ring-offset-black",
    className,
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return <select ref={ref} className={selectClassName(className)} {...props} />;
  },
);

Select.displayName = "Select";
