import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MediaAssetItem {
    key: string;
    label: string;
    url: string | null;
    type: string;
    alt: string | null;
}

function MediaAssetCard({ asset }: { asset: MediaAssetItem }) {
    const { data, setData, post, processing, errors } = useForm<{
        file: File | null;
        alt: string;
    }>({
        file: null,
        alt: asset.alt ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/admin/media/${asset.key}`, { forceFormData: true });
    };

    return (
        <form
            onSubmit={submit}
            className="max-w-2xl space-y-6 rounded-xl border p-6"
        >
            <div>
                <h2 className="text-lg font-semibold">{asset.label}</h2>
                <p className="text-sm text-muted-foreground">
                    Unggah gambar atau video untuk ditampilkan pada halaman terkait.
                </p>
            </div>

            {asset.url && (
                <div className="grid gap-2">
                    <Label>Media saat ini</Label>
                    {asset.type === 'video' ? (
                        <video
                            controls
                            src={asset.url}
                            className="max-h-64 w-auto rounded-md border"
                        />
                    ) : (
                        <img
                            src={asset.url}
                            alt={asset.alt ?? asset.label}
                            className="max-h-64 w-auto rounded-md border"
                        />
                    )}
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor={`file-${asset.key}`}>Berkas (opsional)</Label>
                <Input
                    id={`file-${asset.key}`}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                />
                <InputError message={errors.file} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`alt-${asset.key}`}>Teks alternatif (opsional)</Label>
                <Input
                    id={`alt-${asset.key}`}
                    value={data.alt}
                    onChange={(e) => setData('alt', e.target.value)}
                    placeholder="Deskripsi singkat media"
                />
                <InputError message={errors.alt} />
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={processing}>
                    Simpan
                </Button>
            </div>
        </form>
    );
}

export default function AdminMediaIndex({
    assets,
}: {
    assets: MediaAssetItem[];
}) {
    return (
        <>
            <Head title="Kelola Ilustrasi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Ilustrasi"
                    description="Kelola ilustrasi dan media yang tampil pada halaman publik."
                />

                <div className="space-y-6">
                    {assets.map((asset) => (
                        <MediaAssetCard key={asset.key} asset={asset} />
                    ))}
                </div>
            </div>
        </>
    );
}

AdminMediaIndex.layout = {
    breadcrumbs: [
        {
            title: 'Ilustrasi',
            href: '/admin/media',
        },
    ],
};
