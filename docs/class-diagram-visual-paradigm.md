# Spesifikasi Class Diagram untuk Visual Paradigm

Ya, class inti untuk laporan dapat dibuat dengan class berikut:

1. `Login`
2. `User`
3. `Skrining`
4. `Prediksi`
5. `Fenotipe`
6. `DataLatih`
7. `BasisPengetahuan`
8. `Artikel`
9. `Tentang`
10. `HasilSkrining`
11. `HasilPrediksi`

Nama di atas adalah nama konseptual untuk laporan. Di kode Laravel, beberapa class memiliki nama teknis berbeda, misalnya `HasilSkrining` = `ScreeningResult`, `HasilPrediksi` = `PredictionResult`, `DataLatih` = `TrainingData`, dan `BasisPengetahuan` = `KnowledgeBaseRule`.

## Class dan Atribut

### 1. Login

Stereotype: `<<boundary/control>>`

Atribut:

- `email: string`
- `password: string`
- `remember: boolean`
- `status: string`

Operasi:

- `tampilkanFormLogin(): View`
- `validasiInput(): boolean`
- `autentikasi(email: string, password: string): boolean`
- `logout(): void`
- `lupaPassword(email: string): void`

Catatan implementasi: login dikelola oleh Laravel Fortify dan halaman React `auth/login.tsx`, jadi class ini dimodelkan untuk kebutuhan laporan.

### 2. User

Atribut:

- `id: int`
- `name: string`
- `email: string`
- `password: string`
- `role: string`
- `email_verified_at: datetime`
- `remember_token: string`
- `two_factor_secret: string`
- `two_factor_recovery_codes: string`
- `two_factor_confirmed_at: datetime`

Operasi:

- `isAdmin(): boolean`
- `login(): boolean`
- `logout(): void`
- `ubahProfil(): void`
- `ubahPassword(): void`

### 3. Skrining

Stereotype: `<<control>>`

Atribut:

- `father_name: string`
- `mother_name: string`
- `father_answers: array`
- `mother_answers: array`
- `rules: BasisPengetahuan[]`

Operasi:

- `tampilkanForm(): View`
- `validasiData(): boolean`
- `prosesSkrining(): HasilSkrining`
- `klasifikasi(answers: array, rules: BasisPengetahuan[]): string`
- `simpanHasil(): HasilSkrining`

### 4. Prediksi

Stereotype: `<<control>>`

Atribut:

- `screening_result_id: int`
- `father_blood: string`
- `father_iris: string`
- `father_hair: string`
- `father_ear: string`
- `father_thalassemia: string`
- `mother_blood: string`
- `mother_iris: string`
- `mother_hair: string`
- `mother_ear: string`
- `mother_thalassemia: string`
- `training_rows: DataLatih[]`

Operasi:

- `tampilkanForm(): View`
- `validasiData(): boolean`
- `bangunInputKlasifikasi(): array`
- `hitungPrediksi(): HasilPrediksi`
- `hitungProbabilitasPosterior(): array`
- `simpanHasil(): HasilPrediksi`
- `cetakHasil(): PDF`

### 5. Fenotipe

Atribut:

- `id: int`
- `category: string`
- `value: string`
- `illustration_path: string`
- `illustration_url: string`
- `illustration_type: string`

Operasi:

- `getIllustrationUrl(): string`
- `getIllustrationType(): string`
- `tambahFenotipe(): void`
- `ubahFenotipe(): void`
- `hapusFenotipe(): void`
- `daftarNilaiPerKategori(): array`

### 6. DataLatih

Atribut:

- `id: int`
- `father_blood: string`
- `father_iris: string`
- `father_hair: string`
- `father_ear: string`
- `father_thalassemia: string`
- `mother_blood: string`
- `mother_iris: string`
- `mother_hair: string`
- `mother_ear: string`
- `mother_thalassemia: string`
- `baby_blood: string`
- `baby_iris: string`
- `baby_hair: string`
- `baby_ear: string`
- `baby_thalassemia_risk: string`

Operasi:

- `inputAttributes(): array`
- `outputClasses(): array`
- `importData(): void`
- `tambahData(): void`
- `ubahData(): void`
- `hapusData(): void`

### 7. BasisPengetahuan

Atribut:

- `id: int`
- `slug: string`
- `indicator: string`
- `weight: int`
- `classification_mapping: string`
- `illustration_path: string`
- `illustration_url: string`
- `illustration_type: string`

Operasi:

- `getIllustrationUrl(): string`
- `getIllustrationType(): string`
- `tambahAturan(): void`
- `ubahAturan(): void`
- `hapusAturan(): void`
- `ambilAturanSkrining(): BasisPengetahuan[]`

