<?php

namespace Database\Factories;

use App\Domain\PhenotypeCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\PredictionResult;
use App\Models\ScreeningResult;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PredictionResult>
 */
class PredictionResultFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<PredictionResult>
     */
    protected $model = PredictionResult::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $values = PhenotypeFactory::values();

        $physical = [
            PhenotypeCategory::GolonganDarah->value => fake()->randomElement($values[PhenotypeCategory::GolonganDarah->value]),
            PhenotypeCategory::WarnaIris->value => fake()->randomElement($values[PhenotypeCategory::WarnaIris->value]),
            PhenotypeCategory::TeksturRambut->value => fake()->randomElement($values[PhenotypeCategory::TeksturRambut->value]),
            PhenotypeCategory::BentukCuping->value => fake()->randomElement($values[PhenotypeCategory::BentukCuping->value]),
        ];

        $risk = fake()->randomElement([
            ThalassemiaRisk::Minor->value,
            ThalassemiaRisk::Intermedia->value,
            ThalassemiaRisk::Mayor->value,
        ]);

        return [
            'screening_result_id' => ScreeningResult::factory(),
            'physical_result' => $physical,
            'thalassemia_risk' => $risk,
            'probabilities' => $this->normalizedProbabilities($values, $risk),
        ];
    }

    /**
     * Build normalized posterior probabilities per output variable (Req 4.3).
     *
     * @param  array<string, list<string>>  $values
     * @return array<string, array<string, float>>
     */
    private function normalizedProbabilities(array $values, string $risk): array
    {
        $probabilities = [];

        foreach ($values as $category => $options) {
            $probabilities[$category] = $this->distribution($options);
        }

        $probabilities['baby_thalassemia_risk'] = $this->distribution([
            ThalassemiaRisk::Minor->value,
            ThalassemiaRisk::Intermedia->value,
            ThalassemiaRisk::Mayor->value,
        ]);

        return $probabilities;
    }

    /**
     * Produce a normalized probability distribution over the given classes.
     *
     * @param  list<string>  $classes
     * @return array<string, float>
     */
    private function distribution(array $classes): array
    {
        $weights = [];
        $total = 0.0;

        foreach ($classes as $class) {
            $weight = fake()->randomFloat(4, 0.1, 1.0);
            $weights[$class] = $weight;
            $total += $weight;
        }

        return array_map(static fn (float $w): float => round($w / $total, 6), $weights);
    }
}
