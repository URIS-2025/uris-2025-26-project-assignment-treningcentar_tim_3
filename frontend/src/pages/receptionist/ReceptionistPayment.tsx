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
    ServiceDto,
    PaymentDto,
} from '../../services/receptionistService';

const PAYMENT_METHODS = [
    { value: 2, label: 'Cash' },
    { value: 0, label: 'Card' },
    { value: 1, label: 'Bank Transfer' },
];

const PAYMENT_METHOD_LABELS: Record<number, string> = { 0: 'Card', 1: 'Bank Transfer', 2: 'Cash' };
const PAYMENT_STATUS_LABELS: Record<number, string> = { 0: 'Pending', 1: 'Completed', 2: 'Failed', 3: 'Refunded' };

const ReceptionistPayment: React.FC = () => {
    // ── State ──
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [services, setServices] = useState<ServiceDto[]>([]);
    const [recentPayments, setRecentPayments] = useState<PaymentDto[]>([]);

    const [memberSearch, setMemberSearch] = useState('');
    const [filteredMembers, setFilteredMembers] = useState<MemberSummary[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(2); // Cash default

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [receipt, setReceipt] = useState<{
        member: string;
        service: string;
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
            receptionistService.getAllServices(),
            receptionistService.getAllPayments().catch(() => []),
        ])
            .then(([m, s, p]) => {
                setMembers(m);
                setServices(s);
                setRecentPayments(p.slice(0, 20));
            })
            .catch(() => showToast('error', 'Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    // ── Search ──
    useEffect(() => {
        if (!memberSearch.trim()) {
            setFilteredMembers(members.slice(0, 20));
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

    // ── Auto-fill amount from service ──
    useEffect(() => {
        if (selectedServiceId) {
            const svc = services.find((s) => s.id === selectedServiceId);
            if (svc) {
                setPaymentAmount(svc.price.toString());
            }
        }
    }, [selectedServiceId, services]);

    // ── Toast ──
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 6000);
    };

    // ── Validate ──
    const isValid = () => {
        if (!selectedMemberId) return false;
        if (!selectedServiceId) return false;
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) return false;
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
            // Record payment
            const payment = await receptionistService.recordPayment({
                amount: parseFloat(paymentAmount),
                paymentDate: new Date().toISOString(),
                method: paymentMethod,
                serviceId: selectedServiceId,
            });

            const member = members.find((m) => m.id === selectedMemberId);
            const svc = services.find((s) => s.id === selectedServiceId);

            setReceipt({
                member: member ? `${member.firstName} ${member.lastName}` : selectedMemberId,
                service: svc?.name || 'Unknown',
                amount: `$${parseFloat(paymentAmount).toFixed(2)}`,
                method: PAYMENT_METHOD_LABELS[paymentMethod] || 'Unknown',
                date: new Date().toLocaleString(),
                paymentId: payment.id || (payment as any).paymentId || 'N/A',
            });

            showToast('success', 'Payment recorded successfully!');

            // Refresh payments
            try {
                const updated = await receptionistService.getAllPayments();
                setRecentPayments(updated.slice(0, 20));
            } catch { /* ignore */ }

            // Reset
            setSelectedMemberId('');
            setSelectedServiceId('');
            setPaymentAmount('');
            setPaymentMethod(2);
            setMemberSearch('');
        } catch (err: any) {
            showToast('error', err?.message || 'Failed to record payment.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    const selectedSvc = services.find((s) => s.id === selectedServiceId);

    const statusBadge = (s: number) => {
        if (s === 1) return 'bg-emerald-50 text-emerald-600';
        if (s === 2) return 'bg-rose-50 text-rose-500';
        if (s === 0) return 'bg-amber-50 text-amber-600';
        if (s === 3) return 'bg-purple-50 text-purple-500';
        return 'bg-neutral-100 text-neutral-500';
    };

    // Helper to resolve service name from serviceId
    const getServiceName = (serviceId: string) => {
        const svc = services.find((s) => s.id === serviceId);
        return svc?.name || serviceId?.slice(0, 8) + '…';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl ${toast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50">
                    <CreditCard className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Record Payment</h1>
                    <p className="text-neutral-500 text-sm">Process service payments for members</p>
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
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm">
                            {/* Member Search */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Select Member
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Search members..."
                                        value={memberSearch}
                                        onChange={(e) => {
                                            setMemberSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && filteredMembers.length > 0 && (
                                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-neutral-200 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto shadow-lg">
                                            {filteredMembers.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setSelectedMemberId(m.id);
                                                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 transition-colors text-left text-sm"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-[10px] font-black text-amber-600">{m.firstName?.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-neutral-900 font-semibold">{m.firstName} {m.lastName}</span>
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

                            {/* Service Selection */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" />
                                    Service
                                </label>
                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                >
                                    <option value="">Choose a service...</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} — ${s.price}
                                        </option>
                                    ))}
                                </select>
                                {selectedSvc && (
                                    <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                        <p className="text-xs text-neutral-500">
                                            <strong className="text-neutral-900">{selectedSvc.name}</strong> · ${selectedSvc.price}
                                            {selectedSvc.description && ` — ${selectedSvc.description}`}
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
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
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
                                        onChange={(e) => setPaymentMethod(Number(e.target.value))}
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                    >
                                        {PAYMENT_METHODS.map((pm) => (
                                            <option key={pm.value} value={pm.value}>
                                                {pm.label}
                                            </option>
                                        ))}
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
                                {submitting ? 'Processing Payment...' : 'Record Payment'}
                            </button>
                        </div>

                        {/* Receipt */}
                        {receipt && (
                            <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-teal-600 font-black flex items-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Payment Receipt
                                    </h3>
                                    <button
                                        onClick={() => setReceipt(null)}
                                        className="text-neutral-400 hover:text-neutral-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Member</p>
                                        <p className="text-neutral-900 font-semibold">{receipt.member}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Service</p>
                                        <p className="text-neutral-900 font-semibold">{receipt.service}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Amount</p>
                                        <p className="text-emerald-600 font-black">{receipt.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Method</p>
                                        <p className="text-neutral-900 font-semibold">{receipt.method}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Date</p>
                                        <p className="text-neutral-900 font-semibold">{receipt.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Payment ID</p>
                                        <p className="text-neutral-900 font-mono text-xs">{receipt.paymentId}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-neutral-600 mt-4">Processed by receptionist · {new Date().toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Recent Payments */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-neutral-900 font-bold mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-teal-500" />
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
                                            className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-4 h-4 text-teal-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-neutral-900 truncate">
                                                        {getServiceName(p.serviceId)}
                                                    </p>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusBadge(p.status)}`}>
                                                        {PAYMENT_STATUS_LABELS[p.status] || 'Unknown'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-500">
                                                    ${p.amount?.toFixed(2)} · {PAYMENT_METHOD_LABELS[p.method] || 'Unknown'} · {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
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
