"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Activity, Dumbbell, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getGymCode, setGymCode, setToken, setUser, type AuthUser } from "@/lib/auth";
import { DEFAULT_GYM_CODE } from "@/lib/config";
import { buttonClassName } from "@/components/ui/button-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

export default function LoginPage() {
  const router = useRouter();
  const [gymCode, setGymCodeState] = useState(() => getGymCode() ?? DEFAULT_GYM_CODE);
  const [email, setEmail] = useState("owner@gymflow.test");
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      gymCode.trim() !== "" &&
      email.trim() !== "" &&
      password.trim() !== "" &&
      !submitting
    );
  }, [gymCode, email, password, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const trimmedGym = gymCode.trim();
      setGymCode(trimmedGym);
      const res = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        gymCode: trimmedGym,
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      setUser(res.user);
      router.push(
        res.user.role === "member" ? "/member" : res.user.role === "trainer" ? "/trainer" : "/admin",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-14">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
          <section className="hidden md:flex">
            <div className="relative w-full overflow-hidden rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Dumbbell className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-2xl font-semibold tracking-tight">GymFlow</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Gym management dashboard
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 text-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Gym code access</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Each gym has its own private gym code and isolated data.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <Activity className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Attendance + memberships</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Track check-ins, membership status, and payments.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <Sparkles className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Owner setup wizard</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Create staff, configure plans, and onboard your first member.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-zinc-900/5 blur-2xl dark:bg-white/5" />
            </div>
          </section>

          <section className="flex">
            <div className="w-full rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-black sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Demo credentials are prefilled. Enter your gym code to access your gym.
                  </p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white md:hidden">
                  <Dumbbell className="h-6 w-6" />
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Gym code
                  </div>
                  <Input
                    className="mt-2"
                    value={gymCode}
                    onChange={(e) => setGymCodeState(e.target.value)}
                    autoComplete="organization"
                    placeholder="gymflow"
                  />
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Ask your owner for the gym code (example: gymflow, atlas-fitness)
                  </div>
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Email
                  </div>
                  <Input
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Password
                  </div>
                  <Input
                    className="mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    type="password"
                  />
                </label>

                {error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                <Button fullWidth disabled={!canSubmit} type="submit">
                  {submitting ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">
                  New gym?
                </div>
                <Link
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                  href="/register"
                >
                  Create owner account
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
