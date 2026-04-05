<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Gym;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class AnalyticsOverviewTest extends TestCase
{
    use RefreshDatabase;

    private function makeGym(string $slug): Gym
    {
        return Gym::query()->create([
            'name' => 'Gym ' . $slug,
            'slug' => $slug,
            'attendance_retention_days' => 90,
        ]);
    }

    private function makeOwner(Gym $gym, string $email = 'owner@test.local'): User
    {
        $owner = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Owner',
            'email' => $email,
            'password' => 'password',
            'role' => 'owner',
        ]);

        $gym->update(['owner_user_id' => $owner->getKey()]);

        return $owner->refresh();
    }

    private function makeCashier(Gym $gym, string $email = 'cashier@test.local'): User
    {
        return User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Cashier',
            'email' => $email,
            'password' => 'password',
            'role' => 'cashier',
        ])->refresh();
    }

    private function makeMemberProfile(Gym $gym, string $name = 'Member'): Member
    {
        return Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => null,
            'name' => $name,
            'email' => null,
            'status' => 'active',
        ]);
    }

    private function makePlan(Gym $gym, string $name = 'Monthly'): MembershipPlan
    {
        return MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => $name,
            'duration_days' => 30,
            'price_cents' => 5000,
            'currency' => 'USD',
            'is_active' => true,
            'sort_order' => 10,
        ]);
    }

    public function test_cashier_cannot_access_analytics_overview(): void
    {
        $gym = $this->makeGym('gymflow');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/analytics/overview')
            ->assertStatus(403);
    }

    public function test_owner_can_access_analytics_overview_and_sees_expected_shape(): void
    {
        $gym = $this->makeGym('gymflow');
        $owner = $this->makeOwner($gym, 'owner@test.local');
        $plan = $this->makePlan($gym);
        $member = $this->makeMemberProfile($gym, 'Active Member');

        Membership::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'starts_at' => now()->subDays(1),
            'ends_at' => now()->addDays(29),
            'status' => 'active',
            'cancel_requested_at' => null,
        ]);

        Payment::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'membership_id' => null,
            'recorded_by_user_id' => $owner->getKey(),
            'amount_cents' => 5000,
            'currency' => 'USD',
            'method' => 'cash',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => null,
            'notes' => null,
        ]);

        Attendance::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'checked_in_by_user_id' => $owner->getKey(),
            'checked_in_at' => now(),
            'checked_out_at' => null,
        ]);

        Sanctum::actingAs($owner);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/analytics/overview?months=6&inactive_days=7')
            ->assertStatus(200)
            ->assertJsonPath('range.months', 6)
            ->assertJsonPath('revenue.currency', 'USD')
            ->assertJsonPath('revenue.total_cents', 5000)
            ->assertJsonPath('members.active', 1)
            ->assertJsonPath('attendance.today_checkins', 1);
    }

    public function test_analytics_is_tenant_isolated(): void
    {
        $gymA = $this->makeGym('gym-a');
        $gymB = $this->makeGym('gym-b');

        $ownerA = $this->makeOwner($gymA, 'ownerA@test.local');
        $ownerB = $this->makeOwner($gymB, 'ownerB@test.local');

        $planA = $this->makePlan($gymA, 'Plan A');
        $planB = $this->makePlan($gymB, 'Plan B');

        $memberA1 = $this->makeMemberProfile($gymA, 'A Recent');
        $memberA2 = $this->makeMemberProfile($gymA, 'A Inactive');
        $memberB = $this->makeMemberProfile($gymB, 'B Member');

        foreach ([$memberA1, $memberA2] as $m) {
            Membership::query()->create([
                'gym_id' => $gymA->getKey(),
                'member_id' => $m->getKey(),
                'membership_plan_id' => $planA->getKey(),
                'starts_at' => now()->subDays(1),
                'ends_at' => now()->addDays(29),
                'status' => 'active',
                'cancel_requested_at' => null,
            ]);
        }

        Membership::query()->create([
            'gym_id' => $gymB->getKey(),
            'member_id' => $memberB->getKey(),
            'membership_plan_id' => $planB->getKey(),
            'starts_at' => now()->subDays(1),
            'ends_at' => now()->addDays(29),
            'status' => 'active',
            'cancel_requested_at' => null,
        ]);

        Payment::query()->create([
            'gym_id' => $gymA->getKey(),
            'member_id' => $memberA1->getKey(),
            'membership_plan_id' => $planA->getKey(),
            'membership_id' => null,
            'recorded_by_user_id' => $ownerA->getKey(),
            'amount_cents' => 1111,
            'currency' => 'USD',
            'method' => 'cash',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => null,
            'notes' => null,
        ]);

        Payment::query()->create([
            'gym_id' => $gymB->getKey(),
            'member_id' => $memberB->getKey(),
            'membership_plan_id' => $planB->getKey(),
            'membership_id' => null,
            'recorded_by_user_id' => $ownerB->getKey(),
            'amount_cents' => 9999,
            'currency' => 'USD',
            'method' => 'cash',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => null,
            'notes' => null,
        ]);

        Attendance::query()->create([
            'gym_id' => $gymA->getKey(),
            'member_id' => $memberA1->getKey(),
            'checked_in_by_user_id' => $ownerA->getKey(),
            'checked_in_at' => now(),
            'checked_out_at' => null,
        ]);

        Attendance::query()->create([
            'gym_id' => $gymB->getKey(),
            'member_id' => $memberB->getKey(),
            'checked_in_by_user_id' => $ownerB->getKey(),
            'checked_in_at' => now(),
            'checked_out_at' => null,
        ]);

        Sanctum::actingAs($ownerA);

        $res = $this->withHeader('X-Gym', $gymA->slug)
            ->getJson('/api/v1/analytics/overview?months=6&inactive_days=7')
            ->assertStatus(200)
            ->assertJsonPath('revenue.total_cents', 1111)
            ->assertJsonPath('attendance.today_checkins', 1)
            ->assertJsonPath('inactive_members.total', 1);

        $inactive = $res->json('inactive_members.data');
        $this->assertIsArray($inactive);
        $this->assertNotEmpty($inactive);
        $this->assertSame($memberA2->getKey(), $inactive[0]['id']);
    }
}

