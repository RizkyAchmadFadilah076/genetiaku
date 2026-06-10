<?php

use App\Domain\PhenotypeCategory;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Http\Middleware\EnsureScreeningCompleted;
use App\Http\Requests\Public\ScreeningRequest;
use App\Models\Phenotype;
use App\Models\PredictionResult;
use App\Models\ScreeningResult;
use App\Models\TrainingData;
use Inertia\Testing\AssertableInertia;

/*
 * Task 14.2 — Feature test integrasi alur end-to-end empat tahap.
 *
 * Menguji satu jalur representatif (happy path) yang menelusuri keseluruhan
 * alur publik melalui HTTP/Inertia: skrining (Tahap 1) -> form prediksi
 * (Tahap 2) -> hasil prediksi (Tahap 3-4) -> cetak (Tahap 5), memverifikasi
 * wiring controller <-> service <-> DB <-> Inertia bekerja utuh ujung-ke-ujung
 * dengan kontinuitas sesi yang benar antar-request.
 *
 * Berbeda dengan property test per-tahap yang sudah ada, tes ini fokus pada
 * INTEGRASI: state Tahap 1 (screening_result_id di sesi) harus terbawa ke
 * Tahap 2-4, dan Hasil_Prediksi yang tersimpan harus dapat dicetak.
 *
 * Requirements: 1.6, 2.3, 4.6, 5.2
 *
 * RefreshDatabaseWithoutSeeding diterapkan global pada suite Feature (Pest.php).
 */

/**
 * Nilai Data_Fenotipe yang diseed per kategori. Nilai yang dikirim pada form
 * prediksi dipilih dari himpunan ini DAN turut muncul pada Data_Latih agar
 * lolos validasi NaiveBayesClassifier (Req 3.1).
 *
 * @var array<string, list<string>>
 */
const E2E_PHENOTYPES = [
    'Golongan Darah' => ['A', 'B'],
    'Warna Iris Mata' => ['Cokelat', 'Hitam'],
    'Tekstur Rambut' => ['Lurus', 'Keriting'],
    'Bentuk Cuping Telinga' => ['Menempel', 'Terpisah'],
];

/**
 * Seed seluruh prasyarat alur empat tahap:
 *  - Phenotype          : nilai valid keempat kategori untuk form prediksi.
 *  - TrainingData       : baris dengan nilai atribut dari fenotipe + kategori
 *                         skrining valid, sehingga NaiveBayesClassifier punya
 *                         data latih non-kosong & valid.
 *
 * Catatan: Basis_Pengetahuan kini bersifat STATIS (App\Domain\ScreeningRuleSet)
 * sehingga tidak perlu di-seed; ScreeningEngine memakai aturan tetap tersebut.
 */
function e2eSeedPrerequisites(): void
{
    // --- Data_Fenotipe: nilai valid per kategori ---
    foreach (E2E_PHENOTYPES as $category => $values) {
        foreach ($values as $value) {
            Phenotype::create(['category' => $category, 'value' => $value]);
        }
    }

    // --- Data_Latih: baris yang memuat seluruh nilai fenotipe terkirim pada
    // kolom yang sesuai, plus kategori Hasil_Skrining_Orang_Tua valid. Beberapa
    // baris dengan keluaran berbeda agar perhitungan Naive Bayes bermakna.
    $trainingRows = [
        [
            'father_blood' => 'A', 'father_iris' => 'Cokelat', 'father_hair' => 'Lurus', 'father_ear' => 'Menempel',
            'father_thalassemia' => ScreeningCategory::Carrier->value,
            'mother_blood' => 'B', 'mother_iris' => 'Hitam', 'mother_hair' => 'Keriting', 'mother_ear' => 'Terpisah',
            'mother_thalassemia' => ScreeningCategory::Normal->value,
            'baby_blood' => 'A', 'baby_iris' => 'Cokelat', 'baby_hair' => 'Lurus', 'baby_ear' => 'Menempel',
            'baby_thalassemia_risk' => ThalassemiaRisk::Intermedia->value,
        ],
        [
            'father_blood' => 'B', 'father_iris' => 'Hitam', 'father_hair' => 'Keriting', 'father_ear' => 'Terpisah',
            'father_thalassemia' => ScreeningCategory::Normal->value,
            'mother_blood' => 'A', 'mother_iris' => 'Cokelat', 'mother_hair' => 'Lurus', 'mother_ear' => 'Menempel',
            'mother_thalassemia' => ScreeningCategory::Normal->value,
            'baby_blood' => 'B', 'baby_iris' => 'Hitam', 'baby_hair' => 'Keriting', 'baby_ear' => 'Terpisah',
            'baby_thalassemia_risk' => ThalassemiaRisk::Minor->value,
        ],
        [
            'father_blood' => 'A', 'father_iris' => 'Hitam', 'father_hair' => 'Lurus', 'father_ear' => 'Terpisah',
            'father_thalassemia' => ScreeningCategory::Penderita->value,
            'mother_blood' => 'B', 'mother_iris' => 'Cokelat', 'mother_hair' => 'Keriting', 'mother_ear' => 'Menempel',
            'mother_thalassemia' => ScreeningCategory::Carrier->value,
            'baby_blood' => 'A', 'baby_iris' => 'Hitam', 'baby_hair' => 'Lurus', 'baby_ear' => 'Menempel',
            'baby_thalassemia_risk' => ThalassemiaRisk::Mayor->value,
        ],
    ];

    foreach ($trainingRows as $row) {
        TrainingData::create($row);
    }
}

