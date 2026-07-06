import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Users,
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
    "GymFlow is a multi-tenant gym management platform for fitness studios. Manage members, staff roles, attendance, payments, workout plans, and owner analytics in one place.",
  path: "/",
});

const features = [
  {
    Icon: Users,
    title: "Role-based teams",
    description: "Owner, cashier, trainer, and member workflows.",
  },
  {
    Icon: CalendarCheck,
    title: "Attendance",
    description: "Check-ins, check-outs, and retention rules.",
  },
  {
    Icon: CreditCard,
    title: "Billing",
    description: "Payments, receipts, and membership renewals.",
  },
  {
    Icon: ShieldCheck,
    title: "Multi-gym",
    description: "Each gym isolated by its own gym code.",
  },
] as const;

const demoRoles = [
  {
    title: "Owner",
    description: "Analytics, setup wizard, staff, and membership plans.",
  },
  {
    title: "Cashier",
    description: "Record payments, manage attendance, handle memberships.",
  },
  {
    title: "Trainer",
    description: "Assign workout and food plans with reusable templates.",
  },
  {
    title: "Member",
    description: "View plans, choose a trainer, manage membership status.",
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">
        <div className="w-full">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-black sm:p-9">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Dumbbell className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    GymFlow
                  </h1>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Gym management software for modern fitness studios.
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Run attendance, memberships, payments, trainer plans, and owner analytics
                from one dashboard — with clean role-based access for every person in your
                gym.
              </p>

              <DashboardPreview />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map(({ Icon, title, description }) => (
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

              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={buttonClassName({ variant: "primary", className: "gap-2" })} href="/login">
                  Try live demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link className={buttonClassName({ variant: "outline" })} href="/register">
                  Create a gym
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
                    Quick demo for reviewers
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Open login and click any role below to sign in instantly. No credentials
                    to type — built for portfolio walkthroughs.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium text-emerald-700 dark:text-emerald-300">Gym code:</span>{" "}
                gymflow
                <span className="mx-2 text-zinc-400">·</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-300">Password:</span>{" "}
                password
              </div>

              <div className="mt-5 flex-1 space-y-3">
                {demoRoles.map(({ title, description }) => (
                  <Link
                    key={title}
                    href="/login"
                    className="group flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-black dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                  >
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {description}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-xs font-medium text-emerald-700 opacity-80 transition-opacity group-hover:opacity-100 dark:text-emerald-300">
                      Try
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-black/10 pt-6 dark:border-white/10">
                <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <Activity className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      What you can explore
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Owner analytics, cashier billing, trainer plan templates, and the member
                      portal — all seeded with 24 months of demo data.
                    </p>
                  </div>
                </div>

                <Link
                  className={buttonClassName({ variant: "primary", fullWidth: true, className: "gap-2" })}
                  href="/login"
                >
                  Open demo login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
