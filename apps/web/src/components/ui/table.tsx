"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";

export function tableCardClassName(className?: ClassValue) {
  return cn(
    "overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black",
    className,
  );
}

export type TableCardProps = React.HTMLAttributes<HTMLDivElement>;

export function TableCard({ className, ...props }: TableCardProps) {
  return <div className={tableCardClassName(className)} {...props} />;
}

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <table
      className={cn("min-w-full divide-y divide-black/10 dark:divide-white/10", className)}
      {...props}
    />
  );
}

export type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function Th({ className, ...props }: ThProps) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}

export type TdProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export function Td({ className, ...props }: TdProps) {
  return <td className={cn("px-4 py-3 text-sm", className)} {...props} />;
}
