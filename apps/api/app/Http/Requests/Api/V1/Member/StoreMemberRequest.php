<?php

namespace App\Http\Requests\Api\V1\Member;

use App\Rules\TrainerInTenant;
use App\Support\TenantContext;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
            'assigned_trainer_user_id' => [
                'nullable',
                'integer',
                new TrainerInTenant(app(TenantContext::class)),
            ],
        ];
    }
}
