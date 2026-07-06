import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Dumbbell,
  KeyRound,
  Layers,
  Shield,
  Sparkles,
} from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { buttonClassName } from "@/components/ui/button-classes";
import {
  createPageMetadata,
  createSoftwareApplicationJsonLd,
  createWebSiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  description:
    "GymFlow is a multi-tenant gym management SaaS. Register a gym, get a unique gym code, and run isolated staff workflows — attendance, memberships, payments, and analytics per tenant.",
  path: "/",
});

const tenantPillars = [
  {
    Icon: Building2,
    title: "One gym, one workspace",
    description:
      "Register a gym and get a unique code. Members, payments, and staff belong only to that gym.",
  },
  {
    Icon: KeyRound,
    title: "Gym code at login",
    description:
      "Users sign in with email + password and a gym code — the tenant slug that routes them to the right data.",
  },
  {
    Icon: Shield,
    title: "Enforced isolation",
    description:
      "The API resolves the active gym from the X-Gym header. Policies block cross-tenant access.",
  },
  {
    Icon: Layers,
    title: "Shared platform",
    description:
      "One deployment serves many gyms. Each owner configures plans, staff, and retention independently.",
  },
] as const;

const tenantFlow = [
  { step: "1", title: "Create a gym", detail: "Owner registers → gym code assigned (e.g. gymflow)" },
  { step: "2", title: "Invite staff", detail: "Cashiers and trainers scoped to that gym only" },
  { step: "3", title: "Operate daily", detail: "Attendance, memberships, and payments stay in-tenant" },
] as const;

const demoRoles = [
  {
    title: "Owner",
    description: "Set up your gym tenant — staff, plans, retention, and analytics.",
  },
  {
    title: "Cashier",
    description: "Billing and attendance inside your gym's isolated workspace.",
  },
  {
    title: "Trainer",
    description: "Coach members assigned within the same gym tenant.",
  },
  {
    title: "Member",
    description: "Portal access tied to one gym code — no cross-gym visibility.",
  },
] as const;

export default function Home() {
  const structuredData = [createWebSiteJsonLd(), createSoftwareApplicationJsonLd()];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-14">
        <div className="w-full">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-black sm:p-9">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Dumbbell className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Multi-tenant SaaS
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    GymFlow
                  </h1>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Many gyms. One platform. Strict tenant boundaries.
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                GymFlow is built as a <span className="font-medium text-zinc-800 dark:text-zinc-200">multi-gym tenant system</span>.
                Each fitness studio registers independently, receives a gym code, and runs its own
                members, staff, and billing — without seeing other gyms&apos; data.
              </p>

              <div className="mt-6 grid gap-3">
                {tenantFlow.map(({ step, title, detail }) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                      {step}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
                      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DashboardPreview />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {tenantPillars.map(({ Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {title}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link className={buttonClassName({ variant: "primary", className: "gap-2" })} href="/register">
                  Create a gym
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-zinc-900/5 blur-2xl dark:bg-white/5" />
            </section>

            <section className="flex flex-col rounded-3xl border border-black/10 bg-white/90 p-7 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/70 sm:p-9">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Explore the demo tenant
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Sign in to the pre-seeded <span className="font-medium">gymflow</span> gym. Every
                    role below operates inside that single tenant — switch gyms at login with a
                    different gym code.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Gym code</span>
                    <div className="mt-1 font-mono text-base text-zinc-900 dark:text-zinc-50">gymflow</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Password</span>
                    <div className="mt-1 font-mono text-zinc-900 dark:text-zinc-50">password</div>
                  </div>
                </div>
                <Link
                  className={buttonClassName({ variant: "primary", fullWidth: true, className: "mt-4 gap-2" })}
                  href="/login"
                >
                  Sign in to demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 flex-1 space-y-3">
                {demoRoles.map(({ title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-black/10 pt-6 dark:border-white/10">
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <Activity className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Portfolio highlight
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Tenant resolution middleware, per-gym policies, role gates, and ~18 months of
                      seeded demo data inside the gymflow tenant.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
