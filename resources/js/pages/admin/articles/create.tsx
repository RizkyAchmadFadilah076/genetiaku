import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminArticlesCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        summary: string;
        content: string;
        status: string;
        image: File | null;
    }>({
        title: '',
        summary: '',
        content: '',
        status: 'draft',
        image: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/artikel', { forceFormData: true });
    };

    return (
        <>
            <Head title="Artikel Baru" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Artikel Baru</h1>
                    <p className="text-sm text-muted-foreground">
                        Buat artikel edukasi baru.
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
                            onChange={(e) => setData('status', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="image">Gambar (opsional)</Label>
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
