import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Newspaper } from 'lucide-react';
import { motion } from 'motion/react';

import PublicLayout from '@/layouts/public-layout';

interface ArticleListItem {
    title: string;
    slug: string;
    image_url: string | null;
    excerpt: string | null;
}

interface ArticlesIndexProps {
    articles: ArticleListItem[];
}


const FALLBACK_GRADIENTS = [
    'from-violet-50 to-rose-50',
    'from-rose-50 to-violet-50',
    'from-sky-50 to-violet-50',
    'from-emerald-50 to-sky-50',
    'from-amber-50 to-rose-50',
    'from-rose-50 to-sky-50',
];

export default function ArticlesIndex({ articles }: ArticlesIndexProps) {
    return (
        <PublicLayout>
            <Head title="Artikel" />

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                        <Newspaper className="h-4 w-4" aria-hidden="true" /> Edukasi
                    </span>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-800 dark:text-neutral-50">
                        Pusat Informasi & Edukasi
                    </h1>
                </motion.header>

                {articles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300">
                            <BookOpen className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-slate-500 dark:text-neutral-400">
                            Belum ada artikel yang dipublikasikan.
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.map((article, index) => {
                            const gradient =
                                FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

                            return (
                                <motion.li
                                    key={article.slug}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, delay: index * 0.08 }}
                                >
                                    <Link
                                        href={`/artikel/${article.slug}`}
                                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 dark:border-neutral-800 dark:bg-neutral-900"
                                    >
                                        <div className="relative h-44 overflow-hidden">
                                            {article.image_url ? (
                                                <img
                                                    src={article.image_url}
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div
                                                    aria-hidden="true"
                                                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
                                                >
                                                    <BookOpen
                                                        className="h-12 w-12 text-rose-300 dark:text-rose-400/60"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col p-5">
                                            <h2 className="text-lg font-semibold text-slate-800 transition-colors group-hover:text-rose-600 dark:text-neutral-100">
                                                {article.title}
                                            </h2>
                                            {article.excerpt ? (
                                                <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-neutral-400">
                                                    {article.excerpt}
                                                </p>
                                            ) : null}
                                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-300">
                                                Baca selengkapnya
                                                <ArrowRight
                                                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </PublicLayout>
    );
}
