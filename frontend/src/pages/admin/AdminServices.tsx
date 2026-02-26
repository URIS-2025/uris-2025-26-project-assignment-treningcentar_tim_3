import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Plus, Edit2, Trash2, X, AlertTriangle, Check, Dumbbell, Users, Utensils, Ruler, CreditCard } from 'lucide-react';
import { serviceAdminService, type ServiceDto, type ServiceCreateDto } from '../../services/serviceAdminService';

const CATEGORIES = [
    { id: 1, name: 'Membership', icon: <CreditCard className="w-4 h-4" /> },
    { id: 2, name: 'Personal Training', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 3, name: 'Group Training', icon: <Users className="w-4 h-4" /> },
    { id: 4, name: 'Nutrition', icon: <Utensils className="w-4 h-4" /> },
    { id: 5, name: 'Measurement', icon: <Ruler className="w-4 h-4" /> },
];

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
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

const inputCls = 'w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors';

const emptyForm = (): ServiceCreateDto => ({ name: '', description: '', price: 0, category: 1 });

const AdminServices: React.FC = () => {
    const [services, setServices] = useState<ServiceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [editService, setEditService] = useState<ServiceDto | null>(null);
    const [deleteService, setDeleteService] = useState<ServiceDto | null>(null);

    const [form, setForm] = useState<ServiceCreateDto>(emptyForm());

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await serviceAdminService.getAll();
            setServices(data);
        } catch {
            setError('Failed to load services.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const handleCreate = async () => {
        setFormLoading(true);
        try {
            await serviceAdminService.create(form);
            setShowCreate(false);
            setForm(emptyForm());
            showToast('Service created successfully');
            fetchServices();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editService) return;
        setFormLoading(true);
        try {
            await serviceAdminService.update(editService.id, form);
            setEditService(null);
            showToast('Service updated successfully');
            fetchServices();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteService) return;
        setFormLoading(true);
        try {
            await serviceAdminService.delete(deleteService.id);
            setDeleteService(null);
            showToast('Service deleted successfully');
            fetchServices();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const openEdit = (s: ServiceDto) => {
        setEditService(s);
        setForm({
            name: s.name,
            description: s.description || '',
            price: s.price,
            category: s.category
        });
    };

    const getCategoryName = (id: number) => CATEGORIES.find(c => c.id === id)?.name || 'Other';
    const getCategoryIcon = (id: number) => CATEGORIES.find(c => c.id === id)?.icon || <ShoppingBag className="w-4 h-4" />;

    const ServiceForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <Field label="Service Name">
                <input className={inputCls} placeholder="e.g. Starter Pack" value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                    <select className={inputCls} value={form.category}
                        onChange={(e) => setForm(p => ({ ...p, category: Number(e.target.value) }))}>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
                <Field label="Price ($)">
                    <input className={inputCls} type="number" min={0} step="0.01" value={form.price}
                        onChange={(e) => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </Field>
            </div>
            <Field label="Description">
                <textarea className={`${inputCls} h-20 resize-none text-xs`} placeholder="Service description..." value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </Field>
            <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowCreate(false); setEditService(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={onSubmit} disabled={formLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {formLoading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                        <ShoppingBag className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Packages & Services</h1>
                        <p className="text-neutral-500 text-sm">{services.length} active offerings</p>
                    </div>
                </div>
                <button onClick={() => { setShowCreate(true); setForm(emptyForm()); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Package
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-44 bg-neutral-900 border border-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-500">
                    {services.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-neutral-500 border border-dashed border-white/5 rounded-3xl">
                            No services or packages found.
                        </div>
                    ) : (
                        services.map((s) => (
                            <div key={s.id} className="group bg-neutral-900 border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg bg-neutral-800 text-amber-400`}>
                                        {getCategoryIcon(s.category)}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(s)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteService(s)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1 mb-4">
                                    <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">
                                        {getCategoryName(s.category)}
                                    </span>
                                    <h3 className="text-white font-bold text-lg">{s.name}</h3>
                                    <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed">
                                        {s.description || 'No description provided.'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-2xl font-black text-white">${s.price}</span>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase">One-time</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showCreate && <Modal title="Add New Package" onClose={() => setShowCreate(false)}><ServiceForm onSubmit={handleCreate} submitLabel="Create Package" /></Modal>}
            {editService && <Modal title="Edit Package" onClose={() => setEditService(null)}><ServiceForm onSubmit={handleUpdate} submitLabel="Save Changes" /></Modal>}

            {deleteService && (
                <Modal title="Delete Package" onClose={() => setDeleteService(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-300">Delete <strong>{deleteService.name}</strong>? This will remove it from the store for all users.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteService(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {formLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminServices;
