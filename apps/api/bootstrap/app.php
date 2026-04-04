<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\PruneAttendanceCommand::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias([
            'tenant' => \App\Http\Middleware\ResolveTenant::class,
            'tenant.user' => \App\Http\Middleware\EnsureTenantMatchesAuthenticatedUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        $exceptions->respond(function ($response, \Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return $response;
            }

            $status = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 500;

            $data = method_exists($response, 'getData') ? $response->getData(true) : null;

            $message = is_array($data) && isset($data['message'])
                ? $data['message']
                : ($status >= 500 ? 'Server error.' : 'Request failed.');

            $payload = [
                'message' => $message,
            ];

            if (is_array($data) && isset($data['errors']) && is_array($data['errors'])) {
                $payload['errors'] = $data['errors'];
            }

            return response()->json($payload, $status);
        });
    })->create();
