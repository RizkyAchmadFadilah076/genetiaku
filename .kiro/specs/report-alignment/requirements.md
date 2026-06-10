# Requirements Document

## Introduction

GENETIKAKU adalah sistem pakar berbasis web (Laravel + Inertia/React, MySQL) yang memprediksi karakteristik fisik dan risiko penyakit Thalassemia pada bayi dari fenotipe orang tua menggunakan metode Naive Bayes. Sistem saat ini sudah berjalan dengan alur dua tahap: (1) skrining berbasis aturan untuk mengklasifikasikan status tiap orang tua, dan (2) klasifikasi Naive Bayes atas Data_Latih untuk menghasilkan lima keluaran (Golongan Darah, Tekstur Rambut, Warna Iris Mata, Bentuk Cuping Telinga, dan Risiko Thalassemia).

Fitur ini bertujuan menyelaraskan sistem yang berjalan dengan laporan tugas akhir (skripsi). Ditemukan kesenjangan istilah dan dokumentasi antara laporan dan implementasi: (a) keluaran risiko Thalassemia bayi memakai enum `Rendah`/`Sedang`/`Tinggi`, sedangkan laporan memakai istilah klinis `Minor`/`Intermedia`/`Mayor`; (b) status skrining orang tua memakai `Normal`/`Carrier`/`Berisiko Tinggi`, sedangkan laporan memakai `Normal`/`Carrier`/`Penderita (Mayor)`; (c) peran Hukum Mendel sebagai dasar pengetahuan belum didokumentasikan secara eksplisit terhadap implementasi Naive Bayes; dan (d) data benih, validasi, serta antarmuka harus konsisten dengan istilah baru di seluruh pipeline.

Tujuan utama fitur ini adalah keselarasan istilah dengan laporan akademik **tanpa mengganti metode klasifikasi (tetap Naive Bayes)** dan **tanpa mengubah kelima kategori keluaran**.

## Glossary

- **Sistem**: Aplikasi web GENETIKAKU secara keseluruhan.
- **Mesin_Skrining**: Komponen tahap 1 (`App\Services\ScreeningEngine`) yang mengklasifikasikan tiap orang tua dari Indikator_Skrining ke satu Hasil_Skrining_Orang_Tua berdasarkan Basis_Pengetahuan.
- **Mesin_Naive_Bayes**: Komponen tahap 2 (`App\Services\NaiveBayesClassifier`) yang mengklasifikasikan keluaran bayi dari atribut masukan dan Data_Latih menggunakan metode Naive Bayes.
- **Data_Latih**: Kumpulan baris pelatihan (`training_data`) yang dikelola Admin sebagai dasar perhitungan Naive Bayes.
- **Data_Fenotipe**: Kumpulan nilai fenotipe valid per kategori (`phenotypes`) yang dikelola Admin.
- **Basis_Pengetahuan**: Kumpulan aturan indikator skrining (`knowledge_base_rules`) yang dikelola Admin.
- **Hasil_Skrining_Orang_Tua**: Kategori klasifikasi seorang orang tua hasil Mesin_Skrining.
- **Risiko_Thalassemia_Bayi**: Variabel keluaran Mesin_Naive_Bayes yang menyatakan risiko Thalassemia pada bayi.
- **Kategori_Keluaran**: Lima keluaran prediksi: Golongan Darah, Tekstur Rambut, Warna Iris Mata, Bentuk Cuping Telinga, dan Risiko Thalassemia.
- **Istilah_Laporan**: Terminologi yang dipakai laporan tugas akhir (mis. Minor, Intermedia, Mayor).
- **Pemetaan_Istilah**: Tabel padanan antara istilah sistem lama dan Istilah_Laporan.
- **Halaman_Hasil**: Halaman hasil prediksi publik (`public/prediction/result`).
- **Halaman_Cetak**: Halaman cetak hasil prediksi publik (`public/prediction/print`).
- **ThalassemiaRisk**: Enum domain (`App\Domain\ThalassemiaRisk`) untuk Risiko_Thalassemia_Bayi.
- **ScreeningCategory**: Enum domain (`App\Domain\ScreeningCategory`) untuk Hasil_Skrining_Orang_Tua.
- **Migrasi_Data**: Proses konversi nilai tersimpan lama ke nilai sesuai Istilah_Laporan.

## Requirements

### Requirement 1: Penyelarasan istilah Risiko Thalassemia bayi

