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
use ZipArchive;


class TrainingDataImportController extends Controller
{
    
    public const COLUMNS = [
        'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
        'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
        'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
    ];

    private const COLUMN_LABELS = [
        'father_blood' => 'Golongan Darah Ayah',
        'father_iris' => 'Warna Iris Mata Ayah',
        'father_hair' => 'Tekstur Rambut Ayah',
        'father_ear' => 'Bentuk Cuping Telinga Ayah',
        'father_thalassemia' => 'Status Thalassemia Ayah',
        'mother_blood' => 'Golongan Darah Ibu',
        'mother_iris' => 'Warna Iris Mata Ibu',
        'mother_hair' => 'Tekstur Rambut Ibu',
        'mother_ear' => 'Bentuk Cuping Telinga Ibu',
        'mother_thalassemia' => 'Status Thalassemia Ibu',
        'baby_blood' => 'Golongan Darah Bayi',
        'baby_iris' => 'Warna Iris Mata Bayi',
        'baby_hair' => 'Tekstur Rambut Bayi',
        'baby_ear' => 'Bentuk Cuping Telinga Bayi',
        'baby_thalassemia_risk' => 'Risiko Thalassemia Bayi',
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
        $filename = 'template-data-latih.xlsx';

        return response()->streamDownload(function (): void {
            echo $this->buildXlsxTemplate();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

   
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,txt', 'max:8192'],
        ], [
            'file.required' => 'Berkas Excel/CSV wajib diunggah.',
            'file.mimes' => 'Berkas harus berformat Excel (.xlsx) atau CSV (.csv).',
            'file.max' => 'Ukuran berkas maksimal 8 MB.',
        ]);

        $file = $request->file('file');
        $extension = strtolower((string) $file->getClientOriginalExtension());

        [$records, $parseError] = $extension === 'xlsx'
            ? $this->parseXlsx($file->getRealPath())
            : $this->parseCsv($file->getRealPath());

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

        $header = $this->normalizeHeader($header);

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

    private function parseXlsx(string $path): array
    {
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            return [[], 'Berkas Excel tidak dapat dibuka. Pastikan formatnya .xlsx.'];
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');

        if ($sheetXml === false) {
            $zip->close();

            return [[], 'Berkas Excel tidak memiliki sheet data pertama.'];
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $zip->close();

        $xml = simplexml_load_string($sheetXml);

        if ($xml === false) {
            return [[], 'Sheet Excel tidak dapat dibaca.'];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $rowNode) {
            $row = [];

            foreach ($rowNode->c as $cellNode) {
                $reference = (string) $cellNode['r'];
                $columnIndex = $this->columnIndexFromCellReference($reference);
                $row[$columnIndex] = $this->xlsxCellValue($cellNode, $sharedStrings);
            }

            if ($this->isBlankRow($row)) {
                continue;
            }

            ksort($row);
            $lastColumn = max(array_keys($row));
            $values = [];
            for ($column = 0; $column <= $lastColumn; $column++) {
                $values[] = $row[$column] ?? '';
            }
            $rows[] = $values;
        }

        if ($rows === []) {
            return [[], 'Berkas Excel kosong.'];
        }

        $header = $this->normalizeHeader(array_shift($rows));
        $missing = array_diff(self::COLUMNS, $header);

        if ($missing !== []) {
            return [[], 'Kolom berikut tidak ditemukan pada header: '.implode(', ', $missing).'.'];
        }

        $records = [];
        foreach ($rows as $line) {
            if ($this->isBlankRow($line)) {
                continue;
            }

            $record = [];
            foreach (self::COLUMNS as $column) {
                $position = array_search($column, $header, true);
                $record[$column] = $position === false ? '' : trim((string) ($line[$position] ?? ''));
            }

            $records[] = $record;
        }

        return [$records, null];
    }

    private function normalizeHeader(array $header): array
    {
        return array_map(
            static fn ($name): string => strtolower(trim(str_replace("\xEF\xBB\xBF", '', (string) $name))),
            $header,
        );
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xmlString = $zip->getFromName('xl/sharedStrings.xml');

        if ($xmlString === false) {
            return [];
        }

        $xml = simplexml_load_string($xmlString);

        if ($xml === false) {
            return [];
        }

        $strings = [];
        foreach ($xml->si as $si) {
            if (isset($si->t)) {
                $strings[] = (string) $si->t;
                continue;
            }

            $text = '';
            foreach ($si->r as $run) {
                $text .= (string) $run->t;
            }
            $strings[] = $text;
        }

        return $strings;
    }

    private function xlsxCellValue(\SimpleXMLElement $cellNode, array $sharedStrings): string
    {
        $type = (string) $cellNode['t'];

        if ($type === 's') {
            $index = (int) ($cellNode->v ?? 0);

            return trim((string) ($sharedStrings[$index] ?? ''));
        }

        if ($type === 'inlineStr') {
            return trim((string) ($cellNode->is->t ?? ''));
        }

        return trim((string) ($cellNode->v ?? ''));
    }

    private function columnIndexFromCellReference(string $reference): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($reference)) ?: 'A';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
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

    private function buildXlsxTemplate(): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'training-template-');
        $zip = new ZipArchive();

