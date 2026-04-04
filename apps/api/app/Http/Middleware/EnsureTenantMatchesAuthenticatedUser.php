<?php

namespace App\Http\Middleware;

use Closure;
use App\Support\TenantContext;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureTenantMatchesAuthenticatedUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $tenantGymId = app(TenantContext::class)->gymId();

        if ($tenantGymId === null || (int) $user->gym_id !== (int) $tenantGymId) {
            return response()->json([
                'message' => 'User does not belong to this tenant.',
            ], 403);
        }

        return $next($request);
    }
}
