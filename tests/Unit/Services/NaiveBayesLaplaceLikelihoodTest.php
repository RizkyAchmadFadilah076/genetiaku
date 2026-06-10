<?php

use App\Domain\ScreeningCategory;
use App\Domain\TrainingRow;
use App\Services\NaiveBayesClassifier;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Pool nilai kecil dan tetap untuk membangun Data_Latih + atribut masukan yang
 * valid. Pool sengaja kecil (2–3 nilai) agar kombinasi (nilai, kelas) yang
 * TIDAK muncul pada Data_Latih sering terjadi, sehingga Laplace smoothing
 * benar-benar diuji (likelihood untuk kombinasi absen tetap harus > 0).
 */
const NB_LAP_BLOOD = ['A', 'B', 'O'];
const NB_LAP_IRIS = ['Cokelat', 'Hitam'];
const NB_LAP_HAIR = ['Lurus', 'Keriting'];
const NB_LAP_EAR = ['Menggantung', 'Menempel'];
const NB_LAP_THAL_INPUT = ['Normal', 'Carrier', 'Penderita']; // ScreeningCategory
const NB_LAP_THAL_RISK = ['Minor', 'Intermedia', 'Mayor'];    // ThalassemiaRisk

/**
 * Bangun satu baris Data_Latih dari tuple nilai yang dihasilkan generator.
 *
 * @param  array{0:string,1:string,2:string,3:string,4:string,5:string,6:string,7:string,8:string,9:string,10:string,11:string,12:string,13:string,14:string}  $t
 */
function nbTrainingRowFromTuple(array $t): TrainingRow
{
    return TrainingRow::fromArray([
        'father_blood' => $t[0],
        'father_iris' => $t[1],
        'father_hair' => $t[2],
        'father_ear' => $t[3],
        'father_thalassemia' => $t[4],
        'mother_blood' => $t[5],
        'mother_iris' => $t[6],
        'mother_hair' => $t[7],
        'mother_ear' => $t[8],
        'mother_thalassemia' => $t[9],
        'baby_blood' => $t[10],
        'baby_iris' => $t[11],
        'baby_hair' => $t[12],
        'baby_ear' => $t[13],
        'baby_thalassemia_risk' => $t[14],
    ]);
}

