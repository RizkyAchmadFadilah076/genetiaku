import { Head, Link } from '@inertiajs/react';
import {
    Baby,
    Clock,
    FileText,
    History,
    Printer,
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import PublicLayout from '@/layouts/public-layout';
import {
    getPredictionSessionEntries
    
} from '@/lib/prediction-session-history';
import type {PredictionSessionEntry} from '@/lib/prediction-session-history';
import { cn } from '@/lib/utils';

const VARIABLE_LABELS: Record<string, string> = {
    baby_blood: 'Golongan Darah',
    baby_iris: 'Warna Iris Mata',
    baby_hair: 'Tekstur Rambut',
    baby_ear: 'Bentuk Cuping Telinga',
    baby_thalassemia_risk: 'Risiko Thalassemia',
};

function variableLabel(key: string): string {
    return VARIABLE_LABELS[key] ?? key.replace(/^baby_/, '').replace(/_/g, ' ');
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

function riskBadge(risk: string): string {
    switch (risk) {
        case 'Mayor':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200';
        case 'Intermedia':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200';
        default:
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200';
    }
}

function ResultDetail({ entry }: { entry: PredictionSessionEntry }) {
    return (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {formatDate(entry.createdAt)}
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-50">
                        Hasil Prediksi #{entry.predictionId}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {entry.screening.father_name} dan {entry.screening.mother_name}
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold',
                            riskBadge(entry.thalassemiaRisk),
                        )}
                    >
                        {entry.thalassemiaRisk}
                    </span>
                    <Link
                        href={`/prediksi/${entry.predictionId}/cetak`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                    >
                        <Printer className="h-4 w-4" aria-hidden="true" />
                        Cetak
                    </Link>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                        <ShieldCheck className="h-4 w-4 text-rose-500" aria-hidden="true" />
                        Skrining Orang Tua
                    </h3>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-neutral-500">Ayah</dt>
                            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                                {entry.screening.father_name} ({entry.screening.father_result})
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-neutral-500">Ibu</dt>
                            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                                {entry.screening.mother_name} ({entry.screening.mother_result})
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                        <Baby className="h-4 w-4 text-rose-500" aria-hidden="true" />
                        Karakteristik Bayi
                    </h3>
                    <dl className="mt-3 space-y-2 text-sm">
                        {Object.entries(entry.physical).map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4">
                                <dt className="text-neutral-500">{label}</dt>
                                <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>

            <section className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                    <FileText className="h-4 w-4 text-rose-500" aria-hidden="true" />
                    Probabilitas
                </h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {Object.entries(entry.probabilities).map(([variable, classes]) => (
                        <div key={variable}>
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {variableLabel(variable)}
                            </h4>
                            <ul className="mt-2 space-y-1.5 text-sm">
                                {Object.entries(classes)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([label, probability]) => (
                                        <li
                                            key={label}
                                            className="flex justify-between gap-4 border-b border-neutral-200 pb-1.5 last:border-b-0 dark:border-neutral-800"
                                        >
                                            <span className="text-neutral-600 dark:text-neutral-400">
                                                {label}
                                            </span>
                                            <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                                                {formatPercentage(probability)}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </section>
    );
}

export default function PredictionHistoryPage() {
    const entries = useMemo(() => getPredictionSessionEntries(), []);
    const [selectedId, setSelectedId] = useState<number | null>(
        entries[0]?.predictionId ?? null,
    );
    const selectedEntry =
        entries.find((entry) => entry.predictionId === selectedId) ?? entries[0];

    return (
        <PublicLayout>
            <Head title="Riwayat Prediksi Sesi" />

            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                            <History className="h-4 w-4" aria-hidden="true" />
                            Riwayat sesi
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 dark:text-neutral-50">
                            Riwayat Hasil Prediksi
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
                            Riwayat ini hanya tersimpan selama website tidak di-refresh. Setelah
                            halaman dimuat ulang, daftar akan kosong kembali.
                        </p>
                    </div>
                    <Link
                        href="/prediksi"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Prediksi Lagi
                    </Link>
                </header>

                {entries.length === 0 ? (
                    <section className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <History className="mx-auto h-10 w-10 text-neutral-400" aria-hidden="true" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-neutral-100">
                            Belum ada riwayat pada sesi ini
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
                            Lakukan prediksi terlebih dahulu. Hasil yang muncul akan masuk ke
                            halaman ini selama Anda tidak melakukan refresh.
                        </p>
                    </section>
                ) : (
                    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="space-y-3">
                            {entries.map((entry) => (
                                <button
                                    key={entry.predictionId}
                                    type="button"
                                    onClick={() => setSelectedId(entry.predictionId)}
                                    className={cn(
                                        'w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors dark:bg-neutral-900',
                                        selectedEntry?.predictionId === entry.predictionId
                                            ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-800 dark:ring-rose-950/60'
                                            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800',
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-neutral-100">
                                            Prediksi #{entry.predictionId}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 text-xs font-bold',
                                                riskBadge(entry.thalassemiaRisk),
                                            )}
                                        >
                                            {entry.thalassemiaRisk}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                        {formatDate(entry.createdAt)}
                                    </p>
                                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
                                        {entry.screening.father_name} dan{' '}
                                        {entry.screening.mother_name}
                                    </p>
                                </button>
                            ))}
                        </aside>

                        {selectedEntry ? <ResultDetail entry={selectedEntry} /> : null}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
