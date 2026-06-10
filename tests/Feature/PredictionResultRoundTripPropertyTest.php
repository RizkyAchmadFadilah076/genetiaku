<?php

use App\Domain\PhenotypeCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\PredictionResult;
use App\Models\ScreeningResult;
use Eris\Generator;
use Eris\TestTrait;
use Tests\RefreshDatabaseWithoutSeeding;

uses(TestTrait::class, RefreshDatabaseWithoutSeeding::class);

/*
 * Property 2 (report-alignment) menguji invarian round-trip penyimpanan
 * Risiko_Thalassemia_Bayi pada Hasil_Prediksi (Req 4.1, 1.4, 7.1, 7.2):
 * untuk ThalassemiaRisk apa pun beserta hasil fisik dan probabilitas yang
 * valid, menyimpan sebuah PredictionResult lalu memuatnya kembali dari
 * penyimpanan HARUS mengembalikan thalassemia_risk yang identik, dan nilainya
 * selalu salah satu dari Istilah_Laporan {Minor, Intermedia, Mayor} — nilai
 * yang sama inilah yang diteruskan ke Halaman_Hasil dan Halaman_Cetak.
 *
 * Pendekatan (Pest + Eris, lewat model Eloquent PredictionResult):
 *   - Bangkitkan map fisik acak: keempat kategori PhenotypeCategory
 *     ('Golongan Darah', 'Warna Iris Mata', 'Tekstur Rambut',
 *     'Bentuk Cuping Telinga') => nilai string acak non-kosong.
 *   - Bangkitkan risiko Thalassemia acak dari ThalassemiaRisk
 *     (Minor|Intermedia|Mayor).
 *   - Bangkitkan map probabilitas bersarang acak: variabel keluaran
 *     (baby_blood, baby_iris, baby_hair, baby_ear, baby_thalassemia_risk) =>
 *     (map kelas => float di [0,1]). Float dibangkitkan agar round-trip eksak
 *     (bilangan bulat dibagi penyebut tetap), sehingga perbandingan dalam tetap
 *     bermakna setelah serialisasi JSON.
 *   - Buat parent ScreeningResult lewat factory untuk memenuhi FK.
 *   - Simpan PredictionResult, lalu muat ulang instans baru dari basis data
 *     (PredictionResult::find) dan pastikan setiap field setara serta
 *     thalassemia_risk berdomain Istilah_Laporan.
 *
 * Prefiks unik PROP2_ dipakai untuk simbol lingkup-berkas guna menghindari
 * tabrakan simbol global dengan berkas tes lain.
 */

/**
 * Domain Istilah_Laporan untuk Risiko_Thalassemia_Bayi (Req 1.1, 1.3).
 *
 * @var list<string>
 */
const PROP2_RISK_DOMAIN = ['Minor', 'Intermedia', 'Mayor'];

/**
 * Variabel keluaran probabilitas pada Hasil_Prediksi (Req 4.3).
 *
 * @var list<string>
 */
const PROP2_PROBABILITY_VARIABLES = [
    'baby_blood',
    'baby_iris',
    'baby_hair',
    'baby_ear',
    'baby_thalassemia_risk',
];

/**
 * Generator nilai float di [0,1] yang round-trip eksak melalui JSON.
 *
 * Memilih pembilang bulat 0..N dengan penyebut tetap N sehingga nilai seperti
 * 0, 0.25, 1.0 tersimpan dan termuat persis sama (tanpa galat pembulatan).
 */
function prop2ExactProbabilityGenerator(): Generator
{
    $denominator = 20;

    return Generator\map(
        static fn (int $numerator): float => $numerator / $denominator,
        Generator\choose(0, $denominator),
    );
}

/**
 * Generator map kelas => float untuk satu variabel keluaran. Tiap variabel
 * mendapat beberapa kelas (2..4) dengan nama kelas acak non-kosong.
 */
