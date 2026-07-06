import { BarChart3, CalendarCheck, CreditCard, LayoutDashboard, Users } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-zinc-950 shadow-inner dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-xs text-zinc-500">gymflow.app/admin</span>
      </div>

      <div className="flex min-h-[220px]">
        <aside className="hidden w-28 shrink-0 border-r border-white/10 bg-black/40 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <LayoutDashboard className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-medium text-white">GymFlow</span>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Dashboard", active: true, Icon: LayoutDashboard },
              { label: "Members", active: false, Icon: Users },
              { label: "Payments", active: false, Icon: CreditCard },
              { label: "Attendance", active: false, Icon: CalendarCheck },
            ].map(({ label, active, Icon }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Active members", value: "128" },
              { label: "Check-ins today", value: "42" },
              { label: "Revenue (30d)", value: "$8.4k" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="text-[10px] text-zinc-500">{stat.label}</div>
                <div className="mt-1 text-sm font-semibold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-zinc-300">Monthly revenue</div>
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-3 flex h-16 items-end gap-1.5">
              {[38, 52, 44, 61, 58, 72, 68, 80, 74, 88, 82, 94].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-emerald-500/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
