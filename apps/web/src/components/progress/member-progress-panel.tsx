"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChartLine } from "@/components/ui/chart-line";
import { Input } from "@/components/ui/input";

export type ProgressPeriod = "7d" | "30d" | "90d" | "all";

export type MemberProgressSnapshot = {
  id?: number;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  notes?: string | null;
};

export type MemberProgressData = {
  baseline: MemberProgressSnapshot | null;
  current: MemberProgressSnapshot | null;
  changes: Record<ProgressPeriod, {
    weight_kg: number | null;
    body_fat_percent: number | null;
    waist_cm: number | null;
  }>;
  series: MemberProgressSnapshot[];
};

type MemberProgressPanelProps = {
  progress: MemberProgressData | null;
  loading?: boolean;
  memberId?: number;
  onMeasurementSaved?: () => void | Promise<void>;
  showLogForm?: boolean;
  compact?: boolean;
};

const PERIOD_OPTIONS: Array<{ id: ProgressPeriod; label: string }> = [
  { id: "7d", label: "1 week" },
  { id: "30d", label: "1 month" },
  { id: "90d", label: "3 months" },
  { id: "all", label: "All time" },
];

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function formatDelta(value: number | null, unit: string) {
  if (value === null) return "—";
  if (value === 0) return `0 ${unit}`;
  const sign = value > 0 ? "+" : "";
  const arrow = value < 0 ? "▼" : "▲";
  return `${arrow} ${sign}${value.toFixed(1)} ${unit}`;
}

function deltaClass(value: number | null) {
  if (value === null || value === 0) return "text-zinc-600 dark:text-zinc-400";
  return value < 0
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-amber-800 dark:text-amber-200";
}

export function MemberProgressPanel({
  progress,
  loading = false,
  memberId,
  onMeasurementSaved,
  showLogForm = false,
  compact = false,
}: MemberProgressPanelProps) {
  const [period, setPeriod] = useState<ProgressPeriod>("30d");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [notes, setNotes] = useState("");

  const changes = progress?.changes[period] ?? null;
  const chartData = useMemo(() => {
    return (progress?.series ?? [])
      .filter((point) => point.weight_kg !== null)
      .map((point) => ({
        label: point.recorded_at,
        value: point.weight_kg as number,
      }));
  }, [progress?.series]);

  async function submitMeasurement() {
    if (!memberId) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, string | number> = {
        recorded_at: recordedAt,
      };
      if (weightKg.trim()) body.weight_kg = Number(weightKg);
      if (bodyFat.trim()) body.body_fat_percent = Number(bodyFat);
      if (waistCm.trim()) body.waist_cm = Number(waistCm);
      if (notes.trim()) body.notes = notes.trim();

      await apiFetch(`/api/v1/members/${memberId}/measurements`, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });

      setWeightKg("");
      setBodyFat("");
      setWaistCm("");
      setNotes("");
      await onMeasurementSaved?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save measurement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-black dark:text-zinc-400">
        Loading progress...
      </div>
    );
  }

  const hasData = (progress?.series.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {compact ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Body measurements over time</div>
        ) : (
          <div>
            <div className="text-lg font-semibold">Progress</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Track weight and body measurements over time.
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                period === option.id
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
              }`}
              onClick={() => setPeriod(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          No measurements yet. {showLogForm ? "Log the first check-in below." : "Your trainer will log check-ins here."}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Weight
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {progress?.current?.weight_kg != null ? `${progress.current.weight_kg} kg` : "—"}
              </div>
              <div className={`mt-1 text-sm ${deltaClass(changes?.weight_kg ?? null)}`}>
                {formatDelta(changes?.weight_kg ?? null, "kg")}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Body fat
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {progress?.current?.body_fat_percent != null
                  ? `${progress.current.body_fat_percent}%`
                  : "—"}
              </div>
              <div className={`mt-1 text-sm ${deltaClass(changes?.body_fat_percent ?? null)}`}>
                {formatDelta(changes?.body_fat_percent ?? null, "%")}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Waist
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {progress?.current?.waist_cm != null ? `${progress.current.waist_cm} cm` : "—"}
              </div>
              <div className={`mt-1 text-sm ${deltaClass(changes?.waist_cm ?? null)}`}>
                {formatDelta(changes?.waist_cm ?? null, "cm")}
              </div>
            </div>
          </div>

          {chartData.length > 1 ? (
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold">Weight trend</div>
              <div className="mt-3">
                <ChartLine data={chartData} />
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2 font-medium">Body fat</th>
                    <th className="px-3 py-2 font-medium">Waist</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {[...(progress?.series ?? [])].reverse().map((row) => (
                    <tr key={`${row.recorded_at}-${row.id ?? ""}`} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200">{formatDate(row.recorded_at)}</td>
                      <td className="px-3 py-2">{row.weight_kg != null ? `${row.weight_kg} kg` : "—"}</td>
                      <td className="px-3 py-2">{row.body_fat_percent != null ? `${row.body_fat_percent}%` : "—"}</td>
                      <td className="px-3 py-2">{row.waist_cm != null ? `${row.waist_cm} cm` : "—"}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showLogForm && memberId ? (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm font-semibold">Log measurement</div>
          {formError ? (
            <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
              {formError}
            </div>
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Date</label>
              <Input type="date" value={recordedAt} disabled={saving} onChange={(e) => setRecordedAt(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 78.5"
                value={weightKg}
                disabled={saving}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Body fat (%)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 22"
                value={bodyFat}
                disabled={saving}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Waist (cm)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 84"
                value={waistCm}
                disabled={saving}
                onChange={(e) => setWaistCm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" disabled={saving} onClick={() => void submitMeasurement()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Notes (optional)</label>
            <Input
              placeholder="e.g. Felt stronger this week"
              value={notes}
              disabled={saving}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
