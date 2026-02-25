import React, { useEffect, useState, useCallback } from 'react';
import { Dumbbell, Plus, Edit2, Trash2, X, AlertTriangle, Check } from 'lucide-react';
import {
    reservationAdminService,
    type SessionDto,
    type SessionCreateDTO,
    type SessionUpdateDTO,
} from '../../services/reservationAdminService';
import { adminService, type AdminUser } from '../../services/adminService';

const TRAINING_TYPES = ['Strength', 'Hypertrophy', 'Cardio', 'HIIT', 'CrossFit', 'Functional', 'Mobility', 'Stretching', 'Yoga', 'Pilates', 'Boxing'];
const SESSION_STATUSES = ['Upcoming', 'Finished', 'Canceled'];

// Enum value mappings
const TRAINING_TYPE_MAP: Record<string, number> = {
    'Strength': 0, 'Hypertrophy': 1, 'Cardio': 2, 'HIIT': 3, 'CrossFit': 4,
    'Functional': 5, 'Mobility': 6, 'Stretching': 7, 'Yoga': 8, 'Pilates': 9, 'Boxing': 10
};

const SESSION_STATUS_MAP: Record<string, number> = {
    'Upcoming': 0, 'Finished': 1, 'Canceled': 2
};

const reverseTrainingTypeMap: Record<number, string> = {
    0: 'Strength', 1: 'Hypertrophy', 2: 'Cardio', 3: 'HIIT', 4: 'CrossFit',
    5: 'Functional', 6: 'Mobility', 7: 'Stretching', 8: 'Yoga', 9: 'Pilates', 10: 'Boxing'
};

const reverseSessionStatusMap: Record<number, string> = {
    0: 'Upcoming', 1: 'Finished', 2: 'Canceled'
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border border-amber-100 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 sticky top-0 bg-white">
                <h3 className="text-neutral-800 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 transition-colors"><X className="w-5 h-5" /></button>
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

const inputCls = 'w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-neutral-800 text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors';

const emptyCreate = (): SessionCreateDTO => ({
    name: '', startTime: '', endTime: '', status: 'Upcoming', trainingType: 'Strength', trainerId: '', maxCapacity: 10, isGroup: true,
});

const SessionForm: React.FC<{
    form: SessionCreateDTO | SessionUpdateDTO;
    trainers: AdminUser[];
    isGroup: boolean;
    onFieldChange: (field: string, value: any) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
    formLoading: boolean;
}> = ({ form, trainers, isGroup, onFieldChange, onSubmit, onCancel, submitLabel, formLoading }) => (
    <div className="space-y-4">
        <Field label="Training Name">
            <input className={inputCls} placeholder="e.g. Morning Yoga" value={form.name}
                onChange={(e) => onFieldChange('name', e.target.value)} />
        </Field>
        
        <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
                <select className={inputCls} value={form.status}
                    onChange={(e) => onFieldChange('status', e.target.value)}>
                    {SESSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </Field>
            <Field label="Training Type">
                <select className={inputCls} value={form.trainingType}
                    onChange={(e) => onFieldChange('trainingType', e.target.value)}>
                    {TRAINING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </Field>
        </div>

        <Field label="Trainer">
            <select className={inputCls} value={form.trainerId}
                onChange={(e) => onFieldChange('trainerId', e.target.value)}>
                <option value="">-- Select a trainer --</option>
                {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName} (@{trainer.username})
                    </option>
                ))}
            </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time">
                <input className={inputCls} type="datetime-local" value={form.startTime}
                    onChange={(e) => onFieldChange('startTime', e.target.value)} />
            </Field>
            <Field label="End Time">
                <input className={inputCls} type="datetime-local" value={form.endTime}
                    onChange={(e) => onFieldChange('endTime', e.target.value)} />
            </Field>
        </div>

        {isGroup && (
            <Field label="Max Capacity">
                <input className={inputCls} type="number" min={1} value={form.maxCapacity}
                    onChange={(e) => onFieldChange('maxCapacity', Number(e.target.value))} />
            </Field>
        )}

        <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">
                Cancel
            </button>
            <button onClick={onSubmit} disabled={formLoading || !form.name || !form.trainerId || !form.startTime || !form.endTime}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {formLoading ? 'Saving...' : submitLabel}
            </button>
        </div>
    </div>
);

