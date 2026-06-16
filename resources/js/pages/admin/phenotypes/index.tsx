import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ActionModal } from '@/components/action-modal';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface PhenotypeEntry {
    id: number;
    category: string;
    value: string;
    illustration_url: string | null;
    illustration_type: 'image' | 'gif' | 'video' | null;
}

interface PhenotypeIndexProps {
    phenotypes: PhenotypeEntry[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Fenotipe', href: '/admin/fenotipe' },
];

/** Thumbnail preview ilustrasi (gambar/gif/video) atau placeholder bila kosong. */
function IllustrationPreview({
    url,
    type,
}: {
    url: string | null;
    type: 'image' | 'gif' | 'video' | null;
}) {
    if (!url) {
        return (
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                —
            </span>
        );
    }

    if (type === 'video') {
        return (
            <video
                src={url}
                muted
                loop
                autoPlay
                playsInline
                className="h-12 w-12 rounded-md border object-cover"
            />
        );
    }

    return <img src={url} alt="" className="h-12 w-12 rounded-md border object-cover" />;
}

export default function PhenotypeIndex({ phenotypes }: PhenotypeIndexProps) {
    const [deleteTarget, setDeleteTarget] = useState<PhenotypeEntry | null>(null);

    const handleDelete = (entry: PhenotypeEntry) => {
        setDeleteTarget(entry);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/admin/fenotipe/${deleteTarget.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Data Fenotipe" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Data Fenotipe
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola kategori dan nilai fenotipe yang tersedia
                            pada formulir prediksi.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/fenotipe/create">
                            Tambah Fenotipe
                        </Link>
                    </Button>
                </div>

                {phenotypes.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                        Belum ada data fenotipe. Tambahkan entri pertama Anda.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Kategori
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Nilai
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Ilustrasi
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-right font-medium"
                                    >
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {phenotypes.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {entry.category}
                                        </td>
                                        <td className="px-4 py-3">
                                            {entry.value}
                                        </td>
                                        <td className="px-4 py-3">
                                            <IllustrationPreview
                                                url={entry.illustration_url}
                                                type={entry.illustration_type}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/fenotipe/${entry.id}/edit`}
                                                    >
                                                        Ubah
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(entry)
                                                    }
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
                title="Hapus fenotipe"
                description={
                    deleteTarget
                        ? `Hapus fenotipe "${deleteTarget.category}: ${deleteTarget.value}"?`
                        : 'Hapus fenotipe ini?'
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

PhenotypeIndex.layout = {
    breadcrumbs,
};
