import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Search, Trash2, X, AlertTriangle, Check, Filter } from 'lucide-react';
import { reservationAdminService, type ReservationDto } from '../../services/reservationAdminService';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-neutral-900 font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const AdminReservations: React.FC = () => {
    const [reservations, setReservations] = useState<ReservationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [search, setSearch] = useState('');
    const [filterBy, setFilterBy] = useState<'all' | 'user' | 'session'>('all');
    const [cancelTarget, setCancelTarget] = useState<ReservationDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await reservationAdminService.getAllReservations();
            setReservations(data);
        } catch {
            setError('Failed to load reservations.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReservations(); }, [fetchReservations]);

    const filtered = reservations.filter((r) => {
        const term = search.toLowerCase();
        if (!term) return true;
        if (filterBy === 'user') return (r.username || r.userId)?.toLowerCase().includes(term);
        if (filterBy === 'session') return (r.sessionName || r.sessionId)?.toLowerCase().includes(term);
        return (
            (r.username || r.userId)?.toLowerCase().includes(term) ||
            (r.sessionName || r.sessionId)?.toLowerCase().includes(term)
        );
    });

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setFormLoading(true);
        try {
            await reservationAdminService.cancelReservation(cancelTarget.reservationId);
            setCancelTarget(null);
            showToast('Reservation cancelled');
            fetchReservations();
        } catch (e: any) { setError(e.message); }
        finally { setFormLoading(false); }
    };

    const statusBadge = (s: string) => {
        if (s === 'Active' || s === 'Confirmed') return 'bg-emerald-100 text-emerald-600';
        if (s === 'Cancelled') return 'bg-rose-100 text-rose-600';
        return 'bg-neutral-700 text-neutral-300';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10">
                    <BookOpen className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Reservations</h1>
                    <p className="text-neutral-500 text-sm">{reservations.length} total reservations</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Search reservations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select
                        className="bg-transparent text-sm text-neutral-300 focus:outline-none py-2.5"
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                    >
                        <option value="all">All</option>
                        <option value="user">By User</option>
                        <option value="session">By Session</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Reservation ID</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Session</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                                <th className="text-right px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No reservations found</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.reservationId} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-5 py-4 font-mono text-xs text-neutral-500">{r.reservationId?.slice(0, 8)}…</td>
                                        {/* @ts-ignore */}
                                        <td className="px-5 py-4 text-neutral-900 font-semibold">{r.member.username || r.userId?.slice(0, 8) + '…'}</td>
                                        <td className="px-5 py-4 text-neutral-300">{r.sessionName || r.sessionId?.slice(0, 8) + '…'}</td>
                                        <td className="px-5 py-4 text-neutral-500">
                                            {r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge(r.status)}`}>{r.status || 'Active'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setCancelTarget(r)}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title="Cancel reservation"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {cancelTarget && (
                <Modal title="Cancel Reservation" onClose={() => setCancelTarget(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-300">
                                Cancel this reservation for <strong>{cancelTarget.username || cancelTarget.userId?.slice(0, 8)}</strong>?
                                Capacity will be updated accordingly.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition-colors">
                                Keep
                            </button>
                            <button onClick={handleCancel} disabled={formLoading}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {formLoading ? 'Cancelling...' : 'Cancel Reservation'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminReservations;
