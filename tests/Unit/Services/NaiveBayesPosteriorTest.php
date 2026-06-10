<?php

use App\Domain\TrainingRow;
use App\Services\NaiveBayesClassifier;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Pool nilai kecil & tetap untuk setiap atribut. Dipilih kecil agar
 * kombinasi nilai-kelas sering tumpang tindih pada Data_Latih sehingga
 * perhitungan posterior benar-benar teruji (bukan sekadar Laplace murni).
 *
 * Atribut fenotipe (blood/iris/hair/ear) memakai pool fenotipe; atribut
 * thalassemia ayah/ibu memakai kategori Hasil_Skrining_Orang_Tua valid;
 * variabel keluaran baby_* memakai pool fenotipe + Risiko_Thalassemia_Bayi.
 */
const NB_POST_BLOOD = ['A', 'B', 'AB', 'O'];
const NB_POST_IRIS = ['Coklat', 'Hitam', 'Biru'];
const NB_POST_HAIR = ['Lurus', 'Ikal', 'Keriting'];
const NB_POST_EAR = ['Menempel', 'Menggantung'];
const NB_POST_THAL = ['Normal', 'Carrier', 'Penderita'];
const NB_POST_RISK = ['Minor', 'Intermedia', 'Mayor'];

/**
 * Implementasi referensi INDEPENDEN dari skor posterior tak ternormalisasi
 * lalu dinormalisasi, untuk satu variabel keluaran.
 *
 * Direplikasi persis dari rumus desain (design.md, NaiveBayesClassifier):
 *   prior      P(c)      = count(c) / N
 *   likelihood P(x_i|c)  = (count(x_i,c) + 1) / (count(c) + V_i)   (Laplace)
 *   posterior  score(c)  = P(c) * Π_i P(x_i|c)
 *   normalisasi          = score(c) / Σ_c score(c)
 *
 * V_i = jumlah nilai distinct atribut masukan i pada SELURUH Data_Latih
 * (dihitung sekali, dipakai untuk semua variabel keluaran — sama seperti
 * yang dilakukan classifier).
 *
 * @param  list<array<string,string>>  $rows   baris Data_Latih (array mentah)
 * @param  array<string,string>  $input        atribut masukan
 * @param  array<string,int>  $distinctCounts  V_i per atribut masukan
 * @return array<string,float>  map kelas => probabilitas posterior ternormalisasi
 */
function referenceNormalizedPosterior(array $rows, string $variable, array $input, array $distinctCounts): array
{
    $n = count($rows);

    // count(c) untuk variabel keluaran ini.
    $classCounts = [];
    foreach ($rows as $row) {
        $class = $row[$variable];
        $classCounts[$class] = ($classCounts[$class] ?? 0) + 1;
    }

    $scores = [];
    foreach ($classCounts as $class => $countOfClass) {
        $class = (string) $class;

        // Prior P(c).
        $score = $countOfClass / $n;

        // Π_i likelihood dengan Laplace smoothing.
        foreach ($input as $attribute => $value) {
            $vi = $distinctCounts[$attribute] ?? 0;

            $joint = 0;
            foreach ($rows as $row) {
                if ((string) $row[$variable] === $class && ($row[$attribute] ?? null) === $value) {
                    $joint++;
                }
            }

            $score *= ($joint + 1) / ($countOfClass + $vi);
        }

        $scores[$class] = $score;
    }

    // Normalisasi. Karena normalisasi adalah pembagian seluruh skor dengan
    // jumlah yang sama (monoton), mencocokkan distribusi posterior
    // ternormalisasi yang diturunkan dari prior×Πlikelihood membuktikan
    // posterior classifier = prior × hasil kali likelihood (Req 3.5).
    $sum = array_sum($scores);
    $normalized = [];
    foreach ($scores as $class => $score) {
        $normalized[(string) $class] = $sum > 0.0 ? $score / $sum : 0.0;
    }

    return $normalized;
}

/** Atribut masukan (urutan & kunci sama dengan TrainingRow::inputAttributes()). */
const NB_POST_INPUT_ATTRIBUTES = [
    'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
    'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
];

