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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-amber-950 tracking-tight">Trainers</h1>
                    <p className="text-amber-900/40 text-sm font-medium">{trainers.length} experts registered</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white border border-amber-100 rounded-[2rem] p-8 animate-pulse shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 mb-6" />
                            <div className="h-4 bg-amber-50 rounded-full w-3/4 mb-3" />
                            <div className="h-4 bg-amber-50 rounded-full w-1/2" />
                        </div>
                    ))
                    : trainers.length === 0
                        ? (
                            <div className="col-span-3 py-24 text-center text-amber-900/40 font-bold uppercase tracking-widest text-xs">
                                No trainers found
                            </div>
                        )
                        : trainers.map((trainer) => (
                            <div
                                key={trainer.id}
                                className="bg-white border-2 border-amber-100 rounded-[2rem] p-8 hover:border-blue-400 transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-2xl font-black text-blue-700">
                                        {trainer.firstName?.charAt(0)?.toUpperCase() || trainer.username?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-amber-950 font-black text-xl mb-1 tracking-tight leading-tight">
                                    {trainer.firstName} {trainer.lastName}
                                </h3>
                                <p className="text-amber-900/40 text-xs font-black uppercase tracking-widest">@{trainer.username}</p>

                                <div className="mt-8 pt-6 border-t border-amber-50 flex items-center gap-3 text-amber-900/60 text-sm font-medium">
                                    <div className="p-2 rounded-lg bg-amber-50">
                                        <Mail className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="truncate">{trainer.email}</span>
                                </div>

                                <div className="mt-6">
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">Expert Trainer</span>
                                </div>
                            </div>
                        ))}
            </div>
        </div>
    );
};

export default AdminTrainers;
