import { Head, Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import { Component, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ArrowRight, BookOpen, ClipboardList, Dna, Info, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import FloatingBlood from '@/components/floating-blood';
import PublicLayout from '@/layouts/public-layout';
import { cn } from '@/lib/utils';

interface Highlight {
    title: string;
    description: string;
}

interface HomeProps {
    intro: {
        name: string;
        tagline: string;
        description: string;
    };
    highlights: Highlight[];
    disclaimer: string;
    disclaimerAvailable: boolean;
}


class DisclaimerBoundary extends Component<
    { onFailure: () => void; fallback: ReactNode; children: ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(_error: Error, _info: ErrorInfo) {
        this.props.onFailure();
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}


function Disclaimer({ text, onRendered }: { text: string; onRendered: () => void }) {
    useEffect(() => {
        onRendered();
    }, [onRendered]);

    return (
        <div
            role="note"
            aria-label="Pernyataan penyangkalan"
            className="rounded-xl border border-brand/40 bg-brand/5 p-4 text-sm text-neutral-700 dark:text-neutral-300"
        >
            <p className="flex items-center gap-2 font-semibold text-brand-strong">
                <Info className="h-4 w-4" aria-hidden="true" /> Penyangkalan
            </p>
            <p className="mt-1">{text}</p>
        </div>
    );
}

const STEP_STYLES: { icon: LucideIcon; gradient: string; ring: string; text: string }[] = [
    {
        icon: ClipboardList,
        gradient: 'from-rose-200 to-rose-300',
        ring: 'ring-rose-200/60',
        text: 'text-rose-600 dark:text-rose-300',
    },
    {
        icon: Dna,
        gradient: 'from-violet-200 to-violet-300',
        ring: 'ring-violet-200/60',
        text: 'text-violet-600 dark:text-violet-300',
    },
    {
        icon: Sparkles,
        gradient: 'from-sky-200 to-sky-300',
        ring: 'ring-sky-200/60',
        text: 'text-sky-600 dark:text-sky-300',
    },
    {
        icon: BookOpen,
        gradient: 'from-emerald-200 to-emerald-300',
        ring: 'ring-emerald-200/60',
        text: 'text-emerald-600 dark:text-emerald-300',
    },
];

export default function Home({ intro, highlights, disclaimer, disclaimerAvailable }: HomeProps) {
    
    const [disclaimerRendered, setDisclaimerRendered] = useState(false);

    
    const canStartScreening = disclaimerAvailable && disclaimerRendered;

    return (
        <PublicLayout
            footer={
                <p>
                    {disclaimer
                        ? disclaimer
                        : 'Pernyataan penyangkalan tidak tersedia saat ini.'}
                </p>
            }
        >
            <Head title="Beranda" />

            {/* HERO full-viewport dengan latar VIDEO autoplay/loop/muted (Req 6.1).
                Navigasi atas disediakan oleh PublicLayout (sticky, transparan) yang
                menumpuk di atas video & lapisan peredup. Konten utama diletakkan
                pada bagian bawah section. Sel darah mengapung & aksen warna
                dipertahankan. */}
            <section className="relative -mt-[73px] flex h-[100svh] min-h-[600px] w-full items-end overflow-hidden">
                {/* Video latar mengisi penuh, edge-to-edge. Poster = banner agar
                    tetap menarik sebelum/seandainya video belum tersedia. */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/images/banner-hero.webp"
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                >
                    <source src="/videos/hero.mp4" type="video/mp4" />
                    <source src="/videos/hero.webm" type="video/webm" />
                </video>

                {/* Lapisan peredup semi-transparan agar konten depan tetap terbaca */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-900/25"
                />
                {/* Tint hangat pastel (rose/violet) untuk menjaga nuansa warna */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-br from-rose-900/20 via-transparent to-violet-900/20"
                />

                {/* Sel darah mengapung (zigzag) di sisi kiri */}
                <FloatingBlood />

                {/* Konten bawah: heading, paragraf, lalu dua tombol CTA sebaris */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 text-left sm:pb-20"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Sistem Pakar Prediksi Thalassemia
                    </span>

                    {/* Heading pada barisnya sendiri */}
                    <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl">
                        {intro.name}
                    </h1>

                    {/* Paragraf pendukung tepat di bawah heading, lebar nyaman dibaca */}
                    <p className="mt-4 max-w-2xl text-base text-rose-100 sm:text-lg">
                        {intro.tagline}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                        {intro.description}
                    </p>

                    {/* Baris dua tombol CTA sejajar: primer (kiri) + sekunder (kanan).
                        Tetap satu kolom yang membungkus pada layar sempit. */}
                    <div className="mt-8 flex flex-row flex-wrap items-center gap-4">
                        {canStartScreening ? (
                            <Link
                                href="/skrining"
                                className={cn(
                                    'group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-rose-500 px-8 py-3.5',
                                    'text-base font-semibold text-white shadow-lg shadow-rose-900/30 transition-transform hover:scale-105 hover:bg-rose-600',
                                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                                )}
                            >
                                Mulai Prediksi
                                <ArrowRight
                                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link> 
                        ) : (
                            <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                title="Tautan tersedia setelah pernyataan penyangkalan ditampilkan."
                                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/30 px-8 py-3.5 text-base font-semibold text-white/80 backdrop-blur-sm"
                            >
                                Mulai Prediksi
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        )}

                        <Link
                            href="/artikel"
                            className={cn(
                                'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-8 py-3.5',
                                'text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                            )}
                        >
                            <BookOpen className="h-5 w-5" aria-hidden="true" />
                            Pelajari Lebih Lanjut
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Disclaimer (Req 6.3) wrapped in a boundary that gates the CTA (Req 6.4) */}
            <section className="mx-auto mt-12 max-w-2xl px-6">
                {disclaimerAvailable ? (
                    <DisclaimerBoundary
                        onFailure={() => setDisclaimerRendered(false)}
                        fallback={
                            <div
                                role="alert"
                                className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                            >
                                Pernyataan penyangkalan gagal ditampilkan. Akses ke alur skrining
                                ditahan sampai penyangkalan berhasil ditampilkan.
                            </div>
                        }
                    >
                        <Disclaimer text={disclaimer} onRendered={() => setDisclaimerRendered(true)} />
                    </DisclaimerBoundary>
                ) : (
                    <div
                        role="alert"
                        className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                        Pernyataan penyangkalan gagal ditampilkan. Akses ke alur skrining ditahan
                        sampai penyangkalan berhasil ditampilkan.
                    </div>
                )}
            </section>

            {/* Sorotan alur sebagai flow bernomor yang terhubung */}
            <section className="mx-auto mt-16 max-w-6xl px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="text-center text-3xl font-bold text-neutral-900 dark:text-neutral-50"
                >
                    Bagaimana{' '}
                    <span className="text-rose-600 dark:text-rose-300">
                        GENETIKAKU
                    </span>{' '}
                    bekerja
                </motion.h2>

                <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Garis penghubung horizontal (desktop) */}
                    <div
                        aria-hidden="true"
                        className="absolute top-7 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-rose-200 via-violet-200 to-emerald-200 lg:block dark:from-rose-900 dark:via-violet-900 dark:to-emerald-900"
                    />

                    {highlights.map((item, index) => {
                        const style = STEP_STYLES[index % STEP_STYLES.length];
                        const Icon = style.icon;

                        return (
                            <motion.li
                                key={item.title}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.4 }}
                                transition={{ duration: 0.5, delay: index * 0.12 }}
                                className="relative flex flex-col items-center text-center"
                            >
                                <div
                                    className={cn(
                                        'relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-slate-700 shadow-sm ring-8 ring-white dark:text-slate-900 dark:ring-neutral-950',
                                        style.gradient,
                                    )}
                                >
                                    <Icon className="h-6 w-6" aria-hidden="true" />
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-neutral-900 shadow dark:bg-neutral-900 dark:text-white">
                                        {index + 1}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        'mt-5 w-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ring-1 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900',
                                        style.ring,
                                    )}
                                >
                                    <h3 className={cn('font-semibold', style.text)}>{item.title}</h3>
                                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.li>
                        );
                    })}
                </ol>
            </section>

            {/* Navigasi konten publik (Req 6.2) */}
            <section className="mx-auto mt-16 mb-20 max-w-5xl px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/artikel"
                        className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-violet-50 p-6 text-slate-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                        <BookOpen className="h-8 w-8 text-violet-500 dark:text-violet-300" aria-hidden="true" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-neutral-100">Baca Artikel</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                            Edukasi seputar thalassemia dan pencegahannya.
                        </p>
                        <ArrowRight
                            className="mt-3 h-5 w-5 text-violet-500 transition-transform group-hover:translate-x-1 dark:text-violet-300"
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/tentang"
                        className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50 p-6 text-slate-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                        <Info className="h-8 w-8 text-rose-500 dark:text-rose-300" aria-hidden="true" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-neutral-100">Tentang GENETIKAKU</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                            Pelajari tujuan dan cara kerja sistem ini.
                        </p>
                        <ArrowRight
                            className="mt-3 h-5 w-5 text-rose-500 transition-transform group-hover:translate-x-1 dark:text-rose-300"
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}
