import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Dumbbell, CalendarDays, BookOpen, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { reservationAdminService } from '../../services/reservationAdminService';
import { membershipAdminService } from '../../services/membershipAdminService';

interface Stats {
    totalUsers: number;
    totalTrainers: number;
    activeMemberships: number;
    scheduledTrainings: number;
    totalReservations: number;
}

const StatCard: React.FC<{
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    glow: string;
    loading?: boolean;
}> = ({ label, value, icon, color, glow, loading }) => (
    <div className={`relative overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 p-6 group hover:border-white/10 transition-all duration-300`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${glow}`} />
        <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}>
                {icon}
            </div>
            <div className="text-3xl font-black text-white mb-1">
                {loading ? (
                    <div className="h-8 w-20 bg-neutral-800 rounded-lg animate-pulse" />
                ) : (
                    value
                )}
            </div>
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalTrainers: 0,
        activeMemberships: 0,
        scheduledTrainings: 0,
        totalReservations: 0,
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [users, sessions, memberships, reservations] = await Promise.allSettled([
                adminService.getAllUsers(),
                reservationAdminService.getAllSessions(),
                membershipAdminService.getAllMemberships(),
                reservationAdminService.getAllReservations(),
            ]);

            const usersData = users.status === 'fulfilled' ? users.value : [];
            const sessionsData = sessions.status === 'fulfilled' ? sessions.value : [];
            const membershipsData = memberships.status === 'fulfilled' ? memberships.value : [];
            const reservationsData = reservations.status === 'fulfilled' ? reservations.value : [];

            setStats({
                totalUsers: usersData.length,
                totalTrainers: usersData.filter((u) => u.role === 'Trainer').length,
                activeMemberships: membershipsData.filter((m) => m.isActive).length,
                scheduledTrainings: sessionsData.length,
                totalReservations: reservationsData.length,
            });
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: <Users className="w-5 h-5 text-blue-400" />,
            color: 'bg-blue-500/10',
            glow: 'bg-gradient-to-br from-blue-500/5 to-transparent',
        },
        {
            label: 'Active Memberships',
            value: stats.activeMemberships,
            icon: <Activity className="w-5 h-5 text-emerald-400" />,
            color: 'bg-emerald-500/10',
            glow: 'bg-gradient-to-br from-emerald-500/5 to-transparent',
        },
        {
            label: 'Total Trainers',
            value: stats.totalTrainers,
            icon: <UserCheck className="w-5 h-5 text-amber-400" />,
            color: 'bg-amber-500/10',
            glow: 'bg-gradient-to-br from-amber-500/5 to-transparent',
        },
        {
            label: 'Scheduled Trainings',
            value: stats.scheduledTrainings,
            icon: <Dumbbell className="w-5 h-5 text-purple-400" />,
            color: 'bg-purple-500/10',
            glow: 'bg-gradient-to-br from-purple-500/5 to-transparent',
        },
        {
            label: 'Total Reservations',
            value: stats.totalReservations,
            icon: <CalendarDays className="w-5 h-5 text-rose-400" />,
            color: 'bg-rose-500/10',
            glow: 'bg-gradient-to-br from-rose-500/5 to-transparent',
        },
        {
            label: 'System Health',
            value: 'Good',
            icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
            color: 'bg-teal-500/10',
            glow: 'bg-gradient-to-br from-teal-500/5 to-transparent',
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Dashboard</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        System overview · Last updated {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} loading={loading} />
                ))}
            </div>

            {/* Quick info */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <h2 className="text-white font-bold">System Status</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {['AuthService', 'ReservationService', 'MembershipService', 'LoggerService'].map((service) => (
                        <div key={service} className="flex items-center gap-2 text-neutral-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {service}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
