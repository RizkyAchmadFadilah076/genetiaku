import { Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface UserRow {
    id: number;
    name: string;
    username: string;
    email: string;
    created_at?: string;
}

interface UserFormProps {
    mode: 'create' | 'edit';
    user?: UserRow;
}

export default function UserForm({ mode, user }: UserFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        username: user?.username ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (mode === 'create') {
            post('/admin/pengguna');

            return;
        }

        put(`/admin/pengguna/${user?.id}`);
    };

    return (
        <form onSubmit={submit} className="max-w-xl space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    autoComplete="name"
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={data.username}
                    onChange={(event) => setData('username', event.target.value)}
                    autoComplete="username"
                    placeholder="username"
                />
                <InputError message={errors.username} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    autoComplete="email"
                    placeholder="nama@email.com"
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">
                    {mode === 'create' ? 'Password' : 'Password Baru'}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    autoComplete="new-password"
                />
                {mode === 'edit' ? (
                    <p className="text-xs text-muted-foreground">
                        Kosongkan jika password tidak ingin diubah.
                    </p>
                ) : null}
                <InputError message={errors.password} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) =>
                        setData('password_confirmation', event.target.value)
                    }
                    autoComplete="new-password"
                />
                <InputError message={errors.password_confirmation} />
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={processing}>
                    Simpan
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/admin/pengguna">Batal</Link>
                </Button>
            </div>
        </form>
    );
}
