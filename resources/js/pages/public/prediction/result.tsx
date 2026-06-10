import { Head } from '@inertiajs/react';
import {
    Baby,
    BookOpen,
    CheckCircle2,
    Droplet,
    Ear,
    Eye,
    Info,
    Printer,
    ShieldCheck,
    Sparkles,
    Users,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import PublicLayout from '@/layouts/public-layout';
import { cn } from '@/lib/utils';

/** Hasil_Skrining Tahap 1 terkait (konteks). */
interface ScreeningSummary {
    father_name: string;
    mother_name: string;
    father_result: string;
    mother_result: string;
    father_indicators: string[];
    mother_indicators: string[];
}

/** Konten edukasi yang menyertai hasil (Req 4.4). */
interface EducationContent {
    result_explanation: string;
    thalassemia_info: string;
    follow_up_advice: string;
    method_explanation: string;
    mendel_basis: string;
    two_stage_flow: string;
}

interface PredictionResultProps {
    predictionId: number;
    physical: Record<string, string>;
    thalassemiaRisk: string;
    probabilities: Record<string, Record<string, number>>;
    screening: ScreeningSummary;
    education: EducationContent;
    disclaimer: string;
}

const VARIABLE_LABELS: Record<string, string> = {
    baby_blood: 'Golongan Darah',
    baby_iris: 'Warna Iris Mata',
    baby_hair: 'Tekstur Rambut',
    baby_ear: 'Bentuk Cuping Telinga',
    baby_thalassemia_risk: 'Risiko Thalassemia',
};

/** Ikon per kategori karakteristik fisik. */
const PHYSICAL_ICONS: Record<string, LucideIcon> = {
    'Golongan Darah': Droplet,
    'Warna Iris Mata': Eye,
    'Tekstur Rambut': Sparkles,
    'Bentuk Cuping Telinga': Ear,
};

const variableLabel = (key: string): string =>
    VARIABLE_LABELS[key] ?? key.replace(/^baby_/, '').replace(/_/g, ' ');

const toPercent = (value: number): number => Math.round(value * 1000) / 10;

/** Gaya badge & deskripsi berdasarkan klasifikasi risiko. */
const riskMeta = (
    risk: string,
): {
    badge: string;
    card: string;
    bar: string;
    note: string;
    meaning: string;
} => {
    switch (risk) {
        case 'Mayor':
            return {
                badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200',
                card: 'from-rose-50 to-rose-100/40 border-rose-200 dark:border-rose-900/60',
                bar: 'bg-rose-400',
                note: 'Disarankan pemeriksaan laboratorium dan konsultasi genetik lebih lanjut.',
                meaning:
                    'Thalassemia Mayor adalah bentuk paling berat. Penderita umumnya mengalami anemia parah sejak bayi dan biasanya membutuhkan transfusi darah rutin seumur hidup.',
            };
        case 'Intermedia':
            return {
                badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
                card: 'from-amber-50 to-amber-100/40 border-amber-200 dark:border-amber-900/60',
                bar: 'bg-amber-400',
                note: 'Pertimbangkan pemeriksaan lanjutan untuk memastikan kondisi.',
                meaning:
                    'Thalassemia Intermedia adalah tingkat menengah. Gejala anemia bersifat ringan hingga sedang dan transfusi darah hanya dibutuhkan sesekali pada kondisi tertentu.',
            };
        default:
            return {
                badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
                card: 'from-emerald-50 to-emerald-100/40 border-emerald-200 dark:border-emerald-900/60',
                bar: 'bg-emerald-400',
                note: 'Tetap jaga kesehatan dan lakukan pemeriksaan rutin sesuai anjuran.',
                meaning:
                    'Thalassemia Minor adalah tingkat paling ringan. Umumnya tanpa gejala atau hanya anemia ringan, dan biasanya tidak memerlukan pengobatan khusus.',
            };
    }
};

/** Ringkasan singkat ketiga tingkat risiko untuk konteks pembanding. */
const RISK_LEVEL_LEGEND: { label: string; dot: string; desc: string }[] = [
    {
        label: 'Minor',
        dot: 'bg-emerald-400',
        desc: 'Paling ringan — umumnya tanpa gejala, tidak perlu pengobatan khusus.',
    },
    {
        label: 'Intermedia',
        dot: 'bg-amber-400',
        desc: 'Menengah — anemia ringan hingga sedang, transfusi hanya sesekali.',
    },
    {
        label: 'Mayor',
        dot: 'bg-rose-400',
        desc: 'Paling berat — anemia parah, umumnya butuh transfusi darah rutin.',
    },
];

/** Gaya badge Hasil_Skrining_Orang_Tua (Normal/Carrier/Penderita). */
const screeningBadge = (result: string): string => {
    switch (result) {
        case 'Penderita':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200';
        case 'Carrier':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200';
        default:
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200';
    }
};

/** Kartu ringkasan skrining satu orang tua: nama, hasil, indikator dipilih. */
function ScreeningParentCard({
    name,
    result,
    indicators,
}: {
    name: string;
    result: string;
    indicators: string[];
}) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between gap-3">
                <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                    {name}
                </p>
                <span
                    className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-semibold',
                        screeningBadge(result),
                    )}
                >
                    {result}
                </span>
            </div>
            <div className="mt-3">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Indikator yang dipilih
                </p>
                {indicators.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {indicators.map((indicator) => (
                            <li
                                key={indicator}
                                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                {indicator}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Tidak ada indikator yang dipilih.
                    </p>
                )}
            </div>
        </div>
    );
}