**User Story:** Sebagai penulis tugas akhir, saya ingin keluaran Risiko_Thalassemia_Bayi memakai istilah klinis sesuai laporan (Minor, Intermedia, Mayor), sehingga sistem yang berjalan konsisten dengan dokumen skripsi.

#### Acceptance Criteria

1. THE Sistem SHALL mendefinisikan tiga nilai Risiko_Thalassemia_Bayi yang sesuai Istilah_Laporan: `Minor`, `Intermedia`, dan `Mayor`.
2. THE Sistem SHALL menerapkan Pemetaan_Istilah berikut: `Rendah` menjadi `Minor`, `Sedang` menjadi `Intermedia`, dan `Tinggi` menjadi `Mayor`.
3. THE ThalassemiaRisk SHALL mendefinisikan tepat tiga case enum yang nilainya `Minor`, `Intermedia`, dan `Mayor`.
4. WHERE sebuah keluaran prediksi ditampilkan kepada pengguna, THE Sistem SHALL menampilkan nilai Risiko_Thalassemia_Bayi menggunakan Istilah_Laporan.
5. THE Sistem SHALL mempertahankan metode Naive Bayes sebagai mekanisme klasifikasi Risiko_Thalassemia_Bayi tanpa mengubah algoritmanya.

### Requirement 2: Penyelarasan istilah Hasil Skrining orang tua

**User Story:** Sebagai penulis tugas akhir, saya ingin Hasil_Skrining_Orang_Tua memakai istilah sesuai laporan (Normal, Carrier, Penderita), sehingga klasifikasi tiap orang tua konsisten dengan dokumen skripsi.

#### Acceptance Criteria

1. THE Sistem SHALL mendefinisikan tiga nilai Hasil_Skrining_Orang_Tua sesuai Istilah_Laporan: `Normal`, `Carrier`, dan `Penderita`.
2. THE Sistem SHALL menerapkan Pemetaan_Istilah `Berisiko Tinggi` menjadi `Penderita` untuk Hasil_Skrining_Orang_Tua.
3. THE ScreeningCategory SHALL mendefinisikan tepat tiga case enum yang nilainya `Normal`, `Carrier`, dan `Penderita`.
4. WHERE Hasil_Skrining_Orang_Tua ditampilkan kepada pengguna, THE Sistem SHALL menampilkan nilai menggunakan Istilah_Laporan.
5. WHEN Mesin_Skrining mengklasifikasikan seorang orang tua, THE Mesin_Skrining SHALL mengembalikan tepat satu nilai dari `Normal`, `Carrier`, atau `Penderita`.

### Requirement 3: Dokumentasi hubungan Hukum Mendel dengan Naive Bayes dan alur dua tahap

**User Story:** Sebagai pembaca laporan, saya ingin penjelasan bagaimana Hukum Mendel menjadi dasar pengetahuan sementara klasifikasi dijalankan dengan Naive Bayes, sehingga keselarasan teori dan implementasi dapat dipahami.

#### Acceptance Criteria

1. THE Sistem SHALL menyajikan penjelasan edukatif pada Halaman_Hasil bahwa prediksi dihasilkan dengan metode Naive Bayes berdasarkan Data_Latih.
2. THE Sistem SHALL menyajikan penjelasan edukatif bahwa Data_Latih mencerminkan pola pewarisan menurut Hukum Mendel (mis. Carrier x Carrier menghasilkan kemungkinan 25% Normal, 50% Carrier, 25% Mayor untuk Thalassemia).
3. THE Sistem SHALL menyatakan secara eksplisit alur dua tahap: Mesin_Skrining (berbasis aturan) menghasilkan Hasil_Skrining_Orang_Tua, lalu Mesin_Naive_Bayes menghasilkan Kategori_Keluaran.
4. WHEN seorang pengguna menyelesaikan tahap skrining, THE Sistem SHALL menggunakan Hasil_Skrining_Orang_Tua sebagai atribut masukan untuk Mesin_Naive_Bayes.
5. THE Sistem SHALL menjaga konsistensi istilah Hasil_Skrining_Orang_Tua antara keluaran Mesin_Skrining dan atribut masukan `father_thalassemia` serta `mother_thalassemia` pada Mesin_Naive_Bayes.
6. THE Sistem SHALL menyatakan bahwa Hukum Mendel II (asortasi bebas) berperan sebagai landasan teori variasi fenotipe dan dasar penyusunan Data_Latih, BUKAN sebagai mesin pemetaan kombinasi gen.
7. THE Sistem SHALL menjalankan prediksi karakteristik fisik (Golongan Darah, Tekstur Rambut, Warna Iris Mata, Bentuk Cuping Telinga) melalui Mesin_Naive_Bayes atas Data_Latih fenotipe, tanpa memodelkan genotipe/alel maupun perhitungan Punnett.
8. THE Sistem SHALL membatasi makna istilah Basis_Pengetahuan hanya pada aturan skrining Tahap 1 (Mesin_Skrining), sehingga tidak dirujuk sebagai mekanisme prediksi karakteristik fisik.

