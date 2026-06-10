<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Pemetaan_Istilah untuk Risiko_Thalassemia_Bayi (istilah lama => Istilah_Laporan).
     *
     * @var array<string, string>
     */
    private array $riskMap = [
        'Rendah' => 'Minor',
        'Sedang' => 'Intermedia',
        'Tinggi' => 'Mayor',
    ];

    /**
     * Pemetaan_Istilah untuk Hasil_Skrining_Orang_Tua (istilah lama => Istilah_Laporan).
     *
     * @var array<string, string>
     */
    private array $screeningMap = [
        'Berisiko Tinggi' => 'Penderita',
    ];

    /**
     * Run the migrations.
     *
     * Konversi nilai tersimpan ke Istilah_Laporan memakai query builder (BUKAN
     * model ber-cast), sehingga migrasi tidak terpengaruh definisi enum baru.
     * Bersifat idempoten: klausa WHERE hanya menyentuh baris bernilai istilah
     * lama, sehingga nilai yang sudah memakai Istilah_Laporan dibiarkan.
     */
    public function up(): void
    {
        // Risiko_Thalassemia_Bayi pada hasil prediksi.
        foreach ($this->riskMap as $old => $new) {
            DB::table('prediction_results')
                ->where('thalassemia_risk', $old)
                ->update(['thalassemia_risk' => $new]);
        }

        // Hasil_Skrining_Orang_Tua pada hasil skrining.
        foreach (['father_result', 'mother_result'] as $column) {
            foreach ($this->screeningMap as $old => $new) {
                DB::table('screening_results')
                    ->where($column, $old)
                    ->update([$column => $new]);
            }
        }

        // Hasil_Skrining_Orang_Tua pada Data_Latih.
        foreach (['father_thalassemia', 'mother_thalassemia'] as $column) {
            foreach ($this->screeningMap as $old => $new) {
                DB::table('training_data')
                    ->where($column, $old)
                    ->update([$column => $new]);
            }
        }

        // Risiko_Thalassemia_Bayi pada Data_Latih.
        foreach ($this->riskMap as $old => $new) {
            DB::table('training_data')
                ->where('baby_thalassemia_risk', $old)
                ->update(['baby_thalassemia_risk' => $new]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * Konversi terbalik dari Istilah_Laporan ke istilah lama. Juga idempoten.
     */
    public function down(): void
    {
        // Risiko_Thalassemia_Bayi pada hasil prediksi.
        foreach ($this->riskMap as $old => $new) {
            DB::table('prediction_results')
                ->where('thalassemia_risk', $new)
                ->update(['thalassemia_risk' => $old]);
        }

        // Hasil_Skrining_Orang_Tua pada hasil skrining.
        foreach (['father_result', 'mother_result'] as $column) {
            foreach ($this->screeningMap as $old => $new) {
                DB::table('screening_results')
                    ->where($column, $new)
                    ->update([$column => $old]);
            }
        }

        // Hasil_Skrining_Orang_Tua pada Data_Latih.
        foreach (['father_thalassemia', 'mother_thalassemia'] as $column) {
            foreach ($this->screeningMap as $old => $new) {
                DB::table('training_data')
                    ->where($column, $new)
                    ->update([$column => $old]);
            }
        }

        // Risiko_Thalassemia_Bayi pada Data_Latih.
        foreach ($this->riskMap as $old => $new) {
            DB::table('training_data')
                ->where('baby_thalassemia_risk', $new)
                ->update(['baby_thalassemia_risk' => $old]);
        }
    }
};
