import React, { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle, Search } from 'lucide-react';
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
        if (s === 'Completed' || s === 'Success') return 'bg-emerald-100 text-emerald-700';
        if (s === 'Failed') return 'bg-rose-100 text-rose-700';
        if (s === 'Pending') return 'bg-amber-100 text-amber-700';
        return 'bg-neutral-100 text-neutral-600';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100">
                        <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950 tracking-tight">Payments</h1>
                        <p className="text-amber-900/40 text-sm font-medium">{payments.length} transactions · Volume: <span className="text-emerald-600 font-bold">${total.toFixed(2)}</span></p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/30 group-focus-within:text-amber-500 transition-colors" />
                <input
                    className="w-full bg-white border-2 border-amber-100 rounded-2xl pl-11 pr-4 py-3 text-amber-950 text-sm placeholder-amber-900/20 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                    placeholder="Search by user, status, or transaction ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white border border-amber-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-amber-50">
                                {['ID', 'User', 'Membership', 'Amount', 'Status', 'Date'].map((h) => (
                                    <th key={h} className="text-left px-8 py-5 text-xs font-black text-amber-900/40 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-8 py-5"><div className="h-4 bg-amber-50 rounded-full animate-pulse" /></td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 text-amber-900/40 font-bold uppercase tracking-widest text-xs">No transactions recorded</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-8 py-5 font-mono text-[10px] text-amber-900/30">{p.id?.slice(0, 8)}…</td>
                                        <td className="px-8 py-5 text-amber-950 font-bold">{p.username || p.userId?.slice(0, 8)}</td>
                                        <td className="px-8 py-5 text-amber-900/70 font-medium">{p.membershipTypeName || 'One-time Fee'}</td>
                                        <td className="px-8 py-5 text-emerald-600 font-black">${p.amount?.toFixed(2)} <span className="text-[10px] font-bold opacity-50">{p.currency}</span></td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(p.status)}`}>{p.status}</span>
                                        </td>
                                        <td className="px-8 py-5 text-amber-900/40 font-medium">
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
