<?php

namespace App\Http\Requests\Api\V1\Gym;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateGymRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'attendance_retention_days' => ['sometimes', 'integer', 'in:30,90'],
        ];
    }
}