### Requirement 4: Konsistensi penyimpanan dan validasi data

**User Story:** Sebagai Admin, saya ingin penyimpanan basis data dan validasi menerima istilah sesuai laporan, sehingga seluruh pipeline data konsisten setelah perubahan istilah.

#### Acceptance Criteria

1. THE Sistem SHALL menyimpan nilai kolom `thalassemia_risk` (hasil prediksi) menggunakan Istilah_Laporan `Minor`, `Intermedia`, atau `Mayor`.
2. THE Sistem SHALL menyimpan nilai kolom `father_result` dan `mother_result` (hasil skrining) menggunakan Istilah_Laporan `Normal`, `Carrier`, atau `Penderita`.
3. THE Sistem SHALL menyimpan nilai kolom `baby_thalassemia_risk`, `father_thalassemia`, dan `mother_thalassemia` pada Data_Latih menggunakan Istilah_Laporan.
4. WHEN Admin menyimpan atau memperbarui satu baris Data_Latih, THE Sistem SHALL menerima nilai `baby_thalassemia_risk` hanya bila termasuk `Minor`, `Intermedia`, atau `Mayor`.
5. WHEN Admin menyimpan atau memperbarui satu baris Data_Latih, THE Sistem SHALL menerima nilai `father_thalassemia` dan `mother_thalassemia` hanya bila termasuk `Normal`, `Carrier`, atau `Penderita`.
6. IF Admin mengirim nilai Risiko_Thalassemia_Bayi atau Hasil_Skrining_Orang_Tua di luar Istilah_Laporan, THEN THE Sistem SHALL menolak masukan dan menampilkan pesan kesalahan validasi.
7. WHEN seorang pengguna mengirim data fenotipe untuk prediksi, THE Sistem SHALL memvalidasi nilai fenotipe terhadap Data_Fenotipe tanpa mengubah perilaku validasi fenotipe yang sudah ada.

### Requirement 5: Konsistensi impor CSV Data Latih

**User Story:** Sebagai Admin, saya ingin templat dan validasi impor CSV memakai istilah sesuai laporan, sehingga impor massal tetap konsisten dengan istilah baru.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan templat CSV Data_Latih yang baris contohnya memakai Istilah_Laporan untuk kolom `father_thalassemia`, `mother_thalassemia`, dan `baby_thalassemia_risk`.
2. WHEN Admin mengunggah berkas CSV Data_Latih, THE Sistem SHALL memvalidasi kolom `baby_thalassemia_risk` hanya menerima `Minor`, `Intermedia`, atau `Mayor`.
3. WHEN Admin mengunggah berkas CSV Data_Latih, THE Sistem SHALL memvalidasi kolom `father_thalassemia` dan `mother_thalassemia` hanya menerima `Normal`, `Carrier`, atau `Penderita`.
4. IF sebuah baris CSV memuat nilai risiko atau status skrining di luar Istilah_Laporan, THEN THE Sistem SHALL menolak impor dan melaporkan baris yang tidak valid tanpa menyimpan data apa pun.

### Requirement 6: Konsistensi data benih dan factory

**User Story:** Sebagai pengembang, saya ingin data benih (seeder) dan factory menghasilkan nilai sesuai laporan, sehingga lingkungan demo dan pengujian konsisten dengan istilah baru.

#### Acceptance Criteria

1. WHEN TrainingDataSeeder dijalankan, THE Sistem SHALL menghasilkan nilai `baby_thalassemia_risk` hanya berupa `Minor`, `Intermedia`, atau `Mayor`.
2. WHEN TrainingDataSeeder dijalankan, THE Sistem SHALL menghasilkan nilai `father_thalassemia` dan `mother_thalassemia` hanya berupa `Normal`, `Carrier`, atau `Penderita`.
3. WHEN factory hasil prediksi menghasilkan data, THE Sistem SHALL memakai nilai Risiko_Thalassemia_Bayi sesuai Istilah_Laporan.
4. WHEN factory atau seeder hasil skrining menghasilkan data, THE Sistem SHALL memakai nilai Hasil_Skrining_Orang_Tua sesuai Istilah_Laporan.

