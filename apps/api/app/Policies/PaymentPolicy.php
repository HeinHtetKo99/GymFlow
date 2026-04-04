<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Payment;
use App\Models\User;

final class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Owner || $user->role === UserRole::Cashier;
    }

    public function view(User $user, Payment $payment): bool
    {
        if ((int) $user->gym_id !== (int) $payment->gym_id) {
            return false;
        }

        if ($user->role === UserRole::Owner || $user->role === UserRole::Cashier) {
            return true;
        }

        return $payment->member !== null
            && $payment->member->user_id !== null
            && (int) $payment->member->user_id === (int) $user->getKey();
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Owner || $user->role === UserRole::Cashier;
    }

    public function update(User $user, Payment $payment): bool
    {
        return false;
    }

    public function delete(User $user, Payment $payment): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Payment $payment): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Payment $payment): bool
    {
        return false;
    }

    public function void(User $user, Payment $payment): bool
    {
        return (int) $user->gym_id === (int) $payment->gym_id
            && ($user->role === UserRole::Owner || $user->role === UserRole::Cashier);
    }
}
