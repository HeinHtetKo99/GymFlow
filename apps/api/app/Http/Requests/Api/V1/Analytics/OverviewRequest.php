<?php

namespace App\Http\Requests\Api\V1\Analytics;

use Illuminate\Foundation\Http\FormRequest;

final class OverviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'months' => ['sometimes', 'integer', 'in:6,12,24'],
            'inactive_days' => ['sometimes', 'integer', 'in:7,14,30'],
        ];
    }
}

