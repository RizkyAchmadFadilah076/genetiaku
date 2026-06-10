<?php

use App\Domain\PhenotypeCategory;
use App\Domain\PredictionOutcome;
use App\Domain\ThalassemiaRisk;
use App\Domain\TrainingRow;
use App\Services\NaiveBayesClassifier;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Property 8 menguji bahwa keluaran prediksi bersifat total: untuk setiap input
 * valid dan Data_Latih tidak kosong, PredictionOutcome memuat prediksi untuk
 * keempat kategori fisik dengan nilai yang terdaftar pada Data_Latih, dan
 * Risiko_Thalassemia_Bayi tepat satu dari {Minor, Intermedia, Mayor}.
 *
 * CATATAN simbol global: berkas property NB lain mendeklarasikan const/ fungsi
 * global (mis. NB_BLOODS, NB_OUTPUT_VARIABLES, nbTrainingRowGenerator()). Untuk
 * mencegah tabrakan saat seluruh suite Pest dimuat sekaligus, berkas ini hanya
 * memakai const ber-prefix unik NB_P8_* dan mendefinisikan generator sebagai
 * closure inline (tanpa fungsi global).
 */

// Pool nilai kecil & tetap untuk membangun Data_Latih dan atribut masukan.
const NB_P8_BLOOD = ['A', 'B', 'AB', 'O'];
const NB_P8_IRIS = ['Cokelat', 'Hitam', 'Biru'];
const NB_P8_HAIR = ['Lurus', 'Ikal', 'Keriting'];
const NB_P8_EAR = ['Menempel', 'Menggantung'];
// Atribut masukan father/mother_thalassemia memakai kategori Hasil_Skrining_Orang_Tua.
const NB_P8_THAL_INPUT = ['Normal', 'Carrier', 'Penderita'];
// Variabel keluaran baby_thalassemia_risk memakai kategori Risiko_Thalassemia_Bayi.
const NB_P8_THAL_RISK = ['Minor', 'Intermedia', 'Mayor'];

// Urutan 15 kolom satu baris training (10 atribut masukan + 5 variabel keluaran).
const NB_P8_FIELDS = [
    'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
    'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
    'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
];

// Pemetaan kunci PhenotypeCategory -> kolom baby_* yang bersesuaian pada Data_Latih.
const NB_P8_PHYSICAL_TO_COLUMN = [
    'Golongan Darah' => 'baby_blood',      // PhenotypeCategory::GolonganDarah
    'Warna Iris Mata' => 'baby_iris',      // PhenotypeCategory::WarnaIris
    'Tekstur Rambut' => 'baby_hair',       // PhenotypeCategory::TeksturRambut
    'Bentuk Cuping Telinga' => 'baby_ear', // PhenotypeCategory::BentukCuping
];

// Feature: genetikaku-expert-system, Property 8: Keluaran prediksi lengkap dan klasifikasi risiko bersifat total
it('menghasilkan prediksi lengkap empat kategori fisik dan klasifikasi risiko total', function () {
    $classifier = new NaiveBayesClassifier();

    // Generator satu baris Data_Latih (tuple 15 nilai dari pool tetap) — closure
    // inline agar tidak mendeklarasikan fungsi global.
    $rowGenerator = Generator\tuple(
        Generator\elements(...NB_P8_BLOOD),       // father_blood
        Generator\elements(...NB_P8_IRIS),        // father_iris
        Generator\elements(...NB_P8_HAIR),        // father_hair
        Generator\elements(...NB_P8_EAR),         // father_ear
        Generator\elements(...NB_P8_THAL_INPUT),  // father_thalassemia
        Generator\elements(...NB_P8_BLOOD),       // mother_blood
        Generator\elements(...NB_P8_IRIS),        // mother_iris
        Generator\elements(...NB_P8_HAIR),        // mother_hair
        Generator\elements(...NB_P8_EAR),         // mother_ear
        Generator\elements(...NB_P8_THAL_INPUT),  // mother_thalassemia
        Generator\elements(...NB_P8_BLOOD),       // baby_blood
        Generator\elements(...NB_P8_IRIS),        // baby_iris
        Generator\elements(...NB_P8_HAIR),        // baby_hair
        Generator\elements(...NB_P8_EAR),         // baby_ear
        Generator\elements(...NB_P8_THAL_RISK),   // baby_thalassemia_risk
    );

    $this->forAll(
        // Baris dasar menjamin Data_Latih tidak kosong; atribut masukannya
        // dipakai sebagai input valid (nilainya pasti terdaftar pada Data_Latih).
        Generator\map(
            fn (array $row): TrainingRow => TrainingRow::fromArray(array_combine(NB_P8_FIELDS, $row)),
            $rowGenerator,
        ),
        // Baris tambahan menambah variasi distribusi kelas/atribut (boleh 0..n).
        Generator\seq(Generator\map(
            fn (array $row): TrainingRow => TrainingRow::fromArray(array_combine(NB_P8_FIELDS, $row)),
            $rowGenerator,
        )),
    )->then(function (TrainingRow $baseRow, array $extraRows) use ($classifier) {
        /** @var list<TrainingRow> $training */
        $training = array_merge([$baseRow], $extraRows);

        // Data_Latih dijamin tidak kosong (minimal baris dasar).
        expect($training)->not->toBeEmpty();

        // Kumpulkan nilai teramati per kolom baby_* untuk verifikasi keanggotaan.
        $observedBaby = [];
        foreach ($training as $trainingRow) {
            foreach ($trainingRow->outputClasses() as $column => $value) {
                if (! in_array($value, $observedBaby[$column] ?? [], true)) {
                    $observedBaby[$column][] = $value;
                }
            }
        }

        // Input valid: atribut masukan baris dasar (nilainya muncul pada Data_Latih).
        $input = $baseRow->inputAttributes();

        $outcome = $classifier->predict($input, $training);

        expect($outcome)->toBeInstanceOf(PredictionOutcome::class);

        // Req 4.1: keempat kategori fisik hadir, tidak null, dan nilainya
        // terdaftar pada kolom baby_* yang bersesuaian di Data_Latih.
        $expectedKeys = [
            PhenotypeCategory::GolonganDarah->value,
            PhenotypeCategory::WarnaIris->value,
            PhenotypeCategory::TeksturRambut->value,
            PhenotypeCategory::BentukCuping->value,
        ];
        expect(array_keys($outcome->physical))->toEqualCanonicalizing($expectedKeys);

        foreach ($expectedKeys as $categoryKey) {
            expect($outcome->physical)->toHaveKey($categoryKey);

            $predictedValue = $outcome->physical[$categoryKey];
            expect($predictedValue)->not->toBeNull();

            // Nilai terprediksi harus muncul pada kolom baby_* yang bersesuaian.
            $column = NB_P8_PHYSICAL_TO_COLUMN[$categoryKey];
            expect($observedBaby[$column])->toContain($predictedValue);
        }

        // Req 4.2: Risiko_Thalassemia_Bayi tepat satu dari {Minor, Intermedia, Mayor}.
        expect($outcome->thalassemiaRisk)->toBeInstanceOf(ThalassemiaRisk::class);
        expect(ThalassemiaRisk::cases())->toContain($outcome->thalassemiaRisk);
        expect(NB_P8_THAL_RISK)->toContain($outcome->thalassemiaRisk->value);
    });
})->group('pbt');
