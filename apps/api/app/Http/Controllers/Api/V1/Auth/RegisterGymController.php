<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\RegisterGymRequest;
use App\Models\Gym;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RegisterGymController extends Controller
{
    public function __invoke(RegisterGymRequest $request)
    {
        $validated = $request->validated();
        $explicitSlug = array_key_exists('gym_slug', $validated) && is_string($validated['gym_slug']) && $validated['gym_slug'] !== '';

        $result = DB::transaction(function () use ($validated, $explicitSlug) {
            $slug = $explicitSlug ? $validated['gym_slug'] : $this->generateAvailableSlug($validated['gym_name']);

            if ($explicitSlug && Gym::query()->where('slug', $slug)->exists()) {
                return response()->json(['message' => 'Gym slug is already taken.'], 422);
            }

            $gym = Gym::query()->create([
                'name' => $validated['gym_name'],
                'slug' => $slug,
            ]);

            $owner = User::query()->create([
                'gym_id' => $gym->getKey(),
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'password' => $validated['owner_password'],
                'role' => UserRole::Owner->value,
            ]);

            $gym->owner_user_id = $owner->getKey();
            $gym->save();

            $this->createDefaultMembershipPlans($gym->getKey());

            $token = $owner->createToken('api')->plainTextToken;

            return response()->json([
                'gym' => [
                    'id' => $gym->getKey(),
                    'name' => $gym->name,
                    'code' => $gym->slug,
                    'owner_user_id' => $owner->getKey(),
                ],
                'token' => $token,
                'user' => [
                    'id' => $owner->getKey(),
                    'gym_id' => $owner->gym_id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                    'role' => $owner->role instanceof UserRole ? $owner->role->value : $owner->role,
                ],
            ], 201);
        });

        return $result;
    }

    private function generateAvailableSlug(string $name): string
    {
        $base = Str::slug($name);
        $base = $base !== '' ? $base : 'gym';
        $slug = $base;

        for ($i = 0; $i < 20; $i++) {
            if (! Gym::query()->where('slug', $slug)->exists()) {
                return $slug;
            }
            $slug = $base . '-' . Str::lower(Str::random(5));
        }

        return $base . '-' . Str::lower(Str::random(8));
    }

    private function createDefaultMembershipPlans(int $gymId): void
    {
        $defaults = [
            ['name' => 'Monthly', 'duration_days' => 30, 'price_cents' => 5000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 10],
            ['name' => 'Quarterly', 'duration_days' => 90, 'price_cents' => 13500, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 20],
            ['name' => 'Yearly', 'duration_days' => 365, 'price_cents' => 48000, 'currency' => 'USD', 'is_active' => true, 'sort_order' => 30],
        ];

        foreach ($defaults as $plan) {
            MembershipPlan::query()->updateOrCreate(
                ['gym_id' => $gymId, 'name' => $plan['name']],
                $plan + ['gym_id' => $gymId],
            );
        }
    }
}
