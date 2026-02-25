import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { measurementService } from '../../services/measurementService';
import type { MeasurementAppointmentDTO, MeasurementResultsDTO, GuidelineDTO, GuidelineCreateDTO } from '../../types/measurement';
import { GuidelineCategory, GuidelineCategoryLabel } from '../../types/measurement';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso: string) =>
    new Date(iso).toLocaleString('sr-RS', { dateStyle: 'long', timeStyle: 'short' });

const isFuture = (iso: string) => new Date(iso) > new Date();

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

// ─── Section Card ─────────────────────────────────────────────────────────────
const Card: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-100 p-6 md:p-8">
        <h2 className="text-lg font-black text-amber-950 flex items-center gap-2 mb-5">
            <span>{icon}</span> {title}
        </h2>
        {children}
    </div>
);

// ─── Results Section ──────────────────────────────────────────────────────────
const ResultsSection: React.FC<{
    appt: MeasurementAppointmentDTO;
    onSaved: () => void;
    showToast: (m: string, t: 'success' | 'error') => void;
}> = ({ appt, onSaved, showToast }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<MeasurementResultsDTO>({
        weightKg: appt.weightKg ?? undefined,
        heightCm: appt.heightCm ?? undefined,
        bodyFatPercent: appt.bodyFatPercent ?? undefined,
    });
    const [saving, setSaving] = useState(false);

    const hasResults = appt.weightKg != null || appt.heightCm != null || appt.bodyFatPercent != null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await measurementService.updateResults(appt.appointmentId, form);
            showToast('Results saved!', 'success');
            setEditing(false);
            onSaved();
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Failed to save results.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const numInput = (label: string, field: keyof MeasurementResultsDTO, unit: string) => (
        <div>
            <label className="block text-xs font-bold text-amber-900/50 uppercase tracking-wider mb-1">
                {label} ({unit})
            </label>
            <input
                type="number"
                step="0.1"
                min="0"
                value={form[field] ?? ''}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
        </div>
    );

    if (editing) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {numInput('Weight', 'weightKg', 'kg')}
                    {numInput('Height', 'heightCm', 'cm')}
                    {numInput('Body Fat', 'bodyFatPercent', '%')}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setEditing(false)}
                        className="px-5 py-2 rounded-xl border border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Results'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {hasResults ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {[
                        { label: 'Weight', value: appt.weightKg, unit: 'kg' },
                        { label: 'Height', value: appt.heightCm, unit: 'cm' },
                        { label: 'Body Fat', value: appt.bodyFatPercent, unit: '%' },
                    ].map(({ label, value, unit }) => (
                        <div key={label} className="bg-amber-50 rounded-2xl px-5 py-4">
                            <p className="text-xs font-bold text-amber-900/50 uppercase tracking-wider">{label}</p>
                            <p className="text-2xl font-black text-amber-950 mt-1">
                                {value != null ? `${value} ${unit}` : <span className="text-amber-900/30 text-base">—</span>}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-amber-900/40 italic mb-4">No results recorded yet.</p>
            )}
            <button
                onClick={() => setEditing(true)}
                className="px-5 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors"
            >
                {hasResults ? '✏️ Edit Results' : '➕ Enter Results'}
            </button>
        </div>
    );
};

