import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Calendar, History, ClipboardList, Clock, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import SessionScheduler from '../components/session/SessionScheduler';
import { reservationService } from '../services/reservationService';
import type { SessionDto } from '../types/reservation';

const Sessions: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const token = useSelector((state: RootState) => state.auth.token);
    const [activeTab, setActiveTab] = useState<'available' | 'my-sessions' | 'history'>('available');
    const [personalSessions, setPersonalSessions] = useState<SessionDto[]>([]);
    const [groupSessions, setGroupSessions] = useState<SessionDto[]>([]);
    const [myBookings, setMyBookings] = useState<SessionDto[]>([]);
    const [historySessions, setHistorySessions] = useState<SessionDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const now = new Date();
        const diff = now.getDay(); 
        const start = new Date(now);
        start.setDate(now.getDate() - diff); // Start from Sunday
        start.setHours(0, 0, 0, 0);
        return start;
    });

    useEffect(() => {
        if (!token || !user?.id) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'available') {
                    const weekEnd = new Date(currentWeekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    
                    const [personal, group] = await Promise.all([
                        reservationService.getSessionsByRange(currentWeekStart, weekEnd, token, false),
                        reservationService.getSessionsByRange(currentWeekStart, weekEnd, token, true)
                    ]);
                    setPersonalSessions(personal);
                    setGroupSessions(group);
                } else if (activeTab === 'my-sessions') {
                    const bookings = await reservationService.getUpcomingSessions(user.id, token);
                    setMyBookings(bookings);
                } else if (activeTab === 'history') {
                    const history = await reservationService.getSessionHistory(user.id, token);
                    setHistorySessions(history);
                }
            } catch (err) {
                console.error("Error fetching sessions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentWeekStart, activeTab, token, user?.id]);

    const handleWeekChange = (days: number) => {
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + days);
        setCurrentWeekStart(next);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderMyBookings = () => (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 ${isLoading ? 'opacity-50' : ''}`}>
            {myBookings.length === 0 && !isLoading ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-amber-200">
                    <p className="text-amber-800/40 font-bold uppercase tracking-widest text-xs">No upcoming bookings</p>
                </div>
            ) : (
                myBookings.map((session) => (
                    <div key={session.sessionId} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-amber-900/5 border border-amber-100 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 opacity-20 rounded-bl-[4rem] -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <BookmarkCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">Booked</span>
                        </div>
                        <h3 className="text-xl font-black text-amber-950 mb-2">{session.name}</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-amber-800/60 font-medium">
                                <Clock className="w-4 h-4" /> {formatDate(session.startTime)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-amber-800/60 font-medium">
                                <User className="w-4 h-4" /> {session.trainerId.fullName}
                            </div>
                        </div>
                        <button className="w-full py-3 bg-neutral-50 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 text-xs font-black rounded-xl transition-all border border-transparent hover:border-rose-100">
                            CANCEL RESERVATION
                        </button>
                    </div>
                ))
            )}
        </div>
    );

    const renderHistory = () => (
        <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-amber-900/5 border border-amber-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ${isLoading ? 'opacity-50' : ''}`}>
            {historySessions.length === 0 && !isLoading ? (
                <div className="py-20 text-center">
                    <p className="text-amber-800/40 font-bold uppercase tracking-widest text-xs">No history found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50/50 border-b border-amber-50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">Session</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">Type</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">Date & Time</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">Trainer</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                            {historySessions.map((session) => (
                                <tr key={session.sessionId} className="hover:bg-amber-50/10 transition-colors">
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-amber-950">{session.name}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-amber-800/60">
                                            {session.trainingType === 1 ? 'Personal' : 'Group'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-medium text-amber-900/80">{formatDate(session.startTime)}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                                                <User className="w-3 h-3 text-amber-600" />
                                            </div>
                                            <span className="text-xs font-bold text-amber-900">{session.trainerId.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            session.status === 2 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {session.status === 2 ? 'Completed' : 'Cancelled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-amber-950 tracking-tight">Sessions</h1>
                    <p className="text-amber-800/60 font-medium">Book, manage and track your training journey</p>
                </div>
                
                {/* Custom Tabs */}
                <div className="bg-neutral-100/50 p-1.5 rounded-[1.5rem] flex gap-2 border border-amber-100/50">
                    {[
                        { id: 'available', label: 'Book Training', icon: <Calendar className="w-4 h-4" /> },
                        { id: 'my-sessions', label: 'My Bookings', icon: <ClipboardList className="w-4 h-4" /> },
                        { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-amber-600 shadow-sm' 
                                : 'text-amber-900/40 hover:text-amber-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                {activeTab === 'available' && (
                    <div className={`space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isLoading && (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        
                        {/* Personal Training Scheduler */}
                        <SessionScheduler 
                            title="Personal Training" 
                            sessions={personalSessions} 
                            currentWeekStart={currentWeekStart}
                            onWeekChange={handleWeekChange}
                        />

                        {/* Group Training Scheduler */}
                        <SessionScheduler 
                            title="Group Training" 
                            sessions={groupSessions} 
                            currentWeekStart={currentWeekStart}
                            onWeekChange={handleWeekChange}
                        />
                    </div>
                )}

                {activeTab === 'my-sessions' && renderMyBookings()}
                {activeTab === 'history' && renderHistory()}
            </div>
        </div>
    );
};

export default Sessions;
