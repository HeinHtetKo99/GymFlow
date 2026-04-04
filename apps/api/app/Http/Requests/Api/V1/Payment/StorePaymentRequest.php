<?php

namespace App\Http\Requests\Api\V1\Payment;

use App\Rules\MemberInTenant;
use App\Rules\MembershipPlanInTenant;
use App\Support\TenantContext;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', new MemberInTenant(app(TenantContext::class))],
            'membership_plan_id' => ['sometimes', 'nullable', 'integer', new MembershipPlanInTenant(app(TenantContext::class))],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'method' => ['sometimes', 'string', 'in:cash,card,bank_transfer,other'],
            'paid_at' => ['sometimes', 'date'],
            'reference' => ['sometimes', 'nullable', 'string', 'max:120'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
