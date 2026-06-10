<?php

namespace Database\Seeders;

use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@genetikaku.test'],
            [
                'name' => 'Admin GENETIKAKU',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
            ],
        );

        $this->call([
            PhenotypeSeeder::class,
            KnowledgeBaseSeeder::class,
            TrainingDataSeeder::class,
            ArticleSeeder::class,
            AboutSeeder::class,
        ]);

        
        MediaAsset::query()->updateOrCreate(
            ['key' => 'screening_illustration'],
            ['type' => 'image'],
        );
    }
}
