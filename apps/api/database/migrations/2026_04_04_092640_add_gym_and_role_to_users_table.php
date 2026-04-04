<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('gym_id')->nullable()->constrained('gyms')->nullOnDelete()->after('id');
            $table->string('role')->default('member')->after('password');

            $table->index(['gym_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['gym_id', 'role']);
            $table->dropConstrainedForeignId('gym_id');
            $table->dropColumn('role');
        });
    }
};
