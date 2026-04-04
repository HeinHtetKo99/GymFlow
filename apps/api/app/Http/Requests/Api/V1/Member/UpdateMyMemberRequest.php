<?php

namespace App\Http\Requests\Api\V1\Member;

use App\Rules\TrainerInTenant;
use App\Support\TenantContext;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateMyMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'assigned_trainer_user_id' => [
                'sometimes',
                'nullable',
                'integer',
                new TrainerInTenant(app(TenantContext::class)),
            ],
        ];
    }
}
