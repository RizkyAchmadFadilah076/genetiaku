<?php

namespace Database\Seeders;

use App\Models\TrainingData;
use Illuminate\Database\Seeder;


class TrainingDataSeeder extends Seeder
{
    
    private const ROW_COUNT = 160;

    public function run(): void
    {
        // Benih tetap -> dataset deterministik & reproducible.
        mt_srand(20240607);

        $blood = ['A', 'B', 'AB', 'O'];
        $iris = ['Cokelat', 'Hitam', 'Biru', 'Hijau'];
        $hair = ['Lurus', 'Bergelombang', 'Keriting'];
        $ear = ['Melekat', 'Terpisah'];
        $screening = ['Normal', 'Carrier', 'Penderita'];
        $severity = ['Normal' => 0, 'Carrier' => 1, 'Penderita' => 2];

        $rows = [];

        for ($n = 0; $n < self::ROW_COUNT; $n++) {
            $father = [
                'blood' => $this->pick($blood),
                'iris' => $this->pick($iris),
                'hair' => $this->pick($hair),
                'ear' => $this->pick($ear),
                'thalassemia' => $this->pick($screening),
            ];

            $mother = [
                'blood' => $this->pick($blood),
                'iris' => $this->pick($iris),
                'hair' => $this->pick($hair),
                'ear' => $this->pick($ear),
                'thalassemia' => $this->pick($screening),
            ];

           
            $baby = [
                'blood' => $this->inherit($father['blood'], $mother['blood']),
                'iris' => $this->inherit($father['iris'], $mother['iris']),
                'hair' => $this->inherit($father['hair'], $mother['hair']),
                'ear' => $this->inherit($father['ear'], $mother['ear']),
            ];

            $risk = $this->riskFor(
                $severity[$father['thalassemia']] + $severity[$mother['thalassemia']],
            );

            $rows[] = [
                'father_blood' => $father['blood'],
                'father_iris' => $father['iris'],
                'father_hair' => $father['hair'],
                'father_ear' => $father['ear'],
                'father_thalassemia' => $father['thalassemia'],

                'mother_blood' => $mother['blood'],
                'mother_iris' => $mother['iris'],
                'mother_hair' => $mother['hair'],
                'mother_ear' => $mother['ear'],
                'mother_thalassemia' => $mother['thalassemia'],

                'baby_blood' => $baby['blood'],
                'baby_iris' => $baby['iris'],
                'baby_hair' => $baby['hair'],
                'baby_ear' => $baby['ear'],
                'baby_thalassemia_risk' => $risk,
            ];
        }

        
        foreach (array_chunk($rows, 50) as $chunk) {
            TrainingData::query()->insert(
                array_map(static fn (array $row): array => $row + [
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $chunk),
            );
        }

        mt_srand(); // kembalikan RNG ke kondisi acak.
    }

    
    private function pick(array $items): string
    {
        return $items[mt_rand(0, count($items) - 1)];
    }

    
    private function inherit(string $fromFather, string $fromMother): string
    {
        return mt_rand(0, 1) === 0 ? $fromFather : $fromMother;
    }

    /**
     * Petakan jumlah skor keparahan kedua orang tua ke Risiko_Thalassemia_Bayi.
     */
    private function riskFor(int $severitySum): string
    {
        return match (true) {
            $severitySum <= 1 => 'Minor',
            $severitySum === 2 => 'Intermedia',
            default => 'Mayor',
        };
    }
}
