<?php

namespace App\Rules;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\TenantContext;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class TrainerInTenant implements ValidationRule
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
            $fail('The selected trainer is invalid.');
            return;
        }

        $gymId = $this->tenant->gymId();

        if ($gymId === null) {
            $fail('Tenant not resolved.');
            return;
        }

        $trainer = User::query()
            ->whereKey((int) $value)
            ->where('gym_id', $gymId)
            ->first();

        if ($trainer === null || $trainer->role !== UserRole::Trainer) {
            $fail('The selected trainer is invalid.');
        }
    }
}
