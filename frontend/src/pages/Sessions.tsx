import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Calendar, History, ClipboardList, Clock, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import SessionScheduler from '../components/session/SessionScheduler';
import { reservationService } from '../services/reservationService';
import type { SessionDto } from '../types/reservation';
import { X, Check, AlertCircle } from 'lucide-react';

const Sessions: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const token = useSelector((state: RootState) => state.auth.token);
    const [activeTab, setActiveTab] = useState<'available' | 'my-sessions' | 'history'>('available');
    const [personalSessions, setPersonalSessions] = useState<SessionDto[]>([]);
    const [groupSessions, setGroupSessions] = useState<SessionDto[]>([]);
    const [myBookings, setMyBookings] = useState<SessionDto[]>([]);
    const [historySessions, setHistorySessions] = useState<SessionDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bookingSession, setBookingSession] = useState<SessionDto | null>(null);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleBookClick = (session: SessionDto) => {
        setBookingSession(session);
    };

    const handleConfirmBooking = async () => {
        if (!bookingSession || !user?.id || !token) return;
        
        setIsProcessing(true);
        try {
            await reservationService.createReservation(user.id, bookingSession.sessionId, token);
            showToast(`Successfully booked ${bookingSession.name}!`);
            setBookingSession(null);
            
            // Refresh available sessions
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const [personal, group] = await Promise.all([
                reservationService.getSessionsByRange(currentWeekStart, weekEnd, token, false),
                reservationService.getSessionsByRange(currentWeekStart, weekEnd, token, true)
            ]);
            setPersonalSessions(personal);
            setGroupSessions(group);
        } catch (err: any) {
            showToast(err.message || "Failed to book session", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelReservation = async (session: SessionDto) => {
        if (!token || !user?.id) return;
        
        // Find the reservation ID for this session
        // Note: The SessionDto returned by my-sessions should probably have the reservationId
        // Let's assume for now we need to fetch user reservations to find it or it's already there
        // Looking at renderMyBookings, it uses session.sessionId but we need reservationId to cancel.
        
        try {
            // Need to get reservations to find the ID
            const resData = await reservationService.getAllReservations();
            const reservation = resData.find(r => 
                r.sessionId === session.sessionId && 
                `${r.member.firstName} ${r.member.lastName}` === user.fullName
            );
            
            if (reservation) {
                await reservationService.cancelReservation(reservation.reservationId, token);
                showToast("Reservation cancelled");
                // Refresh
                const bookings = await reservationService.getUpcomingSessions(user.id, token);
                setMyBookings(bookings);
            } else {
                showToast("Could not find reservation to cancel", 'error');
            }
        } catch (err) {
            showToast("Failed to cancel reservation", 'error');
        }
    };

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
                        <button 
                            onClick={() => handleCancelReservation(session)}
                            className="w-full py-3 bg-neutral-50 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 text-xs font-black rounded-xl transition-all border border-transparent hover:border-rose-100">
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
                                            {session.maxCapacity !== undefined && session.maxCapacity !== null ? 'Group Session' : 'Personal Session'}
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
                                            session.status === 1 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {session.status === 1 ? 'Completed' : 'Cancelled'}
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
            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-right-4 transition-all ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}
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
                            onBook={handleBookClick}
                        />

                        {/* Group Training Scheduler */}
                        <SessionScheduler 
                            title="Group Training" 
                            sessions={groupSessions} 
                            currentWeekStart={currentWeekStart}
                            onWeekChange={handleWeekChange}
                            onBook={handleBookClick}
                        />
                    </div>
                )}
                {activeTab === 'my-sessions' && renderMyBookings()}
                {activeTab === 'history' && renderHistory()}
            </div>

            {/* Confirmation Modal */}
            {bookingSession && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-amber-950/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-amber-100">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-amber-50 rounded-2xl">
                                    <Calendar className="w-8 h-8 text-amber-600" />
                                </div>
                                <button onClick={() => setBookingSession(null)} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>
                            
                            <h3 className="text-2xl font-black text-amber-950 mb-2">Book Session?</h3>
                            <p className="text-amber-800/60 font-medium mb-8">
                                Are you sure you want to book <span className="text-amber-950 font-bold underline decoration-amber-300 underline-offset-4">{bookingSession.name}</span> with {bookingSession.trainerId.fullName}?
                            </p>

                            <div className="space-y-3 p-5 bg-neutral-50 rounded-[1.8rem] border border-amber-50 mb-8">
                                <div className="flex items-center gap-3 text-sm font-bold text-amber-900">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    {formatDate(bookingSession.startTime)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setBookingSession(null)}
                                    className="py-4 bg-white hover:bg-neutral-50 text-neutral-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-neutral-100">
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmBooking}
                                    disabled={isProcessing}
                                    className="py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-300 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-600/20">
                                    {isProcessing ? 'Booking...' : 'Confirm Book'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sessions;
