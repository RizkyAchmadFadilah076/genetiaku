import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ArticleData = {
    id: number;
    title: string;
    summary: string | null;
    content: string;
    status: 'draft' | 'published';
    image_url: string | null;
};

export default function AdminArticlesEdit({ article }: { article: ArticleData }) {
    const { data, setData, transform, post, processing, errors } = useForm<{
        title: string;
        summary: string;
        content: string;
        status: 'draft' | 'published';
        image: File | null;
    }>({
        title: article.title,
        summary: article.summary ?? '',
        content: article.content,
        status: article.status,
        image: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((current) => ({ ...current, _method: 'put' }));
        post(`/admin/artikel/${article.id}`, { forceFormData: true });
    };

    return (
        <>
            <Head title="Sunting Artikel" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Sunting Artikel</h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui judul dan konten artikel.
                    </p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Judul</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                            autoFocus
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="summary">Poin Utama (paragraf pembuka)</Label>
                        <textarea
                            id="summary"
                            value={data.summary}
                            onChange={(e) => setData('summary', e.target.value)}
                            rows={4}
                            placeholder="Ringkasan / poin utama yang tampil di kotak atas. Gunakan baris diawali '- ' untuk poin berbutir."
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <InputError message={errors.summary} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Konten</Label>
                        <textarea
                            id="content"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={12}
                            required
                            placeholder={'Gunakan "## Judul Bagian" untuk membuat header & daftar "Pada Halaman Ini".'}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <InputError message={errors.content} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value as 'draft' | 'published')}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="image">Gambar (opsional)</Label>
                        {article.image_url && (
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="mb-2 max-h-48 w-auto rounded-md border"
                            />
                        )}
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('image', e.target.files?.[0] ?? null)
                            }
                        />
                        <InputError message={errors.image} />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            Simpan
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/artikel">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