        $zip->open($tempPath, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $this->xlsxContentTypes());
        $zip->addFromString('_rels/.rels', $this->xlsxRootRels());
        $zip->addFromString('docProps/app.xml', $this->xlsxAppProperties());
        $zip->addFromString('docProps/core.xml', $this->xlsxCoreProperties());
        $zip->addFromString('xl/workbook.xml', $this->xlsxWorkbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->xlsxWorkbookRels());
        $zip->addFromString('xl/styles.xml', $this->xlsxStyles());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->xlsxWorksheet(
            'Data Latih',
            [
                self::COLUMNS,
                [
                    'O', 'Cokelat', 'Lurus', 'Melekat', 'Penderita',
                    'O', 'Hitam', 'Lurus', 'Terpisah', 'Carrier',
                    'O', 'Cokelat', 'Lurus', 'Melekat', 'Intermedia',
                ],
                [
                    'A', 'Hitam', 'Keriting', 'Terpisah', 'Carrier',
                    'B', 'Cokelat', 'Lurus', 'Melekat', 'Normal',
                    'AB', 'Hitam', 'Keriting', 'Terpisah', 'Minor',
                ],
            ],
            [1],
        ));
        $zip->addFromString('xl/worksheets/sheet2.xml', $this->xlsxWorksheet(
            'Panduan Kolom',
            array_merge(
                [['Nama Kolom', 'Keterangan']],
                array_map(
                    static fn (string $column): array => [$column, self::COLUMN_LABELS[$column]],
                    self::COLUMNS,
                ),
            ),
            [1],
        ));
        $zip->addFromString('xl/worksheets/sheet3.xml', $this->xlsxWorksheet(
            'Acuan Nilai',
            $this->referenceRows(),
            [1],
        ));
        $zip->close();

        $contents = (string) file_get_contents($tempPath);
        @unlink($tempPath);

        return $contents;
    }

    private function referenceRows(): array
    {
        $rows = [['Kategori', 'Nilai Valid']];

        foreach ($this->phenotypeOptions() as $category => $values) {
            $rows[] = [$category, implode(', ', $values)];
        }

        $rows[] = ['Status Thalassemia Ayah/Ibu', implode(', ', array_column(ScreeningCategory::cases(), 'value'))];
        $rows[] = ['Risiko Thalassemia Bayi', implode(', ', array_column(ThalassemiaRisk::cases(), 'value'))];

        return $rows;
    }

    private function xlsxWorksheet(string $name, array $rows, array $boldRows = []): string
    {
        $xmlRows = [];

        foreach ($rows as $rowIndex => $row) {
            $cells = [];
            foreach ($row as $columnIndex => $value) {
                $reference = $this->xlsxColumnName($columnIndex + 1).($rowIndex + 1);
                $style = in_array($rowIndex + 1, $boldRows, true) ? ' s="1"' : '';
                $cells[] = sprintf(
                    '<c r="%s" t="inlineStr"%s><is><t>%s</t></is></c>',
                    $reference,
                    $style,
                    htmlspecialchars((string) $value, ENT_XML1)
                );
            }
            $xmlRows[] = sprintf('<row r="%d">%s</row>', $rowIndex + 1, implode('', $cells));
        }

        $lastColumn = $this->xlsxColumnName(max(1, count($rows[0] ?? [])));
        $lastRow = max(1, count($rows));

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<dimension ref="A1:'.$lastColumn.$lastRow.'"/>'
            .'<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
            .'<sheetFormatPr defaultRowHeight="15"/>'
            .'<cols><col min="1" max="'.$this->xlsxColumnNumber($lastColumn).'" width="24" customWidth="1"/></cols>'
            .'<sheetData>'.implode('', $xmlRows).'</sheetData>'
            .'</worksheet>';
    }

    private function xlsxColumnName(int $index): string
    {
        $name = '';

        while ($index > 0) {
            $index--;
            $name = chr(65 + ($index % 26)).$name;
            $index = intdiv($index, 26);
        }

        return $name;
    }

    private function xlsxColumnNumber(string $column): int
    {
        $number = 0;

        foreach (str_split($column) as $letter) {
            $number = ($number * 26) + (ord($letter) - 64);
        }

        return $number;
    }

    private function xlsxContentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            .'<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            .'</Types>';
    }

    private function xlsxRootRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            .'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            .'</Relationships>';
    }

    private function xlsxWorkbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'
            .'<sheet name="Data Latih" sheetId="1" r:id="rId1"/>'
            .'<sheet name="Panduan Kolom" sheetId="2" r:id="rId2"/>'
            .'<sheet name="Acuan Nilai" sheetId="3" r:id="rId3"/>'
            .'</sheets></workbook>';
    }

    private function xlsxWorkbookRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
            .'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>'
            .'<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
    }

    private function xlsxStyles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
            .'<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
            .'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
            .'</styleSheet>';
    }

    private function xlsxAppProperties(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
            .'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
            .'<Application>Genetikaku</Application></Properties>';
    }

    private function xlsxCoreProperties(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            .'xmlns:dc="http://purl.org/dc/elements/1.1/" '
            .'xmlns:dcterms="http://purl.org/dc/terms/" '
            .'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
            .'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            .'<dc:title>Template Data Latih Genetikaku</dc:title>'
            .'<dc:creator>Genetikaku</dc:creator>'
            .'</cp:coreProperties>';
    }
}
