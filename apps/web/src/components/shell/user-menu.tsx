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
  const rootRef = React.useRef<HTMLDivElement>(null);

  const initials = (() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
  })();

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-1.5 pr-2 text-sm hover:bg-zinc-50 sm:gap-3 sm:pr-3 dark:border-white/10 dark:bg-black dark:hover:bg-white/10"
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
          {initials}
        </span>
        <span className="hidden sm:inline-flex flex-col items-start leading-tight">
          <span className="max-w-[10rem] truncate font-medium">{user?.name ?? "Profile"}</span>
          <span className="max-w-[10rem] truncate text-xs text-zinc-600 dark:text-zinc-400">
            {user?.email ?? ""}
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black"
        >
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
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
