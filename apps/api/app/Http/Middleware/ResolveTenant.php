<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Gym;
use App\Support\TenantContext;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Gym') ?? $request->header('X-Tenant');

        if (! is_string($slug) || $slug === '') {
            return response()->json([
                'message' => 'Missing gym code. Provide X-Gym header.',
            ], 400);
        }

        $gym = Gym::query()->where('slug', $slug)->first();

        if ($gym === null) {
            return response()->json([
                'message' => 'Gym not found.',
            ], 404);
        }

        app(TenantContext::class)->setGym($gym);
        $request->attributes->set('tenant', $gym);

        return $next($request);
    }
}
