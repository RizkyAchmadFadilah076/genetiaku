<?php

use App\Domain\ScreeningCategory;
use App\Domain\TrainingRow;
use App\Services\Exceptions\InvalidAttributeException;
use App\Services\NaiveBayesClassifier;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Pool nilai kecil & tetap untuk membangun Data_Latih yang valid. Prefiks unik
 * NB_P9_* sengaja dipakai agar tidak bentrok dengan const global pada file
 * property test Naive Bayes lain (mis. NB_BLOOD, NB_BLOODS) saat seluruh suite
 * dimuat bersama. Semua generator memakai closure inline (tanpa fungsi
 * top-level) demi alasan yang sama.
 */
const NB_P9_BLOOD = ['A', 'B', 'O'];
const NB_P9_IRIS = ['Cokelat', 'Hitam'];
const NB_P9_HAIR = ['Lurus', 'Keriting'];
const NB_P9_EAR = ['Menggantung', 'Menempel'];
const NB_P9_THAL_INPUT = ['Normal', 'Carrier', 'Penderita']; // ScreeningCategory
const NB_P9_THAL_RISK = ['Minor', 'Intermedia', 'Mayor'];    // ThalassemiaRisk

// Feature: genetikaku-expert-system, Property 9: Naive Bayes menolak nilai atribut tak terdaftar
it('menolak input dengan nilai atribut yang tidak terdaftar pada Data_Latih', function () {
    $classifier = new NaiveBayesClassifier();

    $this->limitTo(100)->forAll(
        // Data_Latih: urutan baris, tiap baris tuple 15 nilai dari pool tetap.
        Generator\seq(Generator\tuple(
            Generator\elements(...NB_P9_BLOOD),
            Generator\elements(...NB_P9_IRIS),
            Generator\elements(...NB_P9_HAIR),
            Generator\elements(...NB_P9_EAR),
            Generator\elements(...NB_P9_THAL_INPUT),
            Generator\elements(...NB_P9_BLOOD),
            Generator\elements(...NB_P9_IRIS),
            Generator\elements(...NB_P9_HAIR),
            Generator\elements(...NB_P9_EAR),
            Generator\elements(...NB_P9_THAL_INPUT),
            Generator\elements(...NB_P9_BLOOD),
            Generator\elements(...NB_P9_IRIS),
            Generator\elements(...NB_P9_HAIR),
            Generator\elements(...NB_P9_EAR),
            Generator\elements(...NB_P9_THAL_RISK),
        )),
        // Pemilih nilai input valid per 10 atribut masukan (modulo nilai teramati).
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
        // Atribut yang dikorupsi (indeks 0..9) divariasikan tiap iterasi.
        Generator\choose(0, 9),
        // Entropi untuk membentuk string nilai yang dijamin unik/tak terdaftar.
        Generator\choose(0, PHP_INT_MAX),
    )
        ->withMaxSize(40)
        ->then(function (array $rowTuples, array $selectors, int $corruptIndex, int $nonce) use ($classifier) {
            // Property mensyaratkan Data_Latih tidak kosong: jamin minimal satu baris.
            if ($rowTuples === []) {
                $rowTuples = [['A', 'Cokelat', 'Lurus', 'Menggantung', 'Normal', 'B', 'Hitam', 'Keriting', 'Menempel', 'Carrier', 'O', 'Cokelat', 'Lurus', 'Menempel', 'Minor']];
            }

            /** @var list<TrainingRow> $training */
            $training = array_map(
                static fn (array $t): TrainingRow => TrainingRow::fromArray([
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
                ]),
                $rowTuples,
            );

            // Himpunan nilai teramati per atribut masukan pada Data_Latih.
            $observed = [];
            foreach ($training as $row) {
                foreach ($row->inputAttributes() as $attribute => $value) {
                    $observed[$attribute][$value] = true;
                }
            }

            // Bangun base input valid: tiap nilai diambil dari nilai teramati.
            $inputAttributes = array_keys($training[0]->inputAttributes());
            $input = [];
            foreach ($inputAttributes as $idx => $attribute) {
                $values = array_keys($observed[$attribute]);
                $input[$attribute] = $values[$selectors[$idx] % count($values)];
            }

            // Korupsi satu atribut dengan nilai yang DIJAMIN tak terdaftar pada
            // Data_Latih untuk atribut tsb. Prefiks non-kategori + nonce unik
            // memastikan nilai ini juga bukan ScreeningCategory yang valid,
            // sehingga atribut thalassemia pun tetap ditolak.
            $corruptAttribute = $inputAttributes[$corruptIndex];
            $unregisteredValue = '__NB_P9_TAK_TERDAFTAR__'.$nonce.'_'.$corruptIndex;

            // Sanity prasyarat: nilai korup tidak muncul di Data_Latih maupun
            // sebagai kategori Hasil_Skrining_Orang_Tua.
            expect(isset($observed[$corruptAttribute][$unregisteredValue]))->toBeFalse();
            expect(ScreeningCategory::tryFrom($unregisteredValue))->toBeNull();

            $input[$corruptAttribute] = $unregisteredValue;

            // Req 3.1: predict() membatalkan perhitungan dengan melempar
            // InvalidAttributeException karena ada nilai atribut tak terdaftar.
            expect(fn () => $classifier->predict($input, $training))
                ->toThrow(InvalidAttributeException::class);
        });
});
