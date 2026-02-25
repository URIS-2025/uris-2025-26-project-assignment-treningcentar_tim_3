import React, { useEffect, useState } from 'react';
import { UserCheck, Mail, AlertTriangle } from 'lucide-react';
import { adminService, type AdminUser } from '../../services/adminService';

const AdminTrainers: React.FC = () => {
    const [trainers, setTrainers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminService.getAllUsers()
            .then((users) => setTrainers(users.filter((u) => u.role === 'Trainer')))
            .catch(() => setError('Failed to load trainers.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                    <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-800">Trainers</h1>
                    <p className="text-neutral-500 text-sm">{trainers.length} trainers registered</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white border border-amber-100 shadow-sm rounded-2xl p-6 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-amber-50 mb-4" />
                            <div className="h-4 bg-amber-50 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-amber-50 rounded w-1/2" />
                        </div>
                    ))
                    : trainers.length === 0
                        ? (
                            <div className="col-span-3 py-20 text-center text-neutral-500">
                                No trainers found
                            </div>
                        )
                        : trainers.map((trainer) => (
                            <div
                                key={trainer.id}
                                className="bg-white border border-amber-100 shadow-sm rounded-2xl p-6 hover:border-blue-500/30 hover:bg-amber-50/50 transition-all duration-200 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <span className="text-xl font-black text-blue-400">
                                        {trainer.firstName?.charAt(0)?.toUpperCase() || trainer.username?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-neutral-800 font-bold text-lg">
                                    {trainer.firstName} {trainer.lastName}
                                </h3>
                                <p className="text-neutral-400 text-sm">@{trainer.username}</p>
                                <div className="mt-4 flex items-center gap-2 text-neutral-500 text-sm">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="truncate">{trainer.email}</span>
                                </div>
                                <div className="mt-3">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400">Trainer</span>
                                </div>
                            </div>
                        ))}
            </div>
        </div>
    );
};

export default AdminTrainers;