function prop2ClassProbabilityMapGenerator(): Generator
{
    return Generator\map(
        static function (array $pairs): array {
            $map = [];
            foreach ($pairs as $index => [$class, $probability]) {
                // Pastikan kunci unik & non-kosong walau generator string bertabrakan.
                $key = $class === '' ? "class_{$index}" : $class;
                while (array_key_exists($key, $map)) {
                    $key .= "_{$index}";
                }
                $map[$key] = $probability;
            }

            return $map;
        },
        Generator\seq(
            Generator\tuple(
                Generator\string(),
                prop2ExactProbabilityGenerator(),
            ),
        ),
    );
}

/**
 * Generator map fisik: keempat kategori PhenotypeCategory => nilai string acak.
 */
function prop2PhysicalGenerator(): Generator
{
    $categories = array_map(
        static fn (PhenotypeCategory $category): string => $category->value,
        PhenotypeCategory::cases(),
    );

    return Generator\map(
        static function (array $values) use ($categories): array {
            $physical = [];
            foreach ($categories as $index => $category) {
                $value = $values[$index] ?? '';
                $physical[$category] = $value === '' ? "value_{$index}" : $value;
            }

            return $physical;
        },
        Generator\tuple(
            Generator\string(),
            Generator\string(),
            Generator\string(),
            Generator\string(),
        ),
    );
}

/**
 * Generator map probabilitas bersarang: setiap variabel keluaran => map kelas.
 */
function prop2ProbabilitiesGenerator(): Generator
{
    return Generator\map(
        static function (array $perVariable): array {
            $probabilities = [];
            foreach (PROP2_PROBABILITY_VARIABLES as $index => $variable) {
                $probabilities[$variable] = $perVariable[$index] ?? [];
            }

            return $probabilities;
        },
        Generator\tuple(
            prop2ClassProbabilityMapGenerator(),
            prop2ClassProbabilityMapGenerator(),
            prop2ClassProbabilityMapGenerator(),
            prop2ClassProbabilityMapGenerator(),
            prop2ClassProbabilityMapGenerator(),
        ),
    );
}

// Feature: report-alignment, Property 2: Risiko_Thalassemia_Bayi round-trip dan berdomain Istilah_Laporan
it('menyimpan lalu memuat Risiko_Thalassemia_Bayi mengembalikan nilai identik dan berdomain Istilah_Laporan', function () {
    // Eris default 100 iterasi (lihat Eris\TestTrait::$iterations).
    $this->forAll(
        prop2PhysicalGenerator(),
        Generator\elements(...ThalassemiaRisk::cases()),
        prop2ProbabilitiesGenerator(),
    )
        ->then(function (array $physical, ThalassemiaRisk $thalassemiaRisk, array $probabilities) {
            // Mulai dari state bersih tiap iterasi agar tabel terkontrol.
            PredictionResult::query()->delete();
            ScreeningResult::query()->delete();

            // Parent Hasil_Skrining untuk memenuhi FK screening_result_id.
            $screening = ScreeningResult::factory()->create();

            // Simpan Hasil_Prediksi yang dihitung.
            $saved = PredictionResult::create([
                'screening_result_id' => $screening->id,
                'physical_result' => $physical,
                'thalassemia_risk' => $thalassemiaRisk,
                'probabilities' => $probabilities,
            ]);

            // Muat ulang instans baru dari penyimpanan (bukan dari memori).
            $loaded = PredictionResult::find($saved->id);

            // Referensi Hasil_Skrining harus identik.
            expect($loaded->screening_result_id)->toBe($screening->id);

            // Struktur fisik harus setara secara mendalam.
            expect($loaded->physical_result)->toEqual($physical);

            // Risiko Thalassemia kembali sebagai enum yang sama (round-trip).
            expect($loaded->thalassemia_risk)->toBe($thalassemiaRisk);

            // Nilai tersimpan selalu berdomain Istilah_Laporan {Minor, Intermedia, Mayor}.
            expect($loaded->thalassemia_risk->value)->toBeIn(PROP2_RISK_DOMAIN);

            // Struktur probabilitas bersarang harus setara secara mendalam.
            expect($loaded->probabilities)->toEqual($probabilities);

            // Relasi belongsTo memuat Hasil_Skrining yang benar.
            expect($loaded->screeningResult->id)->toBe($screening->id);
        });
});
