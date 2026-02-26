import React, { useEffect, useState, useCallback } from 'react';
import {
    Users, Plus, Search, ChevronUp, ChevronDown, Edit2, Trash2, X, Check, AlertTriangle,
} from 'lucide-react';
import { adminService, type AdminUser, type CreateUserDTO, type UpdateUserDTO } from '../../services/adminService';

const ROLES = ['Member', 'Trainer', 'Admin', 'Nutritionist', 'Receptionist'];
const PAGE_SIZE = 10;

type SortKey = keyof AdminUser;
type SortDir = 'asc' | 'desc';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-neutral-900 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
        {children}
    </div>
);

const inputCls = 'w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>('username');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [toast, setToast] = useState('');

    // Create form
    const [createForm, setCreateForm] = useState<CreateUserDTO>({
        username: '', email: '', password: '', firstName: '', lastName: '', role: 'Member',
    });
    // Edit form
    const [editForm, setEditForm] = useState<UpdateUserDTO>({
        id: '', username: '', email: '', firstName: '', lastName: '',
    });

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getAllUsers();
            setUsers(data || []);
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    };

    const filtered = users
        .filter((u) =>
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.role?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const av = (a[sortKey] ?? '') as string;
            const bv = (b[sortKey] ?? '') as string;
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => (
        <span className="inline-flex flex-col ml-1">
            <ChevronUp className={`w-2.5 h-2.5 ${sortKey === col && sortDir === 'asc' ? 'text-amber-600' : 'text-neutral-600'}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${sortKey === col && sortDir === 'desc' ? 'text-amber-600' : 'text-neutral-600'}`} />
        </span>
    );

    const roleBadge = (role: string) => {
        const map: Record<string, string> = {
            Admin: 'bg-amber-100 text-amber-600',
            Trainer: 'bg-blue-100 text-blue-600',
            Member: 'bg-emerald-100 text-emerald-600',
            Nutritionist: 'bg-purple-100 text-purple-600',
            Receptionist: 'bg-rose-100 text-rose-600',
        };
        return map[role] || 'bg-neutral-700 text-neutral-300';
    };

    // Handlers
    const handleCreate = async () => {
        setFormLoading(true);
        try {
            await adminService.createUser(createForm);
            setShowCreate(false);
            setCreateForm({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'Member' });
            showToast('User created successfully');
            fetchUsers();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setFormLoading(false);
        }
    };

    const openEdit = (u: AdminUser) => {
        setEditUser(u);
        setEditForm({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName });
    };

    const handleUpdate = async () => {
        setFormLoading(true);
        try {
            await adminService.updateUser(editForm);
            setEditUser(null);
            showToast('User updated successfully');
            fetchUsers();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteUser) return;
        setFormLoading(true);
        try {
            await adminService.deleteUser(deleteUser.id);
            setDeleteUser(null);
            showToast('User deleted');
            fetchUsers();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm animate-in fade-in">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                        <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900">Users</h1>
                        <p className="text-neutral-500 text-sm">{users.length} total users</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                    className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                {[
                                    { key: 'username' as SortKey, label: 'Username' },
                                    { key: 'firstName' as SortKey, label: 'First Name' },
                                    { key: 'lastName' as SortKey, label: 'Last Name' },
                                    { key: 'email' as SortKey, label: 'Email' },
                                    { key: 'role' as SortKey, label: 'Role' },
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-300 transition-colors"
                                        onClick={() => handleSort(key)}
                                    >
                                        <span className="flex items-center gap-1">{label}<SortIcon col={key} /></span>
                                    </th>
                                ))}
                                <th className="text-right px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-neutral-100 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No users found</td></tr>
                            ) : (
                                paginated.map((u) => (
                                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-neutral-900">{u.username}</td>
                                        <td className="px-5 py-4 text-neutral-300">{u.firstName}</td>
                                        <td className="px-5 py-4 text-neutral-300">{u.lastName}</td>
                                        <td className="px-5 py-4 text-neutral-500">{u.email}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${roleBadge(u.role)}`}>{u.role}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => setDeleteUser(u)} className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200">
                        <span className="text-xs text-neutral-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === i + 1 ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}>{i + 1}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <Modal title="Create New User" onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First Name">
                                <input className={inputCls} placeholder="John" value={createForm.firstName}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))} />
                            </Field>
                            <Field label="Last Name">
                                <input className={inputCls} placeholder="Doe" value={createForm.lastName}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))} />
                            </Field>
                        </div>
                        <Field label="Username">
                            <input className={inputCls} placeholder="johndoe" value={createForm.username}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))} />
                        </Field>
                        <Field label="Email">
                            <input className={inputCls} type="email" placeholder="john@example.com" value={createForm.email}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))} />
                        </Field>
                        <Field label="Password">
                            <input className={inputCls} type="password" placeholder="Min. 8 characters" value={createForm.password}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))} />
                        </Field>
                        <Field label="Role">
                            <select className={inputCls} value={createForm.role}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}>
                                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </Field>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors disabled:opacity-50">{formLoading ? 'Creating...' : 'Create User'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {editUser && (
                <Modal title="Edit User" onClose={() => setEditUser(null)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First Name">
                                <input className={inputCls} value={editForm.firstName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
                            </Field>
                            <Field label="Last Name">
                                <input className={inputCls} value={editForm.lastName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
                            </Field>
                        </div>
                        <Field label="Username">
                            <input className={inputCls} value={editForm.username}
                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))} />
                        </Field>
                        <Field label="Email">
                            <input className={inputCls} type="email" value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
                        </Field>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">Cancel</button>
                            <button onClick={handleUpdate} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors disabled:opacity-50">{formLoading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteUser && (
                <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-300">Are you sure you want to delete <strong>{deleteUser.username}</strong>?</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteUser(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors disabled:opacity-50">{formLoading ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminUsers;
