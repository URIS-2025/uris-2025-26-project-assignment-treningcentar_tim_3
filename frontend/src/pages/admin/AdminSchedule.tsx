import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import { reservationAdminService, type SessionDto } from '../../services/reservationAdminService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPE_COLORS: Record<string, string> = {
    Group: 'border-purple-500/40 bg-purple-500/10',
    Personal: 'border-blue-500/40 bg-blue-500/10',
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
            if (!s.dateTime) return false;
            const d = new Date(s.dateTime);
            return d.getDay() === dayIndex;
        });
    };

    const upcomingSessions = [...sessions]
        .filter((s) => s.dateTime && new Date(s.dateTime) >= now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                        <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900">Schedule</h1>
                        <p className="text-neutral-500 text-sm">Weekly training calendar</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-white border border-neutral-200 rounded-xl p-1">
                    {(['week', 'list'] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${view === v ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:text-neutral-900'
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
                            <div className="h-8 bg-neutral-100 rounded-lg mb-2" />
                            <div className="space-y-2">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div key={j} className="h-20 bg-white rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : view === 'week' ? (
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-7 divide-x divide-neutral-200">
                        {DAYS.map((day, i) => {
                            const daySessions = getSessionsForDay(i);
                            const dayDate = new Date(startOfWeek);
                            dayDate.setDate(startOfWeek.getDate() + i);
                            const isToday = dayDate.toDateString() === now.toDateString();
                            return (
                                <div key={day} className="min-h-48">
                                    <div className={`py-3 px-2 text-center border-b border-neutral-200 ${isToday ? 'bg-amber-500/10' : ''}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-amber-600' : 'text-neutral-500'}`}>{day.slice(0, 3)}</p>
                                        <p className={`text-lg font-black ${isToday ? 'text-amber-600' : 'text-neutral-500'}`}>{dayDate.getDate()}</p>
                                    </div>
                                    <div className="p-1.5 space-y-1.5">
                                        {daySessions.map((s) => (
                                            <div key={s.sessionId}
                                                className={`p-2 rounded-lg border text-xs ${TYPE_COLORS[s.sessionType] || 'border-neutral-200 bg-neutral-50'}`}>
                                                <p className="font-bold text-neutral-900 truncate">{s.name}</p>
                                                <p className="text-neutral-500 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(s.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        ))}
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
                        upcomingSessions.map((s) => (
                            <div key={s.sessionId}
                                className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-all">
                                <div className={`w-2 h-14 rounded-full flex-shrink-0 ${s.sessionType === 'Group' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-neutral-900 font-bold">{s.name}</h3>
                                    <p className="text-neutral-500 text-sm truncate">{s.description}</p>
                                </div>
                                <div className="flex gap-6 text-sm text-neutral-500 flex-shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {s.dateTime ? new Date(s.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        {s.capacity} capacity
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${s.sessionType === 'Group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {s.sessionType}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminSchedule;
