<?php

namespace App\Http\Controllers\Api\V1\Gym;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Gym\UpdateGymRequest;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class UpdateGymController extends Controller
{
    public function __invoke(UpdateGymRequest $request, TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json([
                'message' => 'Tenant not resolved.',
            ], 500);
        }

        Gate::authorize('update', $gym);

        if ($request->has('attendance_retention_days')) {
            Gate::authorize('manageBilling', $gym);
        }

        $gym->update([
            'name' => $request->validated('name'),
            'attendance_retention_days' => $request->validated('attendance_retention_days', $gym->attendance_retention_days),
        ]);

        return response()->json([
            'id' => $gym->getKey(),
            'name' => $gym->name,
            'code' => $gym->slug,
            'owner_user_id' => $gym->owner_user_id,
            'attendance_retention_days' => $gym->attendance_retention_days,
        ]);
    }
}
