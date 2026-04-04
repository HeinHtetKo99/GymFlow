import { cn, type ClassValue } from "@/lib/cn";

export type ButtonVariant = "primary" | "neutral" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: ClassValue;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-black";
  const sizes =
    size === "sm" ? "h-10 rounded-xl px-3 text-sm" : "h-11 rounded-xl px-4 text-sm";
  const width = fullWidth ? "w-full" : "";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    neutral:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
    outline:
      "border border-black/10 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10",
    danger:
      "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500/40",
    ghost:
      "bg-transparent text-zinc-900 hover:bg-zinc-900/5 dark:text-zinc-50 dark:hover:bg-white/10",
  };

  return cn(base, sizes, width, variants[variant], className);
}
