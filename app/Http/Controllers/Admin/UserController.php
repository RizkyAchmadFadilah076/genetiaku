<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->where('role', 'admin')
            ->latest('id')
            ->paginate(20, ['id', 'name', 'username', 'email', 'created_at'])
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'currentUserId' => $request->user()?->id,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create');
    }

    public function store(UserRequest $request): RedirectResponse
    {
        User::query()->create($request->validated() + ['role' => 'admin']);

        return redirect()
            ->route('admin.pengguna.index')
            ->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function edit(User $pengguna): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => $pengguna->only(['id', 'name', 'username', 'email']),
        ]);
    }

    public function update(UserRequest $request, User $pengguna): RedirectResponse
    {
        $data = $request->validated();

        if (! $request->filled('password')) {
            unset($data['password']);
        }

        $pengguna->update($data + ['role' => 'admin']);

        return redirect()
            ->route('admin.pengguna.index')
            ->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $pengguna): RedirectResponse
    {
        if ($request->user()?->is($pengguna)) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        if ($pengguna->isAdmin() && $this->adminCount() <= 1) {
            return back()->with('error', 'Admin terakhir tidak dapat dihapus.');
        }

        $pengguna->delete();

        return redirect()
            ->route('admin.pengguna.index')
            ->with('success', 'Pengguna berhasil dihapus.');
    }

    private function adminCount(): int
    {
        return User::query()->where('role', 'admin')->count();
    }
}
