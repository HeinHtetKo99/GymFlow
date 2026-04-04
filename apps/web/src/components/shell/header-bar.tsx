"use client";

import * as React from "react";
import { UserMenu, type UserMenuBadge } from "@/components/shell/user-menu";

export function HeaderBar({
  title,
  subtitle,
  user,
  badges,
  onLogout,
  maxWidth = "max-w-7xl",
}: {
  title: string;
  subtitle: string;
  user: { name: string; email: string } | null;
  badges?: UserMenuBadge[];
  onLogout: () => void;
  maxWidth?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-black/60">
      <div className={`mx-auto flex w-full ${maxWidth} items-center justify-between gap-4`}>
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">{subtitle}</div>
        </div>

        <UserMenu user={user} badges={badges} onLogout={onLogout} />
      </div>
    </header>
  );
}
