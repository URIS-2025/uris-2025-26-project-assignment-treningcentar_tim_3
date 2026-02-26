import React, { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { authService } from '../../services/authService';

interface Payment {
    id: string;
    userId: string;
    username?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    membershipTypeName?: string;
}

const PAYMENT_API = 'http://localhost:5219/api';

const AdminPayments: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch(`${PAYMENT_API}/Payment`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authService.getToken()}`,
            },
        })
            .then(async (r) => {
                if (r.status === 204) return [];
                if (!r.ok) throw new Error('Failed to fetch payments');
                return r.json();
            })
            .then(setPayments)
            .catch(() => setError('Failed to load payments. Make sure the PaymentService is running.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = payments.filter((p) => {
        const term = search.toLowerCase();
        return (
            !term ||
            p.id?.toLowerCase().includes(term) ||
            (p.username || p.userId)?.toLowerCase().includes(term) ||
            p.status?.toLowerCase().includes(term)
        );
    });

    const total = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);

    const statusBadge = (s: string) => {
        if (s === 'Completed' || s === 'Success') return 'bg-emerald-500/20 text-emerald-400';
        if (s === 'Failed') return 'bg-rose-500/20 text-rose-400';
        if (s === 'Pending') return 'bg-amber-500/20 text-amber-400';
        return 'bg-neutral-700 text-neutral-300';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10">
                    <DollarSign className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Payments</h1>
                    <p className="text-neutral-500 text-sm">{payments.length} transactions · Total: ${total.toFixed(2)}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <input
                className="w-full bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Search by user, status, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {['ID', 'User', 'Membership', 'Amount', 'Status', 'Date'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-5 py-4"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No payments found</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-4 font-mono text-xs text-neutral-400">{p.id?.slice(0, 8)}…</td>
                                        <td className="px-5 py-4 text-white font-semibold">{p.username || p.userId?.slice(0, 8) + '…'}</td>
                                        <td className="px-5 py-4 text-neutral-300">{p.membershipTypeName || '—'}</td>
                                        <td className="px-5 py-4 text-emerald-400 font-bold">${p.amount?.toFixed(2)} {p.currency}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
                                        </td>
                                        <td className="px-5 py-4 text-neutral-400">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
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
