<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Member\StoreMemberMeasurementRequest;
use App\Models\Member;
use App\Models\MemberMeasurement;
use App\Support\MemberProgress;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class MemberMeasurementController extends Controller
{
    public function forMember(int $memberId, TenantContext $tenant)
    {
        $member = $this->resolveMember($tenant, $memberId);

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberMeasurement::class, $member]);

        $measurements = $this->measurementsQuery($tenant, $member)->get();

        return response()->json([
            'data' => $measurements,
        ]);
    }

    public function progressForMember(int $memberId, TenantContext $tenant)
    {
        $member = $this->resolveMember($tenant, $memberId);

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberMeasurement::class, $member]);

        $measurements = $this->measurementsQuery($tenant, $member)->get();

        return response()->json([
            'data' => MemberProgress::build($measurements),
        ]);
    }

    public function store(int $memberId, StoreMemberMeasurementRequest $request, TenantContext $tenant)
    {
        $member = $this->resolveMember($tenant, $memberId);

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        Gate::authorize('store', [MemberMeasurement::class, $member]);

        $gymId = $tenant->gymId();
        $payload = $request->validated();

        $measurement = MemberMeasurement::query()->create([
            'gym_id' => $gymId,
            'member_id' => $member->getKey(),
            'recorded_by_user_id' => $request->user()?->getKey(),
            'recorded_at' => $payload['recorded_at'],
            'weight_kg' => $payload['weight_kg'] ?? null,
            'body_fat_percent' => $payload['body_fat_percent'] ?? null,
            'waist_cm' => $payload['waist_cm'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ]);

        return response()->json([
            'data' => $measurement,
        ], 201);
    }

    public function me(TenantContext $tenant)
    {
        $member = $this->resolveAuthenticatedMember($tenant);

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberMeasurement::class, $member]);

        $measurements = $this->measurementsQuery($tenant, $member)->get();

        return response()->json([
            'data' => $measurements,
        ]);
    }

    public function myProgress(TenantContext $tenant)
    {
        $member = $this->resolveAuthenticatedMember($tenant);

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        Gate::authorize('viewForMember', [MemberMeasurement::class, $member]);

        $measurements = $this->measurementsQuery($tenant, $member)->get();

        return response()->json([
            'data' => MemberProgress::build($measurements),
        ]);
    }

    private function resolveMember(TenantContext $tenant, int $memberId): ?Member
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return null;
        }

        return Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($memberId)
            ->first();
    }

    private function resolveAuthenticatedMember(TenantContext $tenant): ?Member
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return null;
        }

        $user = request()->user();

        if ($user === null) {
            return null;
        }

        return Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();
    }

    private function measurementsQuery(TenantContext $tenant, Member $member)
    {
        $gymId = $tenant->gymId();

        return MemberMeasurement::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->orderBy('recorded_at')
            ->orderBy('id');
    }
}
