<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->string('tier', 20)->default('standard')->after('name');
            $table->index(['gym_id', 'tier']);
        });
    }

    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropIndex(['gym_id', 'tier']);
            $table->dropColumn('tier');
        });
    }
};
