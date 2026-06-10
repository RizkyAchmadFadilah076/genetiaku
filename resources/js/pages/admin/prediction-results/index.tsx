import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface ScreeningResultSummary {
    id: number;
    father_name: string;
    mother_name: string;
    father_result: string;
    mother_result: string;
}

export interface PredictionResultRow {
    id: number;
    physical_result: Record<string, string>;
    thalassemia_risk: string;
    probabilities: Record<string, Record<string, number>>;
    created_at: string | null;
    screening_result: ScreeningResultSummary | null;
}

interface IndexProps {
    results: PredictionResultRow[];
}

const RISK_BADGE: Record<string, string> = {
    Minor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    Intermedia: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    Mayor: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function topProbability(
    probabilities: Record<string, Record<string, number>>,
    variable: string,
): string {
    const distribution = probabilities[variable];

    if (!distribution) {
        return '-';
    }

    const entries = Object.entries(distribution);

    if (entries.length === 0) {
        return '-';
    }

    const [label, value] = entries.reduce((best, current) =>
        current[1] > best[1] ? current : best,
    );

    return `${label} (${(value * 100).toFixed(1)}%)`;
}

export default function PredictionResultIndex({ results }: IndexProps) {
    const handleDelete = (id: number) => {
        if (confirm('Hapus Hasil Prediksi ini?')) {
            router.delete(`/admin/hasil-prediksi/${id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Hasil Prediksi" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Hasil Prediksi</h1>
                    <p className="text-sm text-muted-foreground">
                        Riwayat Hasil_Prediksi tersimpan beserta hasil fisik,
                        risiko Thalassemia, dan probabilitas.
                    </p>
                </div>

                {results.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-sidebar-border/70 p-10 text-center dark:border-sidebar-border">
                        <p className="text-muted-foreground">
                            Belum ada Hasil Prediksi tersimpan.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                        Orang Tua
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                        Hasil Fisik Bayi
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                        Risiko Thalassemia
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                        Prob. Risiko
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                        Dibuat
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result) => (
                                    <tr
                                        key={result.id}
                                        className="border-t border-sidebar-border/70 align-top dark:border-sidebar-border"
                                    >
                                        <td className="px-3 py-2">
                                            {result.screening_result ? (
                                                <div className="flex flex-col">
                                                    <span>
                                                        {
                                                            result
                                                                .screening_result
                                                                .father_name
                                                        }
                                                    </span>
                                                    <span>
                                                        {
                                                            result
                                                                .screening_result
                                                                .mother_name
                                                        }
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <ul className="flex flex-col gap-0.5">
                                                {Object.entries(
                                                    result.physical_result,
                                                ).map(([category, value]) => (
                                                    <li key={category}>
                                                        <span className="text-muted-foreground">
                                                            {category}:
                                                        </span>{' '}
                                                        {value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    RISK_BADGE[
                                                        result.thalassemia_risk
                                                    ] ?? 'bg-muted'
                                                }`}
                                            >
                                                {result.thalassemia_risk}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2">
                                            {topProbability(
                                                result.probabilities,
                                                'baby_thalassemia_risk',
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                            {formatDate(result.created_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={`/admin/hasil-prediksi/${result.id}`}
                                                    >
                                                        Detail
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(result.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

PredictionResultIndex.layout = {
    breadcrumbs: [{ title: 'Hasil Prediksi', href: '/admin/hasil-prediksi' }],
};
