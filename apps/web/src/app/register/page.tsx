"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, Dumbbell, Sparkles, UsersRound } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { setGymCode, setToken, setUser, type AuthUser } from "@/lib/auth";
import { buttonClassName } from "@/components/ui/button-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterGymResponse = {
  gym: { id: number; name: string; code: string; owner_user_id: number };
  token: string;
  user: AuthUser;
};

export default function RegisterPage() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [gymSlug, setGymSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      gymName.trim() !== "" &&
      ownerName.trim() !== "" &&
      ownerEmail.trim() !== "" &&
      ownerPassword.trim() !== "" &&
      !submitting
    );
  }, [gymName, ownerName, ownerEmail, ownerPassword, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        gym_name: gymName.trim(),
        owner_name: ownerName.trim(),
        owner_email: ownerEmail.trim(),
        owner_password: ownerPassword,
      };
      if (gymSlug.trim() !== "") body.gym_slug = gymSlug.trim();

      const res = await apiFetch<RegisterGymResponse>("/api/v1/auth/register-gym", {
        method: "POST",
        skipGym: true,
        body: JSON.stringify(body),
      });

      setGymCode(res.gym.code);
      setToken(res.token);
      setUser(res.user);
      router.push("/admin/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
                  <div className="text-2xl font-semibold tracking-tight">Create a new gym</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    You’ll get a gym code and an owner account.
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 text-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Owner account created</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Manage staff, plans, and settings.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <UsersRound className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Start onboarding</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Create cashier + trainer, then your first member.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <Sparkles className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Portfolio-ready flow</div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      Clean UI, receipts, membership management.
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
                  <h1 className="text-2xl font-semibold tracking-tight">Create your gym</h1>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    This creates a new gym and an owner account.
                  </p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white md:hidden">
                  <Dumbbell className="h-6 w-6" />
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Gym name
                  </div>
                  <Input
                    className="mt-2"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    autoComplete="organization"
                    placeholder="e.g. Atlas Fitness"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Gym code (optional)
                  </div>
                  <Input
                    className="mt-2"
                    value={gymSlug}
                    onChange={(e) => setGymSlug(e.target.value)}
                    placeholder="atlas-fitness"
                  />
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Lowercase letters, numbers, and hyphens only. Leave empty to auto-generate.
                  </div>
                </label>

                <div className="h-px bg-black/10 dark:bg-white/10" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      Owner name
                    </div>
                    <Input
                      className="mt-2"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      autoComplete="name"
                      placeholder="enter your name"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      Owner email
                    </div>
                    <Input
                      className="mt-2"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="enter your email"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Owner password
                  </div>
                  <Input
                    className="mt-2"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    autoComplete="new-password"
                    type="password"
                    placeholder="enter password"
                  />
                </label>

                {error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                <Button fullWidth disabled={!canSubmit} type="submit">
                  {submitting ? "Creating..." : "Create gym"}
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">Already have a gym?</div>
                <Link
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                  href="/login"
                >
                  Login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
