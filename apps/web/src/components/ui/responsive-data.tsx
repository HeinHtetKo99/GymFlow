"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";
import { tableCardClassName } from "@/components/ui/table";

export function DataPanel({
  className,
  scrollClassName,
  children,
}: {
  className?: ClassValue;
  scrollClassName?: ClassValue;
  children: React.ReactNode;
}) {
  return (
    <div className={tableCardClassName(className)}>
      <div className={cn("max-h-[70vh] overflow-auto", scrollClassName)}>{children}</div>
    </div>
  );
}

export function DataDesktop({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

export function DataMobile({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return <div className={cn("divide-y divide-black/10 md:hidden dark:divide-white/10", className)}>{children}</div>;
}

export function DataRow({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-3 p-4 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: ClassValue;
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function DataActions({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-wrap gap-2 pt-1", className)}>{children}</div>;
}