### 8. Artikel

Atribut:

- `id: int`
- `title: string`
- `slug: string`
- `summary: string`
- `content: text`
- `status: string`
- `image_path: string`
- `image_url: string`

Operasi:

- `getImageUrl(): string`
- `tampilkanArtikel(): View`
- `tambahArtikel(): void`
- `ubahArtikel(): void`
- `hapusArtikel(): void`
- `publikasikan(): void`

### 9. Tentang

Atribut:

- `id: int`
- `title: string`
- `content: text`
- `image_path: string`
- `image_url: string`

Operasi:

- `getImageUrl(): string`
- `tampilkanHalaman(): View`
- `ubahKonten(): void`

### 10. HasilSkrining

Atribut:

- `id: int`
- `father_name: string`
- `mother_name: string`
- `father_result: string`
- `mother_result: string`
- `father_indicators: array`
- `mother_indicators: array`
- `created_at: datetime`
- `updated_at: datetime`

Operasi:

- `predictionResult(): HasilPrediksi`
- `simpan(): void`
- `lihatHasil(): View`
- `gunakanUntukPrediksi(): Prediksi`

### 11. HasilPrediksi

Atribut:

- `id: int`
- `screening_result_id: int`
- `physical_result: array`
- `thalassemia_risk: string`
- `probabilities: array`
- `created_at: datetime`
- `updated_at: datetime`

Operasi:

- `screeningResult(): HasilSkrining`
- `simpan(): void`
- `lihatHasil(): View`
- `cetakPDF(): PDF`
- `lihatRiwayatSesi(): array`

## Relasi untuk Visual Paradigm

Gunakan relasi berikut saat menggambar ulang.

| Dari | Ke | Jenis Relasi | Multiplicity | Keterangan |
|---|---|---|---|---|
| `Login` | `User` | Association | `1 -> 0..1` | Login melakukan autentikasi terhadap satu user yang cocok. |
| `User` | `Artikel` | Association | `1 -> 0..*` | Admin/user dapat mengelola banyak artikel. |
| `User` | `Tentang` | Association | `1 -> 0..*` | Admin/user dapat mengelola konten tentang. |
| `User` | `Fenotipe` | Association | `1 -> 0..*` | Admin/user dapat mengelola data fenotipe. |
| `User` | `DataLatih` | Association | `1 -> 0..*` | Admin/user dapat mengelola data latih. |
| `User` | `BasisPengetahuan` | Association | `1 -> 0..*` | Admin/user dapat mengelola basis pengetahuan. |
| `Skrining` | `BasisPengetahuan` | Aggregation | `1 o-- 1..*` | Skrining menggunakan kumpulan aturan basis pengetahuan, tetapi aturan tetap berdiri sendiri sebagai data master. |
| `Skrining` | `HasilSkrining` | Composition | `1 *-- 1` | Proses skrining menghasilkan satu hasil skrining sebagai output utama. |
| `HasilSkrining` | `HasilPrediksi` | Association | `1 --> 0..1` | Satu hasil skrining dapat dipakai untuk menghasilkan nol atau satu hasil prediksi. |
| `Prediksi` | `HasilSkrining` | Association | `1 --> 1` | Prediksi membutuhkan hasil skrining orang tua sebagai input. |
| `Prediksi` | `Fenotipe` | Aggregation | `1 o-- 1..*` | Prediksi menggunakan pilihan nilai fenotipe sebagai referensi input. |
| `Prediksi` | `DataLatih` | Aggregation | `1 o-- 1..*` | Prediksi menggunakan banyak data latih untuk perhitungan Naive Bayes. |
| `Prediksi` | `HasilPrediksi` | Composition | `1 *-- 1` | Proses prediksi menghasilkan satu hasil prediksi. |
| `HasilPrediksi` | `HasilSkrining` | Association | `1 --> 1` | Hasil prediksi menyimpan referensi ke hasil skrining melalui `screening_result_id`. |

## Saran Bentuk Diagram

Untuk laporan, susun diagram menjadi tiga area:

1. Area autentikasi dan admin: `Login`, `User`
2. Area data master: `Fenotipe`, `DataLatih`, `BasisPengetahuan`, `Artikel`, `Tentang`
3. Area proses utama: `Skrining`, `HasilSkrining`, `Prediksi`, `HasilPrediksi`

Relasi terpenting yang harus terlihat jelas:

- `Skrining *-- HasilSkrining`
- `Prediksi *-- HasilPrediksi`
- `HasilSkrining --> HasilPrediksi`
- `Prediksi o-- DataLatih`
- `Prediksi o-- Fenotipe`
- `Skrining o-- BasisPengetahuan`
- `Login --> User`
