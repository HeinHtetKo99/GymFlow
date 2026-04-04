<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'gym_id',
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function ownedGyms()
    {
        return $this->hasMany(Gym::class, 'owner_user_id');
    }

    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    public function isCashier(): bool
    {
        return $this->hasRole(UserRole::Cashier);
    }

    public function isTrainer(): bool
    {
        return $this->hasRole(UserRole::Trainer);
    }

    public function isMember(): bool
    {
        return $this->hasRole(UserRole::Member);
    }
}
