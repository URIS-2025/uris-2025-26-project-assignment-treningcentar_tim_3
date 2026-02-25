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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/20 backdrop-blur-sm">
        <div className="bg-white border border-amber-100 rounded-[2rem] w-full max-w-md mx-4 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-amber-50">
                <h3 className="text-amber-950 font-black text-xl tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-amber-50 text-amber-900/40 hover:text-amber-600 transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-8">{children}</div>
        </div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-amber-900/60 uppercase tracking-widest ml-1">{label}</label>
        {children}
    </div>
);

const inputCls = 'w-full bg-amber-50/30 border-2 border-amber-100 rounded-2xl px-4 py-2.5 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all';

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
            <ChevronUp className={`w-2.5 h-2.5 ${sortKey === col && sortDir === 'asc' ? 'text-amber-600' : 'text-amber-200'}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${sortKey === col && sortDir === 'desc' ? 'text-amber-600' : 'text-amber-200'}`} />
        </span>
    );

    const roleBadge = (role: string) => {
        const map: Record<string, string> = {
            Admin: 'bg-amber-100 text-amber-700',
            Trainer: 'bg-blue-100 text-blue-700',
            Member: 'bg-emerald-100 text-emerald-700',
            Nutritionist: 'bg-purple-100 text-purple-700',
            Receptionist: 'bg-rose-100 text-rose-700',
        };
        return map[role] || 'bg-neutral-100 text-neutral-600';
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
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-right-full duration-300">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100">
                        <Users className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950">Users</h1>
                        <p className="text-amber-900/40 text-sm font-medium">{users.length} total users</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/30 group-focus-within:text-amber-500 transition-colors" />
                <input
                    className="w-full bg-white border-2 border-amber-100 rounded-2xl pl-11 pr-4 py-3 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-50">
                                {[
                                    { key: 'username' as SortKey, label: 'Username' },
                                    { key: 'firstName' as SortKey, label: 'First Name' },
                                    { key: 'lastName' as SortKey, label: 'Last Name' },
                                    { key: 'email' as SortKey, label: 'Email' },
                                    { key: 'role' as SortKey, label: 'Role' },
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        className="text-left px-6 py-5 text-xs font-black text-amber-900/40 uppercase tracking-widest cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => handleSort(key)}
                                    >
                                        <span className="flex items-center gap-1">{label}<SortIcon col={key} /></span>
                                    </th>
                                ))}
                                <th className="text-right px-6 py-5 text-xs font-black text-amber-900/40 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-6 py-5"><div className="h-4 bg-amber-50 rounded-full animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-amber-900/40 font-medium">No users found</td></tr>
                            ) : (
                                paginated.map((u) => (
                                    <tr key={u.id} className="hover:bg-amber-50/50 transition-colors group">
                                        <td className="px-6 py-5 font-bold text-amber-950">{u.username}</td>
                                        <td className="px-6 py-5 text-amber-900/70 font-medium">{u.firstName}</td>
                                        <td className="px-6 py-5 text-amber-900/70 font-medium">{u.lastName}</td>
                                        <td className="px-6 py-5 text-amber-900/50 font-medium">{u.email}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${roleBadge(u.role)}`}>{u.role}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(u)} className="p-2 rounded-xl text-amber-900/40 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => setDeleteUser(u)} className="p-2 rounded-xl text-amber-900/40 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-5 border-t border-amber-50 bg-amber-50/20">
                        <span className="text-xs font-bold text-amber-900/40 uppercase tracking-widest">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-amber-900/40 hover:bg-white hover:text-amber-600'}`}>{i + 1}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <Modal title="Create New User" onClose={() => setShowCreate(false)}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleCreate} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">{formLoading ? 'Creating...' : 'Create'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {editUser && (
                <Modal title="Edit User" onClose={() => setEditUser(null)}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setEditUser(null)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleUpdate} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">{formLoading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteUser && (
                <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-amber-950 font-black text-xl mb-2">Are you sure?</p>
                            <p className="text-amber-900/50 font-medium">You are about to delete user <strong className="text-amber-950">{deleteUser.username}</strong>. This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setDeleteUser(null)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50">{formLoading ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminUsers;
