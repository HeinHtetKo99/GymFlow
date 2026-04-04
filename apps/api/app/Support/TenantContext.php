<?php

namespace App\Support;

use App\Models\Gym;

final class TenantContext
{
    private ?Gym $gym = null;

    public function setGym(Gym $gym): void
    {
        $this->gym = $gym;
    }

    public function gym(): ?Gym
    {
        return $this->gym;
    }

    public function gymId(): ?int
    {
        return $this->gym?->getKey();
    }
}
