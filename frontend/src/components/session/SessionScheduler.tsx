import { ChevronLeft, ChevronRight, Clock, User, BookmarkCheck, Users as UsersIcon } from 'lucide-react';
import { type SessionDto } from '../../types/reservation';

interface SessionSchedulerProps {
    title: string;
    sessions: SessionDto[];
    currentWeekStart: Date;
    onWeekChange: (days: number) => void;
    onBook: (session: SessionDto) => void;
}

const SessionScheduler: React.FC<SessionSchedulerProps> = ({ title, sessions, currentWeekStart, onWeekChange, onBook }) => {
    
    // Get array of 7 days starting from currentWeekStart
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const formatDayName = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const formatDateShort = (date: Date) => {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    };

    const getSessionsForDay = (date: Date) => {
        return sessions.filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate.toDateString() === date.toDateString();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    const handleBook = (session: SessionDto) => {
        onBook(session);
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-amber-900/5 border border-amber-100 overflow-hidden">
            {/* Table Header / Toolbar */}
            <div className="p-8 border-b border-amber-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/30">
                <h2 className="text-2xl font-black text-amber-950 uppercase tracking-tight">{title}</h2>
                
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-inner border border-amber-50">
                    <button 
                        onClick={() => onWeekChange(-7)}
                        className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-black text-amber-900 px-2 min-w-[150px] text-center">
                        {formatDateShort(weekDays[0])} - {formatDateShort(weekDays[6])}
                    </span>
                    <button 
                        onClick={() => onWeekChange(7)}
                        className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Scheduler Body */}
            <div className="divide-y divide-amber-50">
                {weekDays.map((day, idx) => {
                    const daySessions = getSessionsForDay(day);
                    return (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 min-h-[120px]">
                            {/* Day Header */}
                            <div className="md:col-span-2 p-6 flex flex-col justify-center bg-amber-50/10 border-r border-amber-50">
                                <span className="text-xs font-black text-amber-800/40 uppercase tracking-[0.2em] mb-1">
                                    {formatDayName(day)}
                                </span>
                                <span className="text-2xl font-black text-amber-950">
                                    {day.getDate()}
                                </span>
                            </div>

                            {/* Sessions List */}
                            <div className="md:col-span-10 p-4 flex flex-wrap gap-4 items-center">
                                {daySessions.length > 0 ? (
                                    daySessions.map((session) => (
                                        <div key={session.sessionId} 
                                            className="flex-1 min-w-[300px] max-w-[400px] bg-white border border-amber-100 rounded-[1.8rem] p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-amber-950 leading-tight">{session.name}</h4>
                                                    <span className="inline-block px-2 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-600 rounded uppercase tracking-wider">
                                                        {session.maxCapacity !== undefined && session.maxCapacity !== null ? 'Group Session' : 'Personal Session'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                        {formatTime(session.startTime)}
                                                    </div>
                                                    <p className="text-[10px] text-amber-800/40 font-bold">
                                                        {formatTime(session.endTime)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                                                        <User className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-amber-800/30 uppercase tracking-wider">Trainer</span>
                                                        <span className="text-xs font-bold text-amber-950">{session.trainerId.fullName}</span>
                                                    </div>
                                                </div>

                                                {session.maxCapacity && (
                                                    <div className="flex items-center gap-2 text-right">
                                                        <div className="flex flex-col">
                                                             <span className="text-[10px] font-black text-amber-800/30 uppercase tracking-wider">Capacity</span>
                                                             <span className="text-xs font-bold text-amber-950">{session.currentBookings} / {session.maxCapacity}</span>
                                                         </div>
                                                         <UsersIcon className="w-4 h-4 text-amber-300" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6">
                                                <button 
                                                    onClick={() => handleBook(session)}
                                                    disabled={session.isBookedByCurrentUser}
                                                    className={`w-full py-3 text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                                                        session.isBookedByCurrentUser
                                                        ? 'bg-emerald-50 text-emerald-600 cursor-default shadow-none'
                                                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10 active:scale-95'
                                                    }`}>
                                                    <BookmarkCheck className="w-4 h-4" /> 
                                                    {session.isBookedByCurrentUser ? 'ALREADY BOOKED' : 'BOOK SESSION'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm font-medium text-amber-800/30 italic px-4">No sessions scheduled for this day</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SessionScheduler;