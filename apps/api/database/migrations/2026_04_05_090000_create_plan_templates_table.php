<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_id')->constrained('gyms')->cascadeOnDelete();
            $table->string('type');
            $table->string('name', 120);
            $table->longText('content')->default('');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['gym_id', 'type']);
            $table->unique(['gym_id', 'type', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_templates');
    }
};

