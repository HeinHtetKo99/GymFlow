<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;

final class MemberPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Owner
            || $user->role === UserRole::Cashier
            || $user->role === UserRole::Trainer;
    }

    public function view(User $user, Member $member): bool
    {
        if ((int) $user->gym_id !== (int) $member->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier || $user->role === UserRole::Trainer) {
            return true;
        }

        return $member->user_id !== null && (int) $member->user_id === (int) $user->getKey();
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Owner
            || $user->role === UserRole::Cashier
            || $user->role === UserRole::Trainer;
    }

    public function update(User $user, Member $member): bool
    {
        if ((int) $user->gym_id !== (int) $member->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier || $user->role === UserRole::Trainer) {
            return true;
        }

        return $member->user_id !== null && (int) $member->user_id === (int) $user->getKey();
    }

    public function delete(User $user, Member $member): bool
    {
        return (int) $user->gym_id === (int) $member->gym_id
            && ($user->role === UserRole::Owner || $user->role === UserRole::Cashier || $user->role === UserRole::Trainer);
    }

    public function restore(User $user, Member $member): bool
    {
        return false;
    }

    public function forceDelete(User $user, Member $member): bool
    {
        return false;
    }

    public function assignTrainer(User $user, Member $member): bool
    {
        return $this->update($user, $member);
    }
}
