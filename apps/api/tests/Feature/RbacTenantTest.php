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

final class RbacTenantTest extends TestCase
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

    private function makeMemberUser(Gym $gym, string $email = 'member@test.local'): User
    {
        return User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Member User',
            'email' => $email,
            'password' => 'password',
            'role' => 'member',
        ])->refresh();
    }

    private function makeMemberProfile(Gym $gym, ?User $user = null): Member
    {
        return Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => $user?->getKey(),
            'name' => $user?->name ?? 'Member',
            'email' => $user?->email,
            'status' => 'active',
        ]);
    }

    public function test_missing_tenant_header_returns_400(): void
    {
        $this->getJson('/api/v1/tenant')
            ->assertStatus(400)
            ->assertJsonPath('message', 'Missing gym code. Provide X-Gym header.');
    }

    public function test_unknown_tenant_slug_returns_404(): void
    {
        $this->withHeader('X-Gym', 'does-not-exist')
            ->getJson('/api/v1/tenant')
            ->assertStatus(404)
            ->assertJsonPath('message', 'Gym not found.');
    }

    public function test_tenant_user_mismatch_returns_403(): void
    {
        $gymA = $this->makeGym('gym-a');
        $gymB = $this->makeGym('gym-b');

        $user = $this->makeCashier($gymA, 'u@test.local');
        Sanctum::actingAs($user);

        $this->withHeader('X-Gym', $gymB->slug)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(403)
            ->assertJsonPath('message', 'User does not belong to this tenant.');
    }

    public function test_member_cannot_view_payments_or_attendance(): void
    {
        $gym = $this->makeGym('gymflow');
        $memberUser = $this->makeMemberUser($gym);
        $this->makeMemberProfile($gym, $memberUser);
        Sanctum::actingAs($memberUser);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/payments')
            ->assertStatus(403);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/attendance')
            ->assertStatus(403);
    }

    public function test_cashier_cannot_create_trainer_account(): void
    {
        $gym = $this->makeGym('gymflow');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');
        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/users', [
                'name' => 'Trainer',
                'email' => 'trainer@test.local',
                'password' => 'password',
                'role' => 'trainer',
            ])
            ->assertStatus(403);
    }

    public function test_owner_can_create_trainer_account(): void
    {
        $gym = $this->makeGym('gymflow');
        $owner = $this->makeOwner($gym, 'owner@test.local');
        Sanctum::actingAs($owner);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/users', [
                'name' => 'Trainer',
                'email' => 'trainer@test.local',
                'password' => 'password',
                'role' => 'trainer',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.role', 'trainer');
    }

    public function test_cashier_can_cancel_and_undo_cancel_for_a_member_membership(): void
    {
        $gym = $this->makeGym('gymflow');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');

        $memberUser = $this->makeMemberUser($gym, 'member@test.local');
        $member = $this->makeMemberProfile($gym, $memberUser);

        $plan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Monthly',
            'duration_days' => 30,
            'price_cents' => 5000,
            'currency' => 'USD',
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $membership = Membership::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'starts_at' => now()->subDays(1),
            'ends_at' => now()->addDays(29),
            'status' => 'active',
            'cancel_requested_at' => null,
        ]);

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson("/api/v1/members/{$member->getKey()}/membership/cancel", [])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'canceling');

        $membership->refresh();
        $this->assertSame('canceling', $membership->status);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson("/api/v1/members/{$member->getKey()}/membership/undo-cancel", [])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'active');
    }

    public function test_member_can_undo_cancel_for_own_membership(): void
    {
        $gym = $this->makeGym('gymflow');
        $memberUser = $this->makeMemberUser($gym, 'member@test.local');
        $member = $this->makeMemberProfile($gym, $memberUser);

        $plan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Monthly',
            'duration_days' => 30,
            'price_cents' => 5000,
            'currency' => 'USD',
            'is_active' => true,
            'sort_order' => 10,
        ]);

        Membership::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'starts_at' => now()->subDays(1),
            'ends_at' => now()->addDays(29),
            'status' => 'canceling',
            'cancel_requested_at' => now()->subHour(),
        ]);

        Sanctum::actingAs($memberUser);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/members/me/membership/undo-cancel', [])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'active');
    }

    public function test_cashier_cannot_list_membership_plans_including_inactive(): void
    {
        $gym = $this->makeGym('gymflow');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');
        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/membership-plans?include_inactive=1')
            ->assertStatus(403);
    }

    public function test_payment_show_includes_membership_plan_for_receipt(): void
    {
        $gym = $this->makeGym('gymflow');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');

        $memberUser = $this->makeMemberUser($gym, 'member@test.local');
        $member = $this->makeMemberProfile($gym, $memberUser);

        $plan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Monthly',
            'duration_days' => 30,
            'price_cents' => 5000,
            'currency' => 'USD',
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $payment = Payment::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'membership_id' => null,
            'recorded_by_user_id' => $cashier->getKey(),
            'amount_cents' => 5000,
            'currency' => 'USD',
            'method' => 'cash',
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => 'R123',
            'notes' => 'Test receipt',
        ]);

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson("/api/v1/payments/{$payment->getKey()}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $payment->getKey())
            ->assertJsonPath('data.membership_plan.name', 'Monthly')
            ->assertJsonPath('data.member.name', 'Member User');
    }
}