### Requirement 7: Konsistensi antarmuka publik dan admin

**User Story:** Sebagai pengguna dan Admin, saya ingin setiap label, badge, dan opsi pada antarmuka memakai istilah sesuai laporan, sehingga tampilan seragam di seluruh sistem.

#### Acceptance Criteria

1. WHERE Halaman_Hasil menampilkan Risiko_Thalassemia_Bayi, THE Sistem SHALL menampilkan `Minor`, `Intermedia`, atau `Mayor`.
2. WHERE Halaman_Cetak menampilkan Risiko_Thalassemia_Bayi, THE Sistem SHALL menampilkan `Minor`, `Intermedia`, atau `Mayor`.
3. WHERE halaman admin hasil prediksi menampilkan penanda (badge) risiko, THE Sistem SHALL menetapkan gaya penanda berdasarkan nilai `Minor`, `Intermedia`, dan `Mayor`.
4. WHERE formulir Data_Latih admin menampilkan pilihan Risiko_Thalassemia_Bayi, THE Sistem SHALL menyajikan opsi `Minor`, `Intermedia`, dan `Mayor`.
5. WHERE formulir atau halaman admin menampilkan pilihan Hasil_Skrining_Orang_Tua, THE Sistem SHALL menyajikan opsi `Normal`, `Carrier`, dan `Penderita`.
6. THE Sistem SHALL menampilkan kelima Kategori_Keluaran dengan label tepat: `Golongan Darah`, `Tekstur Rambut`, `Warna Iris Mata`, `Bentuk Cuping Telinga`, dan `Risiko Thalassemia`.

### Requirement 8: Migrasi data tersimpan yang ada

**User Story:** Sebagai pengembang, saya ingin data yang sudah tersimpan dikonversi ke istilah baru, sehingga catatan lama tetap dapat ditampilkan dan diproses setelah perubahan istilah.

#### Acceptance Criteria

1. WHEN Migrasi_Data dijalankan, THE Sistem SHALL mengonversi nilai `thalassemia_risk` tersimpan dari `Rendah` ke `Minor`, `Sedang` ke `Intermedia`, dan `Tinggi` ke `Mayor`.
2. WHEN Migrasi_Data dijalankan, THE Sistem SHALL mengonversi nilai `father_result` dan `mother_result` tersimpan dari `Berisiko Tinggi` ke `Penderita`.
3. WHEN Migrasi_Data dijalankan, THE Sistem SHALL mengonversi nilai `father_thalassemia`, `mother_thalassemia`, dan `baby_thalassemia_risk` pada Data_Latih ke Istilah_Laporan yang sesuai.
4. IF sebuah nilai tersimpan sudah memakai Istilah_Laporan, THEN THE Sistem SHALL mempertahankan nilai tersebut tanpa perubahan.
5. WHEN Migrasi_Data selesai, THE Sistem SHALL memastikan tidak ada nilai tersisa yang memakai istilah lama (`Rendah`, `Sedang`, `Tinggi`, `Berisiko Tinggi`) pada kolom terkait.

### Requirement 9: Pelestarian fungsionalitas dan kategori keluaran

**User Story:** Sebagai pemangku kepentingan, saya ingin perubahan istilah tidak mengubah perilaku fungsional yang ada, sehingga sistem tetap bekerja seperti sebelumnya selain pada istilah yang diselaraskan.

#### Acceptance Criteria

1. THE Sistem SHALL mempertahankan tepat lima Kategori_Keluaran tanpa penambahan atau penghapusan.
2. WHEN Mesin_Naive_Bayes melakukan prediksi, THE Mesin_Naive_Bayes SHALL menghasilkan keempat karakteristik fisik (Golongan Darah, Tekstur Rambut, Warna Iris Mata, Bentuk Cuping Telinga) dan satu Risiko_Thalassemia_Bayi.
3. WHILE Data_Latih kosong, THE Mesin_Naive_Bayes SHALL membatalkan prediksi dan Sistem SHALL menampilkan pesan bahwa prediksi belum dapat dilakukan.
4. THE Sistem SHALL mempertahankan alur navigasi dari skrining ke prediksi ke hasil ke cetak tanpa perubahan langkah.
5. WHEN Mesin_Naive_Bayes menghitung probabilitas posterior, THE Mesin_Naive_Bayes SHALL menampilkan nilai probabilitas per variabel keluaran seperti perilaku sebelumnya.
