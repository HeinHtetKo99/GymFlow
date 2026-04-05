<?php

namespace Tests\Feature;

use App\Models\Gym;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class PlanTemplateTest extends TestCase
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

    private function makeOwner(Gym $gym, string $email): User
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

    private function makeTrainer(Gym $gym, string $email): User
    {
        return User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Trainer',
            'email' => $email,
            'password' => 'password',
            'role' => 'trainer',
        ])->refresh();
    }

    private function makeCashier(Gym $gym, string $email): User
    {
        return User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Cashier',
            'email' => $email,
            'password' => 'password',
            'role' => 'cashier',
        ])->refresh();
    }

    public function test_trainer_can_create_list_and_delete_templates(): void
    {
        $gym = $this->makeGym('gym-a');
        $this->makeOwner($gym, 'owner@test.local');
        $trainer = $this->makeTrainer($gym, 'trainer@test.local');

        $content = json_encode([
            'schema_version' => 1,
            'type' => 'workout',
            'sections' => [
                ['id' => 's1', 'label' => 'Day 1', 'items' => ['Push ups', 'Squats']],
            ],
        ]);

        Sanctum::actingAs($trainer);

        $created = $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/plan-templates', [
                'type' => 'workout',
                'name' => 'Beginner Workout',
                'content' => $content,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.type', 'workout')
            ->assertJsonPath('data.name', 'Beginner Workout')
            ->json('data');

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/plan-templates?type=workout')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', $created['id']);

        $this->withHeader('X-Gym', $gym->slug)
            ->deleteJson('/api/v1/plan-templates/' . $created['id'])
            ->assertStatus(200);
    }

    public function test_cashier_cannot_manage_templates(): void
    {
        $gym = $this->makeGym('gym-a');
        $this->makeOwner($gym, 'owner@test.local');
        $cashier = $this->makeCashier($gym, 'cashier@test.local');

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->getJson('/api/v1/plan-templates?type=workout')
            ->assertStatus(403);

        $content = json_encode([
            'schema_version' => 1,
            'type' => 'workout',
            'sections' => [['id' => 's1', 'label' => 'Day 1', 'items' => ['A']]],
        ]);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/plan-templates', [
                'type' => 'workout',
                'name' => 'Nope',
                'content' => $content,
            ])
            ->assertStatus(403);
    }

    public function test_templates_are_tenant_isolated(): void
    {
        $gymA = $this->makeGym('gym-a');
        $gymB = $this->makeGym('gym-b');

        $this->makeOwner($gymA, 'ownerA@test.local');
        $this->makeOwner($gymB, 'ownerB@test.local');

        $trainerA = $this->makeTrainer($gymA, 'trainerA@test.local');
        $trainerB = $this->makeTrainer($gymB, 'trainerB@test.local');

        Sanctum::actingAs($trainerA);

        $content = json_encode([
            'schema_version' => 1,
            'type' => 'food',
            'sections' => [['id' => 's1', 'label' => 'Day 1', 'items' => ['Protein']]],
        ]);

        $this->withHeader('X-Gym', $gymA->slug)
            ->postJson('/api/v1/plan-templates', [
                'type' => 'food',
                'name' => 'Simple Food',
                'content' => $content,
            ])
            ->assertStatus(201);

        Sanctum::actingAs($trainerB);

        $this->withHeader('X-Gym', $gymB->slug)
            ->getJson('/api/v1/plan-templates?type=food')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
