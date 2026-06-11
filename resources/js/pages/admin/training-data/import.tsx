import { Head, router, useForm, usePage } from '@inertiajs/react';
import type {FormEvent} from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RowError {
    row: number;
    messages: string[];
}

interface ImportProps {
    columns: string[];
    phenotypeOptions: Record<string, string[]>;
    screeningOptions: string[];
    riskOptions: string[];
    rowErrors: RowError[];
    imported: number | null;
}

interface ImportForm {
    file: File | null;
    [key: string]: File | null;
}

export default function TrainingDataImport({
    columns,
    phenotypeOptions,
    screeningOptions,
    riskOptions,
    rowErrors,
}: ImportProps) {
    const page = usePage<{ flash: { success: string | null; error: string | null } }>();
    const flash = page.props.flash;

    const { setData, post, processing, errors, reset } = useForm<ImportForm>({
        file: null,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/admin/data-latih/import', {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    };

    return (
        <>
            <Head title="Impor Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Impor Data Latih</h1>
                        <p className="text-sm text-muted-foreground">
                            Unggah berkas Excel (.xlsx) sesuai template. CSV lama tetap didukung.
                            Seluruh baris divalidasi terlebih dahulu; bila ada baris tidak valid,
                            tidak ada data yang disimpan.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <a href="/admin/data-latih/template">Unduh Template Excel</a>
                        </Button>
                        <Button variant="outline" onClick={() => router.visit('/admin/data-latih')}>
                            Kembali
                        </Button>
                    </div>
                </div>

                {flash?.success ? (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        {flash.error}
                    </div>
                ) : null}

                <form
                    onSubmit={submit}
                    className="max-w-xl space-y-4 rounded-lg border border-sidebar-border/70 p-5 dark:border-sidebar-border"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="file">Berkas Excel / CSV</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            onChange={(event) => setData('file', event.target.files?.[0] ?? null)}
                        />
                        <InputError message={errors.file} />
                        <p className="text-xs text-muted-foreground">
                            Format utama: .xlsx dari template. Ukuran maksimal 8 MB. Untuk CSV,
                            pemisah kolom boleh koma (,) atau titik koma (;).
                        </p>
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Mengimpor...' : 'Impor'}
                    </Button>
                </form>

                {rowErrors.length > 0 ? (
                    <div className="rounded-lg border border-red-300 dark:border-red-900">
                        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                            Kesalahan per baris ({rowErrors.length}
                            {rowErrors.length >= 100 ? '+' : ''})
                        </div>
                        <ul className="max-h-80 divide-y divide-red-100 overflow-y-auto text-sm dark:divide-red-950">
                            {rowErrors.map((err) => (
                                <li key={err.row} className="px-4 py-2">
                                    <span className="font-medium">Baris {err.row}:</span>{' '}
                                    {err.messages.join(' ')}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <div className="rounded-lg border border-sidebar-border/70 p-5 dark:border-sidebar-border">
                    <h2 className="text-base font-semibold">Acuan Kolom & Nilai Valid</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sheet pertama wajib memuat seluruh nama kolom berikut pada baris pertama
                        (urutan boleh berbeda):
                    </p>
                    <code className="mt-2 block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
                        {columns.join(', ')}
                    </code>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {Object.entries(phenotypeOptions).map(([category, values]) => (
                            <div key={category} className="text-sm">
                                <span className="font-medium">{category}:</span>{' '}
                                <span className="text-muted-foreground">
                                    {values.length > 0 ? values.join(', ') : '- belum ada nilai -'}
                                </span>
                            </div>
                        ))}
                        <div className="text-sm">
                            <span className="font-medium">Status Thalassemia (ayah/ibu):</span>{' '}
                            <span className="text-muted-foreground">
                                {screeningOptions.join(', ')}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Risiko Thalassemia Bayi:</span>{' '}
                            <span className="text-muted-foreground">{riskOptions.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

TrainingDataImport.layout = {
    breadcrumbs: [
        { title: 'Data Latih', href: '/admin/data-latih' },
        { title: 'Impor', href: '/admin/data-latih/import' },
    ],
};
