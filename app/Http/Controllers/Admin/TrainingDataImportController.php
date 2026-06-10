<?php

namespace App\Http\Controllers\Admin;

use App\Domain\PhenotypeCategory;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Http\Controllers\Controller;
use App\Models\Phenotype;
use App\Models\TrainingData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;


class TrainingDataImportController extends Controller
{
    
    public const COLUMNS = [
        'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
        'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
        'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
    ];

    
    public function create(): Response
    {
        return Inertia::render('admin/training-data/import', [
            'columns' => self::COLUMNS,
            'phenotypeOptions' => $this->phenotypeOptions(),
            'screeningOptions' => array_column(ScreeningCategory::cases(), 'value'),
            'riskOptions' => array_column(ThalassemiaRisk::cases(), 'value'),
            'rowErrors' => session('rowErrors', []),
            'imported' => session('imported'),
        ]);
    }

    
    public function template(): StreamedResponse
    {
        $filename = 'template-data-latih.csv';

        return response()->streamDownload(function (): void {
            $out = fopen('php://output', 'w');
           
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, self::COLUMNS);
            fputcsv($out, [
                'O', 'Cokelat', 'Lurus', 'Melekat', 'Penderita',
                'O', 'Hitam', 'Lurus', 'Terpisah', 'Carrier',
                'O', 'Cokelat', 'Lurus', 'Melekat', 'Intermedia',
            ]);
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

   
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:8192'],
        ], [
            'file.required' => 'Berkas CSV wajib diunggah.',
            'file.mimes' => 'Berkas harus berformat CSV (.csv). Dari Excel: Save As -> CSV.',
            'file.max' => 'Ukuran berkas maksimal 8 MB.',
        ]);

        [$records, $parseError] = $this->parseCsv($request->file('file')->getRealPath());

        if ($parseError !== null) {
            return back()->with('error', $parseError);
        }

        if ($records === []) {
            return back()->with('error', 'Berkas tidak berisi baris data.');
        }

        $rules = $this->rowRules();
        $rowErrors = [];
        $valid = [];

        foreach ($records as $index => $record) {
            $validator = Validator::make($record, $rules);

            if ($validator->fails()) {
                
                $rowErrors[] = [
                    'row' => $index + 2,
                    'messages' => $validator->errors()->all(),
                ];

                
                if (count($rowErrors) >= 100) {
                    break;
                }

                continue;
            }

            $valid[] = $validator->validated();
        }

        if ($rowErrors !== []) {
            return back()
                ->with('error', 'Impor dibatalkan: terdapat baris yang tidak valid. Tidak ada data yang disimpan.')
                ->with('rowErrors', $rowErrors);
        }

        $now = now();
        DB::transaction(function () use ($valid, $now): void {
            foreach (array_chunk($valid, 100) as $chunk) {
                TrainingData::query()->insert(array_map(
                    static fn (array $row): array => $row + ['created_at' => $now, 'updated_at' => $now],
                    $chunk,
                ));
            }
        });

        return redirect()
            ->route('admin.data-latih.index')
            ->with('success', count($valid).' baris Data Latih berhasil diimpor.');
    }

    private function parseCsv(string $path): array
    {
        $handle = @fopen($path, 'r');

        if ($handle === false) {
            return [[], 'Berkas tidak dapat dibaca.'];
        }

       
        $firstLine = (string) fgets($handle);
        rewind($handle);
        $delimiter = (substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';

        $header = fgetcsv($handle, 0, $delimiter);

        if ($header === false || $header === null) {
            fclose($handle);

            return [[], 'Berkas kosong atau tidak memiliki baris header.'];
        }

        
        $header = array_map(
            static fn ($name): string => strtolower(trim(str_replace("\xEF\xBB\xBF", '', (string) $name))),
            $header,
        );

        $missing = array_diff(self::COLUMNS, $header);

        if ($missing !== []) {
            fclose($handle);

            return [[], 'Kolom berikut tidak ditemukan pada header: '.implode(', ', $missing).'.'];
        }

        $records = [];

        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            // Lewati baris kosong.
            if ($line === [null] || $line === false || $this->isBlankRow($line)) {
                continue;
            }

            $record = [];
            foreach (self::COLUMNS as $column) {
                $position = array_search($column, $header, true);
                $record[$column] = $position === false ? '' : trim((string) ($line[$position] ?? ''));
            }

            $records[] = $record;
        }

        fclose($handle);

        return [$records, null];
    }

    private function isBlankRow(array $line): bool
    {
        foreach ($line as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }


    private function rowRules(): array
    {
        $columnCategory = [
            'father_blood' => PhenotypeCategory::GolonganDarah,
            'father_iris' => PhenotypeCategory::WarnaIris,
            'father_hair' => PhenotypeCategory::TeksturRambut,
            'father_ear' => PhenotypeCategory::BentukCuping,
            'mother_blood' => PhenotypeCategory::GolonganDarah,
            'mother_iris' => PhenotypeCategory::WarnaIris,
            'mother_hair' => PhenotypeCategory::TeksturRambut,
            'mother_ear' => PhenotypeCategory::BentukCuping,
            'baby_blood' => PhenotypeCategory::GolonganDarah,
            'baby_iris' => PhenotypeCategory::WarnaIris,
            'baby_hair' => PhenotypeCategory::TeksturRambut,
            'baby_ear' => PhenotypeCategory::BentukCuping,
        ];

        $allowedByCategory = $this->phenotypeOptions();

        $rules = [];
        foreach ($columnCategory as $column => $category) {
            $rules[$column] = ['required', 'string', Rule::in($allowedByCategory[$category->value] ?? [])];
        }

        $rules['father_thalassemia'] = ['required', 'string', Rule::in(array_column(ScreeningCategory::cases(), 'value'))];
        $rules['mother_thalassemia'] = ['required', 'string', Rule::in(array_column(ScreeningCategory::cases(), 'value'))];
        $rules['baby_thalassemia_risk'] = ['required', 'string', Rule::in(array_column(ThalassemiaRisk::cases(), 'value'))];

        return $rules;
    }

    /**
     * Nilai fenotipe valid per kategori dari Data_Fenotipe terkini.
     *
     * @return array<string, list<string>>
     */
    private function phenotypeOptions(): array
    {
        $options = [];

        foreach (PhenotypeCategory::cases() as $category) {
            $options[$category->value] = [];
        }

        foreach (Phenotype::query()->orderBy('value')->get(['category', 'value']) as $phenotype) {
            $category = $phenotype->category instanceof PhenotypeCategory
                ? $phenotype->category->value
                : (string) $phenotype->category;

            $options[$category][] = $phenotype->value;
        }

        return $options;
    }
}
