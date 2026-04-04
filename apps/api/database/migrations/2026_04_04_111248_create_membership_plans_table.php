<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->constrained('gyms')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('duration_days');
            $table->unsignedBigInteger('price_cents');
            $table->char('currency', 3)->default('USD');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['gym_id', 'is_active', 'sort_order']);
            $table->unique(['gym_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
