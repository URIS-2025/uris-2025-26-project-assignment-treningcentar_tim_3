import React, { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle, Plus, X, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { authService } from '../../services/authService';

interface Payment {
    id: string;
    amount: number;
    paymentDate: string;
    method: number; // 0=Card, 1=BankTransfer, 2=Cash
    status: number; // 0=Pending, 1=Completed, 2=Failed, 3=Refunded
    serviceId: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
}

const PAYMENT_API = 'http://localhost:5219/api';
const SERVICE_API = 'http://localhost:5079/api';

const methodLabels: Record<number, string> = { 0: 'Card', 1: 'Bank Transfer', 2: 'Cash' };
const statusLabels: Record<number, string> = { 0: 'Pending', 1: 'Completed', 2: 'Failed', 3: 'Refunded' };

const AdminPayments: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [formAmount, setFormAmount] = useState('');
    const [formMethod, setFormMethod] = useState(0);
    const [formServiceId, setFormServiceId] = useState('');

    const handleServiceChange = (serviceId: string) => {
        setFormServiceId(serviceId);
        const service = services.find((s) => s.id === serviceId);
        if (service) {
            setFormAmount(service.price.toString());
        }
    };

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authService.getToken()}`,
    });

    const fetchPayments = async () => {
        try {
            const r = await fetch(`${PAYMENT_API}/Payment`, { headers: authHeaders() });
            if (r.status === 204) return [];
            if (!r.ok) throw new Error('Failed to fetch payments');
            return r.json();
        } catch {
            throw new Error('Failed to load payments');
        }
    };

    const fetchServices = async () => {
        try {
            const r = await fetch(`${SERVICE_API}/service`, { headers: authHeaders() });
            if (r.status === 204) return [];
            if (!r.ok) throw new Error('Failed to fetch services');
            return r.json();
        } catch {
            return [];
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [paymentsData, servicesData] = await Promise.all([fetchPayments(), fetchServices()]);
            setPayments(paymentsData);
            setServices(servicesData);
        } catch (e) {
            setError('Failed to load data. Make sure PaymentService is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formServiceId) {
            setError('Please select a service');
            return;
        }
        setActionLoading('create');
        setError('');
        try {
            const r = await fetch(`${PAYMENT_API}/Payment`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    amount: parseFloat(formAmount),
                    paymentDate: new Date().toISOString(),
                    method: formMethod,
                    serviceId: formServiceId,
                }),
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create payment');
            }
            setSuccess('Payment created successfully');
            setShowForm(false);
            setFormAmount('');
            setFormMethod(0);
            setFormServiceId('');
            await loadData();
        } catch (e: any) {
            setError(e.message || 'Failed to create payment');
        } finally {
            setActionLoading(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: number) => {
        setActionLoading(id);
        setError('');
        try {
            const r = await fetch(`${PAYMENT_API}/Payment/${id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (!r.ok) throw new Error('Failed to update status');
            setSuccess('Payment status updated');
            await loadData();
        } catch {
            setError('Failed to update payment status');
        } finally {
            setActionLoading(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleRefund = async (id: string) => {
        if (!confirm('Are you sure you want to refund this payment?')) return;
        setActionLoading(id);
        setError('');
        try {
            const r = await fetch(`${PAYMENT_API}/Payment/${id}/refund`, {
                method: 'POST',
                headers: authHeaders(),
            });
            if (!r.ok) throw new Error('Failed to refund');
            setSuccess('Payment refunded successfully');
            await loadData();
        } catch {
            setError('Failed to refund payment');
        } finally {
            setActionLoading(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;
        setActionLoading(id);
        setError('');
        try {
            const r = await fetch(`${PAYMENT_API}/Payment/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!r.ok) throw new Error('Failed to delete');
            setSuccess('Payment deleted successfully');
            await loadData();
        } catch {
            setError('Failed to delete payment');
        } finally {
            setActionLoading(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const filtered = payments.filter((p) => {
        const term = search.toLowerCase();
        const statusText = statusLabels[p.status]?.toLowerCase() || '';
        const methodText = methodLabels[p.method]?.toLowerCase() || '';
        return (
            !term ||
            p.id?.toLowerCase().includes(term) ||
            statusText.includes(term) ||
            methodText.includes(term)
        );
    });

    const total = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);

    const statusBadge = (s: number) => {
        if (s === 1) return 'bg-emerald-500/20 text-emerald-600'; // Completed
        if (s === 2) return 'bg-rose-500/20 text-rose-600'; // Failed
        if (s === 0) return 'bg-amber-500/20 text-amber-600'; // Pending
        if (s === 3) return 'bg-blue-500/20 text-blue-600'; // Refunded
        return 'bg-neutral-200 text-neutral-600';
    };

    const getServiceName = (serviceId: string) => {
        const service = services.find((s) => s.id === serviceId);
        return service ? service.name : serviceId?.slice(0, 8) + '…';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10">
                        <DollarSign className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800">Payments</h1>
                        <p className="text-neutral-500 text-sm">{payments.length} transactions · Total: ${total.toFixed(2)}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Payment'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
            )}

            {showForm && (
                <div className="bg-white border border-amber-100 shadow-sm rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-neutral-800 mb-4">Create New Payment</h2>
                    <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-1">Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={formAmount}
                                onChange={(e) => setFormAmount(e.target.value)}
                                className="w-full bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-neutral-800 text-sm focus:outline-none focus:border-amber-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-1">Payment Method</label>
                            <select
                                value={formMethod}
                                onChange={(e) => setFormMethod(parseInt(e.target.value))}
                                className="w-full bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-neutral-800 text-sm focus:outline-none focus:border-amber-500"
                            >
                                <option value={0}>Card</option>
                                <option value={1}>Bank Transfer</option>
                                <option value={2}>Cash</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-1">Service</label>
                            <select
                                value={formServiceId}
                                onChange={(e) => handleServiceChange(e.target.value)}
                                required
                                className="w-full bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-neutral-800 text-sm focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select a service...</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={actionLoading === 'create'}
                                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                            >
                                {actionLoading === 'create' ? 'Creating...' : 'Create Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <input
                className="w-full bg-white border border-amber-100 shadow-sm rounded-xl px-4 py-2.5 text-neutral-800 text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Search by status, method, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="bg-white border border-amber-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-100">
                                {['ID', 'Amount', 'Method', 'Status', 'Date', 'Service', 'Actions'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} className="px-5 py-4"><div className="h-4 bg-amber-50 rounded animate-pulse" /></td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-neutral-500">No payments found</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-5 py-4 font-mono text-xs text-neutral-400">{p.id?.slice(0, 8)}…</td>
                                        <td className="px-5 py-4 text-emerald-600 font-bold">${p.amount?.toFixed(2)}</td>
                                        <td className="px-5 py-4 text-neutral-600">{methodLabels[p.method] || 'Unknown'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge(p.status)}`}>{statusLabels[p.status] || 'Unknown'}</span>
                                        </td>
                                        <td className="px-5 py-4 text-neutral-500">
                                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-5 py-4 text-neutral-600">{getServiceName(p.serviceId)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Status actions - only show for non-refunded */}
                                                {p.status !== 3 && (
                                                    <>
                                                        {p.status !== 1 && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p.id, 1)}
                                                                disabled={actionLoading === p.id}
                                                                title="Mark as Completed"
                                                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {p.status !== 2 && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p.id, 2)}
                                                                disabled={actionLoading === p.id}
                                                                title="Mark as Failed"
                                                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {p.status !== 0 && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p.id, 0)}
                                                                disabled={actionLoading === p.id}
                                                                title="Mark as Pending"
                                                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {/* Refund only for completed payments */}
                                                        {p.status === 1 && (
                                                            <button
                                                                onClick={() => handleRefund(p.id)}
                                                                disabled={actionLoading === p.id}
                                                                title="Refund Payment"
                                                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {/* Delete - always available */}
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    disabled={actionLoading === p.id}
                                                    title="Delete Payment"
                                                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
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
        </div>
    );
};

export default AdminPayments;
