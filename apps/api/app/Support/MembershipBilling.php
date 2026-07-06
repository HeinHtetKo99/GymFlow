<?php

namespace App\Support;

use App\Enums\MembershipTier;
use App\Models\Member;
use App\Models\MemberPlan;
use App\Models\Membership;
use App\Models\MembershipPlan;
use Carbon\CarbonInterface;

final class MembershipBilling
{
    /**
     * @return array{
     *     starts_at: CarbonInterface,
     *     expire_current: bool,
     *     downgrade: bool
     * }
     */
    public static function resolveMembershipStart(
        ?Membership $current,
        MembershipPlan $newPlan,
        CarbonInterface $now,
    ): array {
        $newTier = PersonalTrainingAccess::tierFromPlan($newPlan);

        if ($current === null || $current->ends_at === null || $current->ends_at->lte($now)) {
            return [
                'starts_at' => $now,
                'expire_current' => false,
                'downgrade' => ! $newTier->includesPersonalTraining(),
            ];
        }

        if (! in_array($current->status, ['active', 'canceling'], true)) {
            return [
                'starts_at' => $now,
                'expire_current' => false,
                'downgrade' => ! $newTier->includesPersonalTraining(),
            ];
        }

        $currentTier = PersonalTrainingAccess::tierFromPlan($current->plan);

        if ($currentTier === $newTier) {
            return [
                'starts_at' => $current->ends_at->copy(),
                'expire_current' => false,
                'downgrade' => false,
            ];
        }

        return [
            'starts_at' => $now,
            'expire_current' => true,
            'downgrade' => ! $newTier->includesPersonalTraining()
                && $currentTier->includesPersonalTraining(),
        ];
    }

    public static function tierRank(MembershipTier $tier): int
    {
        return match ($tier) {
            MembershipTier::Standard => 0,
            MembershipTier::Silver => 1,
            MembershipTier::Gold => 2,
        };
    }

    public static function isUpgrade(MembershipTier $from, MembershipTier $to): bool
    {
        return self::tierRank($to) > self::tierRank($from);
    }

    public static function applyDowngradeSideEffects(Member $member, int $gymId): void
    {
        if ($member->assigned_trainer_user_id !== null) {
            $member->update(['assigned_trainer_user_id' => null]);
        }

        MemberPlan::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->delete();
    }
}
