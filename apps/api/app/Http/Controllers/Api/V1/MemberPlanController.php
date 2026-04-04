<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberPlan;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class MemberPlanController extends Controller
{
    public function forMember(int $memberId, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($memberId)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberPlan::class, $member]);

        $plans = MemberPlan::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->orderBy('type')
            ->get();

        return response()->json([
            'data' => $plans,
        ]);
    }

    public function upsert(int $memberId, string $type, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $type = strtolower(trim($type));

        if (! in_array($type, ['workout', 'food'], true)) {
            return response()->json(['message' => 'Invalid plan type.'], 422);
        }

        $payload = request()->validate([
            'content' => ['required', 'string', 'max:20000'],
        ]);

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($memberId)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        Gate::authorize('upsert', [MemberPlan::class, $member]);

        $actorId = request()->user()?->getKey();

        $plan = MemberPlan::query()->updateOrCreate(
            [
                'gym_id' => $gymId,
                'member_id' => $member->getKey(),
                'type' => $type,
            ],
            [
                'content' => $payload['content'],
                'created_by_trainer_user_id' => $actorId,
            ]
        );

        return response()->json([
            'data' => $plan,
        ]);
    }

    public function me(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = request()->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberPlan::class, $member]);

        $plans = MemberPlan::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->orderBy('type')
            ->get();

        return response()->json([
            'data' => $plans,
        ]);
    }
}

