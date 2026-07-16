import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ActionModal } from '@/components/action-modal';
import { Button } from '@/components/ui/button';
import type { PredictionResultRow } from './index';

interface ShowProps {
    result: PredictionResultRow;
}

const RISK_BADGE: Record<string, string> = {
    Rendah: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    Sedang: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    Tinggi: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

const VARIABLE_LABELS: Record<string, string> = {
    baby_thalassemia_risk: 'Risiko Thalassemia Bayi',
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

function sortedDistribution(
    distribution: Record<string, number>,
): [string, number][] {
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
}

export default function PredictionResultShow({ result }: ShowProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDelete = () => {
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/admin/hasil-prediksi/${result.id}`);
    };

    const screening = result.screening_result;

    return (
        <>
            <Head title={`Hasil Prediksi #${result.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Hasil Prediksi #{result.id}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Dibuat {formatDate(result.created_at)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/admin/hasil-prediksi">Kembali</Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </div>
                </div>

                <section className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="mb-3 text-lg font-semibold">
                        Hasil Skrining Terkait
                    </h2>
                    {screening ? (
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Nama Ayah
                                </dt>
                                <dd>{screening.father_name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Nama Ibu
                                </dt>
                                <dd>{screening.mother_name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Hasil Skrining Ayah
                                </dt>
                                <dd>{screening.father_result}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Hasil Skrining Ibu
                                </dt>
                                <dd>{screening.mother_result}</dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="text-muted-foreground">
                            Hasil Skrining terkait tidak tersedia.
                        </p>
                    )}
                </section>

                <section className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="mb-3 text-lg font-semibold">
                        Prediksi Karakteristik Fisik Bayi
                    </h2>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                        {Object.entries(result.physical_result).map(
                            ([category, value]) => (
                                <div key={category}>
                                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                        {category}
                                    </dt>
                                    <dd>{value}</dd>
                                </div>
                            ),
                        )}
                    </dl>
                </section>

                <section className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="mb-3 text-lg font-semibold">
                        Risiko Thalassemia Bayi
                    </h2>
                    <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                            RISK_BADGE[result.thalassemia_risk] ?? 'bg-muted'
                        }`}
                    >
                        {result.thalassemia_risk}
                    </span>
                </section>

                <section className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="mb-3 text-lg font-semibold">
                        Probabilitas Posterior
                    </h2>
                    <div className="flex flex-col gap-5">
                        {Object.entries(result.probabilities).map(
                            ([variable, distribution]) => (
                                <div key={variable}>
                                    <h3 className="mb-2 text-sm font-medium">
                                        {VARIABLE_LABELS[variable] ?? variable}
                                    </h3>
                                    <ul className="flex flex-col gap-1.5">
                                        {sortedDistribution(distribution).map(
                                            ([label, value]) => (
                                                <li
                                                    key={label}
                                                    className="flex items-center gap-3"
                                                >
                                                    <span className="w-40 shrink-0 text-sm">
                                                        {label}
                                                    </span>
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{
                                                                width: `${Math.min(value * 100, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                                                        {(value * 100).toFixed(
                                                            1,
                                                        )}
                                                        %
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            ),
                        )}
                    </div>
                </section>
            </div>

            <ActionModal
                open={deleteModalOpen}
                title="Hapus hasil prediksi"
                description="Hapus Hasil Prediksi ini?"
                confirmLabel="Hapus"
                confirmVariant="destructive"
                onOpenChange={setDeleteModalOpen}
                onConfirm={confirmDelete}
            />
        </>
    );
}

PredictionResultShow.layout = {
    breadcrumbs: [
        { title: 'Hasil Prediksi', href: '/admin/hasil-prediksi' },
        { title: 'Detail', href: '#' },
    ],
};
