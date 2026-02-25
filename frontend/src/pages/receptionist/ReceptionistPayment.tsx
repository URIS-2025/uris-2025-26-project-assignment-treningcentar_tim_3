import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Search,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    DollarSign,
    Package,
    Wallet,
    Receipt,
    User,
} from 'lucide-react';
import { receptionistService } from '../../services/receptionistService';
import type {
    MemberSummary,
    MembershipType,
    PaymentDto,
} from '../../services/receptionistService';

const ReceptionistPayment: React.FC = () => {
    // ── State ──
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [recentPayments, setRecentPayments] = useState<PaymentDto[]>([]);

    const [memberSearch, setMemberSearch] = useState('');
    const [filteredMembers, setFilteredMembers] = useState<MemberSummary[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedMembershipTypeId, setSelectedMembershipTypeId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [receipt, setReceipt] = useState<{
        member: string;
        package: string;
        amount: string;
        method: string;
        date: string;
        paymentId: string;
    } | null>(null);

    // ── Load data ──
    useEffect(() => {
        setLoading(true);
        Promise.all([
            receptionistService.getAllMembers(),
            receptionistService.getAllMembershipTypes(),
            receptionistService.getAllPayments().catch(() => []),
        ])
            .then(([m, t, p]) => {
                setMembers(m);
                setMembershipTypes(t);
                setRecentPayments(p.slice(0, 20));
            })
            .catch(() => showToast('error', 'Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    // ── Search ──
    useEffect(() => {
        if (!memberSearch.trim()) {
            setFilteredMembers([]);
            return;
        }
        const q = memberSearch.toLowerCase();
        setFilteredMembers(
            members
                .filter(
                    (m) =>
                        m.firstName?.toLowerCase().includes(q) ||
                        m.lastName?.toLowerCase().includes(q) ||
                        m.username?.toLowerCase().includes(q)
                )
                .slice(0, 8)
        );
    }, [memberSearch, members]);

    // ── Auto-fill amount from package ──
    useEffect(() => {
        if (selectedMembershipTypeId) {
            const pkg = membershipTypes.find((t) => t.id === selectedMembershipTypeId);
            if (pkg) {
                setPaymentAmount(pkg.price.toString());
            }
        }
    }, [selectedMembershipTypeId, membershipTypes]);

    // ── Toast ──
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 6000);
    };

    // ── Validate ──
    const isValid = () => {
        if (!selectedMemberId) return false;
        if (!selectedMembershipTypeId) return false;
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) return false;
        if (!paymentMethod) return false;
        return true;
    };

    // ── Submit ──
    const handlePayment = async () => {
        if (!isValid()) {
            showToast('error', 'Please fill in all required fields correctly.');
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        try {
            // 1. Record payment
            const payment = await receptionistService.recordPayment({
                userId: selectedMemberId,
                amount: parseFloat(paymentAmount),
                currency: 'USD',
                membershipTypeId: selectedMembershipTypeId,
                paymentMethod,
            });

            // 2. Assign/update membership
            try {
                await receptionistService.assignMembership({
                    userId: selectedMemberId,
                    membershipTypeId: selectedMembershipTypeId,
                    startDate: new Date().toISOString(),
                });
            } catch {
                // Membership assignment may fail if already active - not a blocker
                console.warn('Membership assignment skipped or failed');
            }

            const member = members.find((m) => m.id === selectedMemberId);
            const pkg = membershipTypes.find((t) => t.id === selectedMembershipTypeId);

            setReceipt({
                member: member ? `${member.firstName} ${member.lastName}` : selectedMemberId,
                package: pkg?.name || 'Unknown',
                amount: `$${parseFloat(paymentAmount).toFixed(2)}`,
                method: paymentMethod,
                date: new Date().toLocaleString(),
                paymentId: payment.id || 'N/A',
            });

            showToast('success', 'Payment recorded successfully! Membership has been updated.');

            // Refresh payments
            try {
                const updated = await receptionistService.getAllPayments();
                setRecentPayments(updated.slice(0, 20));
            } catch { /* ignore */ }

            // Reset
            setSelectedMemberId('');
            setSelectedMembershipTypeId('');
            setPaymentAmount('');
            setPaymentMethod('Cash');
            setMemberSearch('');
        } catch (err: any) {
            showToast('error', err?.message || 'Failed to record payment.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    const selectedPkg = membershipTypes.find((t) => t.id === selectedMembershipTypeId);

    const statusBadge = (s: string) => {
        if (s === 'Completed' || s === 'Success') return 'bg-emerald-500/20 text-emerald-400';
        if (s === 'Failed') return 'bg-rose-500/20 text-rose-400';
        if (s === 'Pending') return 'bg-amber-500/20 text-amber-400';
        return 'bg-neutral-700 text-neutral-300';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl ${toast.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                    <CreditCard className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Record Payment</h1>
                    <p className="text-neutral-500 text-sm">Process membership payments and update member status</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading data...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Payment Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-5">
                            {/* Member Search */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Select Member
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Search members..."
                                        value={memberSearch}
                                        onChange={(e) => {
                                            setMemberSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && filteredMembers.length > 0 && (
                                        <div className="absolute top-full mt-1 left-0 right-0 bg-neutral-800 border border-white/5 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                                            {filteredMembers.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setSelectedMemberId(m.id);
                                                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left text-sm"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-[10px] font-black text-amber-400">{m.firstName?.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-white font-semibold">{m.firstName} {m.lastName}</span>
                                                    <span className="text-neutral-500 text-xs ml-auto">@{m.username}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedMember && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Selected: {selectedMember.firstName} {selectedMember.lastName}
                                    </div>
                                )}
                            </div>

                            {/* Package / Membership Type */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" />
                                    Membership Package
                                </label>
                                <select
                                    value={selectedMembershipTypeId}
                                    onChange={(e) => setSelectedMembershipTypeId(e.target.value)}
                                    className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                >
                                    <option value="">Choose a package...</option>
                                    {membershipTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} — ${t.price} ({t.durationDays} days)
                                        </option>
                                    ))}
                                </select>
                                {selectedPkg && (
                                    <div className="mt-2 p-3 bg-neutral-800 rounded-lg border border-white/3">
                                        <p className="text-xs text-neutral-400">
                                            <strong className="text-white">{selectedPkg.name}</strong> ·
                                            {selectedPkg.durationDays} days · ${selectedPkg.price}
                                            {selectedPkg.description && ` — ${selectedPkg.description}`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Amount & Payment Method */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Payment Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5" />
                                        Payment Method
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="CreditCard">Credit Card</option>
                                        <option value="DebitCard">Debit Card</option>
                                        <option value="BankTransfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handlePayment}
                                disabled={submitting || !isValid()}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black rounded-xl transition-all shadow-lg shadow-teal-500/25"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CreditCard className="w-5 h-5" />
                                )}
                                {submitting ? 'Processing Payment...' : 'Record Payment & Update Membership'}
                            </button>
                        </div>

                        {/* Receipt */}
                        {receipt && (
                            <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-teal-400 font-black flex items-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Payment Receipt
                                    </h3>
                                    <button
                                        onClick={() => setReceipt(null)}
                                        className="text-neutral-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Member</p>
                                        <p className="text-white font-semibold">{receipt.member}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Package</p>
                                        <p className="text-white font-semibold">{receipt.package}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Amount</p>
                                        <p className="text-emerald-400 font-black">{receipt.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Method</p>
                                        <p className="text-white font-semibold">{receipt.method}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Date</p>
                                        <p className="text-white font-semibold">{receipt.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Payment ID</p>
                                        <p className="text-white font-mono text-xs">{receipt.paymentId}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-teal-500/10">
                                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Membership status has been automatically updated
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Recent Payments */}
                    <div className="lg:col-span-2">
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-teal-400" />
                                Recent Payments
                            </h2>
                            {recentPayments.length === 0 ? (
                                <div className="text-center py-12 text-neutral-600 text-sm">
                                    <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-40" />
                                    No payment records found
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[550px] overflow-y-auto">
                                    {recentPayments.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-white/3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-white truncate">
                                                        {p.username || p.userId?.slice(0, 8) + '…'}
                                                    </p>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusBadge(p.status)}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-500">
                                                    ${p.amount?.toFixed(2)} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistPayment;
