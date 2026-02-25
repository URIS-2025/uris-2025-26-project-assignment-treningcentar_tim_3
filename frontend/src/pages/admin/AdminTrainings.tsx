import React, { useEffect, useState, useCallback } from 'react';
import { Dumbbell, Plus, Edit2, Trash2, X, AlertTriangle, Check } from 'lucide-react';
import {
    reservationAdminService,
    type SessionDto,
    type SessionCreateDTO,
    type SessionUpdateDTO,
} from '../../services/reservationAdminService';

const SESSION_TYPES = ['Group', 'Personal'];

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/20 backdrop-blur-sm px-4">
        <div className="bg-white border border-amber-100 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
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

const emptyCreate = (): SessionCreateDTO => ({
    name: '', description: '', sessionType: 'Group', trainerId: '', dateTime: '', capacity: 10,
});

const SessionForm: React.FC<{
    form: SessionCreateDTO | SessionUpdateDTO;
    onFieldChange: (field: string, value: any) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
    formLoading: boolean;
}> = ({ form, onFieldChange, onSubmit, onCancel, submitLabel, formLoading }) => (
    <div className="space-y-6">
        <Field label="Training Name">
            <input className={inputCls} placeholder="e.g. Morning Yoga" value={form.name}
                onChange={(e) => onFieldChange('name', e.target.value)} />
        </Field>
        <Field label="Description">
            <textarea className={`${inputCls} resize-none h-24`} placeholder="Session description..."
                value={form.description} onChange={(e) => onFieldChange('description', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
                <select className={inputCls} value={form.sessionType}
                    onChange={(e) => onFieldChange('sessionType', e.target.value)}>
                    {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </Field>
            <Field label="Capacity">
                <input className={inputCls} type="number" min={1} value={form.capacity}
                    onChange={(e) => onFieldChange('capacity', Number(e.target.value))} />
            </Field>
        </div>
        <Field label="Trainer ID">
            <input className={inputCls} placeholder="Trainer UUID" value={form.trainerId}
                onChange={(e) => onFieldChange('trainerId', e.target.value)} />
        </Field>
        <Field label="Date & Time">
            <input className={inputCls} type="datetime-local" value={form.dateTime}
                onChange={(e) => onFieldChange('dateTime', e.target.value)} />
        </Field>
        <div className="flex gap-4 pt-4">
            <button onClick={onCancel}
                className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">
                Cancel
            </button>
            <button onClick={onSubmit} disabled={formLoading}
                className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                {formLoading ? 'Saving...' : submitLabel}
            </button>
        </div>
    </div>
);

const AdminTrainings: React.FC = () => {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editSession, setEditSession] = useState<SessionDto | null>(null);
    const [deleteSession, setDeleteSession] = useState<SessionDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [createForm, setCreateForm] = useState<SessionCreateDTO>(emptyCreate());
    const [editForm, setEditForm] = useState<SessionUpdateDTO>({
        sessionId: '', name: '', description: '', sessionType: 'Group', trainerId: '', dateTime: '', capacity: 10,
    });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await reservationAdminService.getAllSessions();
            setSessions(data);
        } catch {
            setError('Failed to load sessions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleCreate = async () => {
        setFormLoading(true);
        try {
            await reservationAdminService.createSession(createForm);
            setShowCreate(false);
            setCreateForm(emptyCreate());
            showToast('Training created');
            fetchSessions();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const openEdit = (s: SessionDto) => {
        setEditSession(s);
        setEditForm({
            sessionId: s.sessionId, name: s.name, description: s.description,
            sessionType: s.sessionType, trainerId: s.trainerId,
            dateTime: s.dateTime?.slice(0, 16), capacity: s.capacity,
        });
    };

    const handleUpdate = async () => {
        setFormLoading(true);
        try {
            await reservationAdminService.updateSession(editForm);
            setEditSession(null);
            showToast('Training updated');
            fetchSessions();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteSession) return;
        setFormLoading(true);
        try {
            await reservationAdminService.deleteSession(deleteSession.sessionId);
            setDeleteSession(null);
            showToast('Training deleted');
            fetchSessions();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const typeBadge = (type: string) =>
        type === 'Group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-right-full">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-100">
                        <Dumbbell className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950">Trainings</h1>
                        <p className="text-amber-900/40 text-sm font-medium">{sessions.length} sessions available</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-amber-600/20 active:scale-95">
                    <Plus className="w-4 h-4" /> Add Training
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white border border-amber-100 rounded-[2rem] p-8 animate-pulse h-56 shadow-sm" />
                    ))
                    : sessions.length === 0
                        ? <div className="col-span-3 py-24 text-center text-amber-900/40 font-bold uppercase tracking-widest text-xs">No training sessions found</div>
                        : sessions.map((s) => (
                            <div key={s.sessionId}
                                className="bg-white border-2 border-amber-100 rounded-[2rem] p-6 hover:border-amber-400 transition-all group shadow-sm flex flex-col hover:shadow-xl hover:shadow-amber-500/5">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${typeBadge(s.sessionType)}`}>
                                        {s.sessionType}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(s)}
                                            className="p-2 rounded-xl text-amber-900/40 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteSession(s)}
                                            className="p-2 rounded-xl text-amber-900/40 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-amber-950 font-black text-xl mb-2 tracking-tight">{s.name}</h3>
                                <p className="text-amber-900/50 text-sm font-medium mb-6 line-clamp-2 leading-relaxed flex-1">{s.description}</p>
                                <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest">
                                    <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100/50">
                                        <p className="text-amber-900/30 mb-1">Capacity</p>
                                        <p className="text-amber-600 text-sm">{s.capacity}</p>
                                    </div>
                                    <div className="bg-neutral-50 rounded-2xl p-3 text-center border border-neutral-100/50">
                                        <p className="text-neutral-400 mb-1">Date</p>
                                        <p className="text-neutral-700 text-sm">
                                            {s.dateTime ? new Date(s.dateTime).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
            </div>

            {showCreate && (
                <Modal title="Add Training" onClose={() => setShowCreate(false)}>
                    <SessionForm
                        form={createForm}
                        onFieldChange={(field, val) => setCreateForm(prev => ({ ...prev, [field]: val }))}
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                        submitLabel="Create Training"
                        formLoading={formLoading}
                    />
                </Modal>
            )}

            {editSession && (
                <Modal title="Edit Training" onClose={() => setEditSession(null)}>
                    <SessionForm
                        form={editForm}
                        onFieldChange={(field, val) => setEditForm(prev => ({ ...prev, [field]: val }))}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditSession(null)}
                        submitLabel="Save Changes"
                        formLoading={formLoading}
                    />
                </Modal>
            )}

            {deleteSession && (
                <Modal title="Delete Training" onClose={() => setDeleteSession(null)}>
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-amber-950 font-black text-xl mb-2 tracking-tight">Remove Session?</p>
                            <p className="text-amber-900/50 font-medium">You are deleting <strong className="text-amber-950">{deleteSession.name}</strong>. Existing reservations may be affected.</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setDeleteSession(null)}
                                className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={formLoading}
                                className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50">
                                {formLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminTrainings;
