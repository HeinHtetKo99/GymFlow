<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\TenantContext;

final class TenantController extends Controller
{
    public function __invoke(TenantContext $tenant)
    {
        $gym = $tenant->gym();

        if ($gym === null) {
            return response()->json([
                'message' => 'Gym not resolved.',
            ], 500);
        }

        return response()->json([
            'id' => $gym->getKey(),
            'name' => $gym->name,
            'code' => $gym->slug,
            'owner_user_id' => $gym->owner_user_id,
        ]);
    }
}
