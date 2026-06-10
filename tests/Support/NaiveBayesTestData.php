<?php

/*
|--------------------------------------------------------------------------
| Shared Naive Bayes property-test data & generators
|--------------------------------------------------------------------------
|
| Beberapa property test Mesin_Naive_Bayes berbagi pool nilai fenotipe/kategori
| dan generator baris Data_Latih yang sama. Sebelumnya tiap berkas
| mendeklarasikan ulang konstanta global (NB_BLOODS, NB_IRIS, dst.) dan fungsi
| nbTrainingRowGenerator(), sehingga saat seluruh suite Pest dimuat bersama PHP
| memunculkan peringatan "Constant already defined" (dan berisiko fatal
| "Cannot redeclare function").
|
| Berkas ini mendefinisikan simbol bersama tersebut TEPAT SEKALI. Ia di-autoload
| oleh Composer (autoload-dev.files) sehingga tersedia untuk semua berkas test
| tanpa deklarasi ganda. Guard `defined()` / `function_exists()` membuatnya
| idempoten bila ikut termuat lebih dari sekali.
|
| Pool di bawah adalah pool kanonik milik NaiveBayesClassifierTest.php (Property 3)
| dan dipakai ulang oleh NaiveBayesPosteriorNormalizedTest.php (Property 7).
| Berkas property NB lain memakai pool ber-prefix unik miliknya sendiri
| (NB_LAP_*, NB_POST_*, NB_P6_*, NB_P8_*, NB_P9_*, NB_P10_*) dan TIDAK bergantung
| pada konstanta di sini.
*/

use App\Domain\TrainingRow;
use Eris\Generator;

/*
 * Pool nilai fenotipe & kategori sesuai Data_Fenotipe/kategori skrining.
 * Generator menarik nilai dari pool kecil tetap ini agar Data_Latih yang
 * dihasilkan realistis dan kombinasi kelas berulang (memunculkan distribusi
 * prior yang bermakna untuk diuji).
 */
defined('NB_BLOODS') || define('NB_BLOODS', ['A', 'B', 'AB', 'O']);
defined('NB_IRIS') || define('NB_IRIS', ['Cokelat', 'Hitam', 'Biru']);
defined('NB_HAIR') || define('NB_HAIR', ['Lurus', 'Ikal', 'Keriting']);
defined('NB_EAR') || define('NB_EAR', ['Menempel', 'Menggantung']);
defined('NB_THALASSEMIA') || define('NB_THALASSEMIA', ['Normal', 'Carrier', 'Penderita']); // ScreeningCategory values
defined('NB_RISK') || define('NB_RISK', ['Minor', 'Intermedia', 'Mayor']);

/*
 * Variabel keluaran Mesin_Naive_Bayes (lihat TrainingRow::outputClasses()).
 */
defined('NB_OUTPUT_VARIABLES') || define('NB_OUTPUT_VARIABLES', [
    'baby_blood',
    'baby_iris',
    'baby_hair',
    'baby_ear',
    'baby_thalassemia_risk',
]);

if (! function_exists('nbTrainingRowGenerator')) {
    /**
     * Generator Eris untuk satu baris Data_Latih (TrainingRow) dengan nilai
     * atribut diambil dari pool tetap di atas.
     */
    function nbTrainingRowGenerator(): Eris\Generator
    {
        return Generator\map(
            fn (array $v): TrainingRow => TrainingRow::fromArray([
                'father_blood' => $v[0],
                'father_iris' => $v[1],
                'father_hair' => $v[2],
                'father_ear' => $v[3],
                'father_thalassemia' => $v[4],
                'mother_blood' => $v[5],
                'mother_iris' => $v[6],
                'mother_hair' => $v[7],
                'mother_ear' => $v[8],
                'mother_thalassemia' => $v[9],
                'baby_blood' => $v[10],
                'baby_iris' => $v[11],
                'baby_hair' => $v[12],
                'baby_ear' => $v[13],
                'baby_thalassemia_risk' => $v[14],
            ]),
            Generator\tuple(
                Generator\elements(...NB_BLOODS),
                Generator\elements(...NB_IRIS),
                Generator\elements(...NB_HAIR),
                Generator\elements(...NB_EAR),
                Generator\elements(...NB_THALASSEMIA),
                Generator\elements(...NB_BLOODS),
                Generator\elements(...NB_IRIS),
                Generator\elements(...NB_HAIR),
                Generator\elements(...NB_EAR),
                Generator\elements(...NB_THALASSEMIA),
                Generator\elements(...NB_BLOODS),
                Generator\elements(...NB_IRIS),
                Generator\elements(...NB_HAIR),
                Generator\elements(...NB_EAR),
                Generator\elements(...NB_RISK),
            )
        );
    }
}
