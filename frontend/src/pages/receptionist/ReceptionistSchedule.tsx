import React, { useState, useEffect } from 'react';
import {
    CalendarPlus,
    Search,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    User,
    Dumbbell,
    Clock,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { receptionistService } from '../../services/receptionistService';
import type {
    MemberSummary,
    TrainerSummary,
    SessionDto,
} from '../../services/receptionistService';

const ReceptionistSchedule: React.FC = () => {
    // ── State ──
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [trainers, setTrainers] = useState<TrainerSummary[]>([]);
    const [sessions, setSessions] = useState<SessionDto[]>([]);

    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedTrainerId, setSelectedTrainerId] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sessionName, setSessionName] = useState('Personal Training');

    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [confirmationDetails, setConfirmationDetails] = useState<{
        member: string;
        trainer: string;
        date: string;
        time: string;
    } | null>(null);

    const [memberSearch, setMemberSearch] = useState('');
    const [filteredMembers, setFilteredMembers] = useState<MemberSummary[]>([]);
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

    // ── Load data ──
    useEffect(() => {
        setLoading(true);
        Promise.all([
            receptionistService.getAllMembers(),
            receptionistService.getAllTrainers(),
            receptionistService.getAllSessions(),
        ])
            .then(([m, t, s]) => {
                setMembers(m);
                setTrainers(t);
                setSessions(s);
            })
            .catch(() => showToast('error', 'Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    // ── Search members ──
    useEffect(() => {
        if (!memberSearch.trim()) {
            setFilteredMembers(members.slice(0, 20));
            return;
        }
        const q = memberSearch.toLowerCase();
        setFilteredMembers(
            members
                .filter(
                    (m) =>
                        m.firstName?.toLowerCase().includes(q) ||
                        m.lastName?.toLowerCase().includes(q) ||
                        m.username?.toLowerCase().includes(q)
                )
                .slice(0, 8)
        );
    }, [memberSearch, members]);

    // ── Toast ──
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 6000);
    };

    // ── Calendar helpers ──
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const navigateMonth = (delta: number) => {
        const newDate = new Date(calendarMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCalendarMonth(newDate);
    };

    const getSessionsForDate = (date: Date) => {
        return sessions.filter((s) => {
            const sDate = new Date(s.startTime);
            return (
                sDate.getDate() === date.getDate() &&
                sDate.getMonth() === date.getMonth() &&
                sDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const handleCalendarDateClick = (day: number) => {
        const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        setSelectedCalDate(d);
        const dateStr = d.toISOString().split('T')[0];
        setSessionDate(dateStr);
    };

    // ── Submit ──
    const handleSchedule = async () => {
        if (!selectedMemberId || !selectedTrainerId || !sessionDate || !startTime || !endTime) {
            showToast('error', 'Please fill in all required fields.');
            return;
        }
        if (submitting) return;

        const startDateTime = new Date(`${sessionDate}T${startTime}:00`);
        const endDateTime = new Date(`${sessionDate}T${endTime}:00`);

        if (endDateTime <= startDateTime) {
            showToast('error', 'End time must be after start time.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create the session
            const session = await receptionistService.createSession({
                name: sessionName,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: 0,
                trainingType: 1, // Personal
                trainerId: selectedTrainerId,
                maxCapacity: 1,
                isGroup: false,
            });

            // 2. Create reservation for the member
            if (session.sessionId) {
                try {
                    await receptionistService.createReservation({
                        userId: selectedMemberId,
                        sessionId: session.sessionId,
                    });
                } catch (reservationErr) {
                    console.warn('Reservation creation failed:', reservationErr);
                }
            }

            // Refresh sessions
            const updatedSessions = await receptionistService.getAllSessions();
            setSessions(updatedSessions);

            const member = members.find((m) => m.id === selectedMemberId);
            const trainer = trainers.find((t) => t.id === selectedTrainerId);

            setConfirmationDetails({
                member: member ? `${member.firstName} ${member.lastName}` : selectedMemberId,
                trainer: trainer ? `${trainer.firstName} ${trainer.lastName}` : selectedTrainerId,
                date: new Date(sessionDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                time: `${startTime} — ${endTime}`,
            });

            showToast('success', 'Training session scheduled successfully!');

            // Reset form
            setSelectedMemberId('');
            setSelectedTrainerId('');
            setSessionDate('');
            setStartTime('');
            setEndTime('');
            setSessionName('Personal Training');
            setMemberSearch('');
        } catch (err: any) {
            showToast('error', err?.message || 'Failed to schedule training.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render calendar ──
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDay = getFirstDayOfMonth(calendarMonth);
        const days: React.ReactNode[] = [];
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const sessionsOnDay = getSessionsForDate(date);
            const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            const isSelected =
                selectedCalDate &&
                date.getDate() === selectedCalDate.getDate() &&
                date.getMonth() === selectedCalDate.getMonth() &&
                date.getFullYear() === selectedCalDate.getFullYear();
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && handleCalendarDateClick(day)}
                    disabled={isPast}
                    className={`relative h-10 rounded-lg text-xs font-bold transition-all duration-150 ${isSelected
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : isToday
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-200'
                            : isPast
                                ? 'text-neutral-300 cursor-not-allowed'
                                : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                >
                    {day}
                    {sessionsOnDay.length > 0 && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                    )}
                </button>
            );
        }

        return days;
    };

    const selectedMember = members.find((m) => m.id === selectedMemberId);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl ${toast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50">
                    <CalendarPlus className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Schedule Personal Training</h1>
                    <p className="text-neutral-500 text-sm">Book a personal session for a member with a trainer</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading data...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Scheduling Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm">
                            {/* Member Search */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Select Member
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Search members..."
                                        value={memberSearch}
                                        onChange={(e) => {
                                            setMemberSearch(e.target.value);
                                            setShowMemberDropdown(true);
                                        }}
                                        onFocus={() => setShowMemberDropdown(true)}
                                    />
                                    {showMemberDropdown && filteredMembers.length > 0 && (
                                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-neutral-200 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto shadow-lg">
                                            {filteredMembers.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setSelectedMemberId(m.id);
                                                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                                                        setShowMemberDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 transition-colors text-left text-sm"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-[10px] font-black text-amber-600">{m.firstName?.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-neutral-900 font-semibold">{m.firstName} {m.lastName}</span>
                                                    <span className="text-neutral-500 text-xs ml-auto">@{m.username}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedMember && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Selected: {selectedMember.firstName} {selectedMember.lastName}
                                    </div>
                                )}
                            </div>

                            {/* Trainer Select */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Dumbbell className="w-3.5 h-3.5" />
                                    Select Trainer
                                </label>
                                <select
                                    value={selectedTrainerId}
                                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                >
                                    <option value="">Choose a trainer...</option>
                                    {trainers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.firstName} {t.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Session Name */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Dumbbell className="w-3.5 h-3.5" />
                                    Session Name
                                </label>
                                <input
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Personal Training"
                                />
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={sessionDate}
                                        onChange={(e) => setSessionDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSchedule}
                                disabled={submitting || !selectedMemberId || !selectedTrainerId || !sessionDate || !startTime || !endTime}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black rounded-xl transition-all shadow-lg shadow-amber-500/25"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CalendarPlus className="w-5 h-5" />
                                )}
                                {submitting ? 'Scheduling...' : 'Schedule Training Session'}
                            </button>
                        </div>

                        {/* Confirmation */}
                        {confirmationDetails && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-emerald-400 font-black flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Appointment Confirmed
                                    </h3>
                                    <button
                                        onClick={() => setConfirmationDetails(null)}
                                        className="text-neutral-400 hover:text-neutral-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Member</p>
                                        <p className="text-neutral-900 font-semibold">{confirmationDetails.member}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Trainer</p>
                                        <p className="text-neutral-900 font-semibold">{confirmationDetails.trainer}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Date</p>
                                        <p className="text-neutral-900 font-semibold">{confirmationDetails.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Time</p>
                                        <p className="text-neutral-900 font-semibold">{confirmationDetails.time}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-neutral-600 mt-4">Scheduled by receptionist · {new Date().toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Visual Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-neutral-900 font-bold text-sm">
                                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => navigateMonth(-1)}
                                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Day labels */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                                    <div key={d} className="text-center text-[10px] font-bold text-neutral-600 uppercase py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days */}
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendar()}
                            </div>

                            {/* Sessions on selected date */}
                            {selectedCalDate && (
                                <div className="mt-4 pt-4 border-t border-neutral-200">
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                        Sessions on {selectedCalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </h3>
                                    {getSessionsForDate(selectedCalDate).length === 0 ? (
                                        <p className="text-neutral-600 text-xs">No sessions scheduled</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {getSessionsForDate(selectedCalDate).map((s) => (
                                                <div
                                                    key={s.sessionId}
                                                    className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-lg text-xs"
                                                >
                                                    <div className="w-1.5 h-6 rounded-full bg-blue-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-neutral-900 font-semibold">{s.name}</p>
                                                        <p className="text-neutral-500">
                                                            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' — '}
                                                            {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {s.trainerId?.fullName && ` · ${s.trainerId.fullName}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistSchedule;
