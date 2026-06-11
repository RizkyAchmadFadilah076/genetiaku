import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { motion } from 'motion/react';

import PublicLayout from '@/layouts/public-layout';

interface AboutContent {
    title: string;
    content: string;
    image_url: string | null;
}

interface AboutPageProps {
    about: AboutContent | null;
}

export default function About({ about }: AboutPageProps) {
    return (
        <PublicLayout>
            <Head title={about?.title ?? 'Tentang'} />

            {about ? (
                <>
                    {about.image_url ? (
                        <section className="relative h-64 w-full overflow-hidden sm:h-80">
                            <img
                                src={about.image_url}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/55 to-transparent dark:from-neutral-950/90 dark:via-neutral-950/55"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-5xl px-6 pb-8"
                            >
                                <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl dark:text-neutral-50">
                                    {about.title}
                                </h1>
                            </motion.div>
                        </section>
                    ) : null}

                    <motion.article
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: about.image_url ? 0.15 : 0 }}
                        className="mx-auto w-full max-w-5xl px-6 py-10"
                    >
                        {!about.image_url ? (
                            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-800 dark:text-neutral-50">
                                {about.title}
                            </h1>
                        ) : null}
                        <div className="prose prose-neutral max-w-none leading-relaxed whitespace-pre-line text-slate-600 dark:prose-invert dark:text-neutral-300">
                            {about.content}
                        </div>
                    </motion.article>
                </>
            ) : (
                <div className="mx-auto w-full max-w-5xl px-6 py-10">
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300">
                            <Info className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800 dark:text-neutral-100">
                            Tentang
                        </h1>
                        <p className="mt-2 text-slate-500 dark:text-neutral-400">
                            Konten belum tersedia.
                        </p>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
