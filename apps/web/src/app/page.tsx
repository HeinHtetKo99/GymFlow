import Link from "next/link";
import { CalendarCheck, CreditCard, Dumbbell, Users } from "lucide-react";
import { buttonClassName } from "@/components/ui/button-classes";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black sm:p-10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Dumbbell className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">GymFlow</h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Clean gym management dashboard (multi-gym via gym code).
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Members + staff
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Owner, cashier, trainer, and member flows.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Attendance
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Check-ins, checkouts, and retention.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Payments + receipts
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Record payments and print receipts.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-semibold text-white">
                    #
                  </span>
                  Gym code access
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Each gym stays isolated using a simple gym code.
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={buttonClassName({ variant: "primary" })} href="/login">
                Login
              </Link>
              <Link className={buttonClassName({ variant: "outline" })} href="/register">
                Create a gym
              </Link>
            </div>

            <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-zinc-900/5 blur-2xl dark:bg-white/5" />
          </section>

          <section className="rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/60 sm:p-10">
            <div className="text-sm font-semibold">Quick demo</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Use the login page demo credentials, or register a new gym to become the owner.
            </div>

            <div className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
                <div className="font-medium">Owner</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Setup staff, plans, and retention in Setup.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
                <div className="font-medium">Cashier</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Record payments, manage attendance, cancel / undo membership.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
                <div className="font-medium">Trainer + Member</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Trainer assigns plans; member views plans and can self-cancel / undo.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
