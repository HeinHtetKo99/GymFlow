"use client";

import * as React from "react";
import { cn, type ClassValue } from "@/lib/cn";

export function cardClassName(className?: ClassValue) {
  return cn(
    "rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black",
    className,
  );
}

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cardClassName(className)} {...props} />;
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
