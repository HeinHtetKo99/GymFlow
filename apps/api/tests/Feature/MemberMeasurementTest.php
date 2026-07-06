<?php

namespace Tests\Feature;

use App\Models\Gym;
use App\Models\Member;
use App\Models\MemberMeasurement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class MemberMeasurementTest extends TestCase
{
    use RefreshDatabase;

    public function test_trainer_can_log_measurement_for_assigned_member(): void
    {
        $gym = $this->createGym();
        $trainer = $this->createUser($gym, 'trainer@gym.test', 'trainer');
        $member = $this->createMember($gym, $trainer, 'member@gym.test');

        Sanctum::actingAs($trainer);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson("/api/v1/members/{$member->getKey()}/measurements", [
                'recorded_at' => '2026-06-01',
                'weight_kg' => 82.5,
                'waist_cm' => 90,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.weight_kg', 82.5);

        $this->assertDatabaseHas('member_measurements', [
            'member_id' => $member->getKey(),
            'weight_kg' => 82.5,
        ]);
    }

    public function test_trainer_cannot_log_measurement_for_unassigned_member(): void
    {
        $gym = $this->createGym();
        $trainer = $this->createUser($gym, 'trainer@gym.test', 'trainer');
        $member = $this->createMember($gym, null, 'member@gym.test');

        Sanctum::actingAs($trainer);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson("/api/v1/members/{$member->getKey()}/measurements", [
                'recorded_at' => '2026-06-01',
                'weight_kg' => 82.5,
            ])
            ->assertStatus(403);
    }

    public function test_member_can_view_progress_with_period_deltas(): void
    {
        $gym = $this->createGym();
        $memberUser = $this->createUser($gym, 'member@gym.test', 'member');
        $member = $this->createMember($gym, null, 'member@gym.test', $memberUser);

        MemberMeasurement::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'recorded_at' => now()->subDays(45)->toDateString(),
            'weight_kg' => 85,
            'waist_cm' => 92,
        ]);

        MemberMeasurement::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'recorded_at' => now()->subDays(20)->toDateString(),
            'weight_kg' => 83,
            'waist_cm' => 90,
        ]);

        MemberMeasurement::query()->create([
            'gym_id' => $gym->getKey(),
            'member_id' => $member->getKey(),
            'recorded_at' => now()->subDays(3)->toDateString(),
            'weight_kg' => 81.5,
            'waist_cm' => 88,
        ]);

        Sanctum::actingAs($memberUser);

        $res = $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members/me/progress')
            ->assertStatus(200);

        $data = $res->json('data');
        $this->assertSame(85.0, $data['baseline']['weight_kg']);
        $this->assertSame(81.5, $data['current']['weight_kg']);
        $this->assertSame(-3.5, $data['changes']['all']['weight_kg']);
        $this->assertCount(3, $data['series']);
    }

    public function test_store_requires_at_least_one_metric(): void
    {
        $gym = $this->createGym();
        $trainer = $this->createUser($gym, 'trainer@gym.test', 'trainer');
        $member = $this->createMember($gym, $trainer, 'member@gym.test');

        Sanctum::actingAs($trainer);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson("/api/v1/members/{$member->getKey()}/measurements", [
                'recorded_at' => '2026-06-01',
                'notes' => 'No metrics',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['weight_kg']);
    }

    private function createGym(): Gym
    {
        return Gym::query()->create([
            'name' => 'GymFlow',
            'slug' => 'gymflow',
            'attendance_retention_days' => 90,
        ]);
    }

    private function createUser(Gym $gym, string $email, string $role): User
    {
        return User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => ucfirst($role),
            'email' => $email,
            'password' => 'password',
            'role' => $role,
        ]);
    }

    private function createMember(Gym $gym, ?User $trainer, string $email, ?User $memberUser = null): Member
    {
        return Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => $memberUser?->getKey(),
            'assigned_trainer_user_id' => $trainer?->getKey(),
            'name' => 'Member',
            'email' => $email,
            'status' => 'active',
        ]);
    }
}
