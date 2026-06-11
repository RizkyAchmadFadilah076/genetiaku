<?php

namespace App\Http\Controllers\Public;

use App\Domain\KnowledgeBaseRule as KnowledgeBaseRuleDto;
use App\Domain\ScreeningRuleSet;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ScreeningRequest;
use App\Models\KnowledgeBaseRule;
use App\Models\MediaAsset;
use App\Models\ScreeningResult;
use App\Services\ScreeningEngine;
use App\Support\ScreeningIndicators;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScreeningController extends Controller
{
    public const SESSION_KEY = 'screening_result_id';

    public function show(): Response
    {
        $illustration = MediaAsset::query()
            ->where('key', 'screening_illustration')
            ->first();

        return Inertia::render('public/screening', [
            'indicators' => ScreeningIndicators::all(),
            'illustration' => ($illustration && $illustration->path) ? [
                'url' => $illustration->url,
                'type' => $illustration->type,
            ] : null,
        ]);
    }

    public function store(ScreeningRequest $request, ScreeningEngine $engine): RedirectResponse
    {
        $validated = $request->validated();

        $rules = $this->loadRules();

        $fatherAnswers = $this->mapAnswers($validated['father'] ?? []);
        $motherAnswers = $this->mapAnswers($validated['mother'] ?? []);

        $fatherResult = $engine->classify($fatherAnswers, $rules);
        $motherResult = $engine->classify($motherAnswers, $rules);

        $result = ScreeningResult::query()->create([
            'father_name' => $validated['father_name'],
            'mother_name' => $validated['mother_name'],
            'father_result' => $fatherResult,
            'mother_result' => $motherResult,
            'father_indicators' => $this->selectedIndicators($validated['father'] ?? []),
            'mother_indicators' => $this->selectedIndicators($validated['mother'] ?? []),
        ]);

        $request->session()->put(self::SESSION_KEY, $result->id);

        return redirect('/prediksi');
    }

    /**
     * @return list<KnowledgeBaseRuleDto>
     */
    private function loadRules(): array
    {
        $rules = KnowledgeBaseRule::query()
            ->get(['indicator', 'weight', 'classification_mapping'])
            ->map(fn (KnowledgeBaseRule $rule): KnowledgeBaseRuleDto => KnowledgeBaseRuleDto::fromArray([
                'indicator' => $rule->indicator,
                'weight' => $rule->weight,
                'classification_mapping' => $rule->classification_mapping,
            ]))
            ->all();

        return $rules === [] ? ScreeningRuleSet::default() : $rules;
    }

    private function mapAnswers(array $answers): array
    {
        $mapped = [];

        foreach (ScreeningIndicators::map() as $key => $label) {
            $mapped[$label] = $answers[$key] ?? false;
        }

        return $mapped;
    }

    /**
     * @return list<string>
     */
    private function selectedIndicators(array $answers): array
    {
        $selected = [];

        foreach (ScreeningIndicators::map() as $key => $label) {
            if (filter_var($answers[$key] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $selected[] = $label;
            }
        }

        return $selected;
    }
}
