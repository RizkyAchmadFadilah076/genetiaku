<?php

use App\Domain\ScreeningCategory;
use App\Models\ScreeningResult;
use Eris\Generator;
use Eris\TestTrait;
use Tests\RefreshDatabaseWithoutSeeding;

uses(TestTrait::class, RefreshDatabaseWithoutSeeding::class);

/*
 * Property 3 (report-alignment) menguji invarian round-trip penyimpanan
 * Hasil_Skrining_Orang_Tua (Req 4.2, 2.4): untuk Hasil_Skrining apa pun (nama
 * ayah, nama ibu, hasil ayah, hasil ibu) dengan hasil dipilih dari
 * ScreeningCategory, menyimpannya lalu memuatnya kembali dari penyimpanan HARUS
 * mengembalikan keempat field identik, dan father_result/mother_result selalu
 * berdomain Istilah_Laporan {Normal, Carrier, Penderita}.
 *
 * Pendekatan (Pest + Eris, lewat model Eloquent ScreeningResult):
 *   - Bangkitkan nama ayah/ibu acak (string nama non-kosong) dan hasil
 *     ayah/ibu acak dari ketiga kasus ScreeningCategory (Normal, Carrier,
 *     Penderita).
 *   - Simpan via ScreeningResult::create([...]) lalu muat ulang instans baru
 *     dari basis data (ScreeningResult::find($id)).
 *   - Pastikan keempat field identik: nama sama persis, dan father_result /
 *     mother_result kembali sebagai instans enum ScreeningCategory yang sama
 *     dan berdomain Istilah_Laporan.
 *
 * Prefiks unik PROP3_ dipakai untuk simbol lingkup-berkas guna menghindari
 * tabrakan simbol global dengan berkas tes lain.
 */

/**
 * Domain Istilah_Laporan untuk Hasil_Skrining_Orang_Tua (Req 2.1, 2.3).
 *
 * @var list<string>
 */
const PROP3_SCREENING_DOMAIN = ['Normal', 'Carrier', 'Penderita'];

/**
 * Generator tuple (nama ayah, nama ibu, hasil ayah, hasil ibu) untuk membentuk
 * satu Hasil_Skrining acak. Nama memakai generator nama (selalu non-kosong);
 * hasil dipilih dari ketiga kasus ScreeningCategory.
 */
function prop3ScreeningGenerator(): Generator
{
    return Generator\tuple(
        Generator\names(),
        Generator\names(),
        Generator\elements(...ScreeningCategory::cases()),
        Generator\elements(...ScreeningCategory::cases()),
    );
}

// Feature: report-alignment, Property 3: Hasil_Skrining_Orang_Tua round-trip dan berdomain Istilah_Laporan
it('menyimpan lalu memuat Hasil_Skrining mengembalikan keempat field identik dan berdomain Istilah_Laporan', function () {
    // Eris default 100 iterasi (lihat Eris\TestTrait::$iterations).
    $this->forAll(
        prop3ScreeningGenerator(),
    )
        ->then(function (array $skrining) {
            [$fatherName, $motherName, $fatherResult, $motherResult] = $skrining;

            // Mulai dari state bersih tiap iterasi agar tabel terkontrol.
            ScreeningResult::query()->delete();

            // Simpan Hasil_Skrining yang dihitung.
            $saved = ScreeningResult::create([
                'father_name' => $fatherName,
                'mother_name' => $motherName,
                'father_result' => $fatherResult,
                'mother_result' => $motherResult,
            ]);

            // Muat ulang instans baru dari penyimpanan (bukan dari memori).
            $loaded = ScreeningResult::find($saved->id);

            // Keempat field harus identik dengan yang disimpan (round-trip).
            expect($loaded->father_name)->toBe($fatherName);
            expect($loaded->mother_name)->toBe($motherName);
            expect($loaded->father_result)->toBe($fatherResult);
            expect($loaded->mother_result)->toBe($motherResult);

            // Hasil skrining selalu berdomain Istilah_Laporan {Normal, Carrier, Penderita}.
            expect($loaded->father_result->value)->toBeIn(PROP3_SCREENING_DOMAIN);
            expect($loaded->mother_result->value)->toBeIn(PROP3_SCREENING_DOMAIN);
        });
});
