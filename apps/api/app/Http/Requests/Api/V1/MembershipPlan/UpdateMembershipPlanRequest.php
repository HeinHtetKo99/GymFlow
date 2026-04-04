<?php

namespace App\Http\Requests\Api\V1\MembershipPlan;

use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $gymId = app(TenantContext::class)->gymId();
        $planId = (int) $this->route('id');

        return [
            'name' => [
                'sometimes',
                'string',
                'min:2',
                'max:120',
                $gymId === null
                    ? Rule::unique('membership_plans', 'name')->ignore($planId)
                    : Rule::unique('membership_plans', 'name')->where('gym_id', $gymId)->ignore($planId),
            ],
            'duration_days' => ['sometimes', 'integer', 'min:1', 'max:3650'],
            'price_cents' => ['sometimes', 'integer', 'min:0', 'max:1000000000'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}

