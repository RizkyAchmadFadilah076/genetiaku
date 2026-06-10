<?php

use App\Domain\PhenotypeCategory;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\Phenotype;
use App\Models\TrainingData;
use App\Models\User;
use Database\Factories\PhenotypeFactory;
use Eris\Generator;
use Eris\TestTrait;
use Tests\RefreshDatabaseWithoutSeeding;

uses(TestTrait::class, RefreshDatabaseWithoutSeeding::class);

/*
 * Property 13 menguji bahwa penyimpanan baris Data_Latih MENOLAK nilai atribut
 * yang tidak terdaftar pada Data_Fenotipe maupun pada kategori
 * Hasil_Skrining_Orang_Tua / Risiko_Thalassemia_Bayi yang valid (Req 14.3).
 *
 * Pendekatan (feature-level, melalui seam validasi
 * App\Http\Requests\Admin\TrainingDataRequest via route admin.data-latih.store):
 *   - Seed himpunan Data_Fenotipe yang terkontrol (PhenotypeFactory::values).
 *   - Bangun payload baris VALID dari nilai fenotipe + kategori skrining/risiko.
 *   - Tiap iterasi: rusak SATU kolom acak dengan nilai yang dijamin TIDAK ada
 *     pada himpunan yang diizinkan untuk kolom tersebut (string unik berprefiks),
 *     lalu POST sebagai admin dan pastikan ada kesalahan validasi pada kolom itu
 *     SERTA tidak ada baris training_data yang tersimpan.
 *
 * Prefiks unik PROP13_ dipakai untuk simbol lingkup-berkas guna menghindari
 * tabrakan simbol global dengan berkas tes lain.
 */

// Seluruh kolom atribut Data_Latih yang harus tervalidasi terhadap registry.
const PROP13_COLUMNS = [
    'father_blood',
    'father_iris',
    'father_hair',
    'father_ear',
    'father_thalassemia',
    'mother_blood',
    'mother_iris',
    'mother_hair',
    'mother_ear',
    'mother_thalassemia',
    'baby_blood',
    'baby_iris',
    'baby_hair',
    'baby_ear',
    'baby_thalassemia_risk',
];

/**
 * Bangun payload baris Data_Latih yang sepenuhnya VALID dari Data_Fenotipe
 * terkontrol + kategori skrining/risiko yang valid.
 *
 * @return array<string, string>
 */
function prop13ValidPayload(): array
{
    $values = PhenotypeFactory::values();

    $blood = $values[PhenotypeCategory::GolonganDarah->value][0];
    $iris = $values[PhenotypeCategory::WarnaIris->value][0];
    $hair = $values[PhenotypeCategory::TeksturRambut->value][0];
    $ear = $values[PhenotypeCategory::BentukCuping->value][0];

    return [
        'father_blood' => $blood,
        'father_iris' => $iris,
        'father_hair' => $hair,
        'father_ear' => $ear,
        'father_thalassemia' => ScreeningCategory::Normal->value,
        'mother_blood' => $blood,
        'mother_iris' => $iris,
        'mother_hair' => $hair,
        'mother_ear' => $ear,
        'mother_thalassemia' => ScreeningCategory::Carrier->value,
        'baby_blood' => $blood,
        'baby_iris' => $iris,
        'baby_hair' => $hair,
        'baby_ear' => $ear,
        'baby_thalassemia_risk' => ThalassemiaRisk::Minor->value,
    ];
}

/**
 * Generator pasangan (indeks kolom yang dirusak, benih string acak) untuk
 * membentuk nilai korup. Indeks kolom bervariasi 0..14 agar SELURUH kolom
 * atribut tercakup lintas iterasi.
 *
 * @return callable
 */
function prop13CorruptionGenerator(): callable
{
    return Generator\tuple(
        Generator\choose(0, count(PROP13_COLUMNS) - 1),
        Generator\string(),
    );
}

/**
 * Hasilkan nilai korup yang DIJAMIN tidak terdaftar pada Data_Fenotipe maupun
 * kategori skrining/risiko valid. Prefiks + hash memastikan nilainya tidak
 * pernah sama dengan nilai pendek terdaftar mana pun (mis. 'A', 'Normal').
 */
function prop13CorruptValue(string $seed): string
{
    return 'PROP13_INVALID_'.md5($seed.'|'.microtime(true).'|'.random_int(0, PHP_INT_MAX));
}

// Feature: genetikaku-expert-system, Property 13: Data Latih menolak nilai di luar Data_Fenotipe/kategori skrining
it('menolak penyimpanan Data_Latih dengan nilai atribut di luar Data_Fenotipe/kategori skrining', function () {
    // Seed himpunan Data_Fenotipe terkontrol satu kali (stabil lintas iterasi).
    foreach (PhenotypeFactory::values() as $category => $values) {
        foreach ($values as $value) {
            Phenotype::factory()->create([
                'category' => $category,
                'value' => $value,
            ]);
        }
    }

    $admin = User::factory()->create(['role' => 'admin']);

    $this->forAll(
        prop13CorruptionGenerator(),
    )->then(function (array $corruption) use ($admin) {
        [$columnIndex, $seed] = $corruption;
        $column = PROP13_COLUMNS[$columnIndex];

        // Mulai dari state bersih tiap iterasi agar hitungan baris terkontrol.
        TrainingData::query()->delete();

        $payload = prop13ValidPayload();
        $payload[$column] = prop13CorruptValue($seed);

        $response = $this->actingAs($admin)->post(route('admin.data-latih.store'), $payload);

        // Nilai di luar registry harus ditolak dengan kesalahan validasi pada
        // kolom yang dirusak, dan tidak ada baris yang tersimpan.
        $response->assertSessionHasErrors([$column]);
        expect(TrainingData::query()->count())->toBe(0);
    });
});
