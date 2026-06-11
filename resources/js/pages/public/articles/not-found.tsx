import { Head, Link } from '@inertiajs/react';
import { FileQuestion } from 'lucide-react';
import { motion } from 'motion/react';

import PublicLayout from '@/layouts/public-layout';

export default function ArticlesNotFound() {
    return (
        <PublicLayout>
            <Head title="Artikel tidak ditemukan" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center"
            >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500 shadow-sm dark:bg-rose-950/40 dark:text-rose-300">
                    <FileQuestion className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="mt-6 text-sm font-semibold text-rose-600 dark:text-rose-300">404</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                    Artikel tidak ditemukan
                </h1>
                <p className="mt-3 text-slate-500 dark:text-neutral-400">
                    Artikel yang Anda cari tidak tersedia atau belum dipublikasikan.
                </p>
                <Link
                    href="/artikel"
                    className="mt-8 inline-flex min-h-11 items-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                    Kembali ke daftar artikel
                </Link>
            </motion.div>
        </PublicLayout>
    );
}
