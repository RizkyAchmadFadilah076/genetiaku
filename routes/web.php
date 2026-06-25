<?php

use App\Http\Controllers\Admin\AboutController as AdminAboutController;
use App\Http\Controllers\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PhenotypeController;
use App\Http\Controllers\Admin\PredictionResultController;
use App\Http\Controllers\Admin\KnowledgeBaseController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\TrainingDataController;
use App\Http\Controllers\Admin\TrainingDataImportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Public\AboutController;
use App\Http\Controllers\Public\ArticleController;
use App\Http\Controllers\Public\PredictionController;
use App\Http\Controllers\Public\ScreeningController;
use App\Http\Controllers\Public\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/skrining', [ScreeningController::class, 'show'])->name('skrining.show');
Route::post('/skrining', [ScreeningController::class, 'store'])->name('skrining.store');

Route::get('/prediksi', [PredictionController::class, 'create'])
    ->middleware('screening.completed')
    ->name('prediksi.create');

Route::post('/prediksi', [PredictionController::class, 'store'])
    ->middleware('screening.completed')
    ->name('prediksi.store');

Route::inertia('/prediksi/riwayat', 'public/prediction/history')
    ->middleware('screening.completed')
    ->name('prediksi.history');

Route::get('/prediksi/{predictionResult}/cetak', [PredictionController::class, 'print'])
    ->name('prediksi.print');

Route::get('artikel', [ArticleController::class, 'index'])->name('artikel.index');
Route::get('artikel/{slug}', [ArticleController::class, 'show'])->name('artikel.show');

Route::get('tentang', [AboutController::class, 'show'])->name('tentang.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');

    Route::resource('artikel', AdminArticleController::class)->except(['show']);

    
    Route::resource('fenotipe', PhenotypeController::class)->except(['show']);

    
    Route::get('tentang', [AdminAboutController::class, 'edit'])->name('tentang.edit');
    Route::put('tentang', [AdminAboutController::class, 'update'])->name('tentang.update');

    
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::post('media/{key}', [MediaController::class, 'update'])->name('media.update');

    
    Route::resource('basis-pengetahuan', KnowledgeBaseController::class)
        ->except(['show'])
        ->parameters(['basis-pengetahuan' => 'basis_pengetahuan']);

    
    Route::get('data-latih/import', [TrainingDataImportController::class, 'create'])
        ->name('data-latih.import');
    Route::post('data-latih/import', [TrainingDataImportController::class, 'store'])
        ->name('data-latih.import.store');
    Route::get('data-latih/template', [TrainingDataImportController::class, 'template'])
        ->name('data-latih.template');
    Route::get('data-latih/export', [TrainingDataController::class, 'export'])
        ->name('data-latih.export');
    Route::delete('data-latih/hapus-semua', [TrainingDataController::class, 'destroyAll'])
        ->name('data-latih.destroy-all');

    Route::resource('data-latih', TrainingDataController::class)
        ->except(['show'])
        ->parameters(['data-latih' => 'dataLatih']);

    Route::resource('hasil-prediksi', PredictionResultController::class)
        ->only(['index', 'show', 'destroy'])
        ->parameters(['hasil-prediksi' => 'hasilPrediksi']);

    Route::resource('pengguna', UserController::class)
        ->except(['show'])
        ->parameters(['pengguna' => 'pengguna']);
});

require __DIR__.'/settings.php';


