import React, { useEffect, useState, useCallback } from 'react';
import { Ruler, Plus, Trash2, Edit2, X, FileText, Scale } from 'lucide-react';
import {
    measurementAdminService,
    type MeasurementAppointmentDto,
    type MeasurementAppointmentCreateDto,
    type MeasurementResultsDto,
    type GuidelineDto,
    type GuidelineCreateDto,
} from '../../services/measurementAdminService';
import { adminService, type AdminUser } from '../../services/adminService';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white border border-amber-100 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 sticky top-0 bg-white">
                <h3 className="text-neutral-800 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-5 h-5" /></button>
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

const inputCls = 'w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors';

const AdminMeasurements: React.FC = () => {
    const [tab, setTab] = useState<'appointments' | 'guidelines'>('appointments');
    const [appointments, setAppointments] = useState<MeasurementAppointmentDto[]>([]);
    const [guidelines, setGuidelines] = useState<GuidelineDto[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [editAppointment, setEditAppointment] = useState<MeasurementAppointmentDto | null>(null);
    const [deleteAppointment, setDeleteAppointment] = useState<MeasurementAppointmentDto | null>(null);
    const [resultsAppointment, setResultsAppointment] = useState<MeasurementAppointmentDto | null>(null);
    const [guidelineAppointment, setGuidelineAppointment] = useState<MeasurementAppointmentDto | null>(null);
    const [deleteGuideline, setDeleteGuideline] = useState<GuidelineDto | null>(null);

    // Forms
    const emptyAppointmentForm = (): MeasurementAppointmentCreateDto => ({
        memberId: '',
        employeeId: '',
        nutritionistId: '',
        date: new Date().toISOString().slice(0, 16),
        notes: '',
    });

    const [appointmentForm, setAppointmentForm] = useState<MeasurementAppointmentCreateDto>(emptyAppointmentForm());
    const [resultsForm, setResultsForm] = useState<MeasurementResultsDto>({ weightKg: undefined, heightCm: undefined, bodyFatPercent: undefined });
    const [guidelineForm, setGuidelineForm] = useState<GuidelineCreateDto>({ title: '', content: '', category: 'Nutrition' });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : userId.slice(0, 8);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [appts, guides, usrs] = await Promise.allSettled([
                measurementAdminService.getAllAppointments(),
                measurementAdminService.getAllGuidelines(),
                adminService.getAllUsers(),
            ]);
            if (appts.status === 'fulfilled') {
                setAppointments(appts.value || []);
            }
            if (guides.status === 'fulfilled') {
                setGuidelines(guides.value || []);
            }
            if (usrs.status === 'fulfilled') {
                setUsers(usrs.value || []);
            }
        } catch {
            setError('Failed to load measurement data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Filter users by role
    const members = users.filter(u => u.role === 'Member');
    const nutritionists = users.filter(u => u.role === 'Nutritionist');

    const handleCreateAppointment = async () => {
        if (!appointmentForm.memberId || !appointmentForm.nutritionistId) {
            setError('Member and Nutritionist are required');
            return;
        }
        // Backend requires employeeId, set it to nutritionistId
        const payload = { ...appointmentForm, employeeId: appointmentForm.nutritionistId };
        setFormLoading(true);
        try {
            await measurementAdminService.createAppointment(payload);
            setShowCreate(false);
            setAppointmentForm(emptyAppointmentForm());
            showToast('Appointment created');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleUpdateAppointment = async () => {
        if (!editAppointment) return;
        setFormLoading(true);
        // Backend requires employeeId, set it to nutritionistId
        const payload = { ...appointmentForm, employeeId: appointmentForm.nutritionistId || appointmentForm.employeeId };
        try {
            await measurementAdminService.updateAppointment(editAppointment.appointmentId, payload);
            setEditAppointment(null);
            showToast('Appointment updated');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDeleteAppointment = async () => {
        if (!deleteAppointment) return;
        setFormLoading(true);
        try {
            await measurementAdminService.deleteAppointment(deleteAppointment.appointmentId);
            setDeleteAppointment(null);
            showToast('Appointment deleted');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleUpdateResults = async () => {
        if (!resultsAppointment) return;
        setFormLoading(true);
        try {
            await measurementAdminService.updateResults(resultsAppointment.appointmentId, resultsForm);
            setResultsAppointment(null);
            showToast('Results updated');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleCreateGuideline = async () => {
        if (!guidelineAppointment) return;
        if (!guidelineForm.title || !guidelineForm.content) {
            setError('Title and content are required');
            return;
        }
        setFormLoading(true);
        try {
            await measurementAdminService.createGuidelineForAppointment(guidelineAppointment.appointmentId, guidelineForm);
            setGuidelineAppointment(null);
            setGuidelineForm({ title: '', content: '', category: 'Nutrition' });
            showToast('Guideline created');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDeleteGuideline = async () => {
        if (!deleteGuideline) return;
        setFormLoading(true);
        try {
            await measurementAdminService.deleteGuideline(deleteGuideline.guidelineId);
            setDeleteGuideline(null);
            showToast('Guideline deleted');
            fetchAll();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const openEdit = (a: MeasurementAppointmentDto) => {
        setAppointmentForm({
            memberId: a.memberId,
            employeeId: a.employeeId,
            nutritionistId: a.nutritionistId,
            date: a.date.slice(0, 16),
            notes: a.notes || '',
            serviceId: a.serviceId,
        });
        setEditAppointment(a);
    };

    const openResults = (a: MeasurementAppointmentDto) => {
        setResultsForm({
            weightKg: a.weightKg,
            heightCm: a.heightCm,
            bodyFatPercent: a.bodyFatPercent,
        });
        setResultsAppointment(a);
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800">Measurements</h1>
                        <p className="text-sm text-neutral-500">Manage measurement appointments and guidelines</p>
                    </div>
                </div>
                {tab === 'appointments' && (
                    <button onClick={() => { setAppointmentForm(emptyAppointmentForm()); setShowCreate(true); }}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> New Appointment
                    </button>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-green-500 text-neutral-800 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">
                    {toast}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 text-sm">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-amber-100 pb-2">
                <button onClick={() => setTab('appointments')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'appointments' ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-neutral-800'}`}>
                    Appointments ({appointments.length})
                </button>
                <button onClick={() => setTab('guidelines')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'guidelines' ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-neutral-800'}`}>
                    Guidelines ({guidelines.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-neutral-500">Loading...</div>
            ) : tab === 'appointments' ? (
                <div className="space-y-3">
                    {appointments.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">No appointments found.</div>
                    ) : (
                        appointments.map(a => (
                            <div key={a.appointmentId}
                                className="bg-white border border-amber-100 shadow-sm rounded-xl p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-neutral-800">{getUserName(a.memberId)}</span>
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        {new Date(a.date).toLocaleString()} 
                                        {a.nutritionistId && <span> • Nutritionist: {getUserName(a.nutritionistId)}</span>}
                                        {!a.nutritionistId && a.employeeId && <span> • Staff: {getUserName(a.employeeId)}</span>}
                                    </div>
                                    {(a.weightKg || a.heightCm || a.bodyFatPercent) && (
                                        <div className="text-xs text-amber-600 mt-1">
                                            {a.weightKg && <span>Weight: {a.weightKg}kg </span>}
                                            {a.heightCm && <span>Height: {a.heightCm}cm </span>}
                                            {a.bodyFatPercent && <span>Body Fat: {a.bodyFatPercent}% </span>}
                                        </div>
                                    )}
                                    {a.notes && <div className="text-xs text-neutral-500 italic">{a.notes}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openResults(a)} title="Update Results"
                                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-500/20 transition-colors">
                                        <Scale className="w-4 h-4" />
                                    </button>
                                    {!a.guidelineId && (
                                        <button onClick={() => setGuidelineAppointment(a)} title="Add Guideline"
                                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-500/20 transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(a)} title="Edit"
                                        className="p-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-500/20 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeleteAppointment(a)} title="Delete"
                                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500/20 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {guidelines.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">No guidelines found.</div>
                    ) : (
                        guidelines.map(g => (
                            <div key={g.guidelineId}
                                className="bg-white border border-amber-100 shadow-sm rounded-xl p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-bold text-neutral-800">{g.title}</div>
                                    <div className="text-xs text-neutral-500">
                                        Category: <span className="text-amber-600">{g.category}</span>
                                        <span className="text-neutral-500 mx-2">•</span>
                                        Updated: {new Date(g.lastUpdated).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-neutral-600 line-clamp-2">{g.content}</div>
                                </div>
                                <button onClick={() => setDeleteGuideline(g)} title="Delete"
                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500/20 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Appointment Modal */}
            {showCreate && (
                <Modal title="New Appointment" onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <Field label="Member *">
                            <select className={inputCls} value={appointmentForm.memberId}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, memberId: e.target.value }))}>
                                <option value="">Select member...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Nutritionist *">
                            <select className={inputCls} value={appointmentForm.nutritionistId || ''}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, nutritionistId: e.target.value }))}>
                                <option value="">Select nutritionist...</option>
                                {nutritionists.map(n => (
                                    <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Date & Time *">
                            <input type="datetime-local" className={inputCls} value={appointmentForm.date}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, date: e.target.value }))} />
                        </Field>
                        <Field label="Notes">
                            <textarea className={inputCls} rows={3} placeholder="Additional notes..."
                                value={appointmentForm.notes || ''}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, notes: e.target.value }))} />
                        </Field>
                        <button onClick={handleCreateAppointment} disabled={formLoading}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Processing...' : 'Create Appointment'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Edit Appointment Modal */}
            {editAppointment && (
                <Modal title="Edit Appointment" onClose={() => setEditAppointment(null)}>
                    <div className="space-y-4">
                        <Field label="Member *">
                            <select className={inputCls} value={appointmentForm.memberId}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, memberId: e.target.value }))}>
                                <option value="">Select member...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Nutritionist *">
                            <select className={inputCls} value={appointmentForm.nutritionistId || ''}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, nutritionistId: e.target.value }))}>
                                <option value="">Select nutritionist...</option>
                                {nutritionists.map(n => (
                                    <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Date & Time *">
                            <input type="datetime-local" className={inputCls} value={appointmentForm.date}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, date: e.target.value }))} />
                        </Field>
                        <Field label="Notes">
                            <textarea className={inputCls} rows={3} placeholder="Additional notes..."
                                value={appointmentForm.notes || ''}
                                onChange={(e) => setAppointmentForm(p => ({ ...p, notes: e.target.value }))} />
                        </Field>
                        <button onClick={handleUpdateAppointment} disabled={formLoading}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Processing...' : 'Update Appointment'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Delete Appointment Modal */}
            {deleteAppointment && (
                <Modal title="Delete Appointment" onClose={() => setDeleteAppointment(null)}>
                    <p className="text-neutral-600 mb-4">
                        Are you sure you want to delete the appointment for <strong className="text-neutral-800">{getUserName(deleteAppointment.memberId)}</strong>?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteAppointment(null)}
                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-neutral-800 font-semibold py-2.5 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleDeleteAppointment} disabled={formLoading}
                            className="flex-1 bg-red-500 hover:bg-red-400 text-neutral-800 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Update Results Modal */}
            {resultsAppointment && (
                <Modal title="Update Measurement Results" onClose={() => setResultsAppointment(null)}>
                    <div className="space-y-4">
                        <Field label="Weight (kg)">
                            <input type="number" step="0.1" className={inputCls} placeholder="e.g. 75.5"
                                value={resultsForm.weightKg ?? ''}
                                onChange={(e) => setResultsForm(p => ({ ...p, weightKg: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                        </Field>
                        <Field label="Height (cm)">
                            <input type="number" step="0.1" className={inputCls} placeholder="e.g. 180"
                                value={resultsForm.heightCm ?? ''}
                                onChange={(e) => setResultsForm(p => ({ ...p, heightCm: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                        </Field>
                        <Field label="Body Fat (%)">
                            <input type="number" step="0.1" className={inputCls} placeholder="e.g. 15.5"
                                value={resultsForm.bodyFatPercent ?? ''}
                                onChange={(e) => setResultsForm(p => ({ ...p, bodyFatPercent: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                        </Field>
                        <button onClick={handleUpdateResults} disabled={formLoading}
                            className="w-full bg-green-500 hover:bg-green-400 text-neutral-800 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Saving...' : 'Save Results'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Create Guideline Modal */}
            {guidelineAppointment && (
                <Modal title="Add Guideline" onClose={() => setGuidelineAppointment(null)}>
                    <div className="space-y-4">
                        <p className="text-neutral-500 text-sm">
                            Creating guideline for appointment with <strong className="text-neutral-800">{getUserName(guidelineAppointment.memberId)}</strong>
                        </p>
                        <Field label="Title *">
                            <input className={inputCls} placeholder="e.g. Weekly Nutrition Plan"
                                value={guidelineForm.title}
                                onChange={(e) => setGuidelineForm(p => ({ ...p, title: e.target.value }))} />
                        </Field>
                        <Field label="Category">
                            <select className={inputCls} value={guidelineForm.category}
                                onChange={(e) => setGuidelineForm(p => ({ ...p, category: e.target.value }))}>
                                <option value="Nutrition">Nutrition</option>
                                <option value="Exercise">Exercise</option>
                                <option value="Recovery">Recovery</option>
                                <option value="General">General</option>
                            </select>
                        </Field>
                        <Field label="Content *">
                            <textarea className={inputCls} rows={5} placeholder="Guideline content..."
                                value={guidelineForm.content}
                                onChange={(e) => setGuidelineForm(p => ({ ...p, content: e.target.value }))} />
                        </Field>
                        <button onClick={handleCreateGuideline} disabled={formLoading}
                            className="w-full bg-blue-500 hover:bg-blue-400 text-neutral-800 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Creating...' : 'Create Guideline'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Delete Guideline Modal */}
            {deleteGuideline && (
                <Modal title="Delete Guideline" onClose={() => setDeleteGuideline(null)}>
                    <p className="text-neutral-600 mb-4">
                        Are you sure you want to delete the guideline <strong className="text-neutral-800">"{deleteGuideline.title}"</strong>?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteGuideline(null)}
                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-neutral-800 font-semibold py-2.5 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleDeleteGuideline} disabled={formLoading}
                            className="flex-1 bg-red-500 hover:bg-red-400 text-neutral-800 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {formLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminMeasurements;
