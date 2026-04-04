<?php

namespace App\Http\Controllers\Api\V1\Gym;

use App\Http\Controllers\Controller;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class ShowGymController extends Controller
{
    public function __invoke(TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json([
                'message' => 'Tenant not resolved.',
            ], 500);
        }

        Gate::authorize('view', $gym);

        return response()->json([
            'id' => $gym->getKey(),
            'name' => $gym->name,
            'code' => $gym->slug,
            'owner_user_id' => $gym->owner_user_id,
            'attendance_retention_days' => $gym->attendance_retention_days,
            'permissions' => [
                'can_update' => Gate::allows('update', $gym),
                'can_manage_billing' => Gate::allows('manageBilling', $gym),
            ],
        ]);
    }
}
