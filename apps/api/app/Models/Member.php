<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Member extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'gym_id',
        'user_id',
        'assigned_trainer_user_id',
        'name',
        'email',
        'phone',
        'status',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTrainer()
    {
        return $this->belongsTo(User::class, 'assigned_trainer_user_id');
    }

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }
}
