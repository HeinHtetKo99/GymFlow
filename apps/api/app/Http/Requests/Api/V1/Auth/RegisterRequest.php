<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Support\TenantContext;

final class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $gymId = app(TenantContext::class)->gymId();

        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => [
                'required',
                'string',
                'email:rfc',
                'max:255',
                $gymId === null ? 'unique:users,email' : Rule::unique('users', 'email')->where('gym_id', $gymId),
            ],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }
}
