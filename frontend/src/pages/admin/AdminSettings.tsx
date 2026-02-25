import React, { useEffect, useState, useCallback } from 'react';
import { Settings, AlertTriangle, Check, ShieldCheck, Search } from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';

const ROLES = ['Member', 'Trainer', 'Nutritionist', 'Receptionist', 'Admin'];

const ROLE_COLORS: Record<string, string> = {
    Admin: 'text-amber-600',
    Trainer: 'text-blue-600',
    Member: 'text-emerald-600',
    Nutritionist: 'text-purple-600',
    Receptionist: 'text-rose-600',
};

const AdminSettings: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [search, setSearch] = useState('');
    const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch {
            setError('Failed to load users. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = (username: string, role: string) => {
        setPendingRoles((prev) => ({ ...prev, [username]: role }));
    };

    const handleSaveRole = async (user: AdminUser) => {
        const newRole = pendingRoles[user.username];
        if (!newRole || newRole === user.role) return;
        setSaving(user.username);
        try {
            await adminService.updateRole({ username: user.username, newRole });
            showToast(`Role of ${user.username} updated to ${newRole}`);
            setPendingRoles((prev) => { const p = { ...prev }; delete p[user.username]; return p; });
            fetchUsers();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-[1.2rem] shadow-xl font-bold text-sm animate-in slide-in-from-right-full duration-300">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100">
                    <Settings className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-amber-950">Settings</h1>
                    <p className="text-amber-900/40 text-sm font-medium">Role & access management</p>
                </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem] shadow-sm">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900/70 font-medium leading-relaxed">
                    <strong className="text-amber-950 font-black uppercase tracking-wider text-[10px] block mb-1">Security Notice</strong>
                    Only Admin users can change roles. Assigning the Admin role grants full system access.
                    Changes take effect immediately on next login.
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/30 group-focus-within:text-amber-500 transition-colors" />
                <input
                    className="w-full bg-white border-2 border-amber-100 rounded-2xl pl-11 pr-4 py-3 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                    placeholder="Search users by name, username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-8 py-5 border-b border-amber-50 flex items-center justify-between bg-amber-50/10">
                    <div>
                        <h2 className="text-amber-950 font-black">User Roles</h2>
                        <p className="text-amber-900/40 text-[10px] font-black uppercase tracking-widest mt-0.5">Permissions Control</p>
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-widest">
                        {filteredUsers.length} Users Found
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-50">
                                <th className="text-left px-8 py-4 text-xs font-black text-amber-900/40 uppercase tracking-widest">User</th>
                                <th className="text-left px-8 py-4 text-xs font-black text-amber-900/40 uppercase tracking-widest">Email</th>
                                <th className="text-left px-8 py-4 text-xs font-black text-amber-900/40 uppercase tracking-widest">Current Role</th>
                                <th className="text-left px-8 py-4 text-xs font-black text-amber-900/40 uppercase tracking-widest">New Role</th>
                                <th className="text-right px-8 py-4 text-xs font-black text-amber-900/40 uppercase tracking-widest">Apply</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-8 py-5"><div className="h-4 bg-amber-50 rounded-full animate-pulse" /></td>
                                    ))}</tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-amber-900/40 font-bold">No users match your search</td></tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const pending = pendingRoles[u.username];
                                    const hasChange = pending && pending !== u.role;
                                    return (
                                        <tr key={u.id} className="hover:bg-amber-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div>
                                                    <p className="text-amber-950 font-bold">{u.username}</p>
                                                    <p className="text-amber-900/40 text-[10px] font-black uppercase tracking-widest mt-0.5">{u.firstName} {u.lastName}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-amber-900/50 font-medium">{u.email}</td>
                                            <td className="px-8 py-5">
                                                <span className={`font-black text-xs uppercase tracking-wider ${ROLE_COLORS[u.role] || 'text-amber-900/30'}`}>{u.role}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <select
                                                    className="bg-amber-50/50 border-2 border-amber-100 rounded-xl px-4 py-2 text-amber-950 text-xs font-bold focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                                                    value={pending ?? u.role}
                                                    onChange={(e) => handleRoleChange(u.username, e.target.value)}
                                                >
                                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleSaveRole(u)}
                                                    disabled={!hasChange || saving === u.username}
                                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${hasChange
                                                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 active:scale-95'
                                                        : 'bg-amber-50 text-amber-900/20 cursor-not-allowed border border-amber-100'
                                                        }`}
                                                >
                                                    {saving === u.username ? 'Saving...' : 'Apply Change'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
