import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import { reservationAdminService, type SessionDto } from '../../services/reservationAdminService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPE_COLORS: Record<string, string> = {
    Group: 'border-purple-500/40 bg-purple-500/10',
    Personal: 'border-blue-500/40 bg-blue-500/10',
};

// Reverse enum maps for display
const reverseTrainingTypeMap: Record<number, string> = {
    0: 'Strength', 1: 'Hypertrophy', 2: 'Cardio', 3: 'HIIT', 4: 'CrossFit',
    5: 'Functional', 6: 'Mobility', 7: 'Stretching', 8: 'Yoga', 9: 'Pilates', 10: 'Boxing'
};

const AdminSchedule: React.FC = () => {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'week' | 'list'>('week');

    useEffect(() => {
        reservationAdminService.getAllSessions()
            .then(setSessions)
            .catch(() => setError('Failed to load schedule.'))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const getSessionsForDay = (dayIndex: number) => {
        return sessions.filter((s) => {
            if (!s.startTime) return false;
            const d = new Date(s.startTime);
            const dayOffset = Math.floor((d.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
            return dayOffset === dayIndex;
        });
    };

    const getSessionType = (s: SessionDto) => {
        return (s.maxCapacity !== undefined && s.maxCapacity !== null) ? 'Group' : 'Personal';
    };

    const getTrainingTypeName = (trainingType: any) => {
        if (typeof trainingType === 'number') return reverseTrainingTypeMap[trainingType] || 'Unknown';
        return trainingType;
    };

    const getTrainerName = (s: SessionDto) => {
        if (typeof s.trainerId === 'string') return s.trainerId;
        return `${s.trainerId.firstName} ${s.trainerId.lastName}`;
    };

    const upcomingSessions = [...sessions]
        .filter((s) => s.startTime && new Date(s.startTime) >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                        <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-800">Schedule</h1>
                        <p className="text-neutral-500 text-sm">Weekly training calendar</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-white border border-amber-100 shadow-sm rounded-xl p-1">
                    {(['week', 'list'] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${view === v ? 'bg-amber-500 text-neutral-800' : 'text-neutral-400 hover:text-neutral-800'
                                }`}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-8 bg-amber-50 rounded-lg mb-2" />
                            <div className="space-y-2">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div key={j} className="h-20 bg-neutral-900 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : view === 'week' ? (
                <div className="bg-white border border-amber-100 shadow-sm rounded-2xl overflow-x-auto">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }} className="divide-x divide-white/5 min-w-max">
                        {Array.from({ length: 14 }).map((_, i) => {
                            const daySessions = getSessionsForDay(i);
                            const dayDate = new Date(startOfWeek);
                            dayDate.setDate(startOfWeek.getDate() + i);
                            const isToday = dayDate.toDateString() === now.toDateString();
                            const dayOfWeek = dayDate.getDay();
                            return (
                                <div key={i} className="min-h-48">
                                    <div className={`py-3 px-2 text-center border-b border-amber-100 ${isToday ? 'bg-amber-500/10' : ''}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-amber-400' : 'text-neutral-500'}`}>{DAYS[dayOfWeek]}</p>
                                        <p className={`text-lg font-black ${isToday ? 'text-amber-400' : 'text-neutral-400'}`}>{dayDate.getDate()}</p>
                                    </div>
                                    <div className="p-1.5 space-y-1.5 max-h-56 overflow-y-auto">
                                        {daySessions.map((s) => {
                                            const sessionType = getSessionType(s);
                                            return (
                                                <div key={s.sessionId}
                                                    className={`p-2 rounded-lg border text-xs ${TYPE_COLORS[sessionType] || 'border-amber-200 bg-white/5'}`}>
                                                    <p className="font-bold text-neutral-800 truncate">{s.name}</p>
                                                    <p className="text-neutral-600 text-[0.65rem] truncate">{getTrainingTypeName(s.trainingType)}</p>
                                                    <p className="text-neutral-400 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {upcomingSessions.length === 0 ? (
                        <div className="py-20 text-center text-neutral-500">No upcoming sessions</div>
                    ) : (
                        upcomingSessions.map((s) => {
                            const sessionType = getSessionType(s);
                            return (
                                <div key={s.sessionId}
                                    className="flex items-center gap-4 bg-white border border-amber-100 shadow-sm rounded-2xl p-5 hover:border-amber-200 transition-all">
                                    <div className={`w-2 h-14 rounded-full flex-shrink-0 ${sessionType === 'Group' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-neutral-800 font-bold">{s.name}</h3>
                                        <p className="text-neutral-500 text-sm truncate">{getTrainingTypeName(s.trainingType)} • {getTrainerName(s)}</p>
                                    </div>
                                    <div className="flex gap-6 text-sm text-neutral-400 flex-shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            {s.startTime ? new Date(s.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                        </div>
                                        {sessionType === 'Group' && (
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                {s.maxCapacity} capacity
                                            </div>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${sessionType === 'Group' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {sessionType}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminSchedule;
