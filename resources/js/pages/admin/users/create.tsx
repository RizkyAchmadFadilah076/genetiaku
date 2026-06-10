import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import UserForm from './user-form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengguna', href: '/admin/pengguna' },
    { title: 'Tambah', href: '/admin/pengguna/create' },
];

export default function UsersCreate() {
    return (
        <>
            <Head title="Tambah Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tambah Pengguna
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Buat akun admin baru.
                    </p>
                </div>

                <UserForm mode="create" />
            </div>
        </>
    );
}

UsersCreate.layout = {
    breadcrumbs,
};
