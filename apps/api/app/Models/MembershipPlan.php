<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MembershipPlan extends Model
{
    protected $fillable = [
        'gym_id',
        'name',
        'duration_days',
        'price_cents',
        'currency',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'bool',
            'duration_days' => 'int',
            'price_cents' => 'int',
            'sort_order' => 'int',
        ];
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }
}
