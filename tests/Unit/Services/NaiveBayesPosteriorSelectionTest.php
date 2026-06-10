<?php

use App\Domain\PhenotypeCategory;
use App\Domain\PredictionOutcome;
use App\Domain\TrainingRow;
use App\Services\NaiveBayesClassifier;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Pool nilai kecil & tetap untuk membangun Data_Latih dan atribut masukan.
 * Pool dibuat ringkas (mayoritas berisi 2 nilai) agar banyak kombinasi
 * nilai-kelas pasti muncul lintas baris, sehingga skor posterior bervariasi
 * dan pemilihan argmax benar-benar diuji.
 */
const NB_P6_BLOOD = ['A', 'B'];
const NB_P6_IRIS = ['Cokelat', 'Biru'];
const NB_P6_HAIR = ['Lurus', 'Keriting'];
const NB_P6_EAR = ['Menempel', 'Terpisah'];
// Atribut masukan father/mother_thalassemia memakai kategori Hasil_Skrining_Orang_Tua.
const NB_P6_THAL_INPUT = ['Normal', 'Carrier', 'Penderita'];
// Variabel keluaran baby_thalassemia_risk memakai kategori Risiko_Thalassemia_Bayi.
const NB_P6_THAL_RISK = ['Minor', 'Intermedia', 'Mayor'];

/*
 * Urutan 10 atribut masukan, dipakai konsisten saat memilih nilai input dari
 * nilai yang sudah teramati pada Data_Latih (menjamin tidak ada
 * InvalidAttributeException).
 */
const NB_P6_INPUT_ATTRS = [
    'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
    'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
];

/*
 * Pemetaan variabel keluaran -> kunci PhenotypeCategory pada PredictionOutcome::$physical.
 * baby_thalassemia_risk ditangani terpisah lewat PredictionOutcome::$thalassemiaRisk.
 */
const NB_P6_PHYSICAL_KEY = [
    'baby_blood' => 'Golongan Darah',      // PhenotypeCategory::GolonganDarah
    'baby_iris' => 'Warna Iris Mata',      // PhenotypeCategory::WarnaIris
    'baby_hair' => 'Tekstur Rambut',       // PhenotypeCategory::TeksturRambut
    'baby_ear' => 'Bentuk Cuping Telinga', // PhenotypeCategory::BentukCuping
];

// Feature: genetikaku-expert-system, Property 6: Prediksi memilih kelas dengan posterior maksimum
it('memilih kelas dengan skor posterior maksimum untuk setiap variabel keluaran', function () {
    $classifier = new NaiveBayesClassifier();

    $this->forAll(
        // Data_Latih: sekuens baris, tiap baris = tuple 15 nilai (10 atribut
        // masukan + 5 variabel keluaran) dari pool tetap.
        Generator\seq(Generator\tuple(
            Generator\elements(...NB_P6_BLOOD),       // father_blood
            Generator\elements(...NB_P6_IRIS),        // father_iris
            Generator\elements(...NB_P6_HAIR),        // father_hair
            Generator\elements(...NB_P6_EAR),         // father_ear
            Generator\elements(...NB_P6_THAL_INPUT),  // father_thalassemia
            Generator\elements(...NB_P6_BLOOD),       // mother_blood
            Generator\elements(...NB_P6_IRIS),        // mother_iris
            Generator\elements(...NB_P6_HAIR),        // mother_hair
            Generator\elements(...NB_P6_EAR),         // mother_ear
            Generator\elements(...NB_P6_THAL_INPUT),  // mother_thalassemia
            Generator\elements(...NB_P6_BLOOD),       // baby_blood
            Generator\elements(...NB_P6_IRIS),        // baby_iris
            Generator\elements(...NB_P6_HAIR),        // baby_hair
            Generator\elements(...NB_P6_EAR),         // baby_ear
            Generator\elements(...NB_P6_THAL_RISK),   // baby_thalassemia_risk
        )),
        // Indeks pemilihan nilai untuk 10 atribut masukan; dimodulo terhadap
        // jumlah nilai teramati per atribut agar input selalu valid (terdaftar).
        Generator\tuple(...array_fill(0, 10, Generator\choose(0, 99))),
    )->then(function (array $rows, array $inputSelectors) use ($classifier) {
        // Jamin Data_Latih tidak kosong (Property 6 mensyaratkan non-empty).
        if ($rows === []) {
            $rows = [['A', 'Cokelat', 'Lurus', 'Menempel', 'Normal',
                'B', 'Biru', 'Keriting', 'Terpisah', 'Carrier',
                'A', 'Cokelat', 'Lurus', 'Menempel', 'Minor']];
        }

        $fields = [
            'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
            'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
            'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
        ];

        $training = [];
        foreach ($rows as $row) {
            $training[] = TrainingRow::fromArray(array_combine($fields, $row));
        }

        // Kumpulkan nilai teramati per atribut masukan (urutan stabil), lalu
        // bangun input valid dengan memilih salah satu nilai teramati.
        $observed = [];
        foreach ($training as $trainingRow) {
            foreach ($trainingRow->inputAttributes() as $attribute => $value) {
                if (! in_array($value, $observed[$attribute] ?? [], true)) {
                    $observed[$attribute][] = $value;
                }
            }
        }

        $input = [];
        foreach (NB_P6_INPUT_ATTRS as $i => $attribute) {
            $values = $observed[$attribute];
            $input[$attribute] = $values[$inputSelectors[$i] % count($values)];
        }

        $outcome = $classifier->predict($input, $training);

        expect($outcome)->toBeInstanceOf(PredictionOutcome::class);

        // Kelas terpilih per variabel keluaran (4 fisik + risiko thalassemia).
        $selected = [
            'baby_blood' => $outcome->physical[PhenotypeCategory::GolonganDarah->value],
            'baby_iris' => $outcome->physical[PhenotypeCategory::WarnaIris->value],
            'baby_hair' => $outcome->physical[PhenotypeCategory::TeksturRambut->value],
            'baby_ear' => $outcome->physical[PhenotypeCategory::BentukCuping->value],
            'baby_thalassemia_risk' => $outcome->thalassemiaRisk->value,
        ];

        $tolerance = 1e-9;

        foreach ($outcome->probabilities as $variable => $classScores) {
            $predictedClass = $selected[$variable];

            // Kelas terpilih harus punya skor pada variabel ini.
            expect($classScores)->toHaveKey($predictedClass);

            $predictedScore = $classScores[$predictedClass];
            $maxScore = max($classScores);

            // Argmax dipertahankan di bawah normalisasi: kelas terpilih adalah argmax.
            expect($predictedScore)->toBeGreaterThanOrEqual($maxScore - $tolerance);

            // Skor kelas terpilih >= skor setiap kelas lain pada variabel ini (Req 3.6).
            foreach ($classScores as $score) {
                expect($predictedScore)->toBeGreaterThanOrEqual($score - $tolerance);
            }
        }
    });
})->group('pbt');