const AdminTrainings: React.FC = () => {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [trainers, setTrainers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createSessionType, setCreateSessionType] = useState<'Personal' | 'Group'>('Personal');
    const [editSession, setEditSession] = useState<SessionDto | null>(null);
    const [deleteSession, setDeleteSession] = useState<SessionDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [createForm, setCreateForm] = useState<SessionCreateDTO>(emptyCreate());
    const [editForm, setEditForm] = useState<SessionUpdateDTO>({
        sessionId: '', name: '', startTime: '', endTime: '', status: 'Upcoming', trainingType: 'Strength', trainerId: '', maxCapacity: 10,
    });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [sessionsData, trainersData] = await Promise.all([
                reservationAdminService.getAllSessions(),
                adminService.getAllUsers()
            ]);
            setSessions(sessionsData);

            // Show all users as potential trainers to avoid empty dropdowns
            const potentialTrainers = trainersData;
            setTrainers(potentialTrainers);
            if (potentialTrainers.length === 0) {
                setError('No users available. Please create a user first in Admin Users.');
            }
        } catch {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        if (!createForm.name || !createForm.trainerId || !createForm.startTime || !createForm.endTime) {
            setError('Please fill in all required fields');
            return;
        }
        setFormLoading(true);
        setError('');
        try {
            const payload: any = {
                name: createForm.name,
                status: SESSION_STATUS_MAP[createForm.status],
                trainingType: TRAINING_TYPE_MAP[createForm.trainingType],
                trainerId: createForm.trainerId,
                startTime: new Date(createForm.startTime).toISOString(),
                endTime: new Date(createForm.endTime).toISOString(),
                isGroup: createForm.isGroup
            };
            
            if (createForm.isGroup) {
                payload.maxCapacity = createForm.maxCapacity || 10;
            }
            
            await reservationAdminService.createSession(payload);
            setShowCreate(false);
            setCreateForm(emptyCreate());
            showToast('Training created');
            fetchData();
        } catch (e: any) { setError(e.message || 'Failed to create training'); }
        finally { setFormLoading(false); }
    };

    const openEdit = (s: SessionDto) => {
        setEditSession(s);
        const startDate = new Date(s.startTime);
        const endDate = new Date(s.endTime);
        
        // Convert numeric enum values to string names if needed
        const statusStr = typeof s.status === 'number' ? reverseSessionStatusMap[s.status] : s.status;
        const trainingTypeStr = typeof s.trainingType === 'number' ? reverseTrainingTypeMap[s.trainingType] : s.trainingType;
        
        setEditForm({
            sessionId: s.sessionId,
            name: s.name,
            startTime: startDate.toISOString().slice(0, 16),
            endTime: endDate.toISOString().slice(0, 16),
            status: statusStr,
            trainingType: trainingTypeStr,
            trainerId: typeof s.trainerId === 'string' ? s.trainerId : s.trainerId.id,
            maxCapacity: s.maxCapacity,
        });
    };

    const handleUpdate = async () => {
        if (!editForm.name || !editForm.trainerId || !editForm.startTime || !editForm.endTime) {
            setError('Please fill in all required fields');
            return;
        }
        setFormLoading(true);
        setError('');
        try {
            const payload: any = {
                sessionId: editForm.sessionId,
                name: editForm.name,
                status: SESSION_STATUS_MAP[editForm.status],
                trainingType: TRAINING_TYPE_MAP[editForm.trainingType],
                trainerId: editForm.trainerId,
                startTime: new Date(editForm.startTime).toISOString(),
                endTime: new Date(editForm.endTime).toISOString()
            };
            
            if (editForm.maxCapacity !== undefined) {
                payload.maxCapacity = editForm.maxCapacity;
            }
            
            await reservationAdminService.updateSession(payload);
            setEditSession(null);
            showToast('Training updated');
            fetchData();
        } catch (e: any) { setError(e.message || 'Failed to update training'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteSession) return;
        setFormLoading(true);
        try {
            await reservationAdminService.deleteSession(deleteSession.sessionId);
            setDeleteSession(null);
            showToast('Training deleted');
            fetchData();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const getTrainerName = (s: SessionDto) => {
        if (typeof s.trainerId === 'string') return s.trainerId;
        return `${s.trainerId.firstName} ${s.trainerId.lastName}`;
    };

    const getTrainingTypeName = (trainingType: any) => {
        if (typeof trainingType === 'number') return reverseTrainingTypeMap[trainingType] || 'Unknown';
        return trainingType;
    };

    const getStatusName = (status: any) => {
        if (typeof status === 'number') return reverseSessionStatusMap[status] || 'Unknown';
        return status;
    };

    const isGroupSession = (s: SessionDto) => s.maxCapacity !== undefined && s.maxCapacity !== null;

    const typeBadge = (isGroup: boolean) =>
        isGroup ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-neutral-800 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10">
                        <Dumbbell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800">Trainings</h1>
                        <p className="text-neutral-500 text-sm">{sessions.length} sessions</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-800 text-sm font-bold rounded-xl transition-colors">
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
                        <div key={i} className="bg-white border border-amber-100 shadow-sm rounded-2xl p-6 animate-pulse h-44" />
                    ))
                    : sessions.length === 0
                        ? <div className="col-span-3 py-20 text-center text-neutral-500">No training sessions found</div>
                        : sessions.map((s) => (
                            <div key={s.sessionId}
                                className="bg-white border border-amber-100 shadow-sm rounded-2xl p-5 hover:border-amber-200 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${typeBadge(isGroupSession(s))}`}>
                                        {isGroupSession(s) ? 'Group' : 'Personal'}
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
                                <h3 className="text-neutral-800 font-bold text-lg mb-1">{s.name}</h3>
                                <p className="text-neutral-500 text-sm mb-1">{getTrainingTypeName(s.trainingType)}</p>
                                <p className="text-neutral-400 text-xs mb-3">{getTrainerName(s)}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-amber-50 rounded-lg p-2">
                                        <p className="text-neutral-500 mb-0.5">Status</p>
                                        <p className="text-neutral-800 font-bold">{getStatusName(s.status)}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-2">
                                        <p className="text-neutral-500 mb-0.5">Start</p>
                                        <p className="text-neutral-800 font-bold text-[0.7rem]">
                                            {s.startTime ? new Date(s.startTime).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
            </div>

            {showCreate && (
                <Modal title={`Add ${createSessionType} Training`} onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <Field label="Session Type">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setCreateSessionType('Personal');
                                        setCreateForm(prev => ({ ...prev, isGroup: false, maxCapacity: undefined }));
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                                        createSessionType === 'Personal'
                                            ? 'bg-blue-500 text-neutral-800'
                                            : 'bg-amber-50 text-neutral-400 hover:bg-amber-100'
                                    }`}
                                >
                                    Personal
                                </button>
                                <button
                                    onClick={() => {
                                        setCreateSessionType('Group');
                                        setCreateForm(prev => ({ ...prev, isGroup: true, maxCapacity: 10 }));
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                                        createSessionType === 'Group'
                                            ? 'bg-purple-500 text-neutral-800'
                                            : 'bg-amber-50 text-neutral-400 hover:bg-amber-100'
                                    }`}
                                >
                                    Group
                                </button>
                            </div>
                        </Field>
                        <SessionForm
                            form={createForm}
                            trainers={trainers}
                            isGroup={createSessionType === 'Group'}
                            onFieldChange={(field, val) => setCreateForm(prev => ({ ...prev, [field]: val }))}
                            onSubmit={handleCreate}
                            onCancel={() => setShowCreate(false)}
                            submitLabel="Create Training"
                            formLoading={formLoading}
                        />
                    </div>
                </Modal>
            )}

            {editSession && (
                <Modal title="Edit Training" onClose={() => setEditSession(null)}>
                    <SessionForm
                        form={editForm}
                        trainers={trainers}
                        isGroup={isGroupSession(editSession)}
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
                                className="flex-1 py-2.5 rounded-xl border border-amber-200 text-neutral-600 text-sm font-semibold hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={formLoading}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-neutral-800 text-sm font-bold transition-colors disabled:opacity-50">
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
