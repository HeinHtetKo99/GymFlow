<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Gym;
use App\Models\User;

final class GymPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Gym $gym): bool
    {
        return $user->gym_id === $gym->getKey();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Gym $gym): bool
    {
        if ($user->gym_id !== $gym->getKey()) {
            return false;
        }

        return $gym->owner_user_id === $user->getKey() || $user->role === UserRole::Owner || $user->role === UserRole::Cashier;
    }

    public function delete(User $user, Gym $gym): bool
    {
        return $user->gym_id === $gym->getKey() && $gym->owner_user_id === $user->getKey();
    }

    public function restore(User $user, Gym $gym): bool
    {
        return false;
    }

    public function forceDelete(User $user, Gym $gym): bool
    {
        return false;
    }

    public function manageBilling(User $user, Gym $gym): bool
    {
        return $this->delete($user, $gym);
    }
}
