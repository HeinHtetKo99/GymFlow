<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Gym;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class AttendanceDoubleCheckInTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_check_in_twice_without_checking_out(): void
    {
        $gym = Gym::query()->create([
            'name' => 'GymFlow Demo Gym',
            'slug' => 'gymflow',
            'attendance_retention_days' => 90,
        ]);

        $owner = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Owner',
            'email' => 'owner@test.local',
            'password' => 'password',
            'role' => 'owner',
        ]);

        $gym->update(['owner_user_id' => $owner->getKey()]);

        $cashier = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => 'Cashier',
            'email' => 'cashier@test.local',
            'password' => 'password',
            'role' => 'cashier',
        ]);

        $member = Member::query()->create([
            'gym_id' => $gym->getKey(),
            'user_id' => null,
            'assigned_trainer_user_id' => null,
            'name' => 'Member',
            'email' => 'member@test.local',
            'phone' => null,
            'status' => 'active',
        ]);

        Sanctum::actingAs($cashier);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/attendance/check-in', ['member_id' => $member->getKey()])
            ->assertStatus(201);

        $this->withHeader('X-Gym', $gym->slug)
            ->postJson('/api/v1/attendance/check-in', ['member_id' => $member->getKey()])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Member is already checked in.');

        $this->assertSame(
            1,
            Attendance::query()
                ->where('gym_id', $gym->getKey())
                ->where('member_id', $member->getKey())
                ->whereNull('checked_out_at')
                ->count()
        );
    }
}

