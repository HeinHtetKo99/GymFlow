<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Member;
use App\Models\User;

final class MemberMeasurementPolicy
{
    public function viewForMember(User $user, Member $member): bool
    {
        if ((int) $user->gym_id !== (int) $member->gym_id) {
            return false;
        }

        if ($member->user_id !== null && (int) $member->user_id === (int) $user->getKey()) {
            return true;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier) {
            return true;
        }

        if ($user->role === UserRole::Trainer) {
            return $member->assigned_trainer_user_id !== null
                && (int) $member->assigned_trainer_user_id === (int) $user->getKey();
        }

        $gym = $user->gym;

        return $gym !== null && (int) $gym->owner_user_id === (int) $user->getKey();
    }

    public function store(User $user, Member $member): bool
    {
        if ((int) $user->gym_id !== (int) $member->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner) {
            return true;
        }

        if ($user->role === UserRole::Trainer) {
            return $member->assigned_trainer_user_id !== null
                && (int) $member->assigned_trainer_user_id === (int) $user->getKey();
        }

        $gym = $user->gym;

        return $gym !== null && (int) $gym->owner_user_id === (int) $user->getKey();
    }
}
