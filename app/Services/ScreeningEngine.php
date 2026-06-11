<?php

namespace App\Services;

use App\Domain\KnowledgeBaseRule;
use App\Domain\ScreeningCategory;

final class ScreeningEngine
{
    /**
     * Penderita diprioritaskan; jika tidak ada, skor Carrier dibandingkan ambang.
     *
     * @param  array<string,mixed>  $answers
     * @param  list<KnowledgeBaseRule>  $rules
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

    private function minOrValue(?int $current, int $candidate): int
    {
        return $current === null ? $candidate : min($current, $candidate);
    }
}
