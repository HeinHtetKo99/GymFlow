<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Attendance extends Model
{
    protected $fillable = [
        'gym_id',
        'member_id',
        'checked_in_by_user_id',
        'checked_in_at',
        'checked_out_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
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

    public function checkedInBy()
    {
        return $this->belongsTo(User::class, 'checked_in_by_user_id');
    }
}
