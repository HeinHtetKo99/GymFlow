<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereIn('id', function ($q) {
                $q->select('owner_user_id')->from('gyms')->whereNotNull('owner_user_id');
            })
            ->update(['role' => 'owner']);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role', 'owner')
            ->update(['role' => 'cashier']);
    }
};

