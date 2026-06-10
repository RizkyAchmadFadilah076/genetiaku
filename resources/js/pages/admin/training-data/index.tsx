import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { TrainingRow } from './training-data-form';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface IndexProps {
    rows: Paginator<TrainingRow>;
}

const COLUMNS: { key: keyof TrainingRow; label: string }[] = [
    { key: 'father_blood', label: 'Gol. Darah Ayah' },
    { key: 'father_iris', label: 'Iris Ayah' },
    { key: 'father_hair', label: 'Rambut Ayah' },
    { key: 'father_ear', label: 'Cuping Ayah' },
    { key: 'father_thalassemia', label: 'Thal. Ayah' },
    { key: 'mother_blood', label: 'Gol. Darah Ibu' },
    { key: 'mother_iris', label: 'Iris Ibu' },
    { key: 'mother_hair', label: 'Rambut Ibu' },
    { key: 'mother_ear', label: 'Cuping Ibu' },
    { key: 'mother_thalassemia', label: 'Thal. Ibu' },
    { key: 'baby_blood', label: 'Gol. Darah Bayi' },
    { key: 'baby_iris', label: 'Iris Bayi' },
    { key: 'baby_hair', label: 'Rambut Bayi' },
    { key: 'baby_ear', label: 'Cuping Bayi' },
    { key: 'baby_thalassemia_risk', label: 'Risiko Thal. Bayi' },
];

export default function TrainingDataIndex({ rows }: IndexProps) {
    const handleExport = () => {
        window.location.href = '/admin/data-latih/export';
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus baris Data Latih ini?')) {
            router.delete(`/admin/data-latih/${id}`, { preserveScroll: true });
        }
    };

    const handleDeleteAll = () => {
        if (
            confirm(
                `Hapus semua Data Latih (${rows.total} baris)? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            router.delete('/admin/data-latih/hapus-semua', { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Data Latih</h1>
                        <p className="text-sm text-muted-foreground">
                            Baris Data_Latih yang dipakai Mesin Naive Bayes.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={rows.total === 0}
                        >
                            Download Excel
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/data-latih/import">Impor Excel</Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAll}
                            disabled={rows.total === 0}
                        >
                            Hapus Semua
                        </Button>
                        <Button asChild>
                            <Link href="/admin/data-latih/create">Tambah Baris</Link>
                        </Button>
                    </div>
                </div>

                {rows.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-sidebar-border/70 p-10 text-center dark:border-sidebar-border">
                        <p className="text-muted-foreground">
                            Belum ada Data Latih. Tambahkan baris pertama.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        {COLUMNS.map((col) => (
                                            <th
                                                key={col.key}
                                                className="whitespace-nowrap px-3 py-2 font-medium"
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-sidebar-border/70 dark:border-sidebar-border"
                                        >
                                            {COLUMNS.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className="whitespace-nowrap px-3 py-2"
                                                >
                                                    {row[col.key]}
                                                </td>
                                            ))}
                                            <td className="whitespace-nowrap px-3 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link
                                                            href={`/admin/data-latih/${row.id}/edit`}
                                                        >
                                                            Ubah
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            handleDelete(row.id)
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

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {rows.from ?? 0}-{rows.to ?? 0} dari{' '}
                                {rows.total} baris
                            </p>
                            {rows.last_page > 1 ? (
                                <nav className="flex flex-wrap items-center gap-1" aria-label="Navigasi halaman">
                                    {rows.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant={link.active ? 'default' : 'outline'}
                                            disabled={link.url === null}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                })
                                            }
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

TrainingDataIndex.layout = {
    breadcrumbs: [{ title: 'Data Latih', href: '/admin/data-latih' }],
};
