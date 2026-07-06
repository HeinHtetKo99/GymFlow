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

final class PersonalTrainingTierTest extends TestCase
{
    use RefreshDatabase;

    public function test_silver_member_cannot_view_plans_or_progress(): void
    {
        [$gym, , $memberUser] = $this->createMemberWithTier('silver');

        Sanctum::actingAs($memberUser);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members/me/plans')
            ->assertStatus(403);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members/me/progress')
            ->assertStatus(403);
    }

    public function test_gold_member_with_trainer_can_view_plans_and_progress(): void
    {
        [$gym, , $memberUser, $trainer] = $this->createMemberWithTier('gold', withTrainer: true);

        Sanctum::actingAs($memberUser);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members/me/plans')
            ->assertStatus(200);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members/me/progress')
            ->assertStatus(200);

        Sanctum::actingAs($trainer);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members?assigned_trainer=me')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_trainer_does_not_see_silver_member_assigned_to_them(): void
    {
        [$gym, , , $trainer] = $this->createMemberWithTier('silver', withTrainer: true);

        Sanctum::actingAs($trainer);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members?assigned_trainer=me')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_silver_member_cannot_assign_trainer(): void
    {
        [$gym, , $memberUser, $trainer] = $this->createMemberWithTier('silver');

        Sanctum::actingAs($memberUser);

        $this->withHeader('X-Gym', $gym->slug)
            ->patchJson('/api/v1/members/me', [
                'assigned_trainer_user_id' => $trainer->getKey(),
            ])
            ->assertStatus(403);
    }

    /**
     * @return array{0: Gym, 1: Member, 2: User, 3?: User}
     */
    private function createMemberWithTier(string $tier, bool $withTrainer = false): array
    {
        $gym = Gym::query()->create([
            'name' => 'GymFlow',
            'slug' => 'gymflow',
            'attendance_retention_days' => 90,
        ]);

        $trainer = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Trainer',
            'email' => 'trainer-tier@test.local',
            'password' => 'password',
            'role' => 'trainer',
        ]);

        $memberUser = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Member',
            'email' => sprintf('member-%s@test.local', $tier),
            'password' => 'password',
            'role' => 'member',
        ]);

        $plan = MembershipPlan::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => ucfirst($tier),
            'tier' => $tier,
            'duration_days' => 30,
            'price_cents' => $tier === 'gold' ? 200000 : 45000,
            'currency' => 'MMK',
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $member = Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => $memberUser->getKey(),
            'assigned_trainer_user_id' => $withTrainer && $tier === 'gold' ? $trainer->getKey() : null,
            'name' => 'Member',
            'email' => $memberUser->email,
            'status' => 'active',
        ]);

        Membership::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'membership_plan_id' => $plan->getKey(),
            'starts_at' => now()->subDays(3),
            'ends_at' => now()->addDays(27),
            'status' => 'active',
        ]);

        return [$gym, $member, $memberUser, $trainer];
    }
}
