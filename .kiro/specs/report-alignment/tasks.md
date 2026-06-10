# Implementation Plan: report-alignment

## Overview

Penyelarasan terminologi sistem GENETIKAKU dengan Istilah_Laporan (skripsi) sebagai *terminological refactor* + *data migration*, tanpa mengubah metode Naive Bayes maupun kelima Kategori_Keluaran. Implementasi memakai stack yang ada: PHP 8 / Laravel + Inertia/React (TypeScript), pengujian Pest 4 + Eris di SQLite in-memory.

Titik perubahan terpusat pada dua *backed enum* (`ThalassemiaRisk`, `ScreeningCategory`), lalu merembet ke aturan skrining, validasi, impor CSV, seeder/factory, migrasi data tersimpan, frontend, dan konten edukasi. Setiap langkah dibangun di atas langkah sebelumnya dan diakhiri dengan penyatuan (wiring) serta pengujian.

## Tasks

- [x] 1. Selaraskan enum domain ke Istilah_Laporan
  - [x] 1.1 Ubah `App\Domain\ThalassemiaRisk` menjadi tiga case `Minor`/`Intermedia`/`Mayor`
    - Ganti nama dan nilai case `Rendah`→`Minor`, `Sedang`→`Intermedia`, `Tinggi`→`Mayor`
    - Pastikan nama case = nilai (backed enum string) untuk konsistensi pembacaan kode
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Ubah `App\Domain\ScreeningCategory` case ketiga menjadi `Penderita`
    - Ganti `BerisikoTinggi = 'Berisiko Tinggi'` menjadi `Penderita = 'Penderita'`; pertahankan `Normal` dan `Carrier`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 1.3 Tulis example test definisi enum
    - Assert `ThalassemiaRisk::cases()` = {Minor, Intermedia, Mayor}
    - Assert `ScreeningCategory::cases()` = {Normal, Carrier, Penderita}
    - _Requirements: 1.1, 1.3, 2.1, 2.3_

- [x] 2. Selaraskan lapisan aturan skrining (Tahap 1)
  - [x] 2.1 Perbarui `App\Domain\ScreeningRuleSet`
    - Ubah `classification_mapping` default `'Berisiko Tinggi'` → `'Penderita'` pada aturan diagnosis Thalassemia dan riwayat transfusi
    - Jangan ubah bobot atau struktur aturan
    - _Requirements: 2.2_

  - [x] 2.2 Perbarui `App\Services\ScreeningEngine::normalizeCategory()`
    - Tambahkan/ubah cabang match `'penderita' => ScreeningCategory::Penderita`
    - Jaga fungsi tetap total dan deterministik (mengembalikan tepat satu `ScreeningCategory`)
    - _Requirements: 2.5, 3.5_

  - [ ]* 2.3 Perbarui property test Mesin_Skrining
    - **Property 1: Klasifikasi skrining total, berdomain Istilah_Laporan, dan diterima Mesin_Naive_Bayes**
    - Generator memakai `ScreeningCategory::Penderita`; assert hasil ∈ cases dan diterima `NaiveBayesClassifier` tanpa `InvalidAttributeException`
    - **Validates: Requirements 2.5, 3.5**

