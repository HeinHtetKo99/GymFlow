<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\User;

final class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Owner || $user->role === UserRole::Cashier;
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ((int) $user->gym_id !== (int) $attendance->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier) {
            return true;
        }

        return $attendance->member !== null
            && $attendance->member->user_id !== null
            && (int) $attendance->member->user_id === (int) $user->getKey();
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Owner || $user->role === UserRole::Cashier;
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return (int) $user->gym_id === (int) $attendance->gym_id
            && ($user->role === UserRole::Owner || $user->role === UserRole::Cashier);
    }

    public function delete(User $user, Attendance $attendance): bool
    {
        return $this->update($user, $attendance);
    }

    public function restore(User $user, Attendance $attendance): bool
    {
        return false;
    }

    public function forceDelete(User $user, Attendance $attendance): bool
    {
        return false;
    }

    public function checkOut(User $user, Attendance $attendance): bool
    {
        return $this->update($user, $attendance);
    }
}
