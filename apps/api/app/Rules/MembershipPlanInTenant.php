<?php

namespace App\Rules;

use App\Models\MembershipPlan;
use App\Support\TenantContext;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class MembershipPlanInTenant implements ValidationRule
{
    public function __construct(private readonly TenantContext $tenant)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_numeric($value)) {
            $fail('The selected membership plan is invalid.');
            return;
        }

        $gymId = $this->tenant->gymId();

        if ($gymId === null) {
            $fail('Tenant not resolved.');
            return;
        }

        $plan = MembershipPlan::query()
            ->whereKey((int) $value)
            ->where('gym_id', $gymId)
            ->where('is_active', true)
            ->first();

        if ($plan === null) {
            $fail('The selected membership plan is invalid.');
        }
    }
}
