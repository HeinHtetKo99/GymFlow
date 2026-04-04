<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MemberPlan extends Model
{
    protected $fillable = [
        'gym_id',
        'member_id',
        'created_by_trainer_user_id',
        'type',
        'content',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function createdByTrainer()
    {
        return $this->belongsTo(User::class, 'created_by_trainer_user_id');
    }
}

