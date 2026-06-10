<?php

use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\TrainingData;
use Eris\Generator;
use Eris\TestTrait;
use Tests\RefreshDatabaseWithoutSeeding;

uses(TestTrait::class, RefreshDatabaseWithoutSeeding::class);

/*
 * Property 4 (report-alignment) menguji invarian round-trip penyimpanan baris
 * Data_Latih (Req 4.3): untuk baris Data_Latih yang nilai
 * father_thalassemia/mother_thalassemia-nya termasuk Istilah_Laporan
 * {Normal, Carrier, Penderita} dan baby_thalassemia_risk-nya termasuk
 * {Minor, Intermedia, Mayor}, menyimpan lalu memuat ulang baris tersebut HARUS
 * mengembalikan nilai kolom skrining + risiko tanpa perubahan.
 *
 * Pendekatan (Pest + Eris, lewat model Eloquent TrainingData):
 *   - Bangkitkan father_thalassemia/mother_thalassemia acak dari
 *     ScreeningCategory (Normal|Carrier|Penderita).
 *   - Bangkitkan baby_thalassemia_risk acak dari ThalassemiaRisk
 *     (Minor|Intermedia|Mayor).
 *   - Bangkitkan nilai fenotipe (blood/iris/hair/ear ayah, ibu, bayi) sebagai
 *     string non-kosong acak untuk memenuhi kolom NOT NULL tanpa memengaruhi
 *     invarian yang diuji.
 *   - Simpan via TrainingData::create([...]) lalu muat ulang instans baru dari
 *     basis data (TrainingData::find($id)) dan pastikan kolom skrining + risiko
 *     identik serta berdomain Istilah_Laporan.
 *
 * Prefiks unik PROP4_ dipakai untuk simbol lingkup-berkas guna menghindari
 * tabrakan simbol global dengan berkas tes lain.
 */

/**
 * Domain Istilah_Laporan untuk Hasil_Skrining_Orang_Tua (Req 2.1, 2.3).
 *
 * @var list<string>
 */
const PROP4_SCREENING_DOMAIN = ['Normal', 'Carrier', 'Penderita'];

/**
 * Domain Istilah_Laporan untuk Risiko_Thalassemia_Bayi (Req 1.1, 1.3).
 *
 * @var list<string>
 */
const PROP4_RISK_DOMAIN = ['Minor', 'Intermedia', 'Mayor'];

/**
 * Generator nilai fenotipe non-kosong (string) untuk memenuhi kolom NOT NULL
 * yang tidak termasuk invarian skrining/risiko yang diuji.
 */
function prop4PhenotypeGenerator(): Generator
{
    return Generator\map(
        static fn (string $value): string => $value === '' ? 'pheno' : $value,
        Generator\string(),
    );
}

// Feature: report-alignment, Property 4: Data_Latih round-trip dengan Istilah_Laporan
it('menyimpan lalu memuat baris Data_Latih mengembalikan kolom skrining dan risiko tanpa perubahan', function () {
    // Eris default 100 iterasi (lihat Eris\TestTrait::$iterations).
    $this->forAll(
        Generator\elements(...ScreeningCategory::cases()),
        Generator\elements(...ScreeningCategory::cases()),
        Generator\elements(...ThalassemiaRisk::cases()),
        // Delapan nilai fenotipe (ayah 4 + ibu 4) + empat keluaran fisik bayi.
        Generator\tuple(
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
            prop4PhenotypeGenerator(),
        ),
    )
        ->then(function (
            ScreeningCategory $fatherThalassemia,
            ScreeningCategory $motherThalassemia,
            ThalassemiaRisk $babyRisk,
            array $phenotypes,
        ) {
            [
                $fBlood, $fIris, $fHair, $fEar,
                $mBlood, $mIris, $mHair, $mEar,
                $bBlood, $bIris, $bHair, $bEar,
            ] = $phenotypes;

            // Mulai dari state bersih tiap iterasi agar tabel terkontrol.
            TrainingData::query()->delete();

            $fatherResult = $fatherThalassemia->value;
            $motherResult = $motherThalassemia->value;
            $riskValue = $babyRisk->value;

            // Simpan satu baris Data_Latih.
            $saved = TrainingData::create([
                'father_blood' => $fBlood,
                'father_iris' => $fIris,
                'father_hair' => $fHair,
                'father_ear' => $fEar,
                'father_thalassemia' => $fatherResult,

                'mother_blood' => $mBlood,
                'mother_iris' => $mIris,
                'mother_hair' => $mHair,
                'mother_ear' => $mEar,
                'mother_thalassemia' => $motherResult,

                'baby_blood' => $bBlood,
                'baby_iris' => $bIris,
                'baby_hair' => $bHair,
                'baby_ear' => $bEar,
                'baby_thalassemia_risk' => $riskValue,
            ]);

            // Muat ulang instans baru dari penyimpanan (bukan dari memori).
            $loaded = TrainingData::find($saved->id);

            // Kolom skrining + risiko harus identik (round-trip).
            expect($loaded->father_thalassemia)->toBe($fatherResult);
            expect($loaded->mother_thalassemia)->toBe($motherResult);
            expect($loaded->baby_thalassemia_risk)->toBe($riskValue);

            // Dan berdomain Istilah_Laporan.
            expect($loaded->father_thalassemia)->toBeIn(PROP4_SCREENING_DOMAIN);
            expect($loaded->mother_thalassemia)->toBeIn(PROP4_SCREENING_DOMAIN);
            expect($loaded->baby_thalassemia_risk)->toBeIn(PROP4_RISK_DOMAIN);
        });
});
