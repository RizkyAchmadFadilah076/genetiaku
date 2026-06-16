import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ActionModal } from '@/components/action-modal';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface Rule {
    id: number;
    indicator: string;
    weight: number;
    classification_mapping: string;
    illustration_url: string | null;
    illustration_type: 'image' | 'gif' | 'video' | null;
}

interface IndexProps {
    rules: Rule[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Basis Pengetahuan', href: '/admin/basis-pengetahuan' },
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

export default function KnowledgeBaseIndex({ rules }: IndexProps) {
    const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);

    const handleDelete = (rule: Rule) => {
        setDeleteTarget(rule);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/admin/basis-pengetahuan/${deleteTarget.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Basis Pengetahuan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Basis Pengetahuan
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Aturan skrining: indikator/ciri, bobot, dan kategori yang
                            diindikasikan. Nilai awal dari wawancara pakar.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/basis-pengetahuan/create">Tambah Aturan</Link>
                    </Button>
                </div>

                {rules.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                        Belum ada aturan. Tambahkan aturan pertama.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Indikator / Ciri
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Ilustrasi
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Bobot
                                    </th>
                                    <th scope="col" className="px-4 py-3 font-medium">
                                        Pemetaan Kategori
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 font-medium">{rule.indicator}</td>
                                        <td className="px-4 py-3">
                                            <IllustrationPreview
                                                url={rule.illustration_url}
                                                type={rule.illustration_type}
                                            />
                                        </td>
                                        <td className="px-4 py-3">{rule.weight}</td>
                                        <td className="px-4 py-3">{rule.classification_mapping}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/basis-pengetahuan/${rule.id}/edit`}>
                                                        Ubah
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(rule)}
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
                title="Hapus aturan"
                description={
                    deleteTarget
                        ? `Hapus aturan "${deleteTarget.indicator}"?`
                        : 'Hapus aturan ini?'
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

KnowledgeBaseIndex.layout = {
    breadcrumbs,
};
