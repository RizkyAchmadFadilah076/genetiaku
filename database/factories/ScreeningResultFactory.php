<?php

namespace Database\Factories;

use App\Domain\ScreeningCategory;
use App\Models\ScreeningResult;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScreeningResult>
 */
class ScreeningResultFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<ScreeningResult>
     */
    protected $model = ScreeningResult::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            ScreeningCategory::Normal->value,
            ScreeningCategory::Carrier->value,
            ScreeningCategory::Penderita->value,
        ];

        return [
            'father_name' => fake()->name('male'),
            'mother_name' => fake()->name('female'),
            'father_result' => fake()->randomElement($categories),
            'mother_result' => fake()->randomElement($categories),
        ];
    }
}
