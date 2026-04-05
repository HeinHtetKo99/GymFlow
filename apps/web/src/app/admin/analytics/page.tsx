"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartBars } from "@/components/ui/chart-bars";
import { ChartLine } from "@/components/ui/chart-line";
import { Select } from "@/components/ui/select";

type AnalyticsOverviewResponse = {
  range: {
    months: number;
    from_month: string;
    to_month: string;
  };
  revenue: {
    currency: string;
    series: Array<{ month: string; amount_cents: number }>;
    total_cents: number;
  };
  members: {
    active: number;
    expired: number;
    no_membership: number;
  };
  attendance: {
    daily_checkins: Array<{ date: string; count: number }>;
    total_checkins_30d: number;
    unique_members_30d: number;
    today_checkins: number;
    open_checkins: number;
  };
  inactive_members: {
    inactive_days: number;
    total: number;
    data: Array<{ id: number; name: string; last_check_in_at: string | null }>;
  };
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function formatMoney(amountCents: number, currency: string) {
  const value = amountCents / 100;
  if (currency === "MIXED") return `${value.toFixed(2)} (mixed)`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export default function AdminAnalyticsPage() {
  const [months, setMonths] = useState<number>(12);
  const [inactiveDays, setInactiveDays] = useState<number>(7);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<AnalyticsOverviewResponse>(
        `/api/v1/analytics/overview?months=${months}&inactive_days=${inactiveDays}`,
        { token },
      );
      setData(res);
    } catch (err) {
      const status = err instanceof Error && "status" in err ? (err as { status?: number }).status : undefined;
      if (status === 403) {
        setError("Owner access is required to view analytics.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [inactiveDays, months]);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueChart = useMemo(() => {
    if (!data) return [];
    return data.revenue.series.map((p) => ({ label: p.month, value: p.amount_cents }));
  }, [data]);

  const attendanceChart = useMemo(() => {
    if (!data) return [];
    return data.attendance.daily_checkins.map((p) => ({ label: p.date, value: p.count }));
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Analytics</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Revenue, members, attendance, and inactive members.
          </div>
          {data ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <Badge variant="neutral">
                Revenue range: {formatDate(data.range.from_month)} → {formatDate(data.range.to_month)}
              </Badge>
              <Badge variant="neutral">Inactive cutoff: {data.inactive_members.inactive_days} days</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(months)} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
          </Select>
          <Select value={String(inactiveDays)} onChange={(e) => setInactiveDays(Number(e.target.value))}>
            <option value="7">Inactive 7 days</option>
            <option value="14">Inactive 14 days</option>
            <option value="30">Inactive 30 days</option>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Revenue</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatMoney(data.revenue.total_cents, data.revenue.currency)}
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{months} month total</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Members</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-semibold">{data.members.active}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">active</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="neutral">Expired: {data.members.expired}</Badge>
                  <Badge variant="neutral">No membership: {data.members.no_membership}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Attendance</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-semibold">{data.attendance.total_checkins_30d}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">check-ins (30d)</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="neutral">Unique members: {data.attendance.unique_members_30d}</Badge>
                  <Badge variant="neutral">Today: {data.attendance.today_checkins}</Badge>
                  <Badge variant="neutral">Open: {data.attendance.open_checkins}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Inactive</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-semibold">{data.inactive_members.total}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">inactive members</div>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Active membership, no check-in in {data.inactive_members.inactive_days} days
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-lg font-semibold">Revenue trend</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{months} months</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartLine data={revenueChart} />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>
                    Latest:{" "}
                    {data.revenue.series.length > 0
                      ? formatMoney(
                          data.revenue.series[data.revenue.series.length - 1]!.amount_cents,
                          data.revenue.currency,
                        )
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-lg font-semibold">Daily check-ins</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">30 days</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartBars data={attendanceChart} />
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                  Showing the last 30 days of check-ins.
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="text-lg font-semibold">Inactive members</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Showing {data.inactive_members.data.length} of {data.inactive_members.total}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                <div className="max-h-[60vh] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">Member</th>
                        <th className="px-4 py-3 font-medium">Last check-in</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 dark:divide-white/10">
                      {data.inactive_members.data.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-medium">{m.name}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {formatDateTime(m.last_check_in_at)}
                          </td>
                        </tr>
                      ))}
                      {data.inactive_members.data.length === 0 ? (
                        <tr>
                          <td
                            className="px-4 py-10 text-center text-zinc-600 dark:text-zinc-400"
                            colSpan={2}
                          >
                            No inactive members for this cutoff.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
