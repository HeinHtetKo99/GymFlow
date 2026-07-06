<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MemberMeasurement extends Model
{
    protected $fillable = [
        'gym_id',
        'member_id',
        'recorded_by_user_id',
        'recorded_at',
        'weight_kg',
        'body_fat_percent',
        'waist_cm',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'date',
            'weight_kg' => 'float',
            'body_fat_percent' => 'float',
            'waist_cm' => 'float',
        ];
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
