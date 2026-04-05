<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Gym;
use App\Models\Member;
use App\Models\Membership;
use App\Models\Payment;
use Database\Seeders\AnalyticsDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AnalyticsDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeder_creates_analytics_data(): void
    {
        $this->seed(AnalyticsDemoSeeder::class);

        $gym = Gym::query()->where('slug', 'gymflow')->first();
        $this->assertNotNull($gym);

        $this->assertGreaterThan(0, Member::query()->where('gym_id', $gym->getKey())->count());
        $this->assertGreaterThan(0, Membership::query()->where('gym_id', $gym->getKey())->count());
        $this->assertGreaterThan(0, Payment::query()->where('gym_id', $gym->getKey())->count());
        $this->assertGreaterThan(0, Attendance::query()->where('gym_id', $gym->getKey())->count());
    }
}

