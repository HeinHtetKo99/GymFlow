<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Analytics\OverviewRequest;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;

final class AnalyticsController extends Controller
{
    public function overview(OverviewRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $gym = $tenant->gym();
        $isOwner = $user->role === UserRole::Owner
            || ($gym !== null && $gym->owner_user_id !== null && (int) $gym->owner_user_id === (int) $user->getKey());

        if (! $isOwner) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $months = (int) $request->validated('months', 12);
        $inactiveDays = (int) $request->validated('inactive_days', 7);

        $cacheKey = "analytics:overview:gym:{$gymId}:months:{$months}:inactive:{$inactiveDays}";

        $payload = cache()->remember($cacheKey, 60, function () use ($gymId, $months, $inactiveDays) {
            $now = now();
            $toMonth = $now->copy()->startOfMonth();
            $fromMonth = $toMonth->copy()->subMonths($months - 1);
            $endMonthExclusive = $toMonth->copy()->addMonth();

            $driver = DB::connection()->getDriverName();
            $monthKeyExpr = $driver === 'sqlite'
                ? "strftime('%Y-%m', paid_at)"
                : "DATE_FORMAT(paid_at, '%Y-%m')";

            $currencyRows = DB::table('payments')
                ->where('gym_id', $gymId)
                ->whereNull('deleted_at')
                ->where('status', 'paid')
                ->where('paid_at', '>=', $fromMonth)
                ->where('paid_at', '<', $endMonthExclusive)
                ->distinct()
                ->pluck('currency');

            $currencyRows = $currencyRows->map(fn ($c) => is_string($c) ? strtoupper($c) : $c)->filter()->values();
            $currency = $currencyRows->count() === 1 ? (string) $currencyRows->first() : ($currencyRows->count() > 1 ? 'MIXED' : 'USD');

            $revenueRows = DB::table('payments')
                ->selectRaw("{$monthKeyExpr} as month, SUM(amount_cents) as amount_cents")
                ->where('gym_id', $gymId)
                ->whereNull('deleted_at')
                ->where('status', 'paid')
                ->where('paid_at', '>=', $fromMonth)
                ->where('paid_at', '<', $endMonthExclusive)
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            $revenueMap = [];
            foreach ($revenueRows as $row) {
                if (isset($row->month)) {
                    $revenueMap[(string) $row->month] = (int) ($row->amount_cents ?? 0);
                }
            }

            $revenueSeries = [];
            $revenueTotal = 0;
            for ($i = 0; $i < $months; $i++) {
                $monthKey = $fromMonth->copy()->addMonths($i)->format('Y-m');
                $value = (int) ($revenueMap[$monthKey] ?? 0);
                $revenueTotal += $value;
                $revenueSeries[] = ['month' => $monthKey, 'amount_cents' => $value];
            }

            $membershipMaxSub = DB::table('memberships')
                ->select('member_id', DB::raw('MAX(ends_at) as ends_at'))
                ->where('gym_id', $gymId)
                ->groupBy('member_id');

            $membersWithMembership = DB::table('members')
                ->where('members.gym_id', $gymId)
                ->leftJoinSub($membershipMaxSub, 'mmax', function ($join) {
                    $join->on('mmax.member_id', '=', 'members.id');
                });

            $activeMembers = (clone $membersWithMembership)
                ->whereNotNull('mmax.ends_at')
                ->where('mmax.ends_at', '>', $now)
                ->count();

            $expiredMembers = (clone $membersWithMembership)
                ->whereNotNull('mmax.ends_at')
                ->where('mmax.ends_at', '<=', $now)
                ->count();

            $noMembershipMembers = (clone $membersWithMembership)
                ->whereNull('mmax.ends_at')
                ->count();

            $todayStart = $now->copy()->startOfDay();
            $tomorrowStart = $todayStart->copy()->addDay();
            $attendanceFrom = $todayStart->copy()->subDays(29);

            $dailyRows = DB::table('attendances')
                ->selectRaw('DATE(checked_in_at) as date, COUNT(*) as count')
                ->where('gym_id', $gymId)
                ->where('checked_in_at', '>=', $attendanceFrom)
                ->where('checked_in_at', '<', $tomorrowStart)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $dailyMap = [];
            foreach ($dailyRows as $row) {
                if (isset($row->date)) {
                    $dailyMap[(string) $row->date] = (int) ($row->count ?? 0);
                }
            }

            $dailySeries = [];
            $total30d = 0;
            for ($i = 0; $i < 30; $i++) {
                $dayKey = $attendanceFrom->copy()->addDays($i)->format('Y-m-d');
                $value = (int) ($dailyMap[$dayKey] ?? 0);
                $total30d += $value;
                $dailySeries[] = ['date' => $dayKey, 'count' => $value];
            }

            $uniqueMembers30d = (int) DB::table('attendances')
                ->where('gym_id', $gymId)
                ->where('checked_in_at', '>=', $attendanceFrom)
                ->where('checked_in_at', '<', $tomorrowStart)
                ->distinct()
                ->count('member_id');

            $todayCheckins = (int) DB::table('attendances')
                ->where('gym_id', $gymId)
                ->where('checked_in_at', '>=', $todayStart)
                ->where('checked_in_at', '<', $tomorrowStart)
                ->count();

            $openCheckins = (int) DB::table('attendances')
                ->where('gym_id', $gymId)
                ->whereNull('checked_out_at')
                ->count();

            $cutoff = $now->copy()->subDays($inactiveDays);

            $lastAttendanceSub = DB::table('attendances')
                ->select('member_id', DB::raw('MAX(checked_in_at) as last_check_in_at'))
                ->where('gym_id', $gymId)
                ->groupBy('member_id');

            $inactiveBase = DB::table('members')
                ->where('members.gym_id', $gymId)
                ->leftJoinSub($membershipMaxSub, 'mmax', function ($join) {
                    $join->on('mmax.member_id', '=', 'members.id');
                })
                ->leftJoinSub($lastAttendanceSub, 'la', function ($join) {
                    $join->on('la.member_id', '=', 'members.id');
                })
                ->whereNotNull('mmax.ends_at')
                ->where('mmax.ends_at', '>', $now)
                ->where(function ($q) use ($cutoff) {
                    $q->whereNull('la.last_check_in_at')->orWhere('la.last_check_in_at', '<', $cutoff);
                });

            $inactiveTotal = (int) (clone $inactiveBase)->count();

            $inactiveList = (clone $inactiveBase)
                ->select('members.id', 'members.name', 'la.last_check_in_at')
                ->orderByRaw('la.last_check_in_at IS NOT NULL, la.last_check_in_at ASC')
                ->limit(50)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => (string) $row->name,
                        'last_check_in_at' => $row->last_check_in_at,
                    ];
                })
                ->values()
                ->all();

            return [
                'range' => [
                    'months' => $months,
                    'from_month' => $fromMonth->format('Y-m-01'),
                    'to_month' => $toMonth->format('Y-m-01'),
                ],
                'revenue' => [
                    'currency' => $currency,
                    'series' => $revenueSeries,
                    'total_cents' => $revenueTotal,
                ],
                'members' => [
                    'active' => (int) $activeMembers,
                    'expired' => (int) $expiredMembers,
                    'no_membership' => (int) $noMembershipMembers,
                ],
                'attendance' => [
                    'daily_checkins' => $dailySeries,
                    'total_checkins_30d' => $total30d,
                    'unique_members_30d' => $uniqueMembers30d,
                    'today_checkins' => $todayCheckins,
                    'open_checkins' => $openCheckins,
                ],
                'inactive_members' => [
                    'inactive_days' => $inactiveDays,
                    'total' => $inactiveTotal,
                    'data' => $inactiveList,
                ],
            ];
        });

        return response()->json($payload);
    }
}
