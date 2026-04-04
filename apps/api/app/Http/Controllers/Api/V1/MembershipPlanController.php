<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MembershipPlan\StoreMembershipPlanRequest;
use App\Http\Requests\Api\V1\MembershipPlan\UpdateMembershipPlanRequest;
use App\Models\MembershipPlan;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class MembershipPlanController extends Controller
{
    public function index(TenantContext $tenant)
    {
        Gate::authorize('viewAny', MembershipPlan::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $includeInactive = request()->boolean('include_inactive', false);
        if ($includeInactive) {
            Gate::authorize('create', MembershipPlan::class);
        }

        $plans = MembershipPlan::query()
            ->where('gym_id', $gymId)
            ->when(! $includeInactive, fn ($q) => $q->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'duration_days', 'price_cents', 'currency', 'is_active', 'sort_order']);

        return response()->json([
            'data' => $plans,
        ]);
    }

    public function store(StoreMembershipPlanRequest $request, TenantContext $tenant)
    {
        Gate::authorize('create', MembershipPlan::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $plan = MembershipPlan::query()->create([
            'gym_id' => $gymId,
            'name' => $request->validated('name'),
            'duration_days' => $request->validated('duration_days'),
            'price_cents' => $request->validated('price_cents'),
            'currency' => $request->validated('currency', 'USD'),
            'is_active' => $request->validated('is_active', true),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        return response()->json([
            'data' => $plan->only(['id', 'name', 'duration_days', 'price_cents', 'currency', 'is_active', 'sort_order']),
        ], 201);
    }

    public function update(int $id, UpdateMembershipPlanRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $plan = MembershipPlan::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($plan === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('update', $plan);

        $plan->fill($request->validated());
        $plan->save();

        return response()->json([
            'data' => $plan->only(['id', 'name', 'duration_days', 'price_cents', 'currency', 'is_active', 'sort_order']),
        ]);
    }
}
