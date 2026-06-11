<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $disclaimer = 'GENETIKAKU bersifat skrining dan edukasi awal, bukan alat diagnosis medis. '
            .'Hasil tidak menggantikan pemeriksaan laboratorium maupun konsultasi tenaga kesehatan. '
            .'Selalu konsultasikan kondisi Anda dengan dokter atau ahli genetika.';

        return Inertia::render('public/home', [
            'intro' => [
                'name' => 'GENETIKAKU',
                'tagline' => 'Prediksi risiko Thalassemia & prediksi karakteristik bayi berbasis Naive Bayes.',
                'description' => 'GENETIKAKU membantu calon orang tua melakukan skrining risiko Thalassemia '
                    .'serta memperkirakan karakteristik fisik bayi berdasarkan data fenotipe kedua orang tua. '
                    .'Sistem memandu Anda melalui empat tahap: skrining risiko, input fenotipe, '
                    .'perhitungan Naive Bayes, dan penyajian hasil beserta edukasi.',
            ],
            'highlights' => [
                [
                    'title' => 'Skrining Thalassemia',
                    'description' => 'Isi indikator skrining untuk ayah dan ibu guna memperoleh klasifikasi risiko.',
                ],
                [
                    'title' => 'Input Fenotipe',
                    'description' => 'Masukkan karakteristik fisik kedua orang tua sebagai dasar prediksi.',
                ],
                [
                    'title' => 'Perhitungan Naive Bayes',
                    'description' => 'Sistem menghitung prediksi berdasarkan data latih yang dikelola admin.',
                ],
                [
                    'title' => 'Hasil & Edukasi',
                    'description' => 'Lihat prediksi karakteristik bayi, risiko Thalassemia, dan penjelasan edukatif.',
                ],
            ],
            'disclaimer' => $disclaimer,
            'disclaimerAvailable' => $disclaimer !== '',
        ]);
    }
}
