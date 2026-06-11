import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

import PublicLayout from '@/layouts/public-layout';

interface RelatedArticle {
    title: string;
    slug: string;
}

interface ArticleDetail {
    title: string;
    summary: string | null;
    content: string;
    image_url: string | null;
    published_at: string | null;
}

interface ArticlesShowProps {
    article: ArticleDetail;
    related: RelatedArticle[];
}

interface Section {
    id: string;
    heading: string;
    blocks: string[];
}

interface ParsedContent {
    intro: string[];
    sections: Section[];
}


function slugifyHeading(text: string, index: number): string {
    const base = text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    return base ? `${base}-${index}` : `bagian-${index}`;
}


function parseContent(content: string): ParsedContent {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const intro: string[] = [];
    const sections: Section[] = [];

    let current: Section | null = null;
    let buffer: string[] = [];

    const flush = () => {
        const block = buffer.join('\n').trim();
        buffer = [];

        if (!block) {
            return;
        }

        if (current) {
            current.blocks.push(block);
        } else {
            intro.push(block);
        }
    };

    const headingRe = /^#{1,3}\s+(.*)$/;

    for (const line of lines) {
        const match = line.match(headingRe);

        if (match) {
            flush();
            const heading = match[1].trim();
            current = { id: slugifyHeading(heading, sections.length), heading, blocks: [] };
            sections.push(current);
            continue;
        }

        if (line.trim() === '') {
            flush();
            continue;
        }

        buffer.push(line);
    }

    flush();

    return { intro, sections };
}


function ContentBlock({ block }: { block: string }) {
    const rows = block.split('\n');
    const isList = rows.every((row) => /^\s*[-•]\s+/.test(row));

    if (isList) {
        return (
            <ul className="space-y-2">
                {rows.map((row, index) => (
                    <li key={index} className="flex gap-2.5">
                        <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"
                        />
                        <span>{row.replace(/^\s*[-•]\s+/, '')}</span>
                    </li>
                ))}
            </ul>
        );
    }

    return <p className="whitespace-pre-wrap">{block}</p>;
}

export default function ArticlesShow({ article, related }: ArticlesShowProps) {
    const { intro, sections } = useMemo(
        () => parseContent(article.content),
        [article.content],
    );

    const summaryBlocks = useMemo(() => {
        if (!article.summary) {
            return [];
        }

        return article.summary
            .replace(/\r\n/g, '\n')
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean);
    }, [article.summary]);

    const hasToc = sections.length > 0;
    const hasKeyPoints = summaryBlocks.length > 0 || article.image_url;

    return (
        <PublicLayout>
            <Head title={article.title} />

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                <Link
                    href="/artikel"
                    className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-rose-600 underline-offset-4 hover:underline dark:text-rose-300"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Kembali ke daftar artikel
                </Link>

                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl dark:text-neutral-50">
                        {article.title}
                    </h1>
                    <div className="mt-4 flex items-center gap-2.5 text-sm text-slate-500 dark:text-neutral-400">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-300">
                            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="leading-tight">
                            <span className="block font-medium text-slate-600 dark:text-neutral-300">
                                Untuk Semua
                            </span>
                            {article.published_at ? (
                                <span className="block text-xs tracking-wide uppercase">
                                    {article.published_at}
                                </span>
                            ) : null}
                        </span>
                    </div>
                </motion.header>

                {hasKeyPoints && (
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/60 p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/60"
                    >
                        <p className="text-xs font-semibold tracking-widest text-sky-600 uppercase dark:text-sky-300">
                            Poin Utama
                        </p>
                        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
                            <div className="space-y-4 leading-relaxed text-slate-600 dark:text-neutral-300">
                                {summaryBlocks.length > 0 ? (
                                    summaryBlocks.map((block, index) => (
                                        <ContentBlock key={index} block={block} />
                                    ))
                                ) : (
                                    <p className="text-slate-500 dark:text-neutral-400">
                                        Simak ulasan lengkap di bawah ini.
                                    </p>
                                )}
                            </div>
                            {article.image_url ? (
                                <img
                                    src={article.image_url}
                                    alt=""
                                    aria-hidden="true"
                                    className="h-44 w-full rounded-xl object-cover md:w-72"
                                />
                            ) : null}
                        </div>
                    </motion.section>
                )}

                <div className="mt-10 gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <motion.article
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="min-w-0"
                    >
                        {intro.length > 0 ? (
                            <div className="mb-10 space-y-4 leading-relaxed text-slate-600 dark:text-neutral-300">
                                {intro.map((block, index) => (
                                    <ContentBlock key={index} block={block} />
                                ))}
                            </div>
                        ) : null}

                        {sections.length > 0
                            ? sections.map((section) => (
                                  <section
                                      key={section.id}
                                      id={section.id}
                                      className="mb-10 scroll-mt-24"
                                  >
                                      <h2 className="border-b border-neutral-200 pb-2 text-2xl font-semibold text-sky-700 dark:border-neutral-800 dark:text-sky-300">
                                          {section.heading}
                                      </h2>
                                      <div className="mt-4 space-y-4 leading-relaxed text-slate-600 dark:text-neutral-300">
                                          {section.blocks.map((block, index) => (
                                              <ContentBlock key={index} block={block} />
                                          ))}
                                      </div>
                                  </section>
                              ))
                            : null}
                    </motion.article>

                    <motion.aside
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-10 lg:mt-0"
                    >
                        <div className="lg:sticky lg:top-24 lg:space-y-8">
                            {hasToc ? (
                                <nav aria-label="Pada halaman ini">
                                    <p className="border-b border-neutral-200 pb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:border-neutral-800 dark:text-neutral-400">
                                        Pada Halaman Ini
                                    </p>
                                    <ul className="mt-3 space-y-3">
                                        {sections.map((section) => (
                                            <li key={section.id}>
                                                <a
                                                    href={`#${section.id}`}
                                                    className="text-sm text-sky-600 underline-offset-4 hover:underline dark:text-sky-300"
                                                >
                                                    {section.heading}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            ) : null}

                            {related.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border-t-4 border-sky-500 bg-sky-50/70 dark:bg-neutral-900/70">
                                    <div className="p-5">
                                        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-neutral-400">
                                            Artikel Terkait
                                        </p>
                                        <ul className="mt-3 space-y-3">
                                            {related.map((item) => (
                                                <li key={item.slug}>
                                                    <Link
                                                        href={`/artikel/${item.slug}`}
                                                        className="text-sm text-sky-600 underline-offset-4 hover:underline dark:text-sky-300"
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </motion.aside>
                </div>
            </div>
        </PublicLayout>
    );
}