- [x] 3. Selaraskan validasi dan impor CSV Data_Latih
  - [x] 3.1 Verifikasi/sesuaikan `App\Http\Requests\Admin\TrainingDataRequest`
    - Konfirmasi aturan `Rule::in(...)` dibangun dari `*::cases()` sehingga otomatis hanya menerima Istilah_Laporan
    - Verifikasi pesan kesalahan validasi (`*.in`) tetap berlaku
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 3.2 Perbarui `App\Http\Controllers\Admin\TrainingDataImportController`
    - `template()`: baris contoh CSV memakai `Penderita` dan `Intermedia` (hapus `'Sedang'`/istilah lama)
    - Verifikasi `rowRules()` berbasis `*::cases()` dan perilaku impor "all-or-nothing" pada `store()` dipertahankan
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.3 Perbarui property test validasi Data_Latih
    - **Property 5: Validasi Data_Latih menerima hanya Istilah_Laporan**
    - Tambah kasus penolakan istilah lama (`Rendah`/`Sedang`/`Tinggi`/`Berisiko Tinggi`) untuk risiko dan skrining
    - **Validates: Requirements 4.4, 4.5, 4.6**

  - [ ]* 3.4 Tulis property test impor CSV all-or-nothing
    - **Property 6: Impor CSV bersifat all-or-nothing terhadap istilah tak valid**
    - CSV campuran; assert tidak ada baris tersimpan dan `rowErrors` melaporkan baris tak valid
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 4. Checkpoint - Pastikan enum, skrining, dan validasi konsisten
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Selaraskan seeder dan factory
  - [ ] 5.1 Perbarui `TrainingDataSeeder`
    - Array `$screening`/`$severity` memakai `'Penderita'`; `riskFor()` mengembalikan `'Minor'|'Intermedia'|'Mayor'`
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Perbarui factory hasil prediksi dan skrining
    - `TrainingDataFactory`, `ScreeningResultFactory`: referensi `ScreeningCategory::BerisikoTinggi` → `Penderita`
    - `TrainingDataFactory`, `PredictionResultFactory`: referensi `ThalassemiaRisk::Rendah|Sedang|Tinggi` → `Minor|Intermedia|Mayor`
    - _Requirements: 6.3, 6.4_

  - [ ]* 5.3 Tulis property test factory
    - **Property 7: Factory hanya menghasilkan Istilah_Laporan**
    - Hasilkan banyak instans; assert domain nilai `thalassemia_risk` dan `father_result`/`mother_result`
    - **Validates: Requirements 6.3, 6.4**

- [x] 6. Migrasi data tersimpan ke Istilah_Laporan
  - [x] 6.1 Buat migration konversi nilai tersimpan
    - Konversi `prediction_results.thalassemia_risk`, `screening_results.{father,mother}_result`, dan `training_data.{father,mother}_thalassemia` + `baby_thalassemia_risk` via `DB` query builder (bukan model ber-cast)
    - Idempoten: nilai yang sudah memakai Istilah_Laporan dibiarkan; sediakan `down()` reversibel
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 6.2 Tulis property test migrasi
    - **Property 8: Migrasi_Data memetakan ke Istilah_Laporan secara lengkap dan idempoten**
    - Seed mentah via `DB::table()->insert`, jalankan migrasi, assert pemetaan, kelengkapan (tanpa istilah lama tersisa), dan idempotensi
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 7. Verifikasi persistensi round-trip (property tests)
  - [ ]* 7.1 Perbarui property test PredictionResult round-trip
    - **Property 2: Risiko_Thalassemia_Bayi round-trip dan berdomain Istilah_Laporan**
    - Generator risiko dari `ThalassemiaRisk::Minor/Intermedia/Mayor`; assert nilai identik dan ∈ Istilah_Laporan
    - **Validates: Requirements 4.1, 1.4, 7.1, 7.2**

  - [ ]* 7.2 Perbarui property test ScreeningResult round-trip
    - **Property 3: Hasil_Skrining_Orang_Tua round-trip dan berdomain Istilah_Laporan**
    - Ikuti perubahan enum; assert keempat field identik dan `father_result`/`mother_result` ∈ {Normal, Carrier, Penderita}
    - **Validates: Requirements 4.2, 2.4**

  - [ ]* 7.3 Tulis property test TrainingData round-trip
    - **Property 4: Data_Latih round-trip dengan Istilah_Laporan**
    - Simpan lalu muat ulang; assert kolom skrining+risiko tidak berubah
    - **Validates: Requirements 4.3**

