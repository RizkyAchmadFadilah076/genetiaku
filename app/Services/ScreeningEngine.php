<?php

namespace App\Services;

use App\Domain\KnowledgeBaseRule;
use App\Domain\ScreeningCategory;

/**
 * Mesin_Skrining (Tahap 1).
 *
 * Memetakan jawaban Indikator_Skrining seorang orang tua ke tepat satu
 * Hasil_Skrining_Orang_Tua (`Normal`, `Carrier`, `Penderita`)
 * berdasarkan Basis_Pengetahuan (Req 1.2, 1.3, 12.2).
 *
 * Kelas ini MURNI: tidak menyentuh database/HTTP. Seluruh masukan diberikan
 * secara eksplisit sehingga hasilnya deterministik dan mudah diuji property.
 *
 * ## Interpretasi field `classification_mapping`
 *
 * Setiap {@see KnowledgeBaseRule} memetakan satu Indikator_Skrining ke:
 *   - `weight`               : kontribusi skor saat indikator dijawab "ya".
 *   - `classificationMapping`: kategori yang DIINDIKASIKAN bila indikator
 *                              tersebut dijawab afirmatif, salah satu dari
 *                              `Normal` | `Carrier` | `Penderita`.
 *
 * `classificationMapping` menyatakan tingkat kategori yang diisyaratkan oleh
 * indikator tersebut bila dijawab "ya". Indikator kuat (mis. riwayat diagnosis
 * atau riwayat transfusi) dipetakan ke `Penderita`; indikator pendukung
 * (mis. riwayat keluarga, anemia, kadar Hb rendah) dipetakan ke `Carrier`.
 *
 * ## Algoritma `classify`
 *   1. Bila ADA indikator ber-mapping `Penderita` yang dijawab afirmatif
 *      -> langsung `Penderita` (indikator kuat bersifat menentukan).
 *   2. Selain itu, jumlahkan `weight` indikator ber-mapping `Carrier` yang
 *      dijawab afirmatif. Bila skornya >= `carrierThreshold` (bobot terkecil di
 *      antara aturan `Carrier`) -> `Carrier`.
 *   3. Selain itu -> `Normal`.
 *
 * Dengan demikian, mengiyakan beberapa indikator pendukung (carrier) TIDAK
 * lagi otomatis menjadi `Penderita`; hanya indikator kuat yang menentukan
 * kategori tertinggi.
 *
 * Fungsi selalu mengembalikan tepat satu {@see ScreeningCategory} dan
 * deterministik (idempoten) untuk masukan yang sama.
 */
final class ScreeningEngine
{
    /**
     * Klasifikasikan jawaban indikator seorang orang tua.
     *
     * @param  array<string,mixed>  $answers  Jawaban indikator, dikunci nama
     *                                         indikator. Nilai afirmatif
     *                                         (true, 1, "ya"/"yes"/"true")
     *                                         dihitung sebagai "terpenuhi".
     * @param  list<KnowledgeBaseRule>  $rules  Aturan dari Basis_Pengetahuan.
     */
    public function classify(array $answers, array $rules): ScreeningCategory
    {
        $hasHighRiskIndicator = false;
        $carrierScore = 0;
        $carrierThreshold = null;

        foreach ($rules as $rule) {
            $mapping = $this->normalizeCategory($rule->classificationMapping);
            $affirmative = $this->isAffirmative($answers[$rule->indicator] ?? null);

            if ($mapping === ScreeningCategory::Penderita) {
                if ($affirmative) {
                    $hasHighRiskIndicator = true;
                }
            } elseif ($mapping === ScreeningCategory::Carrier) {
                $carrierThreshold = $this->minOrValue($carrierThreshold, $rule->weight);

                if ($affirmative) {
                    $carrierScore += $rule->weight;
                }
            }
        }

        if ($hasHighRiskIndicator) {
            return ScreeningCategory::Penderita;
        }

        if ($carrierThreshold !== null && $carrierScore >= $carrierThreshold) {
            return ScreeningCategory::Carrier;
        }

        return ScreeningCategory::Normal;
    }

    /**
     * Tentukan apakah sebuah jawaban indikator bernilai afirmatif ("ya").
     */
    private function isAffirmative(mixed $answer): bool
    {
        if (is_bool($answer)) {
            return $answer;
        }

        if (is_int($answer)) {
            return $answer === 1;
        }

        if (is_string($answer)) {
            return in_array(
                strtolower(trim($answer)),
                ['1', 'ya', 'yes', 'true', 'y'],
                true,
            );
        }

        return false;
    }

    /**
     * Petakan string `classification_mapping` ke {@see ScreeningCategory},
     * toleran terhadap spasi/kapitalisasi. Mengembalikan null bila tidak
     * dikenali (aturan tersebut tidak berkontribusi pada threshold).
     */
    private function normalizeCategory(string $mapping): ?ScreeningCategory
    {
        $normalized = strtolower(trim($mapping));

        return match ($normalized) {
            'normal' => ScreeningCategory::Normal,
            'carrier' => ScreeningCategory::Carrier,
            'penderita' => ScreeningCategory::Penderita,
            default => ScreeningCategory::tryFrom($mapping),
        };
    }

    /**
     * Kembalikan nilai terkecil antara threshold berjalan dan kandidat baru.
     */
    private function minOrValue(?int $current, int $candidate): int
    {
        return $current === null ? $candidate : min($current, $candidate);
    }
}
