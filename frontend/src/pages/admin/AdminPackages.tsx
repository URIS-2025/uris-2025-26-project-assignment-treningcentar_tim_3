import React, { useEffect, useState, useCallback } from 'react';
import { Package as PackageIcon, Plus, Edit2, Trash2, X, AlertTriangle, Check, Clock, Tag } from 'lucide-react';
import { membershipAdminService, type Package as PackageType, type PackageCreateDTO } from '../../services/membershipAdminService';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-neutral-900 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors"><X className="w-5 h-5" /></button>
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

const emptyForm = (): PackageCreateDTO => ({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    services: []
});

const AdminPackages: React.FC = () => {
    const [packages, setPackages] = useState<PackageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [editPkg, setEditPkg] = useState<PackageType | null>(null);
    const [deletePkg, setDeletePkg] = useState<PackageType | null>(null);

    const [form, setForm] = useState<PackageCreateDTO>(emptyForm());
    const [serviceInput, setServiceInput] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchPackages = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await membershipAdminService.getAllPackages();
            setPackages(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load packages.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPackages(); }, [fetchPackages]);

    const handleCreate = async () => {
        setFormLoading(true);
        try {
            await membershipAdminService.createPackage(form);
            setShowCreate(false);
            setForm(emptyForm());
            showToast('Membership package created');
            fetchPackages();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleUpdate = async () => {
        if (!editPkg) return;
        setFormLoading(true);
        try {
            await membershipAdminService.updatePackage(editPkg.packageId, form);
            setEditPkg(null);
            showToast('Membership package updated');
            fetchPackages();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!deletePkg) return;
        setFormLoading(true);
        try {
            await membershipAdminService.deletePackage(deletePkg.packageId);
            setDeletePkg(null);
            showToast('Membership package deleted');
            fetchPackages();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const openEdit = (p: PackageType) => {
        setEditPkg(p);
        setForm({
            name: p.name,
            description: p.description,
            price: p.price,
            duration: p.duration,
            services: [...p.services]
        });
    };

    const addService = () => {
        if (!serviceInput.trim()) return;
        setForm(p => ({ ...p, services: [...p.services, serviceInput.trim()] }));
        setServiceInput('');
    };

    const removeService = (index: number) => {
        setForm(p => ({ ...p, services: p.services.filter((_, i) => i !== index) }));
    };

    const PackageForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <Field label="Package Name">
                <input className={inputCls} placeholder="e.g. Pro Membership" value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            
            <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (days)">
                    <input className={inputCls} type="number" min={1} value={form.duration}
                        onChange={(e) => setForm(p => ({ ...p, duration: Number(e.target.value) }))} />
                </Field>
                <Field label="Price ($)">
                    <input className={inputCls} type="number" min={0} step="0.01" value={form.price}
                        onChange={(e) => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </Field>
            </div>

            <Field label="Description">
                <textarea className={`${inputCls} h-20 resize-none text-xs`} placeholder="Plan details..." value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </Field>

            <Field label="Included Services">
                <div className="flex gap-2 mb-2">
                    <input className={inputCls} placeholder="e.g. Pool Access" value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    />
                    <button onClick={addService} className="px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {form.services.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-600 text-[10px] font-bold uppercase rounded-lg border border-amber-500/20">
                            {s}
                            <button onClick={() => removeService(i)} className="hover:text-amber-200"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    {form.services.length === 0 && <p className="text-[10px] text-neutral-600 italic">No services added yet</p>}
                </div>
            </Field>

            <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowCreate(false); setEditPkg(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">Cancel</button>
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
                        <PackageIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900">Membership Packages</h1>
                        <p className="text-neutral-500 text-sm">{packages.length} defined plans</p>
                    </div>
                </div>
                <button onClick={() => { setShowCreate(true); setForm(emptyForm()); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> New Package
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-56 bg-white border border-neutral-200 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-neutral-500 border border-dashed border-neutral-200 rounded-3xl">
                            No membership packages found. Start by creating one.
                        </div>
                    ) : (
                        packages.map((pkg) => (
                            <div key={pkg.packageId} className="group relative bg-white border border-neutral-200 rounded-2xl p-6 hover:border-amber-500/50 transition-all">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeletePkg(pkg)} className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <h3 className="text-xl font-black text-neutral-900 mb-2">{pkg.name}</h3>
                                <p className="text-neutral-500 text-xs mb-6 line-clamp-3 leading-relaxed h-12">
                                    {pkg.description}
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-3 border border-neutral-200">
                                        <Clock className="w-4 h-4 text-amber-500/50" />
                                        <div>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Duration</p>
                                            <p className="text-sm text-neutral-900 font-black">{pkg.duration} Days</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-3 border border-neutral-200">
                                        <Tag className="w-4 h-4 text-emerald-500/50" />
                                        <div>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Price</p>
                                            <p className="text-sm text-emerald-600 font-black">${pkg.price}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Included Services</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {pkg.services?.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/5 text-neutral-300 text-[10px] font-bold rounded-md">
                                                {s}
                                            </span>
                                        ))}
                                        {(!pkg.services || pkg.services.length === 0) && <span className="text-[10px] text-neutral-600">Base access only</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showCreate && <Modal title="Create Package" onClose={() => setShowCreate(false)}><PackageForm onSubmit={handleCreate} submitLabel="Create Package" /></Modal>}
            {editPkg && <Modal title="Edit Package" onClose={() => setEditPkg(null)}><PackageForm onSubmit={handleUpdate} submitLabel="Save Changes" /></Modal>}

            {deletePkg && (
                <Modal title="Delete Package" onClose={() => setDeletePkg(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-300">Delete <strong>{deletePkg.name}</strong>? This will remove this membership plan permanently.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletePkg(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">Cancel</button>
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

export default AdminPackages;
