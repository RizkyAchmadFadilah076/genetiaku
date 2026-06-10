<?php

use App\Domain\KnowledgeBaseRule;
use App\Domain\ScreeningCategory;
use App\Services\ScreeningEngine;
use Eris\Generator;
use Eris\TestTrait;

uses(TestTrait::class);

/*
 * Pool Indikator_Skrining sesuai Req 1.1 (riwayat keluarga, diagnosis,
 * anemia, kadar Hb rendah, transfusi, gejala pendukung). Generator memilih
 * dari pool ini agar nama indikator pada aturan dan jawaban konsisten.
 */
const SCREENING_INDICATORS = [
    'riwayat_keluarga',
    'riwayat_diagnosis',
    'riwayat_anemia',
    'kadar_hb_rendah',
    'riwayat_transfusi',
    'gejala_pendukung',
];

const SCREENING_MAPPINGS = ['Normal', 'Carrier', 'Penderita'];

// Feature: genetikaku-expert-system, Property 1: Klasifikasi skrining bersifat total dan deterministik
it('mengklasifikasikan jawaban lengkap secara total dan deterministik', function () {
    $engine = new ScreeningEngine();

    $this->forAll(
        // Sekuens "spesifikasi indikator": tiap entri membawa nama indikator,
        // bobot positif, pemetaan klasifikasi valid, dan jawaban afirmatif/tidak.
        Generator\seq(Generator\tuple(
            Generator\elements(...SCREENING_INDICATORS),
            Generator\choose(1, 10),                  // bobot selalu positif
            Generator\elements(...SCREENING_MAPPINGS), // mapping valid
            Generator\bool(),                          // jawaban indikator
        ))
    )->then(function (array $specs) use ($engine) {
        // Dedupe per nama indikator (entri terakhir menang) agar Basis_Pengetahuan
        // dan peta jawaban tetap konsisten dan lengkap atas indikator yang sama.
        $byIndicator = [];
        foreach ($specs as [$indicator, $weight, $mapping, $answer]) {
            $byIndicator[$indicator] = [$weight, $mapping, $answer];
        }

        $rules = [];
        $answers = [];
        foreach ($byIndicator as $indicator => [$weight, $mapping, $answer]) {
            $rules[] = new KnowledgeBaseRule($indicator, $weight, $mapping);
            $answers[$indicator] = $answer; // peta jawaban lengkap atas semua indikator
        }

        $result = $engine->classify($answers, $rules);

        // Totalitas: hasil adalah tepat satu dari tiga kategori (Req 1.3).
        expect($result)->toBeInstanceOf(ScreeningCategory::class);
        expect([
            ScreeningCategory::Normal,
            ScreeningCategory::Carrier,
            ScreeningCategory::Penderita,
        ])->toContain($result);

        // Determinisme / idempotensi: pemanggilan berulang dengan input identik
        // menghasilkan kategori yang sama (Req 1.2, 12.2).
        expect($engine->classify($answers, $rules))->toBe($result);
        expect($engine->classify($answers, $rules))->toBe($result);
    });
});
