<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;
use App\Support\TenantContext;

final class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = User::query()->create([
            'gym_id' => $gymId,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'role' => 'member',
        ]);

        $member = Member::query()->create([
            'gym_id' => $gymId,
            'user_id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'status' => 'active',
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->getKey(),
                'gym_id' => $user->gym_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role instanceof UserRole ? $user->role->value : $user->role,
            ],
            'member' => [
                'id' => $member->getKey(),
                'status' => $member->status,
            ],
        ], 201);
    }
}
