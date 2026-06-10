<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom snapshot indikator skrining yang dipilih tiap orang tua,
     * agar dapat ditampilkan pada Halaman_Hasil dan Halaman_Cetak.
     */
    public function up(): void
    {
        Schema::table('screening_results', function (Blueprint $table) {
            $table->json('father_indicators')->nullable()->after('father_result');
            $table->json('mother_indicators')->nullable()->after('mother_result');
        });
    }

    public function down(): void
    {
        Schema::table('screening_results', function (Blueprint $table) {
            $table->dropColumn(['father_indicators', 'mother_indicators']);
        });
    }
};
