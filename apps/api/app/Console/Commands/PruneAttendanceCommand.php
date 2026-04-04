<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Gym;
use Illuminate\Console\Command;

final class PruneAttendanceCommand extends Command
{
    protected $signature = 'attendance:prune {--dry-run : Do not delete, only report counts}';
    protected $description = 'Deletes attendance records older than each gym retention setting.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $gyms = Gym::query()
            ->get(['id', 'attendance_retention_days']);

        $totalToDelete = 0;

        foreach ($gyms as $gym) {
            $days = (int) ($gym->attendance_retention_days ?? 90);
            if ($days <= 0) $days = 90;

            $cutoff = now()->subDays($days);

            $query = Attendance::query()
                ->where('gym_id', $gym->getKey())
                ->where('checked_in_at', '<', $cutoff);

            $count = (int) $query->count();
            $totalToDelete += $count;

            if ($count > 0) {
                $this->line("Gym {$gym->getKey()}: {$count} records older than {$days} days.");
            }

            if (! $dryRun && $count > 0) {
                $query->delete();
            }
        }

        $this->info(($dryRun ? 'Dry run: ' : '') . "Total pruned: {$totalToDelete}");

        return self::SUCCESS;
    }
}

