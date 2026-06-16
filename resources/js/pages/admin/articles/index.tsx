import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ActionModal } from '@/components/action-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ArticleListItem = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    image_url: string | null;
};

export default function AdminArticlesIndex({
    articles,
}: {
    articles: ArticleListItem[];
}) {
    const [deleteTarget, setDeleteTarget] = useState<ArticleListItem | null>(null);

    const handleDelete = (article: ArticleListItem) => {
        setDeleteTarget(article);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/admin/artikel/${deleteTarget.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Kelola Artikel" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Artikel</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola artikel edukasi GENETIKAKU.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/artikel/create">Artikel Baru</Link>
                    </Button>
                </div>

                {articles.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                        Belum ada artikel. Buat artikel pertama Anda.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Gambar</th>
                                    <th className="px-4 py-3 font-medium">Judul</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr key={article.id} className="border-b last:border-0">
                                        <td className="px-4 py-3">
                                            {article.image_url ? (
                                                <img
                                                    src={article.image_url}
                                                    alt=""
                                                    className="h-12 w-16 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{article.title}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    article.status === 'published'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {article.status === 'published'
                                                    ? 'Published'
                                                    : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/artikel/${article.id}/edit`}>
                                                        Sunting
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(article)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ActionModal
                open={deleteTarget !== null}
                title="Hapus artikel"
                description={
                    deleteTarget
                        ? `Hapus artikel "${deleteTarget.title}"?`
                        : 'Hapus artikel ini?'
                }
                confirmLabel="Hapus"
                confirmVariant="destructive"
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                onConfirm={confirmDelete}
            />
        </>
    );
}
