<?php

namespace Database\Factories;

use App\Domain\PhenotypeCategory;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Models\TrainingData;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingData>
 *
 * Nilai atribut dibatasi pada Data_Fenotipe (PhenotypeFactory::values) dan
 * kategori Hasil_Skrining_Orang_Tua yang valid agar Data_Latih konsisten
 * dengan Data_Fenotipe (Req 14.3).
 */
class TrainingDataFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<TrainingData>
     */
    protected $model = TrainingData::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $values = PhenotypeFactory::values();

        $blood = $values[PhenotypeCategory::GolonganDarah->value];
        $iris = $values[PhenotypeCategory::WarnaIris->value];
        $hair = $values[PhenotypeCategory::TeksturRambut->value];
        $ear = $values[PhenotypeCategory::BentukCuping->value];

        $screening = [
            ScreeningCategory::Normal->value,
            ScreeningCategory::Carrier->value,
            ScreeningCategory::Penderita->value,
        ];

        $risk = [
            ThalassemiaRisk::Minor->value,
            ThalassemiaRisk::Intermedia->value,
            ThalassemiaRisk::Mayor->value,
        ];

        return [
            'father_blood' => fake()->randomElement($blood),
            'father_iris' => fake()->randomElement($iris),
            'father_hair' => fake()->randomElement($hair),
            'father_ear' => fake()->randomElement($ear),
            'father_thalassemia' => fake()->randomElement($screening),

            'mother_blood' => fake()->randomElement($blood),
            'mother_iris' => fake()->randomElement($iris),
            'mother_hair' => fake()->randomElement($hair),
            'mother_ear' => fake()->randomElement($ear),
            'mother_thalassemia' => fake()->randomElement($screening),

            'baby_blood' => fake()->randomElement($blood),
            'baby_iris' => fake()->randomElement($iris),
            'baby_hair' => fake()->randomElement($hair),
            'baby_ear' => fake()->randomElement($ear),
            'baby_thalassemia_risk' => fake()->randomElement($risk),
        ];
    }
}
