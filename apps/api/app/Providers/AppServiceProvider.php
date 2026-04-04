<?php

namespace App\Providers;

use App\Support\TenantContext;
use App\Models\Attendance;
use App\Models\Gym;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\Membership;
use App\Models\Payment;
use App\Policies\AttendancePolicy;
use App\Policies\GymPolicy;
use App\Policies\MemberPolicy;
use App\Policies\MembershipPlanPolicy;
use App\Policies\MembershipPolicy;
use App\Policies\PaymentPolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);
    }

    public function boot(): void
    {
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Gym::class, GymPolicy::class);
        Gate::policy(Member::class, MemberPolicy::class);
        Gate::policy(MembershipPlan::class, MembershipPlanPolicy::class);
        Gate::policy(Membership::class, MembershipPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
    }
}
