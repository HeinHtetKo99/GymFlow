"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export type UserMenuBadge = {
  label: string;
  variant?: "neutral" | "success" | "warning" | "danger";
};

export function UserMenu({
  user,
  badges,
  onLogout,
}: {
  user: { name: string; email: string } | null;
  badges?: UserMenuBadge[];
  onLogout: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const initials = (() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
  })();

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white py-1.5 pl-1.5 pr-3 text-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/10"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
          {initials}
        </span>
        <span className="hidden sm:inline-flex flex-col items-start leading-tight">
          <span className="font-medium">{user?.name ?? "Profile"}</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {user?.email ?? ""}
          </span>
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black">
          <div className="px-4 py-3">
            <div className="text-sm font-semibold">{user?.name ?? "—"}</div>
            <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {user?.email ?? "—"}
            </div>
            {badges?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <Badge key={b.label} variant={b.variant ?? "neutral"}>
                    {b.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="border-t border-black/10 p-2 dark:border-white/10">
            <button
              className="flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              type="button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
