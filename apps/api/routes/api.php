<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\RegisterGymController;
use App\Http\Controllers\Api\V1\Gym\ShowGymController;
use App\Http\Controllers\Api\V1\Gym\UpdateGymController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\MemberPlanController;
use App\Http\Controllers\Api\V1\MembershipPlanController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\PlanTemplateController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    Route::prefix('auth')->group(function () {
        Route::post('/register-gym', RegisterGymController::class);
    });

    Route::middleware('tenant')->group(function () {
        Route::get('/tenant', TenantController::class);

        Route::prefix('auth')->group(function () {
            Route::post('/register', RegisterController::class);
            Route::post('/login', LoginController::class);

            Route::middleware(['auth:sanctum', 'tenant.user'])->group(function () {
                Route::get('/me', MeController::class);
                Route::post('/logout', LogoutController::class);
            });
        });

        Route::middleware(['auth:sanctum', 'tenant.user'])->group(function () {
            Route::get('/gym', ShowGymController::class);
            Route::patch('/gym', UpdateGymController::class);

            Route::get('/trainers', [MemberController::class, 'trainers']);

            Route::get('/members/me', [MemberController::class, 'me']);
            Route::patch('/members/me', [MemberController::class, 'updateMe']);
            Route::post('/members/me/membership/cancel', [MemberController::class, 'cancelMyMembership']);
            Route::post('/members/me/membership/undo-cancel', [MemberController::class, 'undoCancelMyMembership']);
            Route::get('/members/me/plans', [MemberPlanController::class, 'me']);

            Route::get('/members', [MemberController::class, 'index']);
            Route::post('/members', [MemberController::class, 'store']);
            Route::get('/members/{id}', [MemberController::class, 'show']);
            Route::patch('/members/{id}', [MemberController::class, 'update']);
            Route::get('/members/{id}/plans', [MemberPlanController::class, 'forMember']);
            Route::put('/members/{id}/plans/{type}', [MemberPlanController::class, 'upsert']);
            Route::post('/members/{id}/membership/cancel', [MemberController::class, 'cancelMembership']);
            Route::post('/members/{id}/membership/undo-cancel', [MemberController::class, 'undoCancelMembership']);
            Route::delete('/members/{id}', [MemberController::class, 'destroy']);

            Route::get('/attendance', [AttendanceController::class, 'index']);
            Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
            Route::post('/attendance/{id}/check-out', [AttendanceController::class, 'checkOut']);
            Route::get('/attendance/me', [AttendanceController::class, 'me']);

            Route::get('/membership-plans', [MembershipPlanController::class, 'index']);
            Route::post('/membership-plans', [MembershipPlanController::class, 'store']);
            Route::patch('/membership-plans/{id}', [MembershipPlanController::class, 'update']);

            Route::get('/payments', [PaymentController::class, 'index']);
            Route::post('/payments', [PaymentController::class, 'store']);
            Route::get('/payments/me', [PaymentController::class, 'me']);
            Route::get('/payments/{id}', [PaymentController::class, 'show']);
            Route::post('/payments/{id}/void', [PaymentController::class, 'void']);

            Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);

            Route::get('/plan-templates', [PlanTemplateController::class, 'index']);
            Route::post('/plan-templates', [PlanTemplateController::class, 'store']);
            Route::patch('/plan-templates/{id}', [PlanTemplateController::class, 'update']);
            Route::delete('/plan-templates/{id}', [PlanTemplateController::class, 'destroy']);

            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::patch('/users/{id}/role', [UserController::class, 'updateRole']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });
    });
});
