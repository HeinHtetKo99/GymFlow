<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Support\Facades\DB;

final class HealthController
{
    public function __invoke()
    {
        try {
            DB::select('select 1');

            return response()->json([
                'status' => 'ok',
                'db' => 'ok',
            ]);
        } catch (\Throwable) {
            return response()->json([
                'status' => 'degraded',
                'db' => 'down',
            ], 503);
        }
    }
}
