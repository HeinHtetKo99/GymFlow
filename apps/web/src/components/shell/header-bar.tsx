"use client";

import * as React from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { UserMenu, type UserMenuBadge } from "@/components/shell/user-menu";

export function HeaderBar({
  title,
  subtitle,
  user,
  badges,
  onLogout,
  logoHref,
  maxWidth = "max-w-7xl",
}: {
  title: string;
  subtitle: string;
  user: { name: string; email: string } | null;
  badges?: UserMenuBadge[];
  onLogout: () => void;
  logoHref?: string;
  maxWidth?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/60 sm:px-6 sm:py-4">
      <div className={`mx-auto flex w-full ${maxWidth} items-center justify-between gap-2 sm:gap-4`}>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href={logoHref ?? "/"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white"
            aria-label="GymFlow"
          >
            <Dumbbell className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </div>
            <div className="hidden truncate text-xs text-zinc-600 sm:block dark:text-zinc-400">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <UserMenu user={user} badges={badges} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
