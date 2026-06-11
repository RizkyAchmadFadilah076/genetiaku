import { Head, Link, router, useForm } from '@inertiajs/react';
import { History } from 'lucide-react';
import { useEffect  } from 'react';
import type {FormEvent} from 'react';

import InputError from '@/components/input-error';
import PublicLayout from '@/layouts/public-layout';
import { cn } from '@/lib/utils';

type PhenotypeOptions = Record<string, string[]>;

type PhenotypeIllustrations = Record<
    string,
    Record<string, { url: string; type: 'image' | 'gif' | 'video' | null }>
>;

interface ScreeningSummary {
    father_name: string;
    mother_name: string;
    father_result: string;
    mother_result: string;
}

interface PredictionFormProps {
    phenotypeOptions: PhenotypeOptions;
    phenotypeIllustrations: PhenotypeIllustrations;
    screening: ScreeningSummary;
}

type ParentKey = 'father' | 'mother';

interface PredictionForm {
    father_blood: string;
    father_iris: string;
    father_hair: string;
    father_ear: string;
    mother_blood: string;
    mother_iris: string;
    mother_hair: string;
    mother_ear: string;
    [key: string]: string;
}

type FieldSuffix = 'blood' | 'iris' | 'hair' | 'ear';

type PredictionFieldName = `${ParentKey}_${FieldSuffix}`;

const CATEGORY_FIELDS: { suffix: FieldSuffix; category: string }[] = [
    { suffix: 'blood', category: 'Golongan Darah' },
    { suffix: 'iris', category: 'Warna Iris Mata' },
    { suffix: 'hair', category: 'Tekstur Rambut' },
    { suffix: 'ear', category: 'Bentuk Cuping Telinga' },
];

const PARENTS: { key: ParentKey; label: string; nameField: 'father_name' | 'mother_name'; resultField: 'father_result' | 'mother_result' }[] = [
    { key: 'father', label: 'Ayah', nameField: 'father_name', resultField: 'father_result' },
    { key: 'mother', label: 'Ibu', nameField: 'mother_name', resultField: 'mother_result' },
];

const fieldName = (parent: ParentKey, suffix: FieldSuffix): PredictionFieldName =>
    `${parent}_${suffix}`;

export default function PredictionFormPage({ phenotypeOptions, phenotypeIllustrations, screening }: PredictionFormProps) {
    const { data, setData, post, processing, errors } = useForm<PredictionForm>({
        father_blood: '',
        father_iris: '',
        father_hair: '',
        father_ear: '',
        mother_blood: '',
        mother_iris: '',
        mother_hair: '',
        mother_ear: '',
    });

    useEffect(() => {
        router.reload({ only: ['phenotypeOptions', 'phenotypeIllustrations'] });
    }, []);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/prediksi');
    };

    return (
        <PublicLayout>
            <Head title="Prediksi Karakteristik Bayi" />

            <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-neutral-50">
                            Input Fenotipe Orang Tua
                        </h1>
                        <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
                            Pilih karakteristik fisik ayah dan ibu. Hasil skrining Tahap 1 telah
                            terisi otomatis dan tidak dapat diubah.
                        </p>
                    </div>
                    <Link
                        href="/prediksi/riwayat"
                        className={cn(
                            'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5',
                            'text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400',
                        )}
                    >
                        <History className="h-4 w-4" aria-hidden="true" />
                        Riwayat Sesi
                    </Link>
                </header>

                <section
                    aria-label="Hasil skrining Tahap 1"
                    className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900"
                >
                    <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-300">Hasil Skrining Thalassemia</h2>
                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {PARENTS.map((parent) => (
                            <div key={parent.key} className="space-y-1">
                                <dt className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                                    {parent.label}: {screening[parent.nameField]}
                                </dt>
                                <dd>
                                    <label
                                        htmlFor={`${parent.key}-screening-result`}
                                        className="sr-only"
                                    >
                                        Hasil skrining {parent.label.toLowerCase()}
                                    </label>
                                    <input
                                        id={`${parent.key}-screening-result`}
                                        type="text"
                                        value={screening[parent.resultField]}
                                        readOnly
                                        disabled
                                        aria-readonly="true"
                                        className="block min-h-11 w-full cursor-not-allowed rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                    />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <form onSubmit={submit} className="mt-8 space-y-8" noValidate>
                    {PARENTS.map((parent) => (
                        <fieldset
                            key={parent.key}
                            className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800"
                        >
                            <legend className="px-1 text-lg font-semibold text-rose-600 dark:text-rose-300">
                                Fenotipe {parent.label}
                            </legend>

                            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {CATEGORY_FIELDS.map(({ suffix, category }) => {
                                    const name = fieldName(parent.key, suffix);
                                    const inputId = `${parent.key}-${suffix}`;
                                    const options = phenotypeOptions[category] ?? [];
                                    const error = errors[name];
                                    const selected = data[name];
                                    const media = selected
                                        ? phenotypeIllustrations[category]?.[selected]
                                        : undefined;

                                    return (
                                        <div key={suffix}>
                                            <label
                                                htmlFor={inputId}
                                                className="block text-sm font-medium text-slate-700 dark:text-neutral-200"
                                            >
                                                {category}
                                            </label>
                                            <select
                                                id={inputId}
                                                name={name}
                                                value={data[name]}
                                                onChange={(event) => setData(name, event.target.value)}
                                                aria-invalid={error ? true : undefined}
                                                aria-describedby={error ? `${inputId}-error` : undefined}
                                                className={cn(
                                                    'mt-1 block min-h-11 w-full rounded-md border px-3 py-2 text-sm',
                                                    'text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100',
                                                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400',
                                                    error
                                                        ? 'border-red-500'
                                                        : 'border-neutral-300 dark:border-neutral-700',
                                                )}
                                            >
                                                <option value="">Pilih {category.toLowerCase()}…</option>
                                                {options.map((value) => (
                                                    <option key={value} value={value}>
                                                        {value}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError id={`${inputId}-error`} message={error} />
                                            {media ? (
                                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                                                    {media.type === 'video' ? (
                                                        <video
                                                            src={media.url}
                                                            autoPlay
                                                            muted
                                                            loop
                                                            playsInline
                                                            aria-hidden="true"
                                                            className="h-14 w-14 shrink-0 rounded-md object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={media.url}
                                                            alt=""
                                                            aria-hidden="true"
                                                            className="h-14 w-14 shrink-0 rounded-md object-cover"
                                                        />
                                                    )}
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Ilustrasi {category.toLowerCase()}: {selected}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </fieldset>
                    ))}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className={cn(
                                'inline-flex min-h-11 items-center justify-center rounded-full bg-rose-500 px-6 py-3',
                                'text-base font-semibold text-white transition-colors hover:bg-rose-600',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
                                'disabled:cursor-not-allowed disabled:opacity-60',
                            )}
                        >
                            {processing ? 'Menghitung…' : 'Lihat Hasil Prediksi'}
                        </button>
                    </div>
                </form>
            </section>
        </PublicLayout>
    );
}