/** Kartu seksi dengan judul beraksen ikon. */
function SectionCard({
    icon: Icon,
    title,
    children,
    className,
}: {
    icon: LucideIcon;
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg dark:text-neutral-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                {title}
            </h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

const EDUCATION_ITEMS: { key: keyof EducationContent; title: string }[] = [
    { key: 'method_explanation', title: 'Metode Naive Bayes' },
    { key: 'two_stage_flow', title: 'Alur Dua Tahap' },
    { key: 'mendel_basis', title: 'Dasar Hukum Mendel' },
    { key: 'result_explanation', title: 'Penjelasan Hasil' },
    { key: 'thalassemia_info', title: 'Tentang Thalassemia' },
    { key: 'follow_up_advice', title: 'Saran Pemeriksaan Lanjutan' },
];

const METHOD_STEPS = [
    { title: 'Prior', desc: 'Peluang awal tiap kemungkinan dari frekuensinya pada data latih.' },
    { title: 'Likelihood', desc: 'Peluang tiap fenotipe orang tua, dihaluskan dengan teknik Laplace.' },
    { title: 'Posterior', desc: 'Prior dikalikan likelihood, lalu dinormalisasi jadi persentase.' },
    { title: 'Keputusan', desc: 'Kemungkinan dengan posterior tertinggi dipilih sebagai prediksi.' },
];

export default function PredictionResultPage({
    physical,
    thalassemiaRisk,
    probabilities,
    screening,
    education,
    disclaimer,
}: PredictionResultProps) {
    const risk = riskMeta(thalassemiaRisk);

    return (
        <PublicLayout footer={<p>{disclaimer}</p>}>
            <Head title="Hasil Prediksi" />

            <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                {/* Hero */}
                <header className="overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-6 shadow-sm sm:p-8 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300">
                                <Baby className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl dark:text-neutral-50">
                                    Hasil Prediksi Karakteristik Bayi
                                </h1>
                                <p className="mt-1 text-sm text-slate-600 sm:text-base dark:text-neutral-400">
                                    Berdasarkan fenotipe{' '}
                                    <span className="font-medium text-slate-700 dark:text-neutral-300">
                                        {screening.father_name}
                                    </span>{' '}
                                    &amp;{' '}
                                    <span className="font-medium text-slate-700 dark:text-neutral-300">
                                        {screening.mother_name}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className={cn(
                                'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 sm:w-auto print:hidden',
                                'text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400',
                            )}
                        >
                            <Printer className="h-4 w-4" aria-hidden="true" />
                            Cetak Hasil
                        </button>
                    </div>
                </header>

                <div className="mt-6 space-y-6">
                    {/* Hasil Skrining Orang Tua (Tahap 1) — konteks sebelum hasil bayi */}
                    <SectionCard
                        icon={Users}
                        title="Hasil Skrining Orang Tua (Tahap 1)"
                    >
                        <p className="-mt-2 mb-4 text-sm text-slate-600 dark:text-neutral-400">
                            Klasifikasi status Thalassemia tiap orang tua dari indikator yang
                            dipilih. Hasil ini menjadi masukan untuk prediksi karakteristik bayi.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ScreeningParentCard
                                name={screening.father_name}
                                result={screening.father_result}
                                indicators={screening.father_indicators}
                            />
                            <ScreeningParentCard
                                name={screening.mother_name}
                                result={screening.mother_result}
                                indicators={screening.mother_indicators}
                            />
                        </div>
                    </SectionCard>

                    {/* Risiko Thalassemia — kartu menonjol */}
                    <section
                        className={cn(
                            'rounded-2xl border bg-gradient-to-br p-5 shadow-sm sm:p-6',
                            risk.card,
                        )}
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-slate-700 dark:bg-neutral-900/70 dark:text-neutral-200">
                                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                                        Risiko Thalassemia Bayi
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                                        {risk.note}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={cn(
                                    'inline-flex items-center self-start rounded-full px-5 py-2 text-lg font-bold sm:self-auto',
                                    risk.badge,
                                )}
                            >
                                {thalassemiaRisk}
                            </span>
                        </div>

                        {/* Penjelasan arti tingkat risiko hasil prediksi */}
                        <p className="mt-4 rounded-xl bg-white/60 p-3 text-sm leading-relaxed text-slate-700 dark:bg-neutral-900/50 dark:text-neutral-200">
                            <span className="font-semibold">Apa arti "{thalassemiaRisk}"? </span>
                            {risk.meaning}
                        </p>

                        {/* Legenda ketiga tingkat sebagai pembanding */}
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                            {RISK_LEVEL_LEGEND.map((level) => (
                                <div
                                    key={level.label}
                                    className={cn(
                                        'rounded-xl border bg-white/50 p-3 dark:bg-neutral-900/40',
                                        level.label === thalassemiaRisk
                                            ? 'border-slate-400 dark:border-neutral-500'
                                            : 'border-transparent',
                                    )}
                                >
                                    <dt className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                                        <span
                                            className={cn(
                                                'h-2.5 w-2.5 rounded-full',
                                                level.dot,
                                            )}
                                            aria-hidden="true"
                                        />
                                        {level.label}
                                    </dt>
                                    <dd className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-neutral-400">
                                        {level.desc}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Karakteristik fisik bayi */}
                    <SectionCard icon={Baby} title="Karakteristik Fisik Bayi">
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {Object.entries(physical).map(([category, value]) => {
                                const Icon = PHYSICAL_ICONS[category] ?? Sparkles;
                                return (
                                    <div
                                        key={category}
                                        className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-300">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <dt className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                                {category}
                                            </dt>
                                            <dd className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                                {value}
                                            </dd>
                                        </div>
                                    </div>
                                );
                            })}
                        </dl>
                    </SectionCard>

                    {/* Probabilitas */}
                    <SectionCard icon={Workflow} title="Probabilitas Prediksi">
                        <p className="-mt-2 mb-4 text-sm text-slate-600 dark:text-neutral-400">
                            Tingkat keyakinan model terhadap setiap kemungkinan.
                        </p>
                        <div className="space-y-5">
                            {Object.entries(probabilities).map(([variable, classes]) => (
                                <div key={variable}>
                                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                        {variableLabel(variable)}
                                    </h3>
                                    <ul className="mt-2 space-y-2">
                                        {Object.entries(classes)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([className, probability], index) => {
                                                const percent = toPercent(probability);
                                                return (
                                                    <li key={className}>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                                {className}
                                                            </span>
                                                            <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                                                                {percent}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            role="meter"
                                                            aria-valuenow={percent}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-label={`${variableLabel(variable)}: ${className} ${percent} persen`}
                                                            className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'h-full rounded-full',
                                                                    index === 0
                                                                        ? 'bg-rose-300 dark:bg-rose-500/60'
                                                                        : 'bg-neutral-200 dark:bg-neutral-700',
                                                                )}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Cara kerja Naive Bayes */}
                    <SectionCard icon={Workflow} title="Cara Kerja Prediksi (Naive Bayes)">
                        <p className="-mt-2 text-sm leading-relaxed text-slate-600 dark:text-neutral-300">
                            Prediksi dihitung dengan algoritma Naive Bayes dari data latih: fenotipe
                            ayah &amp; ibu ditambah hasil skrining Thalassemia kedua orang tua (Tahap 1).
                        </p>
                        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                            {METHOD_STEPS.map((step, index) => (
                                <li
                                    key={step.title}
                                    className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200 text-xs font-bold text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-neutral-300">
                                        <span className="font-semibold text-slate-800 dark:text-neutral-100">
                                            {step.title}
                                        </span>{' '}
                                        — {step.desc}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </SectionCard>

                    {/* Edukasi */}
                    <SectionCard icon={BookOpen} title="Edukasi">
                        <div className="space-y-4">
                            {EDUCATION_ITEMS.map((item) => (
                                <div key={item.key}>
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                        {education[item.key]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Disclaimer */}
                    <section
                        aria-label="Pernyataan penyangkalan"
                        className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                    >
                        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>{disclaimer}</p>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}
