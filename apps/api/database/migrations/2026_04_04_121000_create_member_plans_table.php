<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->constrained('gyms')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('created_by_trainer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type');
            $table->longText('content')->default('');
            $table->timestamps();

            $table->unique(['gym_id', 'member_id', 'type']);
            $table->index(['gym_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_plans');
    }
};

