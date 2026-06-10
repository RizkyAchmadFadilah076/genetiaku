<?php

namespace App\Http\Controllers\Admin;

use App\Domain\PhenotypeCategory;
use App\Domain\ScreeningCategory;
use App\Domain\ThalassemiaRisk;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TrainingDataRequest;
use App\Models\Phenotype;
use App\Models\TrainingData;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

/**
 * Manajemen Data_Latih Naive Bayes (Req 14).
 *
 * Resourceful: index, create, store, edit, update, destroy. Penyimpanan dan
 * pembaruan divalidasi oleh App\Http\Requests\Admin\TrainingDataRequest yang
 * menolak nilai di luar Data_Fenotipe/kategori Hasil_Skrining_Orang_Tua
 * (Req 14.3).
 */
class TrainingDataController extends Controller
{
    private const COLUMNS = [
        'father_blood', 'father_iris', 'father_hair', 'father_ear', 'father_thalassemia',
        'mother_blood', 'mother_iris', 'mother_hair', 'mother_ear', 'mother_thalassemia',
        'baby_blood', 'baby_iris', 'baby_hair', 'baby_ear', 'baby_thalassemia_risk',
    ];

    /**
     * Daftar baris Data_Latih beserta atribut ayah/ibu, status Thalassemia,
     * dan prediksi bayi (Req 14.1).
     */
    public function index(): Response
    {
        $rows = TrainingData::query()
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/training-data/index', [
            'rows' => $rows,
        ]);
    }

    /**
     * Formulir pembuatan baris Data_Latih baru.
     */
    public function create(): Response
    {
        return Inertia::render('admin/training-data/create', [
            'phenotypeOptions' => $this->phenotypeOptions(),
            'screeningOptions' => $this->screeningOptions(),
            'riskOptions' => $this->riskOptions(),
        ]);
    }

    /**
     * Simpan baris Data_Latih baru (Req 14.2, 14.3).
     */
    public function store(TrainingDataRequest $request): RedirectResponse
    {
        TrainingData::create($request->validated());

        return redirect()
            ->route('admin.data-latih.index')
            ->with('success', 'Baris Data Latih berhasil ditambahkan.');
    }

    /**
     * Formulir perubahan baris Data_Latih.
     */
    public function edit(TrainingData $dataLatih): Response
    {
        return Inertia::render('admin/training-data/edit', [
            'row' => $dataLatih,
            'phenotypeOptions' => $this->phenotypeOptions(),
            'screeningOptions' => $this->screeningOptions(),
            'riskOptions' => $this->riskOptions(),
        ]);
    }

    /**
     * Perbarui baris Data_Latih (Req 14.2, 14.3).
     */
    public function update(TrainingDataRequest $request, TrainingData $dataLatih): RedirectResponse
    {
        $dataLatih->update($request->validated());

        return redirect()
            ->route('admin.data-latih.index')
            ->with('success', 'Baris Data Latih berhasil diperbarui.');
    }

    /**
     * Hapus baris Data_Latih (Req 14.2).
     */
    public function destroy(TrainingData $dataLatih): RedirectResponse
    {
        $dataLatih->delete();

        return redirect()
            ->route('admin.data-latih.index')
            ->with('success', 'Baris Data Latih berhasil dihapus.');
    }

    /**
     * Unduh seluruh Data_Latih dalam format Excel.
     */
    public function export(): StreamedResponse
    {
        $filename = 'data-latih-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function (): void {
            echo $this->buildExportXlsx();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Hapus seluruh Data_Latih.
     */
    public function destroyAll(): RedirectResponse
    {
        $deleted = TrainingData::query()->delete();

        return redirect()
            ->route('admin.data-latih.index')
            ->with('success', $deleted.' baris Data Latih berhasil dihapus.');
    }

    /**
     * Opsi nilai fenotipe per kategori dari Data_Fenotipe terkini.
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

    /**
     * Opsi kategori Hasil_Skrining_Orang_Tua.
     *
     * @return list<string>
     */
    private function screeningOptions(): array
    {
        return array_map(
            static fn (ScreeningCategory $c): string => $c->value,
            ScreeningCategory::cases(),
        );
    }

    /**
     * Opsi klasifikasi Risiko_Thalassemia_Bayi.
     *
     * @return list<string>
     */
    private function riskOptions(): array
    {
        return array_map(
            static fn (ThalassemiaRisk $r): string => $r->value,
            ThalassemiaRisk::cases(),
        );
    }

    private function buildExportXlsx(): string
    {
        $rows = [
            self::COLUMNS,
        ];

        TrainingData::query()
            ->orderBy('id')
            ->chunk(500, function ($trainingRows) use (&$rows): void {
                foreach ($trainingRows as $trainingRow) {
                    $rows[] = array_map(
                        static fn (string $column): string => (string) $trainingRow->{$column},
                        self::COLUMNS,
                    );
                }
            });

        $tempPath = tempnam(sys_get_temp_dir(), 'training-export-');
        $zip = new ZipArchive();

        $zip->open($tempPath, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $this->xlsxContentTypes());
        $zip->addFromString('_rels/.rels', $this->xlsxRootRels());
        $zip->addFromString('docProps/app.xml', $this->xlsxAppProperties());
        $zip->addFromString('docProps/core.xml', $this->xlsxCoreProperties());
        $zip->addFromString('xl/workbook.xml', $this->xlsxWorkbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->xlsxWorkbookRels());
        $zip->addFromString('xl/styles.xml', $this->xlsxStyles());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->xlsxWorksheet($rows, [1]));
        $zip->close();

        $contents = (string) file_get_contents($tempPath);
        @unlink($tempPath);

        return $contents;
    }

    private function xlsxWorksheet(array $rows, array $boldRows = []): string
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
            .'<sheets><sheet name="Data Latih" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
    }

    private function xlsxWorkbookRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
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
            .'<dc:title>Export Data Latih Genetikaku</dc:title>'
            .'<dc:creator>Genetikaku</dc:creator>'
            .'</cp:coreProperties>';
    }
}
