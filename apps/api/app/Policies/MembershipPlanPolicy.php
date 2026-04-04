<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\MembershipPlan;
use App\Models\User;

final class MembershipPlanPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MembershipPlan $plan): bool
    {
        return (int) $user->gym_id === (int) $plan->gym_id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Owner;
    }

    public function update(User $user, MembershipPlan $plan): bool
    {
        return (int) $user->gym_id === (int) $plan->gym_id && $user->role === UserRole::Owner;
    }

    public function delete(User $user, MembershipPlan $plan): bool
    {
        return false;
    }
}

