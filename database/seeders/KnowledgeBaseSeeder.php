<?php

namespace Database\Seeders;

use App\Domain\ScreeningRuleSet;
use App\Http\Requests\Public\ScreeningRequest;
use App\Models\KnowledgeBaseRule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $slugByLabel = array_flip(ScreeningRequest::INDICATORS);

        foreach (ScreeningRuleSet::default() as $rule) {
            $slug = $slugByLabel[$rule->indicator] ?? Str::slug($rule->indicator, '_');

            KnowledgeBaseRule::query()->updateOrCreate(
                ['indicator' => $rule->indicator],
                [
                    'slug' => $slug,
                    'weight' => $rule->weight,
                    'classification_mapping' => $rule->classificationMapping,
                ],
            );
        }
    }
}
