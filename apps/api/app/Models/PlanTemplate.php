<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class PlanTemplate extends Model
{
    protected $fillable = [
        'gym_id',
        'type',
        'name',
        'content',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}

