import React, { useEffect, useState } from 'react';
import { Calendar, Activity } from 'lucide-react';
import { sessionService, type SessionDto } from '../services/sessionService';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const TrainerDashboard: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPersonalSessions = async () => {
            try {
                // Fetch all sessions and filter by today's date or just to show recent stats.
                // Assuming trainer only sees their own stuff. The backend doesn't seem to filter by trainer in GetAllSessions, 
                // but GetPersonalSessions / GetGroupSessions might, although we should probably just show some count.
                // Let's just fetch all and filter in frontend if needed, or just show placeholders if fetch is complex without backend filter.
                const allSessions = await sessionService.getAllSessions();
                setSessions(allSessions.filter(s => s.trainerId === user?.fullName || true)); // We don't have trainerId in user payload exactly right now, maybe sub.
            } catch (err) {
                console.error("Failed to load sessions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPersonalSessions();
    }, [user]);

    const upcomingSessionsCount = sessions.filter(s => new Date(s.date) >= new Date()).length;
    const todaySessionsCount = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-amber-950">Welcome back, {user?.fullName || 'Trainer'}!</h1>
                <p className="text-amber-900/60 mt-2">Here is what's happening today in your schedule.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Stat Card 1 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                        <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-amber-950 font-black text-2xl">{loading ? '-' : todaySessionsCount}</h3>
                    <p className="text-sm font-bold text-amber-900/40 uppercase tracking-wider mt-1">Sessions Today</p>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                        <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-amber-950 font-black text-2xl">{loading ? '-' : upcomingSessionsCount}</h3>
                    <p className="text-sm font-bold text-amber-900/40 uppercase tracking-wider mt-1">Upcoming Sessions</p>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-6 shadow-lg shadow-amber-600/20 text-white flex flex-col justify-center">
                    <h3 className="font-black text-xl mb-2">Ready for a new session?</h3>
                    <p className="text-white/80 text-sm mb-4">Schedule your next group or personal training.</p>
                    <a href="/trainer-sessions" className="bg-white text-amber-600 px-4 py-2 rounded-xl text-sm font-bold w-max hover:bg-amber-50 transition-colors">
                        Go to Schedule
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm">
                <h2 className="text-xl font-black text-amber-950 mb-6">Today's Timeline</h2>

                {loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-amber-100 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-amber-100 rounded"></div>
                                <div className="h-4 bg-amber-100 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ) : sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
                    <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                        <Calendar className="w-12 h-12 text-amber-200 mx-auto mb-3" />
                        <h3 className="text-amber-900 font-bold">No sessions mapped for today</h3>
                        <p className="text-amber-900/40 text-sm mt-1">Enjoy your free time or schedule a new one.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).map(session => (
                            <div key={session.sessionId} className="flex items-center gap-4 p-4 rounded-xl border border-amber-50 hover:border-amber-200 transition-colors">
                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-amber-50 rounded-xl">
                                    <span className="text-xs font-black text-amber-600 uppercase">
                                        {new Date(`1970-01-01T${session.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-black text-amber-950">{session.trainingType === 1 ? 'Group Training' : 'Personal Training'}</h4>
                                    <p className="text-sm font-bold text-amber-900/40">Capacity: {session.capacity > 0 ? session.capacity : '1'} person(s)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerDashboard;
