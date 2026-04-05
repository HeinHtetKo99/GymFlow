<?php

namespace Database\Seeders;

use App\Models\Gym;
use App\Models\Member;
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

        MembershipPlan::query()->updateOrCreate(
            ['gym_id' => $gym->getKey(), 'name' => 'Monthly'],
            ['duration_days' => 30, 'price_cents' => 5000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 10]
        );

        MembershipPlan::query()->updateOrCreate(
            ['gym_id' => $gym->getKey(), 'name' => 'Quarterly'],
            ['duration_days' => 90, 'price_cents' => 13500, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 20]
        );

        MembershipPlan::query()->updateOrCreate(
            ['gym_id' => $gym->getKey(), 'name' => 'Yearly'],
            ['duration_days' => 365, 'price_cents' => 48000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 30]
        );

        Member::query()->updateOrCreate(
            ['user_id' => $testUser->getKey()],
            [
                'gym_id' => $gym->getKey(),
                'name' => $testUser->name,
                'email' => $testUser->email,
                'phone' => '+1 555-0000',
                'status' => 'active',
                'assigned_trainer_user_id' => $trainer->getKey(),
            ]
        );

        $shouldSeedDemo = app()->environment(['local', 'development'])
            || filter_var((string) env('SEED_DEMO', 'false'), FILTER_VALIDATE_BOOL);

        if ($shouldSeedDemo) {
            $this->call(AnalyticsDemoSeeder::class);
        }
    }
}
