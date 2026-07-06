<?php

namespace App\Enums;

enum MembershipTier: string
{
    case Standard = 'standard';
    case Silver = 'silver';
    case Gold = 'gold';

    public function includesPersonalTraining(): bool
    {
        return $this === self::Gold;
    }

    public function label(): string
    {
        return match ($this) {
            self::Standard => 'Standard',
            self::Silver => 'Silver',
            self::Gold => 'Gold',
        };
    }
}
