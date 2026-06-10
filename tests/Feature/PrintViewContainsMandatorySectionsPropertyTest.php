<?php

use App\Domain\PhenotypeCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\PredictionResult;
use App\Models\ScreeningResult;
use Eris\Generator;
use Eris\TestTrait;
use Inertia\Testing\AssertableInertia;
use Tests\RefreshDatabaseWithoutSeeding;

uses(TestTrait::class, RefreshDatabaseWithoutSeeding::class);

/*
 * Property 17 menguji bahwa tampilan cetak Hasil_Prediksi memuat seluruh bagian
 * wajib (Req 5.2), di level rute/HTTP + Inertia.
 *
 * Route: GET /prediksi/{predictionResult}/cetak (name 'prediksi.print'),
 * tanpa guard skrining — sebuah Hasil_Prediksi tersimpan dapat dicetak
 * kapan pun berdasarkan id-nya. Controller PredictionController@print merender
 * komponen Inertia 'public/prediction/print' dengan props:
 *   - physical        : map kategori PhenotypeCategory => nilai (Req 5.2)
 *   - thalassemiaRisk  : Risiko_Thalassemia_Bayi (Minor|Intermedia|Mayor) (Req 5.2)
 *   - probabilities    : map variabel keluaran => (map kelas => float) (Req 5.2)
 *   - education        : { result_explanation, thalassemia_info, follow_up_advice } (Req 5.2)
 *   - disclaimer       : pernyataan penyangkalan (Req 5.2)
 *
 * Untuk sembarang Hasil_Prediksi tersimpan, tampilan cetak HARUS memuat KELIMA
 * bagian wajib tersebut, masing-masing hadir dan non-kosong. Properti ini
 * memvalidasi di level props/data Inertia (AssertableInertia) karena isi cetak
 * sepenuhnya digerakkan oleh props ini.
 *
 * Pendekatan (Pest + Eris, feature-level):
 *   - Bangkitkan Hasil_Prediksi yang bervariasi: nilai fisik acak untuk keempat
 *     kategori, Risiko_Thalassemia_Bayi acak, dan map probabilitas bersarang
 *     acak; simpan via PredictionResultFactory (yang juga membuat parent
 *     ScreeningResult terkait, memenuhi FK).
 *   - GET route('prediksi.print', $prediction); pastikan HTTP 200 dan komponen
 *     'public/prediction/print', lalu pastikan SEMUA bagian wajib hadir & non-kosong.
 *   - Reset tabel antar-iterasi agar state terkontrol & performa terjaga.
 *
 * Prefiks unik PROP17_ dipakai untuk simbol lingkup-berkas guna menghindari
 * tabrakan simbol global dengan berkas tes lain.
 */

/**
 * Variabel keluaran probabilitas pada Hasil_Prediksi (Req 4.3).
 *
 * @var list<string>
 */
const PROP17_PROBABILITY_VARIABLES = [
    'baby_blood',
    'baby_iris',
    'baby_hair',
    'baby_ear',
    'baby_thalassemia_risk',
];

/**
 * Generator nilai fisik: keempat kategori PhenotypeCategory => nilai string
 * non-kosong acak. String kosong digantikan fallback deterministik agar setiap
 * kategori selalu memiliki nilai non-kosong.
 */
function prop17PhysicalGenerator(): Generator
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
 * Generator map probabilitas bersarang: setiap variabel keluaran => map kelas
 * (2..3 kelas) dengan nilai float di [0,1]. Selalu non-kosong.
 */
function prop17ProbabilitiesGenerator(): Generator
{
    return Generator\map(
        static function (int $seed): array {
            $probabilities = [];
            foreach (PROP17_PROBABILITY_VARIABLES as $vIndex => $variable) {
                $classCount = 2 + ($seed % 2); // 2 atau 3 kelas
                $map = [];
                for ($c = 0; $c < $classCount; $c++) {
                    $map["class_{$c}"] = round((($seed + $c + $vIndex) % 100) / 100, 4);
                }
                $probabilities[$variable] = $map;
            }

            return $probabilities;
        },
        Generator\choose(0, 1000000),
    );
}

// Feature: genetikaku-expert-system, Property 17: Tampilan cetak memuat seluruh bagian wajib
it('tampilan cetak Hasil_Prediksi memuat seluruh bagian wajib', function () {
    // Nonaktifkan Vite agar render Inertia tidak bergantung pada aset terbuild.
    $this->withoutVite();

    // Eris default 100 iterasi (lihat Eris\TestTrait::$iterations).
    $this->forAll(
        prop17PhysicalGenerator(),
        Generator\elements(...ThalassemiaRisk::cases()),
        prop17ProbabilitiesGenerator(),
    )->then(function (array $physical, ThalassemiaRisk $thalassemiaRisk, array $probabilities) {
        // Mulai dari state bersih tiap iterasi agar tabel terkontrol & performan.
        PredictionResult::query()->delete();
        ScreeningResult::query()->delete();

        // Bangkitkan Hasil_Prediksi tersimpan yang bervariasi; factory juga
        // membuat parent ScreeningResult terkait (memenuhi FK).
        $prediction = PredictionResult::factory()->create([
            'physical_result' => $physical,
            'thalassemia_risk' => $thalassemiaRisk,
            'probabilities' => $probabilities,
        ]);

        $response = $this->get(route('prediksi.print', $prediction));
        $response->assertOk();

        $response->assertInertia(function (AssertableInertia $page) use ($physical, $thalassemiaRisk, $probabilities) {
            // Halaman React 'public/prediction/print' dibangun pada task 7.5;
            // properti ini memvalidasi kontrak prop, bukan keberadaan view.
            $page->component('public/prediction/print', false);

            $props = $page->toArray()['props'];

            // --- Bagian wajib 1: karakteristik fisik bayi (Req 5.2) ---
            $actualPhysical = $props['physical'] ?? null;
            expect($actualPhysical)->toBeArray();
            foreach (PhenotypeCategory::cases() as $category) {
                expect(array_key_exists($category->value, $actualPhysical))->toBeTrue();
                expect($actualPhysical[$category->value])->toBe($physical[$category->value]);
                expect($actualPhysical[$category->value])->not->toBe('');
            }

            // --- Bagian wajib 2: Risiko_Thalassemia_Bayi (Req 5.2) ---
            $actualRisk = $props['thalassemiaRisk'] ?? null;
            expect($actualRisk)->toBeString();
            expect($actualRisk)->not->toBe('');
            expect($actualRisk)->toBe($thalassemiaRisk->value);
            expect(in_array($actualRisk, ['Minor', 'Intermedia', 'Mayor'], true))->toBeTrue();

            // --- Bagian wajib 3: nilai probabilitas (Req 5.2) ---
            $actualProbabilities = $props['probabilities'] ?? null;
            expect($actualProbabilities)->toBeArray();
            expect($actualProbabilities)->not->toBeEmpty();
            expect($actualProbabilities)->toEqual($probabilities);

            // --- Bagian wajib 4: konten edukasi (Req 5.2) ---
            $education = $props['education'] ?? null;
            expect($education)->toBeArray();
            foreach (['result_explanation', 'thalassemia_info', 'follow_up_advice'] as $key) {
                expect(array_key_exists($key, $education))->toBeTrue();
                expect($education[$key])->toBeString();
                expect($education[$key])->not->toBe('');
            }

            // --- Bagian wajib 5: pernyataan penyangkalan/disclaimer (Req 5.2) ---
            $disclaimer = $props['disclaimer'] ?? null;
            expect($disclaimer)->toBeString();
            expect($disclaimer)->not->toBe('');
        });
    });
});
