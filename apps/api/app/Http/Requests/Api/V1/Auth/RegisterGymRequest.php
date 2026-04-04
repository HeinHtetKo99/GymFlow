<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

final class RegisterGymRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gym_name' => ['required', 'string', 'min:2', 'max:120'],
            'gym_slug' => ['sometimes', 'nullable', 'string', 'min:2', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:gyms,slug'],
            'owner_name' => ['required', 'string', 'min:2', 'max:120'],
            'owner_email' => ['required', 'string', 'email:rfc', 'max:255'],
            'owner_password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }
}

