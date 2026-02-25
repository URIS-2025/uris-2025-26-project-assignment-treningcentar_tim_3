import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { measurementService } from '../../services/measurementService';
import type { MeasurementAppointmentDTO, MeasurementAppointmentCreateDTO } from '../../types/measurement';
import { servicePickerService, type ServiceOption } from '../../services/servicePickerService';
import type { UserSearchResult } from '../../services/userSearchService';
import UserAutocomplete from '../../components/shared/UserAutocomplete';

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('sr-RS', { dateStyle: 'medium', timeStyle: 'short' });

const isFuture = (iso: string) => new Date(iso) > new Date();

type Filter = 'All' | 'Upcoming' | 'Past';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string; type: 'success' | 'error'; onClose: () => void }> = ({ msg, type, onClose }) => (
    <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold
            ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
    >
        <span>{msg}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
);

// ─── Label ────────────────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-bold text-amber-900/60 uppercase tracking-wider mb-1">
        {children}
    </label>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddSlotModal: React.FC<ModalProps> = ({ onClose, onSuccess }) => {
    // --- selection state (the actual IDs to submit)
    const [selectedMember, setSelectedMember] = useState<UserSearchResult | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<UserSearchResult | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');

    // --- services list for dropdown
    const [services, setServices] = useState<ServiceOption[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);

    // --- form errors
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState('');
    const [saving, setSaving] = useState(false);

    // load services on mount
    useEffect(() => {
        servicePickerService.getAll()
            .then(data => setServices(data))
            .catch(() => setServices([]))
            .finally(() => setLoadingServices(false));
    }, []);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!selectedMember) errs.member = 'Please select a member from the dropdown.';
        if (!selectedTrainer) errs.trainer = 'Please select a trainer from the dropdown.';
        if (!selectedServiceId) errs.service = 'Please select a service.';
        if (!date) errs.date = 'Date & Time is required.';
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        setSubmitError('');
        try {
            const dto: MeasurementAppointmentCreateDTO = {
                memberId: selectedMember!.id,
                employeeId: selectedTrainer!.id,
                serviceId: selectedServiceId,
                date: new Date(date).toISOString(),
                notes: notes.trim() || undefined,
            };
            await measurementService.createAppointment(dto);
            onSuccess();
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to create appointment.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-5 text-2xl text-gray-400 hover:text-gray-700 transition-colors"
                >
                    &times;
                </button>
                <h2 className="text-xl font-black text-amber-950 mb-6">Add Measurement Slot</h2>

                {submitError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Member autocomplete */}
                    <div>
                        <FieldLabel>Member *</FieldLabel>
                        <UserAutocomplete
                            role="Member"
                            placeholder="Search by name, username or email…"
                            onSelect={u => {
                                setSelectedMember(u);
                                if (u) setFieldErrors(p => ({ ...p, member: '' }));
                            }}
                            error={fieldErrors.member}
                        />
                    </div>

                    {/* Trainer autocomplete */}
                    <div>
                        <FieldLabel>Trainer *</FieldLabel>
                        <UserAutocomplete
                            role="Trainer"
                            placeholder="Search by name, username or email…"
                            onSelect={u => {
                                setSelectedTrainer(u);
                                if (u) setFieldErrors(p => ({ ...p, trainer: '' }));
                            }}
                            error={fieldErrors.trainer}
                        />
                    </div>

                    {/* Service dropdown */}
                    <div>
                        <FieldLabel>Service *</FieldLabel>
                        {loadingServices ? (
                            <div className="text-xs text-amber-900/40 italic px-1">Loading services…</div>
                        ) : (
                            <select
                                value={selectedServiceId}
                                onChange={e => {
                                    setSelectedServiceId(e.target.value);
                                    setFieldErrors(p => ({ ...p, service: '' }));
                                }}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white ${fieldErrors.service
                                        ? 'border-rose-300 bg-rose-50'
                                        : 'border-amber-200'
                                    }`}
                            >
                                <option value="">— Select a service —</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {fieldErrors.service && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">{fieldErrors.service}</p>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div>
                        <FieldLabel>Date &amp; Time *</FieldLabel>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={e => {
                                setDate(e.target.value);
                                setFieldErrors(p => ({ ...p, date: '' }));
                            }}
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${fieldErrors.date ? 'border-rose-300 bg-rose-50' : 'border-amber-200'
                                }`}
                        />
                        {fieldErrors.date && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">{fieldErrors.date}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <FieldLabel>Notes (optional)</FieldLabel>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Any additional notes…"
                            className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Creating…' : 'Create Slot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MeasurementAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<MeasurementAppointmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('All');
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await measurementService.getAllAppointments();
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAppointments(data);
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Failed to load appointments.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const filtered = appointments.filter(a => {
        if (filter === 'Upcoming') return isFuture(a.date);
        if (filter === 'Past') return !isFuture(a.date);
        return true;
    });

    const handleModalSuccess = () => {
        setShowModal(false);
        showToast('Appointment created successfully!', 'success');
        loadAppointments();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-amber-950 tracking-tight">
                        My Measurement Appointments
                    </h1>
                    <p className="text-sm text-amber-900/50 mt-1">
                        Manage your scheduled measurement slots
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/20 transition-all hover:scale-105 active:scale-95 text-sm"
                >
                    + Add Slot
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['All', 'Upcoming', 'Past'] as Filter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                            : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
                <span className="ml-auto self-center text-xs text-amber-900/40 font-semibold">
                    {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <Spinner />
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-amber-900/40">
                    <div className="text-5xl mb-4">📅</div>
                    <p className="font-semibold">No appointments found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/5 overflow-hidden border border-amber-100">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-amber-50 border-b border-amber-100">
                                    <th className="px-6 py-4 text-left text-xs font-black text-amber-900/50 uppercase tracking-widest">
                                        Date &amp; Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-amber-900/50 uppercase tracking-widest">
                                        Member ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-amber-900/50 uppercase tracking-widest">
                                        Trainer ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-amber-900/50 uppercase tracking-widest">
                                        Notes
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-amber-900/50 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                                {filtered.map(a => (
                                    <tr key={a.appointmentId} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-amber-950">
                                            {formatDate(a.date)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-amber-900/60 max-w-[140px] truncate">
                                            {a.memberId}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-amber-900/60 max-w-[140px] truncate">
                                            {a.employeeId}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/60 max-w-[160px] truncate">
                                            {a.notes || <span className="text-amber-900/30 italic">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFuture(a.date)
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {isFuture(a.date) ? 'Upcoming' : 'Past'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/nutritionist/measurement-appointments/${a.appointmentId}`}
                                                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-amber-50">
                        {filtered.map(a => (
                            <div key={a.appointmentId} className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-amber-950">{formatDate(a.date)}</p>
                                        <p className="text-xs text-amber-900/50 font-mono truncate mt-0.5">
                                            Member: {a.memberId}
                                        </p>
                                        {a.notes && (
                                            <p className="text-xs text-amber-900/60 mt-1 truncate">{a.notes}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isFuture(a.date)
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {isFuture(a.date) ? 'Upcoming' : 'Past'}
                                        </span>
                                        <Link
                                            to={`/nutritionist/measurement-appointments/${a.appointmentId}`}
                                            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                                        >
                                            Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <AddSlotModal onClose={() => setShowModal(false)} onSuccess={handleModalSuccess} />
            )}

            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MeasurementAppointments;
