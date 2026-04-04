<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\CreateUserRequest;
use App\Http\Requests\Api\V1\User\UpdateUserRoleRequest;
use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;
use App\Support\TenantContext;

final class UserController extends Controller
{
    public function index(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $users = User::query()
            ->where('gym_id', $gymId)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'data' => $users,
        ]);
    }

    public function store(CreateUserRequest $request, TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $actor = $request->user();

        if ($actor === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isOwner = (int) $gym->owner_user_id === (int) $actor->getKey();
        $role = $request->validated('role');

        if ($role === UserRole::Owner->value) {
            return response()->json(['message' => 'Cannot create owner via this endpoint.'], 422);
        }

        if (! $isOwner) {
            if ($actor->role !== UserRole::Cashier || $role !== UserRole::Member->value) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $memberId = $request->validated('member_id');

        if ($role !== UserRole::Member->value && $memberId !== null) {
            return response()->json(['message' => 'member_id is only allowed for member accounts.'], 422);
        }

        if ($role !== UserRole::Member->value && ! $isOwner) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user = User::query()->create([
            'gym_id' => $gym->getKey(),
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'role' => $role,
        ]);

        if ($role === UserRole::Member->value) {
            if ($memberId !== null) {
                $member = Member::query()
                    ->where('gym_id', $gym->getKey())
                    ->whereKey($memberId)
                    ->first();

                if ($member === null) {
                    $user->delete();
                    return response()->json(['message' => 'Member not found.'], 404);
                }

                if ($member->user_id !== null) {
                    $user->delete();
                    return response()->json(['message' => 'Member already has an account.'], 422);
                }

                $member->update([
                    'user_id' => $user->getKey(),
                    'email' => $member->email ?? $user->email,
                    'name' => $member->name ?: $user->name,
                ]);
            } else {
                Member::query()->create([
                    'gym_id' => $gym->getKey(),
                    'user_id' => $user->getKey(),
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => 'active',
                ]);
            }
        }

        return response()->json([
            'data' => $user->only(['id', 'name', 'email', 'role', 'gym_id']),
        ], 201);
    }

    public function updateRole(int $id, UpdateUserRoleRequest $request, TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $actor = $request->user();

        if ($actor === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $gym->owner_user_id !== (int) $actor->getKey()) {
            return response()->json(['message' => 'Only owner can manage staff.'], 403);
        }

        $user = User::query()
            ->where('gym_id', $gym->getKey())
            ->whereKey($id)
            ->first();

        if ($user === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ((int) $gym->owner_user_id === (int) $user->getKey()) {
            return response()->json(['message' => 'Cannot change owner role.'], 422);
        }

        $newRole = $request->validated('role');

        if ($newRole === UserRole::Owner->value) {
            return response()->json(['message' => 'Cannot change role to owner.'], 422);
        }
        $user->update(['role' => $newRole]);

        if ($newRole === UserRole::Member->value) {
            $member = Member::query()
                ->where('gym_id', $gym->getKey())
                ->where('user_id', $user->getKey())
                ->first();

            if ($member === null) {
                Member::query()->create([
                    'gym_id' => $gym->getKey(),
                    'user_id' => $user->getKey(),
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => 'active',
                ]);
            }
        }

        return response()->json([
            'data' => $user->only(['id', 'name', 'email', 'role', 'gym_id']),
        ]);
    }

    public function destroy(int $id, TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $actor = request()->user();

        if ($actor === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isOwner = (int) $gym->owner_user_id === (int) $actor->getKey();

        $user = User::query()
            ->where('gym_id', $gym->getKey())
            ->whereKey($id)
            ->first();

        if ($user === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ((int) $gym->owner_user_id === (int) $user->getKey()) {
            return response()->json(['message' => 'Cannot delete owner account.'], 422);
        }

        if ((int) $actor->getKey() === (int) $user->getKey()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        if (! $isOwner) {
            if ($actor->role !== UserRole::Cashier) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            if ($user->role !== UserRole::Member) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Deleted.',
        ]);
    }
}
