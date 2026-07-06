<?php

namespace App\Support;

use App\Enums\MembershipTier;
use App\Models\Member;
use App\Models\Membership;
use Illuminate\Database\Eloquent\Builder;

final class PersonalTrainingAccess
{
    public static function tierFromPlan(?object $plan): MembershipTier
    {
        if ($plan === null) {
            return MembershipTier::Standard;
        }

        $raw = $plan->tier ?? MembershipTier::Standard->value;

        return MembershipTier::tryFrom((string) $raw) ?? MembershipTier::Standard;
    }

    public static function membershipIsActive(?Membership $membership): bool
    {
        if ($membership === null || $membership->ends_at === null) {
            return false;
        }

        if ($membership->ends_at->lte(now())) {
            return false;
        }

        return in_array($membership->status, ['active', 'canceling'], true);
    }

    public static function activeMembership(Member $member, int $gymId): ?Membership
    {
        $membership = Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->with(['plan:id,name,tier'])
            ->orderByDesc('ends_at')
            ->first();

        if (! self::membershipIsActive($membership)) {
            return null;
        }

        return $membership;
    }

    public static function coachingTier(Member $member, int $gymId): ?MembershipTier
    {
        $membership = self::activeMembership($member, $gymId);

        if ($membership === null) {
            return null;
        }

        $tier = self::tierFromPlan($membership->plan);

        return $tier->includesPersonalTraining() ? $tier : null;
    }

    public static function hasCoachingTier(Member $member, int $gymId): bool
    {
        return self::coachingTier($member, $gymId) !== null;
    }

    public static function canUsePersonalTraining(Member $member, int $gymId): bool
    {
        return self::hasCoachingTier($member, $gymId)
            && $member->assigned_trainer_user_id !== null;
    }

    /**
     * @param  Builder<Membership>  $query
     */
    public static function applyActiveCoachingMembershipConstraint(Builder $query, int $gymId): void
    {
        $query
            ->where('gym_id', $gymId)
            ->whereIn('status', ['active', 'canceling'])
            ->where('ends_at', '>', now())
            ->whereHas('plan', function (Builder $planQuery): void {
                $planQuery->whereIn('tier', [
                    MembershipTier::Silver->value,
                    MembershipTier::Gold->value,
                ]);
            });
    }

    /**
     * @param  Builder<Member>  $query
     */
    public static function scopeWithActiveCoachingTier(Builder $query, int $gymId): void
    {
        $query->whereHas('memberships', function (Builder $membershipQuery) use ($gymId): void {
            self::applyActiveCoachingMembershipConstraint($membershipQuery, $gymId);
        });
    }
}
