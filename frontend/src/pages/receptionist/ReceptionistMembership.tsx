import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    Calendar,
    Package,
    Clock,
    AlertTriangle,
    X,
    UserCheck,
} from 'lucide-react';
import { receptionistService } from '../../services/receptionistService';
import type { MemberSummary, MembershipInfo, MembershipType } from '../../services/receptionistService';

const ReceptionistMembership: React.FC = () => {
    // ── State ──
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<MemberSummary[]>([]);
    const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
    const [membership, setMembership] = useState<MembershipInfo | null>(null);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [loading, setLoading] = useState(false);
    const [membershipLoading, setMembershipLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // ── Load members & types ──
    useEffect(() => {
        setLoading(true);
        Promise.all([
            receptionistService.getAllMembers(),
            receptionistService.getAllMembershipTypes(),
        ])
            .then(([m, t]) => {
                setMembers(m);
                setMembershipTypes(t);
            })
            .catch(() => showToast('error', 'Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    // ── Search ──
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredMembers(members.slice(0, 20));
            return;
        }
        const q = searchQuery.toLowerCase();
        const results = members.filter(
            (m) =>
                m.firstName?.toLowerCase().includes(q) ||
                m.lastName?.toLowerCase().includes(q) ||
                m.username?.toLowerCase().includes(q) ||
                m.id?.toLowerCase().includes(q)
        );
        setFilteredMembers(results.slice(0, 10));
    }, [searchQuery, members]);

    // ── Load membership when member selected ──
    useEffect(() => {
        if (!selectedMember) {
            setMembership(null);
            return;
        }
        setMembershipLoading(true);
        receptionistService
            .getMemberMembership(selectedMember.id)
            .then(setMembership)
            .catch(() => setMembership(null))
            .finally(() => setMembershipLoading(false));
    }, [selectedMember]);

    // ── Helpers ──
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const selectMember = (member: MemberSummary) => {
        setSelectedMember(member);
        setSearchQuery('');
        setFilteredMembers([]);
    };

    const getPackageName = (typeId: string) => {
        const t = membershipTypes.find((mt) => mt.id === typeId);
        return t?.name || 'Unknown Package';
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const isActive = membership?.isActive ?? false;
    const daysRemaining = membership ? getDaysRemaining(membership.endDate) : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl ${toast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
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
                <div className="p-2.5 rounded-xl bg-emerald-50">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Membership Verification</h1>
                    <p className="text-neutral-500 text-sm">Verify member status before booking or entry</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-neutral-900 font-bold mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-600" />
                    Find Member
                </h2>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Search by name, username, or member ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredMembers.length > 0 && (
                    <div className="mt-3 bg-white border border-neutral-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-lg">
                        {filteredMembers.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => selectMember(m)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 transition-colors text-left border-b border-neutral-100 last:border-b-0"
                            >
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-black text-amber-600">
                                        {m.firstName?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">{m.firstName} {m.lastName}</p>
                                    <p className="text-xs text-neutral-500">@{m.username}</p>
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

            {/* Membership Status */}
            {selectedMember && (
                <div className="space-y-6">
                    {/* Member Card */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-neutral-900 font-bold flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-amber-600" />
                                Member Information
                            </h2>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xl font-black text-amber-600">
                                    {selectedMember.firstName?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg text-neutral-900 font-bold">
                                    {selectedMember.firstName} {selectedMember.lastName}
                                </p>
                                <p className="text-sm text-neutral-500">@{selectedMember.username} · {selectedMember.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Membership Details */}
                    {membershipLoading ? (
                        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-center gap-2 text-neutral-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading membership status...
                            </div>
                        </div>
                    ) : !membership ? (
                        <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-4">
                                    <XCircle className="w-8 h-8 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-black text-rose-500 mb-2">No Active Membership</h3>
                                <p className="text-neutral-500 text-sm mb-4">
                                    This member does not have any membership record. Booking is <strong className="text-rose-500">blocked</strong>.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 text-sm font-bold">
                                    <XCircle className="w-4 h-4" />
                                    Booking Blocked
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`bg-white border rounded-2xl p-6 shadow-sm ${isActive ? 'border-emerald-200' : 'border-rose-200'
                                }`}
                        >
                            {/* Status Banner */}
                            <div
                                className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${isActive
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-rose-50 border border-rose-200'
                                    }`}
                            >
                                {isActive ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                                )}
                                <div>
                                    <p className={`text-sm font-black ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isActive ? 'ACTIVE MEMBERSHIP' : 'EXPIRED / INACTIVE MEMBERSHIP'}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {isActive
                                            ? 'Member is eligible for booking and entry.'
                                            : 'Booking is blocked. Membership renewal required.'}
                                    </p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-neutral-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Package</span>
                                    </div>
                                    <p className="text-neutral-900 font-bold text-sm">
                                        {membership.membershipTypeName || getPackageName(membership.membershipTypeId)}
                                    </p>
                                </div>

                                <div className="p-4 bg-neutral-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Expires</span>
                                    </div>
                                    <p className="text-neutral-900 font-bold text-sm">
                                        {new Date(membership.endDate).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div className="p-4 bg-neutral-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Days Remaining</span>
                                    </div>
                                    <p className={`font-black text-lg ${daysRemaining > 7
                                        ? 'text-emerald-600'
                                        : daysRemaining > 0
                                            ? 'text-amber-600'
                                            : 'text-rose-500'
                                        }`}>
                                        {daysRemaining > 0 ? daysRemaining : 0}
                                    </p>
                                </div>

                                <div className="p-4 bg-neutral-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${isActive
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-rose-50 text-rose-500'
                                            }`}
                                    >
                                        {isActive ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Booking Button */}
                            <div className="mt-6">
                                {isActive ? (
                                    <button
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white text-base font-black rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                                        onClick={() => showToast('success', 'Member is verified! Proceed with booking.')}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Verified — Allow Booking
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-neutral-200 text-neutral-400 text-base font-black rounded-xl cursor-not-allowed opacity-60"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Booking Blocked — Membership Inactive
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReceptionistMembership;
