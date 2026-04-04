<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('membership_plan_id')->nullable()->constrained('membership_plans')->nullOnDelete()->after('member_id');
            $table->foreignId('membership_id')->nullable()->constrained('memberships')->nullOnDelete()->after('membership_plan_id');

            $table->index(['gym_id', 'membership_plan_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['gym_id', 'membership_plan_id', 'paid_at']);
            $table->dropConstrainedForeignId('membership_id');
            $table->dropConstrainedForeignId('membership_plan_id');
        });
    }
};