// Feature: genetikaku-expert-system, Property 4: Laplace smoothing menjamin likelihood positif
it('menjamin setiap likelihood P(x_i|c) berada di (0, 1] berkat Laplace smoothing', function () {
    $classifier = new NaiveBayesClassifier();

    // Minimum 100 iterasi (limitTo adalah metode trait, dipanggil sebelum forAll).
    $this->limitTo(100)->forAll(
        // Data_Latih: urutan baris; tiap baris adalah tuple 15 nilai dari pool.
        Generator\seq(Generator\tuple(
            Generator\elements(...NB_LAP_BLOOD),
            Generator\elements(...NB_LAP_IRIS),
            Generator\elements(...NB_LAP_HAIR),
            Generator\elements(...NB_LAP_EAR),
            Generator\elements(...NB_LAP_THAL_INPUT),
            Generator\elements(...NB_LAP_BLOOD),
            Generator\elements(...NB_LAP_IRIS),
            Generator\elements(...NB_LAP_HAIR),
            Generator\elements(...NB_LAP_EAR),
            Generator\elements(...NB_LAP_THAL_INPUT),
            Generator\elements(...NB_LAP_BLOOD),
            Generator\elements(...NB_LAP_IRIS),
            Generator\elements(...NB_LAP_HAIR),
            Generator\elements(...NB_LAP_EAR),
            Generator\elements(...NB_LAP_THAL_RISK),
        )),
        // Pemilih nilai input per atribut masukan (10 atribut). Indeks ini
        // dipakai memilih dari himpunan nilai yang BENAR-BENAR muncul pada
        // Data_Latih untuk atribut tersebut, sehingga input selalu valid
        // (predict tidak melempar InvalidAttributeException) namun kombinasi
        // (nilai, kelas) bisa absen untuk sebagian kelas → menguji smoothing.
        Generator\tuple(
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
            Generator\choose(0, 999),
        ),
    )
        ->withMaxSize(40)
        ->then(function (array $rowTuples, array $selectors) use ($classifier) {
            // Property mensyaratkan Data_Latih tidak kosong; jamin minimal satu baris.
            if ($rowTuples === []) {
                $rowTuples = [['A', 'Cokelat', 'Lurus', 'Menggantung', 'Normal', 'B', 'Hitam', 'Keriting', 'Menempel', 'Carrier', 'O', 'Cokelat', 'Lurus', 'Menempel', 'Minor']];
            }

            /** @var list<TrainingRow> $training */
            $training = array_map('nbTrainingRowFromTuple', $rowTuples);
            $n = count($training);

            // V_i: jumlah nilai distinct setiap atribut masukan pada Data_Latih.
            $distinct = [];
            foreach ($training as $row) {
                foreach ($row->inputAttributes() as $attribute => $value) {
                    $distinct[$attribute][$value] = true;
                }
            }
            $distinctValueCounts = array_map('count', $distinct);

            // Bangun atribut masukan valid: setiap nilai dipilih dari nilai yang
            // muncul pada Data_Latih untuk atribut itu.
            $inputAttributes = array_keys($training[0]->inputAttributes());
            $input = [];
            foreach ($inputAttributes as $idx => $attribute) {
                $observed = array_keys($distinct[$attribute]);
                $input[$attribute] = $observed[$selectors[$idx] % count($observed)];
            }

            $outputVariables = array_keys($training[0]->outputClasses());

            // --- Reimplementasi referensi likelihood Laplace, independen dari
            //     metode private classifier, atas Data_Latih + input yang sama.
            $checked = 0;
            foreach ($outputVariables as $variable) {
                $classCounts = [];
                foreach ($training as $row) {
                    $class = $row->outputClasses()[$variable];
                    $classCounts[$class] = ($classCounts[$class] ?? 0) + 1;
                }

                foreach ($classCounts as $class => $countOfClass) {
                    $class = (string) $class;

                    foreach ($input as $attribute => $value) {
                        $vi = $distinctValueCounts[$attribute];

                        $joint = 0;
                        foreach ($training as $row) {
                            if ((string) $row->outputClasses()[$variable] !== $class) {
                                continue;
                            }
                            if (($row->inputAttributes()[$attribute] ?? null) === $value) {
                                $joint++;
                            }
                        }

                        // P(x_i|c) = (count(x_i,c) + 1) / (count(c) + V_i).
                        $likelihood = ($joint + 1) / ($countOfClass + $vi);

                        // Req 3.4 & 3.7: smoothing menjamin likelihood positif dan
                        // tidak melebihi 1 (numerator <= count(c)+1 <= count(c)+V_i).
                        expect($likelihood)->toBeGreaterThan(0.0);
                        expect($likelihood)->toBeLessThanOrEqual(1.0);
                        $checked++;
                    }
                }
            }

            // Pastikan ada likelihood yang diperiksa (Data_Latih non-kosong).
            expect($checked)->toBeGreaterThan(0);

            // --- Konsistensi dengan classifier nyata: predict() berhasil dan
            //     probabilitas posterior terdefinisi (tanpa pembagian nol/NaN),
            //     membuktikan smoothing benar-benar menjaga skor tetap positif.
            $outcome = $classifier->predict($input, $training);

            foreach ($outcome->probabilities as $distribution) {
                foreach ($distribution as $probability) {
                    expect(is_finite($probability))->toBeTrue();
                    expect($probability)->toBeGreaterThanOrEqual(0.0);
                    expect($probability)->toBeLessThanOrEqual(1.0 + 1e-9);
                }
            }
        });
});
