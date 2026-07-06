<?php

namespace Tests\Feature;

use App\Models\Gym;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class MembershipUpgradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_silver_to_gold_starts_immediately_and_assigns_trainer(): void
    {
        $gym = Gym::query()->create([
            'name' => 'GymFlow',
            'slug' => 'gymflow',
            'attendance_retention_days' => 90,
        ]);

        $cashier = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Cashier',
            'email' => 'cashier@test.local',
            'password' => 'password',
            'role' => 'cashier',
        ]);

        $trainer = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Trainer',
            'email' => 'trainer@test.local',
            'password' => 'password',
            'role' => 'trainer',
        ]);

        $silverPlan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Silver',
            'tier' => 'silver',
            'duration_days' => 30,
            'price_cents' => 45000,
            'currency' => 'MMK',
            'is_active' => true,
        ]);

        $goldPlan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Gold',
            'tier' => 'gold',
            'duration_days' => 30,
            'price_cents' => 200000,
            'currency' => 'MMK',
            'is_active' => true,
        ]);

        $member = Member::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Member',
            'email' => 'member@test.local',
            'status' => 'active',
        ]);

        Membership::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $silverPlan->getKey(),
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(25),
            'status' => 'active',
        ]);

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/payments', [
                'member_id' => $member->getKey(),
                'membership_plan_id' => $goldPlan->getKey(),
                'assigned_trainer_user_id' => $trainer->getKey(),
                'amount_cents' => 200000,
                'method' => 'cash',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('memberships', [
            'member_id' => $member->getKey(),
            'membership_plan_id' => $silverPlan->getKey(),
            'status' => 'expired',
        ]);

        $active = Membership::query()
            ->where('member_id', $member->getKey())
            ->where('status', 'active')
            ->with('plan')
            ->first();

        $this->assertNotNull($active);
        $this->assertSame('gold', $active->plan?->tier);
        $this->assertTrue($active->starts_at->lte(now()->addMinute()));
        $this->assertSame($trainer->getKey(), $member->fresh()?->assigned_trainer_user_id);
    }
}
