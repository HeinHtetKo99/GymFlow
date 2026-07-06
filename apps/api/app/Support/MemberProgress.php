<?php

namespace App\Support;

use App\Models\MemberMeasurement;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

final class MemberProgress
{
    /**
     * @param  Collection<int, MemberMeasurement>  $measurements
     * @return array{
     *     baseline: ?array<string, mixed>,
     *     current: ?array<string, mixed>,
     *     changes: array<string, array<string, float|null>>,
     *     series: array<int, array<string, mixed>>
     * }
     */
    public static function build(Collection $measurements, ?CarbonInterface $now = null): array
    {
        $now = $now ?? now();
        $ordered = $measurements
            ->sortBy(fn (MemberMeasurement $m) => [$m->recorded_at->timestamp, $m->getKey()])
            ->values();

        if ($ordered->isEmpty()) {
            return [
                'baseline' => null,
                'current' => null,
                'changes' => self::emptyChanges(),
                'series' => [],
            ];
        }

        $baseline = self::snapshot($ordered->first());
        $current = self::snapshot($ordered->last());
        $series = $ordered->map(fn (MemberMeasurement $m) => self::snapshot($m))->all();

        return [
            'baseline' => $baseline,
            'current' => $current,
            'changes' => [
                '7d' => self::delta($ordered, $current, $now->copy()->subDays(7)),
                '30d' => self::delta($ordered, $current, $now->copy()->subDays(30)),
                '90d' => self::delta($ordered, $current, $now->copy()->subDays(90)),
                'all' => self::deltaFromSnapshots($baseline, $current),
            ],
            'series' => $series,
        ];
    }

    /**
     * @return array<string, array<string, float|null>>
     */
    private static function emptyChanges(): array
    {
        $empty = ['weight_kg' => null, 'body_fat_percent' => null, 'waist_cm' => null];

        return [
            '7d' => $empty,
            '30d' => $empty,
            '90d' => $empty,
            'all' => $empty,
        ];
    }

    /**
     * @param  Collection<int, MemberMeasurement>  $ordered
     * @return array<string, float|null>
     */
    private static function delta(Collection $ordered, ?array $current, CarbonInterface $asOf): array
    {
        if ($current === null) {
            return ['weight_kg' => null, 'body_fat_percent' => null, 'waist_cm' => null];
        }

        $compare = $ordered
            ->filter(fn (MemberMeasurement $m) => $m->recorded_at->lte($asOf))
            ->last();

        if ($compare === null) {
            return ['weight_kg' => null, 'body_fat_percent' => null, 'waist_cm' => null];
        }

        return self::deltaFromSnapshots(self::snapshot($compare), $current);
    }

    /**
     * @param  array<string, mixed>|null  $from
     * @param  array<string, mixed>|null  $to
     * @return array<string, float|null>
     */
    private static function deltaFromSnapshots(?array $from, ?array $to): array
    {
        return [
            'weight_kg' => self::diff($from['weight_kg'] ?? null, $to['weight_kg'] ?? null),
            'body_fat_percent' => self::diff($from['body_fat_percent'] ?? null, $to['body_fat_percent'] ?? null),
            'waist_cm' => self::diff($from['waist_cm'] ?? null, $to['waist_cm'] ?? null),
        ];
    }

    private static function diff(mixed $from, mixed $to): ?float
    {
        if (! is_numeric($from) || ! is_numeric($to)) {
            return null;
        }

        return round((float) $to - (float) $from, 2);
    }

    /**
     * @return array<string, mixed>
     */
    private static function snapshot(MemberMeasurement $measurement): array
    {
        return [
            'id' => $measurement->getKey(),
            'recorded_at' => $measurement->recorded_at->toDateString(),
            'weight_kg' => $measurement->weight_kg,
            'body_fat_percent' => $measurement->body_fat_percent,
            'waist_cm' => $measurement->waist_cm,
            'notes' => $measurement->notes,
        ];
    }
}
