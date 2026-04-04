"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderBar } from "@/components/shell/header-bar";
import { getToken, getUser, logoutLocal, type AuthUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";

export default function TrainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.replace("/login");
      return;
    }

    if (u.role !== "trainer") {
      router.replace(u.role === "member" ? "/member" : "/admin");
      return;
    }

    Promise.resolve().then(() => setUserState(u));
  }, [router, pathname]);

  function onLogout() {
    logoutLocal();
    router.push("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <HeaderBar
        title="Trainer Portal"
        subtitle={user ? `${user.name} • ${roleLabel(user.role)}` : "Loading..."}
        user={user ? { name: user.name, email: user.email } : null}
        badges={user ? [{ label: `Role: ${roleLabel(user.role)}` }] : []}
        onLogout={onLogout}
        maxWidth="max-w-7xl"
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
