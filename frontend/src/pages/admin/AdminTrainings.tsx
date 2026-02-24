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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
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
    <div className="space-y-4">
        <Field label="Training Name">
            <input className={inputCls} placeholder="e.g. Morning Yoga" value={form.name}
                onChange={(e) => onFieldChange('name', e.target.value)} />
        </Field>
        <Field label="Description">
            <textarea className={`${inputCls} resize-none h-20`} placeholder="Session description..."
                value={form.description} onChange={(e) => onFieldChange('description', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
        <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/5 transition-colors">
                Cancel
            </button>
            <button onClick={onSubmit} disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
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
        type === 'Group' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10">
                        <Dumbbell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Trainings</h1>
                        <p className="text-neutral-500 text-sm">{sessions.length} sessions</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Training
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-white/5 rounded-2xl p-6 animate-pulse h-44" />
                    ))
                    : sessions.length === 0
                        ? <div className="col-span-3 py-20 text-center text-neutral-500">No training sessions found</div>
                        : sessions.map((s) => (
                            <div key={s.sessionId}
                                className="bg-neutral-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${typeBadge(s.sessionType)}`}>
                                        {s.sessionType}
                                    </span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(s)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteSession(s)}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{s.name}</h3>
                                <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{s.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-neutral-800 rounded-lg p-2 text-center">
                                        <p className="text-neutral-500 mb-0.5">Capacity</p>
                                        <p className="text-white font-bold">{s.capacity}</p>
                                    </div>
                                    <div className="bg-neutral-800 rounded-lg p-2 text-center">
                                        <p className="text-neutral-500 mb-0.5">Date</p>
                                        <p className="text-white font-bold">
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
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-300">
                                Delete <strong>{deleteSession.name}</strong>? This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteSession(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={formLoading}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
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
