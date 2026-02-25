import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Search, Trash2, X, AlertTriangle, Check, Filter } from 'lucide-react';
import { reservationAdminService, type ReservationDto } from '../../services/reservationAdminService';

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
        if (s === 'Active' || s === 'Confirmed') return 'bg-emerald-100 text-emerald-700';
        if (s === 'Cancelled') return 'bg-rose-100 text-rose-700';
        return 'bg-neutral-100 text-neutral-600';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-right-full">
                    <Check className="w-4 h-4" /> {toast}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-100">
                    <BookOpen className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-amber-950 tracking-tight">Reservations</h1>
                    <p className="text-amber-900/40 text-sm font-medium">{reservations.length} total registrations</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/30 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        className="w-full bg-white border-2 border-amber-100 rounded-2xl pl-11 pr-4 py-3 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                        placeholder="Search reservations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 bg-white border-2 border-amber-100 rounded-2xl px-4 py-3 shadow-sm min-w-[180px]">
                    <Filter className="w-4 h-4 text-amber-900/30" />
                    <select
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-amber-900/60 focus:outline-none w-full cursor-pointer"
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                    >
                        <option value="all">Search All</option>
                        <option value="user">By User</option>
                        <option value="session">By Session</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-amber-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-50">
                                {['ID', 'User', 'Session', 'Date', 'Status', 'Action'].map((h) => (
                                    <th key={h} className={`px-8 py-5 text-xs font-black text-amber-900/40 uppercase tracking-widest ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-8 py-5">
                                                <div className="h-4 bg-amber-50 rounded-full animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 text-amber-900/40 font-bold uppercase tracking-widest text-xs">No reservations found</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.reservationId} className="hover:bg-amber-50/50 transition-colors group">
                                        <td className="px-8 py-5 font-mono text-[10px] text-amber-900/30">{r.reservationId?.slice(0, 8)}…</td>
                                        <td className="px-8 py-5 text-amber-950 font-bold">{r.username || r.userId?.slice(0, 8)}</td>
                                        <td className="px-8 py-5 text-amber-900/70 font-medium">{r.sessionName || r.sessionId?.slice(0, 8)}</td>
                                        <td className="px-8 py-5 text-amber-900/40 font-medium whitespace-nowrap">
                                            {r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(r.status)}`}>{r.status || 'Active'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setCancelTarget(r)}
                                                    className="p-2 rounded-xl text-amber-900/40 hover:text-rose-600 hover:bg-rose-50 transition-all"
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
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-amber-950 font-black text-xl mb-2 tracking-tight">Confirm Cancellation?</p>
                            <p className="text-amber-900/50 font-medium">
                                Cancel the reservation for <strong className="text-amber-950">{cancelTarget.username || 'this user'}</strong>?
                                Capacity will be adjusted for others.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setCancelTarget(null)}
                                className="flex-1 py-4 rounded-2xl border-2 border-amber-100 text-amber-900/60 text-sm font-bold hover:bg-amber-50 transition-all">
                                Keep
                            </button>
                            <button onClick={handleCancel} disabled={formLoading}
                                className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-black transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50">
                                {formLoading ? 'Processing...' : 'Cancel Now'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminReservations;
