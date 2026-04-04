<?php

namespace App\Rules;

use App\Models\Member;
use App\Support\TenantContext;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class MemberInTenant implements ValidationRule
{
    public function __construct(private readonly TenantContext $tenant)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_numeric($value)) {
            $fail('The selected member is invalid.');
            return;
        }

        $gymId = $this->tenant->gymId();

        if ($gymId === null) {
            $fail('Tenant not resolved.');
            return;
        }

        $member = Member::query()
            ->whereKey((int) $value)
            ->where('gym_id', $gymId)
            ->first();

        if ($member === null) {
            $fail('The selected member is invalid.');
        }
    }
}
