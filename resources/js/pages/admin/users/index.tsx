import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { UserRow } from './user-form';

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
    last_page: number;
}

interface UsersIndexProps {
    users: Paginator<UserRow>;
    currentUserId: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengguna', href: '/admin/pengguna' },
];

export default function UsersIndex({ users, currentUserId }: UsersIndexProps) {
    const handleDelete = (user: UserRow) => {
        if (user.id === currentUserId) {
            alert('Anda tidak dapat menghapus akun sendiri.');

            return;
        }

        if (confirm(`Hapus pengguna "${user.name}"?`)) {
            router.delete(`/admin/pengguna/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Kelola Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Kelola Pengguna
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tambah, ubah, dan hapus akun admin.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/pengguna/create">Tambah Pengguna</Link>
                    </Button>
                </div>

                {users.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                        Belum ada pengguna.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Nama</th>
                                        <th className="px-4 py-3 font-medium">Username</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-3">{user.username}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/pengguna/${user.id}/edit`}
                                                        >
                                                            Ubah
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={user.id === currentUserId}
                                                        onClick={() => handleDelete(user)}
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
                                Menampilkan {users.from ?? 0}-{users.to ?? 0} dari{' '}
                                {users.total} pengguna
                            </p>
                            {users.last_page > 1 ? (
                                <nav className="flex flex-wrap items-center gap-1" aria-label="Navigasi halaman">
                                    {users.links.map((link, index) => (
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

UsersIndex.layout = {
    breadcrumbs,
};
