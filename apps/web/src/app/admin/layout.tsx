"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser, logoutLocal, type AuthUser } from "@/lib/auth";
import { HeaderBar } from "@/components/shell/header-bar";
import {
  canManageAccounts,
  canViewBillingOrAttendance,
  isOwnerUser,
  roleLabel,
} from "@/lib/roles";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [ownerUserId, setOwnerUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.replace("/login");
      return;
    }

    if (u.role === "member") {
      router.replace("/member");
      return;
    }
    if (u.role === "trainer") {
      router.replace("/trainer");
      return;
    }

    Promise.resolve().then(() => setUserState(u));

    let cancelled = false;
    void (async () => {
      try {
        const gym = await apiFetch<{ owner_user_id: number | null }>("/api/v1/gym", {
          token,
        });
        if (!cancelled) setOwnerUserId(gym.owner_user_id);
      } catch {
        if (!cancelled) setOwnerUserId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const title = "GymFlow";

  const isOwner = useMemo(() => {
    if (user?.role === "owner") return true;
    return isOwnerUser(user?.id, ownerUserId);
  }, [ownerUserId, user?.id, user?.role]);

  const displayRole = user?.role ? (isOwner ? "owner" : user.role) : null;

  function onLogout() {
    logoutLocal();
    router.push("/login");
  }

  const navItems = useMemo(() => {
    const role = user?.role;
    const canBilling = canViewBillingOrAttendance({ role, isOwner });
    const canAccounts = canManageAccounts({ role, isOwner });

    if (role === "trainer" && !isOwner) {
      return [
        { href: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
        { href: "/admin/members", label: "Members", Icon: Users },
      ];
    }

    const items: Array<{ href: string; label: string; Icon: typeof LayoutDashboard }> = [
      { href: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/admin/members", label: "Members", Icon: Users },
    ];

    if (isOwner) {
      items.push({ href: "/admin/onboarding", label: "Setup", Icon: Sparkles });
      items.push({ href: "/admin/analytics", label: "Analytics", Icon: BarChart3 });
    }

    if (canBilling) {
      items.push({ href: "/admin/attendance", label: "Attendance", Icon: CalendarCheck });
      items.push({ href: "/admin/payments", label: "Payments", Icon: CreditCard });
    }

    if (canAccounts) {
      items.push({ href: "/admin/users", label: "Accounts", Icon: UserCog });
    }

    return items;
  }, [isOwner, user?.role]);

  const activeHref = useMemo(() => {
    const found = navItems.find((i) => pathname.startsWith(i.href));
    return found?.href ?? null;
  }, [navItems, pathname]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <HeaderBar
        title={title}
        subtitle={user ? `${user.name} • ${roleLabel(displayRole)}` : "Loading..."}
        user={user ? { name: user.name, email: user.email } : null}
        badges={[
          { label: `Role: ${roleLabel(displayRole)}` },
          ...(isOwner ? [{ label: "Owner", variant: "success" as const }] : []),
        ]}
        onLogout={onLogout}
        maxWidth="max-w-screen-2xl"
      />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-6 px-6 py-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="rounded-2xl border border-black/10 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/60">
            {navItems.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-10 items-center rounded-xl px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
                  }`}
                >
                  <item.Icon className="mr-2 h-4 w-4 opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
