import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, Plus, Check, X, AlertTriangle, Edit2, Trash2, UserPlus } from 'lucide-react';
import {
    membershipAdminService,
    type MembershipType,
    type ActiveMembership,
    type MembershipTypeCreateDTO,
} from '../../services/membershipAdminService';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/20 backdrop-blur-sm px-4">
        <div className="bg-white border border-amber-100 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
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

const emptyTypeForm = (): MembershipTypeCreateDTO => ({ name: '', durationDays: 30, price: 0, description: '' });

const AdminMemberships: React.FC = () => {
    const [tab, setTab] = useState<'types' | 'active'>('types');
    const [types, setTypes] = useState<MembershipType[]>([]);
    const [memberships, setMemberships] = useState<ActiveMembership[]>([]);
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
            const [t, m] = await Promise.allSettled([
                membershipAdminService.getAllMembershipTypes(),
                membershipAdminService.getAllMemberships(),
            ]);
            if (t.status === 'fulfilled') setTypes(t.value || []);
            if (m.status === 'fulfilled') setMemberships(m.value || []);
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
            showToast('Membership plan created');
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
            showToast('Membership plan updated');
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
            showToast('Membership plan deleted');
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
        <div className="space-y-6">
            <Field label="Plan Name">
                <input className={inputCls} placeholder="e.g. Premium Monthly" value={typeForm.name}
                    onChange={(e) => setTypeForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
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
                <textarea className={`${inputCls} h-24 resize-none`} placeholder="Plan description..." value={typeForm.description}
                    onChange={(e) => setTypeForm(p => ({ ...p, description: e.target.value }))} />
            </Field>
            <div className="flex gap-4 pt-4">
                <button onClick={() => { setShowCreateType(false); setEditType(null); }}
                    className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                <button onClick={onSubmit} disabled={formLoading}
                    className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                    {formLoading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-right-full">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100">
                        <CreditCard className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950">Memberships</h1>
                        <p className="text-amber-900/40 text-sm font-medium">{types.length} plans · {memberships.filter(m => m.isActive).length} active members</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {tab === 'types' ? (
                        <button onClick={() => { setShowCreateType(true); setTypeForm(emptyTypeForm()); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-amber-600/20 active:scale-95">
                            <Plus className="w-4 h-4" /> Add Plan
                        </button>
                    ) : (
                        <button onClick={() => setShowAssign(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-amber-600/20 active:scale-95">
                            <UserPlus className="w-4 h-4" /> Assign User
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="flex gap-2 bg-white border-2 border-amber-100 rounded-2xl p-1.5 w-fit shadow-sm">
                {(['types', 'active'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-6 py-2.5 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-amber-900/40 hover:text-amber-600 hover:bg-amber-50'
                            }`}>
                        {t === 'types' ? 'Membership Plans' : 'Active Memberships'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-44 bg-white border border-amber-100 rounded-[2rem] animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : tab === 'types' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {types.length === 0
                        ? <div className="col-span-3 py-24 text-center text-amber-900/40 font-bold uppercase tracking-widest text-xs">No membership plans yet</div>
                        : types.map((t) => (
                            <div key={t.id} className="relative bg-white border-2 border-amber-100 rounded-[2.5rem] p-8 hover:border-emerald-400 transition-all group shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditType(t); setTypeForm({ name: t.name, durationDays: t.durationDays, price: t.price, description: t.description || '' }); }}
                                        className="p-2 rounded-xl text-amber-900/40 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeleteType(t)}
                                        className="p-2 rounded-xl text-amber-900/40 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="text-amber-950 font-black text-xl mb-2 tracking-tight">{t.name}</h3>
                                <p className="text-amber-900/50 text-sm font-medium mb-8 leading-relaxed line-clamp-2">{t.description || 'Flexible training plan for high achievers.'}</p>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-amber-50 rounded-[1.5rem] p-4 text-center border border-amber-100/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/30 mb-1">Duration</p>
                                        <p className="text-amber-950 font-black text-lg">{t.durationDays}d</p>
                                    </div>
                                    <div className="flex-1 bg-emerald-50 rounded-[1.5rem] p-4 text-center border border-emerald-100/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/30 mb-1">Price</p>
                                        <p className="text-emerald-600 font-black text-lg">${t.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="bg-white border border-amber-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-amber-50">
                                    {['User', 'Plan', 'Start Date', 'End Date', 'Status', 'Action'].map((h) => (
                                        <th key={h} className={`px-8 py-5 text-xs font-black text-amber-900/40 uppercase tracking-widest ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                                {memberships.length === 0
                                    ? <tr><td colSpan={6} className="text-center py-20 text-amber-900/40 font-bold uppercase tracking-widest text-xs">No active memberships assigned</td></tr>
                                    : memberships.map((m) => (
                                        <tr key={m.id} className="hover:bg-amber-50/50 transition-colors group">
                                            <td className="px-8 py-5 text-amber-950 font-bold">{m.username || m.userId?.slice(0, 8)}</td>
                                            <td className="px-8 py-5 text-amber-900/70 font-medium">{m.membershipTypeName || 'Standard Plan'}</td>
                                            <td className="px-8 py-5 text-amber-900/40 font-medium">{m.startDate ? new Date(m.startDate).toLocaleDateString() : '—'}</td>
                                            <td className="px-8 py-5 text-amber-900/40 font-medium">{m.endDate ? new Date(m.endDate).toLocaleDateString() : '—'}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                                    {m.isActive ? 'Active' : 'Expired'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {m.isActive && (
                                                    <button onClick={() => setDeactivateTarget(m)}
                                                        className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                                                        Stop
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showCreateType && <Modal title="New Membership Plan" onClose={() => setShowCreateType(false)}><TypeForm onSubmit={handleCreateType} submitLabel="Create Plan" /></Modal>}
            {editType && <Modal title="Edit Membership Plan" onClose={() => setEditType(null)}><TypeForm onSubmit={handleUpdateType} submitLabel="Save Changes" /></Modal>}

            {deleteType && (
                <Modal title="Delete Plan" onClose={() => setDeleteType(null)}>
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-amber-950 font-black text-xl mb-2 tracking-tight">Delete Plan?</p>
                            <p className="text-amber-900/50 font-medium">Are you sure you want to remove <strong className="text-amber-950">{deleteType.name}</strong>? Users on this plan will keep it until it expires.</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setDeleteType(null)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleDeleteType} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50">
                                {formLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showAssign && (
                <Modal title="Assign Membership" onClose={() => setShowAssign(false)}>
                    <div className="space-y-6">
                        <Field label="User ID">
                            <input className={inputCls} placeholder="User UUID" value={assignForm.userId}
                                onChange={(e) => setAssignForm(p => ({ ...p, userId: e.target.value }))} />
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
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowAssign(false)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleAssign} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                                {formLoading ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Deactivate */}
            {deactivateTarget && (
                <Modal title="Deactivate" onClose={() => setDeactivateTarget(null)}>
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-amber-950 font-black text-xl mb-2 tracking-tight">Deactivate Access?</p>
                            <p className="text-amber-900/50 font-medium">Deactivate <strong className="text-amber-950">{deactivateTarget.username || 'this user'}</strong>'s membership? They will lose all reservation privileges immediately.</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setDeactivateTarget(null)} className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">Cancel</button>
                            <button onClick={handleDeactivate} disabled={formLoading} className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                                {formLoading ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminMemberships;
