<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Gym;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\MemberPlan;
use App\Models\Payment;
use App\Models\PlanTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class AnalyticsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $gym = Gym::query()->firstOrCreate(
            ['slug' => 'gymflow'],
            ['name' => 'GymFlow Demo Gym', 'attendance_retention_days' => 90]
        );

        $owner = User::query()->firstOrCreate(
            ['email' => 'owner@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Owner',
                'password' => 'password',
                'role' => 'owner',
            ]
        );

        $cashier = User::query()->firstOrCreate(
            ['email' => 'cashier@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Cashier',
                'password' => 'password',
                'role' => 'cashier',
            ]
        );

        $trainer = User::query()->firstOrCreate(
            ['email' => 'trainer@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Trainer',
                'password' => 'password',
                'role' => 'trainer',
            ]
        );

        $trainer2 = User::query()->firstOrCreate(
            ['email' => 'trainer2@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Trainer Two',
                'password' => 'password',
                'role' => 'trainer',
            ]
        );

        $gym->update(['owner_user_id' => $owner->getKey()]);

        $plans = [
            MembershipPlan::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'name' => 'Monthly'],
                ['duration_days' => 30, 'price_cents' => 5000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 10]
            ),
            MembershipPlan::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'name' => 'Quarterly'],
                ['duration_days' => 90, 'price_cents' => 13500, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 20]
            ),
            MembershipPlan::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'name' => 'Yearly'],
                ['duration_days' => 365, 'price_cents' => 48000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 30]
            ),
        ];

        $demoMemberEmails = [];
        for ($i = 1; $i <= 36; $i++) {
            $demoMemberEmails[] = sprintf('demo.member%02d@gymflow.test', $i);
        }

        $demoMemberIds = Member::query()
            ->where('gym_id', $gym->getKey())
            ->whereIn('email', $demoMemberEmails)
            ->pluck('id')
            ->all();

        if (count($demoMemberIds) > 0) {
            Attendance::query()
                ->where('gym_id', $gym->getKey())
                ->whereIn('member_id', $demoMemberIds)
                ->delete();

            Membership::query()
                ->where('gym_id', $gym->getKey())
                ->whereIn('member_id', $demoMemberIds)
                ->delete();

            Payment::withTrashed()
                ->where('gym_id', $gym->getKey())
                ->whereIn('member_id', $demoMemberIds)
                ->forceDelete();
        }

        $members = [];
        foreach ($demoMemberEmails as $idx => $email) {
            $n = $idx + 1;
            $assignedTrainerId = $n <= 18 ? $trainer->getKey() : $trainer2->getKey();
            $member = Member::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'email' => $email],
                [
                    'gym_id' => $gym->getKey(),
                    'user_id' => null,
                    'assigned_trainer_user_id' => $assignedTrainerId,
                    'name' => 'Demo Member ' . $n,
                    'email' => $email,
                    'phone' => sprintf('+1 555-01%02d', $n),
                    'status' => 'active',
                ]
            );
            $members[] = $member;
        }

        $activeMembers = array_slice($members, 0, 24);
        $expiredMembers = array_slice($members, 24, 8);
        $noMembershipMembers = array_slice($members, 32, 4);

        $now = now();

        foreach ($activeMembers as $i => $member) {
            $plan = $plans[$i % count($plans)];
            $startsAt = $now->copy()->subDays(14);
            $endsAt = $now->copy()->addDays((int) $plan->duration_days - 14);
            Membership::query()->create([
                'gym_id' => $gym->getKey(),
                'member_id' => $member->getKey(),
                'membership_plan_id' => $plan->getKey(),
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'active',
                'cancel_requested_at' => null,
            ]);
        }

        foreach ($expiredMembers as $i => $member) {
            $plan = $plans[$i % count($plans)];
            $endsAt = $now->copy()->subDays(2 + ($i % 20));
            $startsAt = $endsAt->copy()->subDays((int) $plan->duration_days);
            Membership::query()->create([
                'gym_id' => $gym->getKey(),
                'member_id' => $member->getKey(),
                'membership_plan_id' => $plan->getKey(),
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'active',
                'cancel_requested_at' => null,
            ]);
        }

        $months = 24;
        $toMonth = $now->copy()->startOfMonth();
        $fromMonth = $toMonth->copy()->subMonths($months - 1);

        for ($m = 0; $m < $months; $m++) {
            $monthStart = $fromMonth->copy()->addMonths($m);
            $paymentsThisMonth = 6 + ($m % 6);

            for ($j = 0; $j < $paymentsThisMonth; $j++) {
                $member = $activeMembers[($m * 13 + $j * 7) % count($activeMembers)];
                $plan = $plans[($m + $j) % count($plans)];
                $paidAt = $monthStart->copy()->addDays(($j * 3) % 25)->addHours(10 + ($j % 7));

                $amount = (int) $plan->price_cents;
                $wiggle = (($j % 5) - 2) * 250;
                $amountCents = max(1000, $amount + $wiggle);

                $recordedBy = $j % 2 === 0 ? $cashier : $owner;

                Payment::query()->create([
                    'gym_id' => $gym->getKey(),
                    'member_id' => $member->getKey(),
                    'membership_plan_id' => $plan->getKey(),
                    'membership_id' => null,
                    'recorded_by_user_id' => $recordedBy->getKey(),
                    'amount_cents' => $amountCents,
                    'currency' => 'USD',
                    'method' => $j % 3 === 0 ? 'card' : 'cash',
                    'status' => 'paid',
                    'paid_at' => $paidAt,
                    'reference' => $j % 4 === 0 ? 'R' . Str::upper(Str::random(6)) : null,
                    'notes' => null,
                ]);
            }
        }

        $todayStart = $now->copy()->startOfDay();
        $attendanceFrom = $todayStart->copy()->subDays(29);

        $inactiveActive = array_slice($activeMembers, 0, 5);
        $neverCheckedIn = array_slice($activeMembers, 5, 3);

        $activeForRecentAttendance = array_values(array_filter(
            $activeMembers,
            fn (Member $m) => ! in_array($m->getKey(), array_map(fn (Member $x) => $x->getKey(), array_merge($inactiveActive, $neverCheckedIn)), true)
        ));

        for ($d = 0; $d < 30; $d++) {
            $day = $attendanceFrom->copy()->addDays($d);
            $base = ($d * 7) % 8;
            $count = $base;

            for ($k = 0; $k < $count; $k++) {
                $member = $activeForRecentAttendance[($d * 11 + $k * 5) % count($activeForRecentAttendance)];
                $in = $day->copy()->addHours(6 + ($k % 8))->addMinutes(($k * 13) % 60);
                $out = $in->copy()->addMinutes(45 + (($k * 17) % 75));
                Attendance::query()->create([
                    'gym_id' => $gym->getKey(),
                    'member_id' => $member->getKey(),
                    'checked_in_by_user_id' => $cashier->getKey(),
                    'checked_in_at' => $in,
                    'checked_out_at' => $out,
                ]);
            }
        }

        foreach ($inactiveActive as $i => $member) {
            $in = $todayStart->copy()->subDays(10 + $i)->addHours(9);
            $out = $in->copy()->addMinutes(70);
            Attendance::query()->create([
                'gym_id' => $gym->getKey(),
                'member_id' => $member->getKey(),
                'checked_in_by_user_id' => $cashier->getKey(),
                'checked_in_at' => $in,
                'checked_out_at' => $out,
            ]);
        }

        $openA = $activeMembers[count($activeMembers) - 1];
        $openB = $activeMembers[count($activeMembers) - 2];

        Attendance::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $openA->getKey(),
            'checked_in_by_user_id' => $cashier->getKey(),
            'checked_in_at' => $todayStart->copy()->addHours(8)->addMinutes(10),
            'checked_out_at' => null,
        ]);

        Attendance::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $openB->getKey(),
            'checked_in_by_user_id' => $cashier->getKey(),
            'checked_in_at' => $todayStart->copy()->addHours(9)->addMinutes(25),
            'checked_out_at' => null,
        ]);

        foreach ($noMembershipMembers as $member) {
            if (random_int(0, 1) === 1) {
                $in = $todayStart->copy()->subDays(random_int(2, 25))->addHours(7);
                $out = $in->copy()->addMinutes(60);
                Attendance::query()->create([
                    'gym_id' => $gym->getKey(),
                    'member_id' => $member->getKey(),
                    'checked_in_by_user_id' => $cashier->getKey(),
                    'checked_in_at' => $in,
                    'checked_out_at' => $out,
                ]);
            }
        }

        $workoutTemplate = json_encode([
            'schema_version' => 1,
            'type' => 'workout',
            'title' => 'Beginner Full Body',
            'sections' => [
                ['id' => 'mon', 'label' => 'Day 1', 'items' => ['Squats 3x8', 'Push-ups 3x10', 'Plank 3x30s']],
                ['id' => 'wed', 'label' => 'Day 2', 'items' => ['Deadlift 3x5', 'Rows 3x10', 'Carry 3x40m']],
            ],
        ]);

        $foodTemplate = json_encode([
            'schema_version' => 1,
            'type' => 'food',
            'title' => 'Simple Meal Plan',
            'sections' => [
                ['id' => 'b', 'label' => 'Breakfast', 'items' => ['Eggs + toast', 'Fruit']],
                ['id' => 'l', 'label' => 'Lunch', 'items' => ['Chicken + rice', 'Salad']],
                ['id' => 'd', 'label' => 'Dinner', 'items' => ['Fish + potatoes', 'Vegetables']],
            ],
        ]);

        if (is_string($workoutTemplate)) {
            PlanTemplate::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'type' => 'workout', 'name' => 'Beginner Full Body'],
                [
                    'content' => $workoutTemplate,
                    'created_by_user_id' => $trainer->getKey(),
                    'updated_by_user_id' => $trainer->getKey(),
                ]
            );
        }

        if (is_string($foodTemplate)) {
            PlanTemplate::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'type' => 'food', 'name' => 'Simple Meal Plan'],
                [
                    'content' => $foodTemplate,
                    'created_by_user_id' => $trainer->getKey(),
                    'updated_by_user_id' => $trainer->getKey(),
                ]
            );
        }

        $planTargets = array_slice($activeMembers, 0, 12);
        foreach ($planTargets as $idx => $member) {
            $actor = $member->assigned_trainer_user_id === $trainer2->getKey() ? $trainer2 : $trainer;
            MemberPlan::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'member_id' => $member->getKey(), 'type' => 'workout'],
                ['content' => (string) $workoutTemplate, 'created_by_trainer_user_id' => $actor->getKey()]
            );

            MemberPlan::query()->updateOrCreate(
                ['gym_id' => $gym->getKey(), 'member_id' => $member->getKey(), 'type' => 'food'],
                ['content' => (string) $foodTemplate, 'created_by_trainer_user_id' => $actor->getKey()]
            );
        }
    }
}
