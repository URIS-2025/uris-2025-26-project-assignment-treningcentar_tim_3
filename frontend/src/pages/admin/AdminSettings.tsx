import React, { useEffect, useState, useCallback } from 'react';
import { Settings, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';

const ROLES = ['Member', 'Trainer', 'Nutritionist', 'Receptionist', 'Admin'];

const ROLE_COLORS: Record<string, string> = {
    Admin: 'text-amber-400',
    Trainer: 'text-blue-400',
    Member: 'text-emerald-400',
    Nutritionist: 'text-purple-400',
    Receptionist: 'text-rose-400',
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
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-700/50">
                    <Settings className="w-6 h-6 text-neutral-300" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Settings</h1>
                    <p className="text-neutral-500 text-sm">Role & access management</p>
                </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-300">
                    <strong>Role Management</strong> — Only Admin users can change roles. Assigning the Admin role grants full system access.
                    Role changes take effect immediately on next login.
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="relative">
                <input
                    className="w-full bg-neutral-900 border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Search users by name, username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white font-bold">User Roles</h2>
                    <p className="text-neutral-500 text-sm">Change user roles to control system access</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Email</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Role</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">New Role</th>
                                <th className="text-right px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Apply</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-5 py-4"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                                    ))}</tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-neutral-500">No users match your search</td></tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const pending = pendingRoles[u.username];
                                    const hasChange = pending && pending !== u.role;
                                    return (
                                        <tr key={u.id} className="hover:bg-white/2 transition-colors">
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-white font-semibold">{u.username}</p>
                                                    <p className="text-neutral-500 text-xs">{u.firstName} {u.lastName}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-neutral-400">{u.email}</td>
                                            <td className="px-5 py-4">
                                                <span className={`font-bold ${ROLE_COLORS[u.role] || 'text-neutral-300'}`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <select
                                                    className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                                    value={pending ?? u.role}
                                                    onChange={(e) => handleRoleChange(u.username, e.target.value)}
                                                >
                                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleSaveRole(u)}
                                                    disabled={!hasChange || saving === u.username}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${hasChange
                                                        ? 'bg-amber-500 hover:bg-amber-400 text-white'
                                                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {saving === u.username ? 'Saving...' : 'Apply'}
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
