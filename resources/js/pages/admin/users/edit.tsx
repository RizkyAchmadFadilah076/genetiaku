import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import UserForm from './user-form';
import type {UserRow} from './user-form';

interface UsersEditProps {
    user: UserRow;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengguna', href: '/admin/pengguna' },
    { title: 'Ubah', href: '#' },
];

export default function UsersEdit({ user }: UsersEditProps) {
    return (
        <>
            <Head title="Ubah Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Ubah Pengguna
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui profil atau password admin.
                    </p>
                </div>

                <UserForm mode="edit" user={user} />
            </div>
        </>
    );
}

UsersEdit.layout = {
    breadcrumbs,
};
