<?php

namespace Tests\Feature;

use App\Models\Gym;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class TrainerMembersFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_trainer_can_filter_members_to_assigned_only(): void
    {
        $gym = Gym::query()->create([
            'name' => 'GymFlow',
            'slug' => 'gymflow',
            'attendance_retention_days' => 90,
        ]);

        $trainer = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Trainer',
            'email' => 'trainer@test.local',
            'password' => 'password',
            'role' => 'trainer',
        ]);

        $otherTrainer = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Other Trainer',
            'email' => 'trainer2@test.local',
            'password' => 'password',
            'role' => 'trainer',
        ]);

        $assigned = Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => null,
            'assigned_trainer_user_id' => $trainer->getKey(),
            'name' => 'Assigned Member',
            'email' => 'assigned@test.local',
            'status' => 'active',
        ]);

        Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => null,
            'assigned_trainer_user_id' => null,
            'name' => 'Unassigned Member',
            'email' => 'unassigned@test.local',
            'status' => 'active',
        ]);

        Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => null,
            'assigned_trainer_user_id' => $otherTrainer->getKey(),
            'name' => 'Other Trainer Member',
            'email' => 'other@test.local',
            'status' => 'active',
        ]);

        Sanctum::actingAs($trainer);

        $res = $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/members?assigned_trainer=me')
            ->assertStatus(200);

        $data = $res->json('data');
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
        $this->assertSame($assigned->getKey(), $data[0]['id']);
    }
}