// Feature: genetikaku-expert-system, Task 14.2: alur end-to-end empat tahap
it('menelusuri alur skrining -> prediksi -> hasil -> cetak via HTTP/Inertia', function () {
    // Render Inertia tanpa bergantung pada aset Vite terbuild.
    $this->withoutVite();

    e2eSeedPrerequisites();

    // ---------------------------------------------------------------------
    // Tahap 1 — Skrining (POST /skrining): hitung Hasil_Skrining ayah & ibu,
    // simpan record, simpan id ke sesi, lalu redirect ke /prediksi (Req 1.6).
    // ---------------------------------------------------------------------
    $indicatorKeys = array_keys(ScreeningRequest::INDICATORS);

    // Ayah: jawab afirmatif "riwayat keluarga" (skor 2 -> Carrier).
    $fatherAnswers = array_fill_keys($indicatorKeys, false);
    $fatherAnswers['riwayat_keluarga'] = true;

    // Ibu: seluruh indikator negatif (skor 0 -> Normal).
    $motherAnswers = array_fill_keys($indicatorKeys, false);

    $screeningResponse = $this->post(route('skrining.store'), [
        'father_name' => 'Budi Santoso',
        'mother_name' => 'Siti Aminah',
        'father' => $fatherAnswers,
        'mother' => $motherAnswers,
    ]);

    // Req 1.6: setelah Hasil_Skrining tersimpan, alur diteruskan ke Tahap 2.
    $screeningResponse->assertRedirect('/prediksi');

    // Req 1.6: tepat satu Hasil_Skrining tercipta dengan kedua nilai kategori.
    expect(ScreeningResult::query()->count())->toBe(1);

    /** @var ScreeningResult $screening */
    $screening = ScreeningResult::query()->firstOrFail();
    expect($screening->father_name)->toBe('Budi Santoso');
    expect($screening->mother_name)->toBe('Siti Aminah');
    expect($screening->father_result)->toBe(ScreeningCategory::Carrier);
    expect($screening->mother_result)->toBe(ScreeningCategory::Normal);

    // Kontinuitas sesi: controller menyimpan screening_result_id di sesi.
    $this->assertEquals(
        $screening->id,
        session(EnsureScreeningCompleted::SESSION_KEY),
    );

    // ---------------------------------------------------------------------
    // Tahap 2 — Form Prediksi (GET /prediksi): tampilkan opsi fenotipe dan
    // Hasil_Skrining read-only yang sudah terisi otomatis (Req 2.3).
    // ---------------------------------------------------------------------
    $formResponse = $this->get(route('prediksi.create'));
    $formResponse->assertOk();

    $formResponse->assertInertia(function (AssertableInertia $page) use ($screening) {
        $page->component('public/prediction/form', false);

        $props = $page->toArray()['props'];

        // Req 2.3: Hasil_Skrining Tahap 1 diteruskan read-only pada prop 'screening'.
        $screeningProp = $props['screening'] ?? null;
        expect($screeningProp)->toBeArray();
        expect($screeningProp['father_name'])->toBe($screening->father_name);
        expect($screeningProp['mother_name'])->toBe($screening->mother_name);
        expect($screeningProp['father_result'])->toBe(ScreeningCategory::Carrier->value);
        expect($screeningProp['mother_result'])->toBe(ScreeningCategory::Normal->value);

        // Opsi fenotipe tersedia untuk keempat kategori (konteks Tahap 2).
        $options = $props['phenotypeOptions'] ?? null;
        expect($options)->toBeArray();
        foreach (PhenotypeCategory::cases() as $category) {
            expect(array_key_exists($category->value, $options))->toBeTrue();
        }
    });

    // ---------------------------------------------------------------------
    // Tahap 3-4 — Prediksi & Hasil (POST /prediksi): jalankan Naive Bayes atas
    // fenotipe terkirim + Hasil_Skrining, simpan Hasil_Prediksi (Req 4.6), dan
    // render halaman hasil.
    // ---------------------------------------------------------------------
    $phenotypePayload = [
        'father_blood' => 'A', 'father_iris' => 'Cokelat', 'father_hair' => 'Lurus', 'father_ear' => 'Menempel',
        'mother_blood' => 'B', 'mother_iris' => 'Hitam', 'mother_hair' => 'Keriting', 'mother_ear' => 'Terpisah',
    ];

    $resultResponse = $this->post(route('prediksi.store'), $phenotypePayload);
    $resultResponse->assertOk();

    $resultResponse->assertInertia(function (AssertableInertia $page) {
        $page->component('public/prediction/result', false);

        $props = $page->toArray()['props'];

        // Req 4.1: keempat karakteristik fisik bayi diprediksi.
        $physical = $props['physical'] ?? null;
        expect($physical)->toBeArray();
        foreach (PhenotypeCategory::cases() as $category) {
            expect(array_key_exists($category->value, $physical))->toBeTrue();
            expect($physical[$category->value])->not->toBe('');
        }

        // Req 4.2: Risiko_Thalassemia_Bayi tepat satu klasifikasi valid.
        expect(in_array($props['thalassemiaRisk'] ?? null, ['Minor', 'Intermedia', 'Mayor'], true))->toBeTrue();

        // Req 4.3: probabilitas posterior disertakan.
        expect($props['probabilities'] ?? null)->toBeArray()->not->toBeEmpty();
    });

    // Req 4.6: Hasil_Prediksi tersimpan dengan referensi ke Hasil_Skrining.
    expect(PredictionResult::query()->count())->toBe(1);

    /** @var PredictionResult $prediction */
    $prediction = PredictionResult::query()->firstOrFail();
    expect($prediction->screening_result_id)->toBe($screening->id);
    expect($prediction->physical_result)->toBeArray();
    expect($prediction->thalassemia_risk)->toBeInstanceOf(ThalassemiaRisk::class);
    expect($prediction->probabilities)->toBeArray()->not->toBeEmpty();

    // ---------------------------------------------------------------------
    // Tahap 5 — Cetak (GET /prediksi/{id}/cetak): seluruh bagian wajib hadir
    // pada tampilan cetak (Req 5.2).
    // ---------------------------------------------------------------------
    $printResponse = $this->get(route('prediksi.print', $prediction));
    $printResponse->assertOk();

    $printResponse->assertInertia(function (AssertableInertia $page) {
        $page->component('public/prediction/print', false);

        $props = $page->toArray()['props'];

        // Req 5.2: fisik, risiko, probabilitas, edukasi, dan disclaimer wajib ada.
        $physical = $props['physical'] ?? null;
        expect($physical)->toBeArray();
        foreach (PhenotypeCategory::cases() as $category) {
            expect(array_key_exists($category->value, $physical))->toBeTrue();
        }

        expect(in_array($props['thalassemiaRisk'] ?? null, ['Minor', 'Intermedia', 'Mayor'], true))->toBeTrue();
        expect($props['probabilities'] ?? null)->toBeArray()->not->toBeEmpty();

        $education = $props['education'] ?? null;
        expect($education)->toBeArray();
        foreach (['result_explanation', 'thalassemia_info', 'follow_up_advice'] as $key) {
            expect(array_key_exists($key, $education))->toBeTrue();
            expect($education[$key])->toBeString()->not->toBe('');
        }

        expect($props['disclaimer'] ?? null)->toBeString()->not->toBe('');
    });
});
