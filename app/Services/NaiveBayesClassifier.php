<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\PhenotypeCategory;
use App\Domain\PredictionOutcome;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Domain\TrainingRow;
use App\Services\Exceptions\EmptyTrainingDataException;
use App\Services\Exceptions\InvalidAttributeException;

final class NaiveBayesClassifier
{
    /** @var list<string> */
    private const THALASSEMIA_ATTRIBUTES = [
        'father_thalassemia',
        'mother_thalassemia',
    ];

    public function predict(array $input, array $training): PredictionOutcome
    {
        $this->guardAgainstEmptyTrainingData($training);
        $this->guardAgainstUnknownAttributeValues($input, $training);

        return $this->compute($input, $training);
    }

    private function guardAgainstEmptyTrainingData(array $training): void
    {
        if ($training === []) {
            throw EmptyTrainingDataException::create();
        }
    }

    private function guardAgainstUnknownAttributeValues(array $input, array $training): void
    {
        $allowedValues = $this->allowedValuesByAttribute($training);

        foreach ($input as $attribute => $value) {
            $allowedForAttribute = $allowedValues[$attribute] ?? [];

            if (in_array($attribute, self::THALASSEMIA_ATTRIBUTES, true)) {
                foreach (ScreeningCategory::cases() as $category) {
                    $allowedForAttribute[$category->value] = true;
                }
            }

            if (! isset($allowedForAttribute[$value])) {
                throw InvalidAttributeException::forValue((string) $attribute, $value);
            }
        }
    }

    private function allowedValuesByAttribute(array $training): array
    {
        $allowed = [];

        foreach ($training as $row) {
            foreach ($row->inputAttributes() as $attribute => $value) {
                $allowed[$attribute][$value] = true;
            }
        }

        return $allowed;
    }

    /**
     * Hitung prior, likelihood Laplace, posterior, lalu pilih kelas terbaik.
     */
    private function compute(array $input, array $training): PredictionOutcome
    {
        $n = count($training);
        $distinctValueCounts = $this->distinctValueCounts($training);
        $outputVariables = array_keys($training[0]->outputClasses());

        /** @var array<string,array<string,float>> $probabilities */
        $probabilities = [];
        /** @var array<string,string> $selected */
        $selected = [];

        foreach ($outputVariables as $variable) {
            $scores = $this->unnormalizedScores($variable, $input, $training, $n, $distinctValueCounts);
            $selected[$variable] = $this->classWithMaxScore($scores);
            $probabilities[$variable] = $this->normalize($scores);
        }

        $physical = [
            PhenotypeCategory::GolonganDarah->value => $selected['baby_blood'],
            PhenotypeCategory::WarnaIris->value => $selected['baby_iris'],
            PhenotypeCategory::TeksturRambut->value => $selected['baby_hair'],
            PhenotypeCategory::BentukCuping->value => $selected['baby_ear'],
        ];

        $thalassemiaRisk = ThalassemiaRisk::from($selected['baby_thalassemia_risk']);

        return new PredictionOutcome($physical, $thalassemiaRisk, $probabilities);
    }

    /**
     * score(c) = P(c) * product P(x_i | c).
     *
     * @param  array<string,string>  $input
     * @param  list<TrainingRow>  $training
     * @param  array<string,int>  $distinctValueCounts
     * @return array<string,float>
     */
    private function unnormalizedScores(
        string $variable,
        array $input,
        array $training,
        int $n,
        array $distinctValueCounts,
    ): array {
        $classCounts = [];
        foreach ($training as $row) {
            $class = $row->outputClasses()[$variable];
            $classCounts[$class] = ($classCounts[$class] ?? 0) + 1;
        }

        $scores = [];

        foreach ($classCounts as $class => $countOfClass) {
            $class = (string) $class;
            $score = $countOfClass / $n;

            foreach ($input as $attribute => $value) {
                $vi = $distinctValueCounts[$attribute] ?? 0;
                $jointCount = $this->jointCount($training, $variable, (string) $class, (string) $attribute, $value);

                $score *= ($jointCount + 1) / ($countOfClass + $vi);
            }

            $scores[$class] = $score;
        }

        return $scores;
    }

    private function jointCount(
        array $training,
        string $variable,
        string $class,
        string $attribute,
        string $value,
    ): int {
        $count = 0;

        foreach ($training as $row) {
            if ((string) $row->outputClasses()[$variable] !== $class) {
                continue;
            }

            if (($row->inputAttributes()[$attribute] ?? null) === $value) {
                $count++;
            }
        }

        return $count;
    }

    private function classWithMaxScore(array $scores): string
    {
        $bestClass = null;
        $bestScore = -INF;

        foreach ($scores as $class => $score) {
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestClass = (string) $class;
            }
        }

        return (string) $bestClass;
    }

    private function normalize(array $scores): array
    {
        $sum = array_sum($scores);

        $normalized = [];
        foreach ($scores as $class => $score) {
            $normalized[(string) $class] = $sum > 0.0 ? $score / $sum : 0.0;
        }

        return $normalized;
    }

    private function distinctValueCounts(array $training): array
    {
        $distinct = [];

        foreach ($training as $row) {
            foreach ($row->inputAttributes() as $attribute => $value) {
                $distinct[$attribute][$value] = true;
            }
        }

        return array_map('count', $distinct);
    }
}
