<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Membership extends Model
{
    protected $fillable = [
        'gym_id',
        'member_id',
        'membership_plan_id',
        'starts_at',
        'ends_at',
        'status',
        'cancel_requested_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancel_requested_at' => 'datetime',
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

    public function plan()
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }
}
