import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardCheck,
    Search,
    UserCheck,
    Clock,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    X,
    History,
} from 'lucide-react';
import { receptionistService } from '../../services/receptionistService';
import type { MemberSummary, CheckinDto } from '../../services/receptionistService';

const ReceptionistCheckIn: React.FC = () => {
    // ── State ──
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<MemberSummary[]>([]);
    const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
    const [location, setLocation] = useState('Main Entrance');
    const [checkinHistory, setCheckinHistory] = useState<CheckinDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // ── Load all members on mount ──
    useEffect(() => {
        setLoading(true);
        receptionistService
            .getAllMembers()
            .then(setMembers)
            .catch(() => showToast('error', 'Failed to load members'))
            .finally(() => setLoading(false));
    }, []);

    // ── Search / filter ──
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredMembers([]);
            return;
        }
        setSearchLoading(true);
        const q = searchQuery.toLowerCase();
        const results = members.filter(
            (m) =>
                m.firstName?.toLowerCase().includes(q) ||
                m.lastName?.toLowerCase().includes(q) ||
                m.username?.toLowerCase().includes(q) ||
                m.id?.toLowerCase().includes(q)
        );
        setFilteredMembers(results.slice(0, 10));
        setSearchLoading(false);
    }, [searchQuery, members]);

    // ── Load check-in history when member selected ──
    const loadHistory = useCallback(async (userId: string) => {
        setHistoryLoading(true);
        try {
            const history = await receptionistService.getMemberCheckins(userId);
            setCheckinHistory(history);
        } catch {
            setCheckinHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedMember) {
            loadHistory(selectedMember.id);
        }
    }, [selectedMember, loadHistory]);

    // ── Toast helper ──
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    // ── Record Check-In ──
    const handleCheckin = async () => {
        if (!selectedMember) return;
        if (submitting) return;

        setSubmitting(true);
        try {
            await receptionistService.recordCheckin({
                userId: selectedMember.id,
                timestamp: new Date().toISOString(),
                location,
            });
            showToast('success', `Check-in recorded successfully for ${selectedMember.firstName} ${selectedMember.lastName}`);
            loadHistory(selectedMember.id);
        } catch (err: any) {
            const msg = err?.message || 'Failed to record check-in';
            if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('expired')) {
                showToast('error', 'Membership is inactive or expired. Check-in denied.');
            } else if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
                showToast('error', 'Member has already checked in today.');
            } else {
                showToast('error', msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Select member ──
    const selectMember = (member: MemberSummary) => {
        setSelectedMember(member);
        setSearchQuery('');
        setFilteredMembers([]);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl transition-all duration-300 animate-in slide-in-from-right ${toast.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <ClipboardCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Check-In Management</h1>
                    <p className="text-neutral-500 text-sm">Manual check-in registration for members</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Search & Check-In Form */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4 text-amber-400" />
                            Find Member
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                className="w-full bg-neutral-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="Search by name, username, or member ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                            )}
                        </div>

                        {/* Search Results */}
                        {filteredMembers.length > 0 && (
                            <div className="mt-3 bg-neutral-800 border border-white/5 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                {filteredMembers.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => selectMember(m)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/3 last:border-b-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-black text-amber-400">
                                                {m.firstName?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {m.firstName} {m.lastName}
                                            </p>
                                            <p className="text-xs text-neutral-500">@{m.username} · {m.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center gap-2 mt-3 text-neutral-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading members...
                            </div>
                        )}
                    </div>

                    {/* Selected Member & Check-In Form */}
                    {selectedMember && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-white font-bold flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                    Selected Member
                                </h2>
                                <button
                                    onClick={() => {
                                        setSelectedMember(null);
                                        setCheckinHistory([]);
                                    }}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Member Card */}
                            <div className="flex items-center gap-4 p-4 bg-neutral-800 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-black text-amber-400">
                                        {selectedMember.firstName?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">
                                        {selectedMember.firstName} {selectedMember.lastName}
                                    </p>
                                    <p className="text-xs text-neutral-500">@{selectedMember.username} · {selectedMember.email}</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-500/10 rounded-lg">
                                    <span className="text-xs font-bold text-blue-400">{selectedMember.role}</span>
                                </div>
                            </div>

                            {/* Check-In Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                                        <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                                        Check-in Time
                                    </label>
                                    <div className="bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono">
                                        {new Date().toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                                        <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                                        Location
                                    </label>
                                    <select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                    >
                                        <option value="Main Entrance">Main Entrance</option>
                                        <option value="Side Entrance">Side Entrance</option>
                                        <option value="Gym Floor">Gym Floor</option>
                                        <option value="Swimming Pool">Swimming Pool</option>
                                        <option value="Group Training Room">Group Training Room</option>
                                    </select>
                                </div>
                            </div>

                            {/* Check-In Button */}
                            <button
                                onClick={handleCheckin}
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ClipboardCheck className="w-5 h-5" />
                                )}
                                {submitting ? 'Recording Check-In...' : 'Record Check-In'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Check-In History */}
                <div className="lg:col-span-2">
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-purple-400" />
                            Recent Check-Ins
                            {selectedMember && (
                                <span className="text-xs text-neutral-500 font-normal ml-1">
                                    — {selectedMember.firstName} {selectedMember.lastName}
                                </span>
                            )}
                        </h2>

                        {!selectedMember ? (
                            <div className="text-center py-12 text-neutral-600 text-sm">
                                <ClipboardCheck className="w-8 h-8 mx-auto mb-3 opacity-40" />
                                Select a member to view their check-in history
                            </div>
                        ) : historyLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-16 bg-neutral-800 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : checkinHistory.length === 0 ? (
                            <div className="text-center py-12 text-neutral-600 text-sm">
                                No check-ins found this month
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {checkinHistory
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map((c, i) => (
                                        <div
                                            key={c.checkinId || i}
                                            className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-white/3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white">
                                                    {new Date(c.timestamp).toLocaleDateString('en-GB', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </p>
                                                <p className="text-[11px] text-neutral-500">
                                                    {new Date(c.timestamp).toLocaleTimeString()} · {c.location}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistCheckIn;
