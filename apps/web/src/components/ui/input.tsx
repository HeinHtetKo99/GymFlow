"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";

export function inputClassName(className?: ClassValue) {
  return cn(
    "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-2",
    "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
    "disabled:opacity-50",
    "dark:border-white/10 dark:bg-black dark:ring-offset-black",
    className,
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={inputClassName(className)} {...props} />;
  },
);

Input.displayName = "Input";