- [-] 8. Selaraskan antarmuka (Inertia/React)
  - [x] 8.1 Perbarui `resources/js/pages/public/prediction/result.tsx`
    - `riskMeta()`: `case 'Tinggi'`→`case 'Mayor'`, `case 'Sedang'`→`case 'Intermedia'`, default menangani `Minor`
    - Badge menampilkan nilai apa adanya dari prop `thalassemiaRisk`
    - _Requirements: 7.1_

  - [x] 8.2 Perbarui `resources/js/pages/public/prediction/print.tsx`
    - Perbarui komentar tipe; pastikan menampilkan `thalassemiaRisk` apa adanya (Istilah_Laporan)
    - _Requirements: 7.2_

  - [x] 8.3 Perbarui `resources/js/pages/admin/prediction-results/index.tsx`
    - `RISK_BADGE`: ganti kunci `Rendah|Sedang|Tinggi` → `Minor|Intermedia|Mayor` (Minor→hijau, Intermedia→amber, Mayor→merah)
    - _Requirements: 7.3_

  - [x] 8.4 Verifikasi opsi form admin dan label kategori keluaran
    - Konfirmasi `riskOptions`/`screeningOptions` (dari `*::cases()`) tampil sebagai Istilah_Laporan di form Data_Latih
    - Konfirmasi label kelima Kategori_Keluaran (`Golongan Darah`, `Tekstur Rambut`, `Warna Iris Mata`, `Bentuk Cuping Telinga`, `Risiko Thalassemia`) di `VARIABLE_LABELS`
    - _Requirements: 7.4, 7.5, 7.6_

- [x] 9. Tambahkan dokumentasi edukatif Hukum Mendel dan alur dua tahap
  - [x] 9.1 Perluas `App\Http\Controllers\Public\PredictionController::educationalContent()`
    - Tambah kunci `method_explanation` (Naive Bayes atas Data_Latih), `mendel_basis` (Data_Latih mencerminkan pola pewarisan Mendel; Hukum Mendel II sebagai landasan teori variasi fenotipe, BUKAN mesin pemetaan gen/Punnett), `two_stage_flow` (Mesin_Skrining → Mesin_Naive_Bayes)
    - Kirim ke `result`/`print` tanpa mengubah perhitungan
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8_

  - [ ]* 9.2 Perbarui example test seksi cetak/edukasi wajib
    - Assert Halaman_Cetak/Halaman_Hasil memuat penjelasan Naive Bayes, dasar Mendel, dan alur dua tahap
    - _Requirements: 3.2, 3.3_

- [x] 10. Selaraskan pool data uji regresi yang ada
  - [ ] 10.1 Perbarui `tests/Support/NaiveBayesTestData.php` dan konstanta lokal NB
    - Selaraskan pool `NB_RISK`, `NB_*_THAL` dan referensi nama case enum ke Istilah_Laporan agar suite regresi (NaiveBayes*, PredictionFlowEndToEnd, PrintView*, dll.) tetap lulus
    - _Requirements: 1.5, 3.7, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Checkpoint akhir - Pastikan seluruh suite lulus
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tugas bertanda `*` bersifat opsional (test) dan dapat dilewati untuk MVP lebih cepat; tugas implementasi inti tidak ditandai opsional.
- Setiap tugas merujuk klausa requirement spesifik untuk ketertelusuran.
- Property test (Pest 4 + Eris) menjalankan minimum 100 iterasi dan diberi tag `// Feature: report-alignment, Property {N}: {teks}`; satu properti per berkas.
- Urutan deploy penting: migrasi data (tugas 6.1) harus berjalan bersamaan dengan aktivasi enum baru agar cast atas data lama tidak gagal.
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke lapisan berikutnya.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2", "3.1", "3.2", "5.1", "5.2", "6.1", "8.1", "8.2", "8.3", "8.4", "9.1", "10.1"] },
    { "id": 2, "tasks": ["2.3", "3.3", "3.4", "5.3", "6.2", "7.1", "7.2", "7.3", "9.2"] }
  ]
}
```
