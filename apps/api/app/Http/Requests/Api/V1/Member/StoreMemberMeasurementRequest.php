<?php

namespace App\Http\Requests\Api\V1\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class StoreMemberMeasurementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recorded_at' => ['required', 'date'],
            'weight_kg' => ['nullable', 'numeric', 'min:20', 'max:500'],
            'body_fat_percent' => ['nullable', 'numeric', 'min:1', 'max:80'],
            'waist_cm' => ['nullable', 'numeric', 'min:30', 'max:300'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasMetric = $this->filled('weight_kg')
                || $this->filled('body_fat_percent')
                || $this->filled('waist_cm');

            if (! $hasMetric) {
                $validator->errors()->add('weight_kg', 'At least one measurement is required.');
            }
        });
    }
}