/** Variabel keluaran (sama dengan TrainingRow::outputClasses()). */
const NB_POST_OUTPUT_VARIABLES = ['baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk'];

// Feature: genetikaku-expert-system, Property 5: Posterior sama dengan prior dikali hasil kali likelihood
it('menghasilkan posterior sama dengan prior dikali hasil kali likelihood', function () {
    $classifier = new NaiveBayesClassifier();

    // Generator satu baris Data_Latih: 15 field dari pool nilai tetap.
    $rowGenerator = Generator\tuple(
        Generator\elements(...NB_POST_BLOOD),   // father_blood
        Generator\elements(...NB_POST_IRIS),    // father_iris
        Generator\elements(...NB_POST_HAIR),    // father_hair
        Generator\elements(...NB_POST_EAR),     // father_ear
        Generator\elements(...NB_POST_THAL),    // father_thalassemia
        Generator\elements(...NB_POST_BLOOD),   // mother_blood
        Generator\elements(...NB_POST_IRIS),    // mother_iris
        Generator\elements(...NB_POST_HAIR),    // mother_hair
        Generator\elements(...NB_POST_EAR),     // mother_ear
        Generator\elements(...NB_POST_THAL),    // mother_thalassemia
        Generator\elements(...NB_POST_BLOOD),   // baby_blood
        Generator\elements(...NB_POST_IRIS),    // baby_iris
        Generator\elements(...NB_POST_HAIR),    // baby_hair
        Generator\elements(...NB_POST_EAR),     // baby_ear
        Generator\elements(...NB_POST_RISK),    // baby_thalassemia_risk
    );

    $this->forAll(
        Generator\seq($rowGenerator),
        Generator\choose(0, 1000), // indeks pemilih baris untuk dijadikan input
    )->then(function (array $tuples, int $pick) use ($classifier) {
        // Rakit baris Data_Latih (array asosiatif) dari tuple generator.
        $keys = [
            'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
            'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
            'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
        ];

        $rows = array_map(static fn (array $t): array => array_combine($keys, $t), $tuples);

        // Jamin Data_Latih tidak kosong (Property 5 disyaratkan untuk Data_Latih
        // tidak kosong; predict() melempar exception bila kosong).
        if ($rows === []) {
            $rows = [array_combine($keys, [
                'A', 'Coklat', 'Lurus', 'Menempel', 'Normal',
                'B', 'Hitam', 'Ikal', 'Menggantung', 'Carrier',
                'AB', 'Biru', 'Keriting', 'Menempel', 'Minor',
            ])];
        }

        // Input diambil dari salah satu baris Data_Latih -> dijamin setiap nilai
        // atribut masukan terdaftar, sehingga predict() tidak melempar
        // InvalidAttributeException (input valid sesuai Req 3.1).
        $source = $rows[$pick % count($rows)];
        $input = [];
        foreach (NB_POST_INPUT_ATTRIBUTES as $attribute) {
            $input[$attribute] = $source[$attribute];
        }

        // V_i: jumlah nilai distinct tiap atribut masukan pada seluruh Data_Latih.
        $distinctCounts = [];
        foreach (NB_POST_INPUT_ATTRIBUTES as $attribute) {
            $values = [];
            foreach ($rows as $row) {
                $values[$row[$attribute]] = true;
            }
            $distinctCounts[$attribute] = count($values);
        }

        $training = array_map(TrainingRow::fromArray(...), $rows);
        $outcome = $classifier->predict($input, $training);

        // Untuk SETIAP variabel keluaran (4 fisik + risiko thalassemia),
        // posterior ternormalisasi classifier harus sama dengan referensi
        // independen prior×Πlikelihood (lalu dinormalisasi).
        foreach (NB_POST_OUTPUT_VARIABLES as $variable) {
            $expected = referenceNormalizedPosterior($rows, $variable, $input, $distinctCounts);
            $actual = $outcome->probabilities[$variable];

            expect(array_keys($actual))->toEqualCanonicalizing(array_keys($expected));

            foreach ($expected as $class => $probability) {
                expect(abs($actual[$class] - $probability))->toBeLessThan(1e-9);
            }
        }
    });
});
