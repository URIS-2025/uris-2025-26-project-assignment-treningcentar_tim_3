import React, { useEffect, useState } from 'react';
import { Calendar, Activity, ClipboardList, Weight } from 'lucide-react';
import { sessionService, type SessionDto } from '../services/sessionService';
import { measurementService, type MeasurementAppointmentDto } from '../services/measurementService';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const TrainerDashboard: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [measurements, setMeasurements] = useState<MeasurementAppointmentDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sessionsResult, measurementsResult] = await Promise.allSettled([
                    sessionService.getAllSessions(),
                    measurementService.getAllAppointments()
                ]);
                if (sessionsResult.status === 'fulfilled') setSessions(sessionsResult.value);
                if (measurementsResult.status === 'fulfilled') setMeasurements(measurementsResult.value);
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString());
    const upcomingSessionsCount = sessions.filter(s => new Date(s.startTime) >= new Date()).length;
    const upcomingMeasurements = measurements.filter(m => new Date(m.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-amber-950">Welcome back, {user?.fullName || 'Trainer'}!</h1>
                <p className="text-amber-900/60 mt-2">Here is what's happening today in your schedule.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                        <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-amber-950 font-black text-2xl">{loading ? '-' : todaySessions.length}</h3>
                    <p className="text-sm font-bold text-amber-900/40 uppercase tracking-wider mt-1">Sessions Today</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                        <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-amber-950 font-black text-2xl">{loading ? '-' : upcomingSessionsCount}</h3>
                    <p className="text-sm font-bold text-amber-900/40 uppercase tracking-wider mt-1">Upcoming Sessions</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        <ClipboardList className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-amber-950 font-black text-2xl">{loading ? '-' : upcomingMeasurements.length}</h3>
                    <p className="text-sm font-bold text-amber-900/40 uppercase tracking-wider mt-1">Upcoming Measurements</p>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-6 shadow-lg shadow-amber-600/20 text-white flex flex-col justify-center">
                    <h3 className="font-black text-xl mb-2">New session?</h3>
                    <p className="text-white/80 text-sm mb-4">Schedule group or personal training.</p>
                    <a href="/trainer-sessions" className="bg-white text-amber-600 px-4 py-2 rounded-xl text-sm font-bold w-max hover:bg-amber-50 transition-colors">
                        Go to Schedule
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Sessions */}
                <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm">
                    <h2 className="text-xl font-black text-amber-950 mb-6">Today's Timeline</h2>

                    {loading ? (
                        <div className="animate-pulse space-y-4 py-1">
                            <div className="h-4 bg-amber-100 rounded w-3/4"></div>
                            <div className="h-4 bg-amber-100 rounded"></div>
                            <div className="h-4 bg-amber-100 rounded w-5/6"></div>
                        </div>
                    ) : todaySessions.length === 0 ? (
                        <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                            <Calendar className="w-12 h-12 text-amber-200 mx-auto mb-3" />
                            <h3 className="text-amber-900 font-bold">No sessions today</h3>
                            <p className="text-amber-900/40 text-sm mt-1">Enjoy your free time or schedule a new one.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todaySessions.map(session => (
                                <div key={session.sessionId} className="flex items-center gap-4 p-4 rounded-xl border border-amber-50 hover:border-amber-200 transition-colors">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-amber-50 rounded-xl">
                                        <span className="text-xs font-black text-amber-600 uppercase">
                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-amber-950">{session.trainingType === 1 ? 'Group Training' : 'Personal Training'}</h4>
                                        <p className="text-sm font-bold text-amber-900/40">Capacity: {(session.maxCapacity && session.maxCapacity > 0) ? session.maxCapacity : '1'} person(s)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Measurements */}
                <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-amber-950">Upcoming Measurements</h2>
                        <a href="/trainer-measurements" className="text-sm font-bold text-amber-600 hover:text-orange-600 transition-colors">View All</a>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4 py-1">
                            <div className="h-4 bg-amber-100 rounded w-3/4"></div>
                            <div className="h-4 bg-amber-100 rounded"></div>
                        </div>
                    ) : upcomingMeasurements.length === 0 ? (
                        <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                            <Weight className="w-12 h-12 text-amber-200 mx-auto mb-3" />
                            <h3 className="text-amber-900 font-bold">No upcoming measurements</h3>
                            <p className="text-amber-900/40 text-sm mt-1">Client measurement appointments will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingMeasurements.slice(0, 5).map(m => (
                                <div key={m.appointmentId} className="flex items-center gap-4 p-4 rounded-xl border border-amber-50 hover:border-emerald-200 transition-colors">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-emerald-50 rounded-xl">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">
                                            {new Date(m.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-black text-emerald-700 leading-none">
                                            {new Date(m.date).getDate()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-amber-950 truncate">Client {m.memberId.substring(0, 8)}...</h4>
                                        <p className="text-sm font-bold text-amber-900/40">
                                            {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {m.notes && <span className="ml-2 italic">— {m.notes.substring(0, 30)}{m.notes.length > 30 ? '...' : ''}</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerDashboard;
