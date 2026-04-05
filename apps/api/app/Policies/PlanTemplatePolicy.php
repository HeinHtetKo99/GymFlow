<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PlanTemplate;
use App\Models\User;

final class PlanTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Owner || $user->role === UserRole::Trainer;
    }

    public function view(User $user, PlanTemplate $template): bool
    {
        if ((int) $user->gym_id !== (int) $template->gym_id) {
            return false;
        }

        return $user->role === UserRole::Owner || $user->role === UserRole::Trainer;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, PlanTemplate $template): bool
    {
        return $this->view($user, $template);
    }

    public function delete(User $user, PlanTemplate $template): bool
    {
        return $this->view($user, $template);
    }
}

