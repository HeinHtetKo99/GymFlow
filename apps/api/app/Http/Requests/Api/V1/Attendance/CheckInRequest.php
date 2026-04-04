<?php

namespace App\Http\Requests\Api\V1\Attendance;

use App\Rules\MemberInTenant;
use App\Support\TenantContext;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', new MemberInTenant(app(TenantContext::class))],
            'checked_in_at' => ['sometimes', 'date'],
        ];
    }
}
