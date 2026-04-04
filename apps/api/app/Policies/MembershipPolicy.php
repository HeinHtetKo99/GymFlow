<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\User;

final class MembershipPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Owner
            || $user->role === UserRole::Cashier
            || $user->role === UserRole::Trainer;
    }

    public function view(User $user, Membership $membership): bool
    {
        if ((int) $user->gym_id !== (int) $membership->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier || $user->role === UserRole::Trainer) {
            return true;
        }

        return $membership->member !== null
            && $membership->member->user_id !== null
            && (int) $membership->member->user_id === (int) $user->getKey();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Membership $membership): bool
    {
        return false;
    }

    public function delete(User $user, Membership $membership): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Membership $membership): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Membership $membership): bool
    {
        return false;
    }

    public function cancel(User $user, Membership $membership): bool
    {
        return (int) $user->gym_id === (int) $membership->gym_id
            && ($user->role === UserRole::Owner || $user->role === UserRole::Cashier);
    }

    public function requestCancel(User $user, Membership $membership): bool
    {
        return (int) $user->gym_id === (int) $membership->gym_id
            && $user->role === UserRole::Member
            && $membership->member !== null
            && $membership->member->user_id !== null
            && (int) $membership->member->user_id === (int) $user->getKey();
    }

    public function undoCancel(User $user, Membership $membership): bool
    {
        if ((int) $user->gym_id !== (int) $membership->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier) {
            return true;
        }

        return $user->role === UserRole::Member
            && $membership->member !== null
            && $membership->member->user_id !== null
            && (int) $membership->member->user_id === (int) $user->getKey();
    }
}
