import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import { reservationAdminService, type SessionDto } from '../../services/reservationAdminService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPE_COLORS: Record<string, string> = {
    Group: 'border-purple-100 bg-purple-50 text-purple-700',
    Personal: 'border-blue-100 bg-blue-50 text-blue-700',
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100">
                        <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-amber-950 tracking-tight">Schedule</h1>
                        <p className="text-amber-900/40 text-sm font-medium">Weekly training activity</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-white border-2 border-amber-100 rounded-2xl p-1.5 shadow-sm">
                    {(['week', 'list'] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-6 py-2 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all ${view === v
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                : 'text-amber-900/40 hover:text-amber-600'
                                }`}>
                            {v} View
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-10 bg-amber-50 rounded-xl mb-3" />
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div key={j} className="h-24 bg-white border border-amber-50 rounded-2xl shadow-sm" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : view === 'week' ? (
                <div className="bg-white border-2 border-amber-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="grid grid-cols-7 divide-x divide-amber-100">
                        {DAYS.map((day, i) => {
                            const daySessions = getSessionsForDay(i);
                            const dayDate = new Date(startOfWeek);
                            dayDate.setDate(startOfWeek.getDate() + i);
                            const isToday = dayDate.toDateString() === now.toDateString();
                            return (
                                <div key={day} className="min-h-[500px] flex flex-col">
                                    <div className={`py-5 px-3 text-center border-b border-amber-50 ${isToday ? 'bg-amber-100/30' : ''}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-amber-600' : 'text-amber-900/30'}`}>{day.slice(0, 3)}</p>
                                        <p className={`text-2xl font-black ${isToday ? 'text-amber-600' : 'text-amber-950'}`}>{dayDate.getDate()}</p>
                                    </div>
                                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                        {daySessions.map((s) => (
                                            <div key={s.sessionId}
                                                className={`p-3 rounded-2xl border-2 transition-all hover:scale-102 hover:shadow-md cursor-default ${TYPE_COLORS[s.sessionType] || 'border-amber-100 bg-white text-amber-950'}`}>
                                                <p className="font-black text-xs leading-tight mb-2">{s.name}</p>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">
                                                        {new Date(s.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {upcomingSessions.length === 0 ? (
                        <div className="py-24 text-center text-amber-900/30 font-bold uppercase tracking-widest text-xs">No upcoming sessions discovered</div>
                    ) : (
                        upcomingSessions.map((s) => (
                            <div key={s.sessionId}
                                className="flex items-center gap-6 bg-white border-2 border-amber-100 rounded-[2rem] p-6 hover:border-amber-400 transition-all hover:shadow-xl hover:shadow-amber-500/5 group">
                                <div className={`w-3 h-16 rounded-full flex-shrink-0 ${s.sessionType === 'Group' ? 'bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-amber-950 font-black text-lg tracking-tight leading-tight">{s.name}</h3>
                                    <p className="text-amber-900/40 text-sm font-medium truncate mt-1">{s.description}</p>
                                </div>
                                <div className="flex items-center gap-8 text-sm  flex-shrink-0">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 text-amber-950 font-bold">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            {s.dateTime ? new Date(s.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-900/40 text-[10px] font-black uppercase tracking-widest mt-1">
                                            <Users className="w-3 h-3" />
                                            {s.capacity} spots total
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${s.sessionType === 'Group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
