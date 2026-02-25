import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, Plus, Check, X, AlertTriangle, Edit2, Trash2, UserPlus } from 'lucide-react';
import {
    membershipAdminService,
    type MembershipType,
    type ActiveMembership,
    type MembershipTypeCreateDTO,
} from '../../services/membershipAdminService';
import { adminService, type AdminUser } from '../../services/adminService';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white border border-amber-100 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
                <h3 className="text-neutral-800 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{label}</label>
        {children}
    </div>
);

const inputCls = 'w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors';

const emptyTypeForm = (): MembershipTypeCreateDTO => ({ name: '', durationDays: 30, price: 0, description: '' });

const AdminMemberships: React.FC = () => {
    const [tab, setTab] = useState<'types' | 'active'>('types');
    const [types, setTypes] = useState<MembershipType[]>([]);
    const [memberships, setMemberships] = useState<ActiveMembership[]>([]);
    const [members, setMembers] = useState<AdminUser[]>([]);
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Modals
    const [showCreateType, setShowCreateType] = useState(false);
    const [editType, setEditType] = useState<MembershipType | null>(null);
    const [deleteType, setDeleteType] = useState<MembershipType | null>(null);
    const [showAssign, setShowAssign] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState<ActiveMembership | null>(null);

    const [typeForm, setTypeForm] = useState<MembershipTypeCreateDTO>(emptyTypeForm());
    const [assignForm, setAssignForm] = useState({ userId: '', membershipTypeId: '', startDate: '' });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [t, m, u] = await Promise.allSettled([
                membershipAdminService.getAllMembershipTypes(),
                membershipAdminService.getAllMemberships(),
                adminService.getAllUsers(),
            ]);
            if (t.status === 'fulfilled') setTypes(t.value || []);
            if (m.status === 'fulfilled') setMemberships(m.value || []);
            if (u.status === 'fulfilled') {
                const users = u.value || [];
                setAllUsers(users);
                // Filter to only show Members (not Admins/Trainers) for assignment dropdown
                setMembers(users.filter(user => user.role === 'Member'));
            }
        } catch {
            setError('Failed to load membership data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreateType = async () => {
        setFormLoading(true);
        try {
            await membershipAdminService.createMembershipType(typeForm);
            setShowCreateType(false);
            setTypeForm(emptyTypeForm());
            showToast('Membership type created');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleUpdateType = async () => {
        if (!editType) return;
        setFormLoading(true);
        try {
            await membershipAdminService.updateMembershipType(editType.id, typeForm);
            setEditType(null);
            showToast('Membership type updated');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDeleteType = async () => {
        if (!deleteType) return;
        setFormLoading(true);
        try {
            await membershipAdminService.deleteMembershipType(deleteType.id);
            setDeleteType(null);
            showToast('Membership type deleted');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleAssign = async () => {
        setFormLoading(true);
        try {
            await membershipAdminService.assignMembership(assignForm);
            setShowAssign(false);
            setAssignForm({ userId: '', membershipTypeId: '', startDate: '' });
            showToast('Membership assigned');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        setFormLoading(true);
        try {
            await membershipAdminService.deactivateMembership(deactivateTarget.id);
            setDeactivateTarget(null);
            showToast('Membership deactivated');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const TypeForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <Field label="Plan Name">
                <input className={inputCls} placeholder="e.g. Premium Monthly" value={typeForm.name}
                    onChange={(e) => setTypeForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (days)">
                    <input className={inputCls} type="number" min={1} value={typeForm.durationDays}
                        onChange={(e) => setTypeForm(p => ({ ...p, durationDays: Number(e.target.value) }))} />
                </Field>
                <Field label="Price ($)">
                    <input className={inputCls} type="number" min={0} step="0.01" value={typeForm.price}
                        onChange={(e) => setTypeForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </Field>
            </div>
            <Field label="Description">
                <textarea className={`${inputCls} h-20 resize-none`} placeholder="Plan description..." value={typeForm.description}
                    onChange={(e) => setTypeForm(p => ({ ...p, description: e.target.value }))} />
            </Field>
            <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowCreateType(false); setEditType(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={onSubmit} disabled={formLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50">
                    {formLoading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-neutral-800 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <CreditCard className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800">Memberships</h1>
                        <p className="text-neutral-500 text-sm">{types.length} plans · {memberships.filter(m => m.isActive).length} active</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {tab === 'types' ? (
                        <button onClick={() => { setShowCreateType(true); setTypeForm(emptyTypeForm()); }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold rounded-xl transition-colors">
                            <Plus className="w-4 h-4" /> Add Plan
                        </button>
                    ) : (
                        <button onClick={() => setShowAssign(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold rounded-xl transition-colors">
                            <UserPlus className="w-4 h-4" /> Assign
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="flex gap-1 bg-white border border-amber-100 shadow-sm rounded-xl p-1 w-fit">
                {(['types', 'active'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${tab === t ? 'bg-amber-500 text-neutral-800' : 'text-neutral-400 hover:text-neutral-800'
                            }`}>
                        {t === 'types' ? 'Membership Plans' : 'Active Memberships'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-36 bg-white border border-amber-100 shadow-sm rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : tab === 'types' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {types.length === 0
                        ? <div className="col-span-3 py-16 text-center text-neutral-500">No membership plans yet</div>
                        : types.map((t) => (
                            <div key={t.id} className="bg-white border border-amber-100 shadow-sm rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-neutral-800 font-bold text-lg">{t.name}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditType(t); setTypeForm({ name: t.name, durationDays: t.durationDays, price: t.price, description: t.description || '' }); }}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteType(t)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-sm mb-4">{t.description || 'No description'}</p>
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-0.5">Duration</p>
                                        <p className="text-neutral-800 font-bold">{t.durationDays}d</p>
                                    </div>
                                    <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-0.5">Price</p>
                                        <p className="text-emerald-400 font-bold">${t.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="bg-white border border-amber-100 shadow-sm rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-100">
                                {['User', 'Plan', 'Start Date', 'End Date', 'Status', 'Action'].map((h) => (
                                    <th key={h} className={`px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {memberships.length === 0
                                ? <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No memberships assigned</td></tr>
                                : memberships.map((m) => {
                                    const user = allUsers.find(u => u.id === m.userId);
                                    const plan = types.find(t => t.id === m.membershipTypeId);
                                    return (
                                    <tr key={m.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-4 text-neutral-800 font-semibold">{user ? `${user.firstName} ${user.lastName}` : (m.username || m.userId?.slice(0, 8) + '…')}</td>
                                        <td className="px-5 py-4 text-neutral-600">{plan?.name || m.membershipTypeName || m.membershipTypeId?.slice(0, 8) + '…'}</td>
                                        <td className="px-5 py-4 text-neutral-400">{m.startDate ? new Date(m.startDate).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-4 text-neutral-400">{m.endDate ? new Date(m.endDate).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                m.displayStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                m.displayStatus === 'Scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                                m.displayStatus === 'Expired' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-neutral-700 text-neutral-400'
                                            }`}>
                                                {m.displayStatus}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {(m.displayStatus === 'Active' || m.displayStatus === 'Scheduled') && (
                                                <button onClick={() => setDeactivateTarget(m)}
                                                    className="px-3 py-1 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
                                                    Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreateType && <Modal title="Add Membership Plan" onClose={() => setShowCreateType(false)}><TypeForm onSubmit={handleCreateType} submitLabel="Create Plan" /></Modal>}
            {editType && <Modal title="Edit Membership Plan" onClose={() => setEditType(null)}><TypeForm onSubmit={handleUpdateType} submitLabel="Save Changes" /></Modal>}

            {deleteType && (
                <Modal title="Delete Plan" onClose={() => setDeleteType(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-300">Delete <strong>{deleteType.name}</strong>? This cannot be undone.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteType(null)} className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleDeleteType} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50">
                                {formLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showAssign && (
                <Modal title="Assign Membership" onClose={() => setShowAssign(false)}>
                    <div className="space-y-4">
                        <Field label="Member">
                            <select className={inputCls} value={assignForm.userId}
                                onChange={(e) => setAssignForm(p => ({ ...p, userId: e.target.value }))}>
                                <option value="">Select member...</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.firstName} {m.lastName} ({m.username})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Membership Plan">
                            <select className={inputCls} value={assignForm.membershipTypeId}
                                onChange={(e) => setAssignForm(p => ({ ...p, membershipTypeId: e.target.value }))}>
                                <option value="">Select plan...</option>
                                {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.durationDays}d)</option>)}
                            </select>
                        </Field>
                        <Field label="Start Date">
                            <input className={inputCls} type="date" value={assignForm.startDate}
                                onChange={(e) => setAssignForm(p => ({ ...p, startDate: e.target.value }))} />
                        </Field>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowAssign(false)} className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleAssign} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50">
                                {formLoading ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Deactivate */}
            {deactivateTarget && (() => {
                const targetUser = allUsers.find(u => u.id === deactivateTarget.userId);
                const userName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : (deactivateTarget.username || deactivateTarget.userId?.slice(0, 8));
                return (
                <Modal title="Deactivate Membership" onClose={() => setDeactivateTarget(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <p className="text-sm text-amber-300">Deactivate <strong>{userName}</strong>'s membership? They will lose access to training reservations.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeactivateTarget(null)} className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleDeactivate} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50">
                                {formLoading ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </Modal>
                );
            })()}
        </div>
    );
};

export default AdminMemberships;
