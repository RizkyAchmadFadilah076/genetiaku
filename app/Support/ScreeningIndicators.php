<?php

namespace App\Support;

use App\Http\Requests\Public\ScreeningRequest;
use App\Models\KnowledgeBaseRule;

class ScreeningIndicators
{
    public static function map(): array
    {
        $rules = KnowledgeBaseRule::query()
            ->orderBy('id')
            ->get(['slug', 'indicator']);

        if ($rules->isNotEmpty()) {
            return $rules
                ->mapWithKeys(static fn (KnowledgeBaseRule $rule): array => [
                    $rule->slug => $rule->indicator,
                ])
                ->all();
        }

        return ScreeningRequest::INDICATORS;
    }

    /**
     * @return list<array{key:string,label:string,illustration_url:?string,illustration_type:?string}>
     */
    public static function all(): array
    {
        $rules = KnowledgeBaseRule::query()
            ->orderBy('id')
            ->get(['slug', 'indicator', 'illustration_path']);

        if ($rules->isNotEmpty()) {
            return $rules
                ->map(static fn (KnowledgeBaseRule $rule): array => [
                    'key' => $rule->slug,
                    'label' => $rule->indicator,
                    'illustration_url' => $rule->illustration_url,
                    'illustration_type' => $rule->illustration_type,
                ])
                ->all();
        }

        $fallback = [];
        foreach (ScreeningRequest::INDICATORS as $slug => $label) {
            $fallback[] = [
                'key' => $slug,
                'label' => $label,
                'illustration_url' => null,
                'illustration_type' => null,
            ];
        }

        return $fallback;
    }
}
