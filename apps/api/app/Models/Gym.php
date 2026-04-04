<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Gym extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'attendance_retention_days',
        'owner_user_id',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
}
