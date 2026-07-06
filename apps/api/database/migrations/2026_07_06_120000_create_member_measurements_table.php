<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->constrained('gyms')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('recorded_at');
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->decimal('body_fat_percent', 5, 2)->nullable();
            $table->decimal('waist_cm', 6, 2)->nullable();
            $table->string('notes', 1000)->nullable();

            $table->timestamps();

            $table->index(['member_id', 'recorded_at']);
            $table->index(['gym_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_measurements');
    }
};
