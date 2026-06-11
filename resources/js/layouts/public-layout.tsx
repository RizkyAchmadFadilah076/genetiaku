import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PublicNavItem {
    label: string;
    href: string;
}

const NAV_ITEMS: PublicNavItem[] = [
    { label: 'Beranda', href: '/' },
    { label: 'Artikel', href: '/artikel' },
    { label: 'Tentang', href: '/tentang' },
    { label: 'Prediksi', href: '/skrining' },
];

export const PUBLIC_DISCLAIMER =
    'GENETIKAKU bersifat skrining dan edukasi awal, bukan alat diagnosis medis, dan tidak menggantikan pemeriksaan laboratorium maupun konsultasi tenaga kesehatan.';

interface PublicLayoutProps {
    footer?: ReactNode;
}

export default function PublicLayout({ children, footer }: PropsWithChildren<PublicLayoutProps>) {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (href: string): boolean =>
        href === '/' ? url === '/' : url === href || url.startsWith(`${href}/`);

    return (
        <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md print:hidden dark:border-neutral-800/60 dark:bg-neutral-950/70">
                <nav
                    aria-label="Navigasi utama"
                    className="mx-auto flex w-full max-w-6xl items-center justify-between gap-x-2 px-4 py-3 sm:px-6 sm:py-4"
                >
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center gap-1.5 font-display text-lg font-bold tracking-tight text-slate-800 dark:text-neutral-100"
                    >
                        <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                        GENETIKAKU
                    </Link>

                    <ul className="hidden items-center gap-1 md:flex lg:gap-2">
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                            active
                                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                                : 'text-slate-600 hover:bg-neutral-100 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-nav"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 md:hidden dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                        {menuOpen ? (
                            <X className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        )}
                    </button>
                </nav>

                {menuOpen ? (
                    <div
                        id="mobile-nav"
                        className="border-t border-neutral-200/60 bg-white/95 px-4 py-2 backdrop-blur-md md:hidden dark:border-neutral-800/60 dark:bg-neutral-950/95"
                    >
                        <ul className="flex flex-col gap-1 py-1">
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(item.href);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={() => setMenuOpen(false)}
                                            className={cn(
                                                'flex min-h-11 items-center rounded-md px-3 py-2 text-base font-medium transition-colors',
                                                active
                                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                                    : 'text-slate-700 hover:bg-neutral-100 hover:text-rose-600 dark:text-neutral-200 dark:hover:bg-neutral-800',
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-neutral-200 bg-gradient-to-b from-transparent to-rose-50/60 px-6 py-6 print:hidden dark:border-neutral-800 dark:to-neutral-900/40">
                <div className="mx-auto w-full max-w-5xl space-y-2 text-sm text-slate-600 dark:text-neutral-400">
                    <div role="note" aria-label="Pernyataan penyangkalan">
                        {footer ?? <p>{PUBLIC_DISCLAIMER}</p>}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        &copy; {new Date().getFullYear()} GENETIKAKU.
                    </p>
                </div>
            </footer>
        </div>
    );
}
