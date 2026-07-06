<?php

namespace Database\Seeders;

use App\Models\Gym;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $gym = Gym::query()->firstOrCreate(
            ['slug' => 'gymflow'],
            ['name' => 'GymFlow Demo Gym', 'attendance_retention_days' => 90]
        );

        $testUser = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Test User',
                'password' => 'password',
                'role' => 'member',
            ]
        );

        $owner = User::query()->updateOrCreate(
            ['email' => 'owner@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Owner',
                'password' => 'password',
                'role' => 'owner',
            ]
        );

        $cashier = User::query()->updateOrCreate(
            ['email' => 'cashier@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Cashier',
                'password' => 'password',
                'role' => 'cashier',
            ]
        );

        $trainer = User::query()->updateOrCreate(
            ['email' => 'trainer@gymflow.test'],
            [
                'gym_id' => $gym->getKey(),
                'name' => 'Trainer',
                'password' => 'password',
                'role' => 'trainer',
            ]
        );

        if ($owner !== null) {
            Gym::query()
                ->whereKey($gym->getKey())
                ->update(['owner_user_id' => $owner->getKey()]);
        }

        MembershipPlan::query()
            ->where('gym_id', $gym->getKey())
            ->whereNotIn('name', ['Silver', 'Gold'])
            ->update(['is_active' => false]);

        $silverPlan = MembershipPlan::query()->updateOrCreate(
            ['gym_id' => $gym->getKey(), 'name' => 'Silver'],
            [
                'tier' => 'silver',
                'duration_days' => 30,
                'price_cents' => 45000,
                'currency' => 'MMK',
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $goldPlan = MembershipPlan::query()->updateOrCreate(
            ['gym_id' => $gym->getKey(), 'name' => 'Gold'],
            [
                'tier' => 'gold',
                'duration_days' => 30,
                'price_cents' => 200000,
                'currency' => 'MMK',
                'is_active' => true,
                'sort_order' => 20,
            ]
        );

        $member = Member::query()->updateOrCreate(
            ['user_id' => $testUser->getKey()],
            [
                'gym_id' => $gym->getKey(),
                'name' => $testUser->name,
                'email' => $testUser->email,
                'phone' => '+95 9 000 000 000',
                'status' => 'active',
                'assigned_trainer_user_id' => $trainer->getKey(),
            ]
        );

        Membership::query()->updateOrCreate(
            [
                'gym_id' => $gym->getKey(),
                'member_id' => $member->getKey(),
            ],
            [
                'membership_plan_id' => $goldPlan->getKey(),
                'starts_at' => now()->subDays(7),
                'ends_at' => now()->addDays(23),
                'status' => 'active',
                'cancel_requested_at' => null,
            ]
        );

        $shouldSeedDemo = app()->environment(['local', 'development'])
            || filter_var((string) env('SEED_DEMO', 'false'), FILTER_VALIDATE_BOOL);

        if ($shouldSeedDemo) {
            $this->call(AnalyticsDemoSeeder::class);
        }
    }
}
