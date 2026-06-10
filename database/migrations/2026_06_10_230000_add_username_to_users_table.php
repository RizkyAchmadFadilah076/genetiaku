<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('username')->nullable()->unique()->after('name');
            });
        }

        DB::table('users')
            ->whereNull('username')
            ->select(['id', 'name', 'email'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                $base = Str::slug((string) ($user->name ?: Str::before($user->email, '@')), '_');
                $base = $base !== '' ? $base : 'user';

                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => "{$base}_{$user->id}"]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            });
        }
    }
};
