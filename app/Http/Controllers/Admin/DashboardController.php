<?php

namespace App\Http\Controllers\Admin;

use App\Domain\ThalassemiaRisk;
use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\KnowledgeBaseRule;
use App\Models\MediaAsset;
use App\Models\Phenotype;
use App\Models\PredictionResult;
use App\Models\ScreeningResult;
use App\Models\TrainingData;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $predictionCounts = PredictionResult::query()
            ->selectRaw('thalassemia_risk, COUNT(*) as total')
            ->groupBy('thalassemia_risk')
            ->pluck('total', 'thalassemia_risk');

        $predictionDistribution = collect(ThalassemiaRisk::cases())
            ->map(fn (ThalassemiaRisk $risk): array => [
                'label' => $risk->value,
                'total' => (int) ($predictionCounts[$risk->value] ?? 0),
            ])
            ->values();

        $recentPredictions = PredictionResult::query()
            ->with('screeningResult')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(static fn (PredictionResult $result): array => [
                'id' => $result->id,
                'thalassemia_risk' => $result->thalassemia_risk->value,
                'parents' => $result->screeningResult === null
                    ? 'Data skrining tidak tersedia'
                    : $result->screeningResult->father_name.' & '.$result->screeningResult->mother_name,
                'created_at' => $result->created_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'articles' => Article::query()->count(),
                'published_articles' => Article::query()->where('status', 'published')->count(),
                'illustrations' => MediaAsset::query()->count(),
                'phenotype_illustrations' => Phenotype::query()->whereNotNull('illustration_path')->count(),
                'knowledge_illustrations' => KnowledgeBaseRule::query()->whereNotNull('illustration_path')->count(),
                'training_data' => TrainingData::query()->count(),
                'prediction_results' => PredictionResult::query()->count(),
                'screening_results' => ScreeningResult::query()->count(),
                'knowledge_rules' => KnowledgeBaseRule::query()->count(),
                'phenotypes' => Phenotype::query()->count(),
                'users' => User::query()->count(),
                'admins' => User::query()->where('role', 'admin')->count(),
                'predictions_today' => PredictionResult::query()->whereDate('created_at', Carbon::today())->count(),
            ],
            'predictionDistribution' => $predictionDistribution,
            'recentPredictions' => $recentPredictions,
        ]);
    }
}