// ─── Guideline Section ────────────────────────────────────────────────────────
const GuidelineSection: React.FC<{
    appt: MeasurementAppointmentDTO;
    onSaved: () => void;
    showToast: (m: string, t: 'success' | 'error') => void;
}> = ({ appt, onSaved, showToast }) => {
    const [guideline, setGuideline] = useState<GuidelineDTO | null>(null);
    const [loadingG, setLoadingG] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<GuidelineCreateDTO>({
        title: '',
        content: '',
        category: GuidelineCategory.Nutrition,
    });
    const [saving, setSaving] = useState(false);

    const loadGuideline = useCallback(async () => {
        if (!appt.guidelineId) {
            setLoadingG(false);
            return;
        }
        setLoadingG(true);
        try {
            const g = await measurementService.getGuidelineById(appt.guidelineId);
            setGuideline(g);
            setForm({ title: g.title, content: g.content, category: g.category });
        } catch {
            // guideline might not be visible – treat as "none"
            setGuideline(null);
        } finally {
            setLoadingG(false);
        }
    }, [appt.guidelineId]);

    useEffect(() => {
        loadGuideline();
    }, [loadGuideline]);

    const handleSave = async () => {
        if (!form.title.trim()) return showToast('Title is required.', 'error');
        if (!form.content.trim()) return showToast('Content is required.', 'error');

        setSaving(true);
        try {
            if (guideline) {
                await measurementService.updateGuideline(guideline.guidelineId, form);
                showToast('Guideline updated!', 'success');
            } else {
                await measurementService.createGuideline(appt.appointmentId, form);
                showToast('Guideline created!', 'success');
                onSaved(); // re-fetch appointment so guidelineId is populated
            }
            setEditing(false);
            loadGuideline();
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Failed to save guideline.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loadingG) return <div className="text-amber-900/40 text-sm italic">Loading guideline…</div>;

    const categories = Object.values(GuidelineCategory) as GuidelineCategory[];

    if (editing || !guideline) {
        return (
            <div className="space-y-4">
                {!guideline && !editing && (
                    <p className="text-amber-900/40 italic mb-2">No guideline yet for this appointment.</p>
                )}
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-5 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors"
                    >
                        ➕ Create Guideline
                    </button>
                ) : (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-amber-900/50 uppercase tracking-wider mb-1">Title</label>
                            <input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-900/50 uppercase tracking-wider mb-1">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: Number(e.target.value) as GuidelineCategory }))}
                                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{GuidelineCategoryLabel[c]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-900/50 uppercase tracking-wider mb-1">Content</label>
                            <textarea
                                rows={5}
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setEditing(false); if (!guideline) setForm({ title: '', content: '', category: GuidelineCategory.Nutrition }); }}
                                className="px-5 py-2 rounded-xl border border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : (guideline ? 'Update Guideline' : 'Create Guideline')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Guideline exists and not editing
    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-black text-amber-950 text-lg">{guideline.title}</p>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {GuidelineCategoryLabel[guideline.category]}
                    </span>
                </div>
                <button
                    onClick={() => setEditing(true)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors"
                >
                    ✏️ Edit
                </button>
            </div>
            <p className="text-amber-900/70 text-sm leading-relaxed whitespace-pre-wrap">{guideline.content}</p>
            <p className="text-xs text-amber-900/30">Last updated: {fmt(guideline.lastUpdated)}</p>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [appt, setAppt] = useState<MeasurementAppointmentDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadAppt = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await measurementService.getAppointmentById(id);
            setAppt(data);
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Failed to load appointment.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadAppt();
    }, [loadAppt]);

    if (loading) return <Spinner />;
    if (!appt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl font-black text-amber-950">Appointment not found</p>
                    <Link to="/nutritionist/measurement-appointments" className="mt-4 inline-block text-amber-600 font-bold hover:underline">
                        ← Back to list
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 md:p-10">
            {/* Back */}
            <Link
                to="/nutritionist/measurement-appointments"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900 mb-6 group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Appointments
            </Link>

            {/* Header Card */}
            <Card title="Appointment Info" icon="📋">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: 'Date & Time', value: fmt(appt.date) },
                        { label: 'Status', value: isFuture(appt.date) ? '🟢 Upcoming' : '⚫ Past' },
                        { label: 'Notes', value: appt.notes || '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-amber-50 rounded-2xl px-5 py-4">
                            <p className="text-xs font-bold text-amber-900/50 uppercase tracking-wider">{label}</p>
                            <p className="text-sm font-semibold text-amber-950 mt-1">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: 'Member ID', value: appt.memberId },
                        { label: 'Trainer / Employee ID', value: appt.employeeId },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-amber-50 rounded-2xl px-5 py-4">
                            <p className="text-xs font-bold text-amber-900/50 uppercase tracking-wider">{label}</p>
                            <p className="text-xs font-mono text-amber-950/70 mt-1 break-all">{value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Results */}
            <div className="mt-6">
                <Card title="Measurement Results" icon="📊">
                    <ResultsSection appt={appt} onSaved={loadAppt} showToast={showToast} />
                </Card>
            </div>

            {/* Guideline */}
            <div className="mt-6">
                <Card title="Guideline / Recommendations" icon="📝">
                    <GuidelineSection appt={appt} onSaved={loadAppt} showToast={showToast} />
                </Card>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AppointmentDetails;
