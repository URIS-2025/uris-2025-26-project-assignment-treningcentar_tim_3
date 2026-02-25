import React, { useEffect, useState } from 'react';
import { Calendar, Users, Plus, AlertCircle } from 'lucide-react';
import { sessionService, type SessionDto, type SessionCreateDto } from '../services/sessionService';
import SessionForm from '../components/sessions/SessionForm';
import RegisteredMembersModal from '../components/sessions/RegisteredMembersModal';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { authService } from '../services/authService';

const TrainerSessions: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Fallback if the user's local storage is outdated and missing 'id'
    const actualTrainerId = user?.id || authService.getUserFromToken()?.id || '';

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // For now, fetch all. If backend filters by trainer, great. Else we filter client side if we had trainerId = userId matching.
            const data = await sessionService.getAllSessions();
            setSessions(data.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
        } catch (err) {
            console.error("Failed to load sessions", err);
            setError("Failed to load sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleCreateSession = async (dto: SessionCreateDto) => {
        setError('');
        try {
            await sessionService.addSession(dto);
            setIsFormOpen(false);
            fetchSessions();
        } catch (err) {
            setError("Failed to create session.");
        }
    };

    const handleDeleteSession = async (session: SessionDto) => {
        setError('');
        const sessionDate = new Date(session.startTime);
        const now = new Date();
        const diffHours = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) {
            setError("Cannot cancel session less than 24 hours before start time.");
            return;
        }

        if (window.confirm('Are you sure you want to cancel this session?')) {
            try {
                await sessionService.deleteSession(session.sessionId);
                fetchSessions();
            } catch (err) {
                setError("Failed to cancel session.");
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-amber-950">My Sessions</h1>
                    <p className="text-amber-900/60 mt-2">Manage your group and personal training schedule.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-600/20"
                >
                    <Plus className="w-5 h-5" /> Schedule New
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{error}</span>
                </div>
            )}

            <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                        <Calendar className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                        <h3 className="text-amber-900 font-bold text-lg">No sessions scheduled</h3>
                        <p className="text-amber-900/40 text-sm mt-1">Click the button above to schedule your first session.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sessions.map(session => (
                            <div key={session.sessionId} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-amber-50 hover:border-amber-200 hover:shadow-md hover:shadow-amber-100/50 transition-all gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-50 rounded-xl flex flex-col items-center justify-center border border-amber-200 text-amber-900">
                                        <span className="text-[10px] font-black uppercase">{new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl font-black leading-none">{new Date(session.startTime).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-amber-950 text-lg">
                                                {session.trainingType === 1 ? 'Group Training' : 'Personal Training'}
                                            </h4>
                                            {session.trainingType === 1 && (
                                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {session.maxCapacity || 'N/A'} Max
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-amber-900/40">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {session.trainingType === 1 && (
                                        <button
                                            onClick={() => setSelectedSessionId(session.sessionId)}
                                            className="px-4 py-2 text-sm font-bold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
                                        >
                                            View Members
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSession(session)}
                                        className="px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isFormOpen && (
                <SessionForm
                    trainerId={actualTrainerId}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleCreateSession}
                />
            )}

            {selectedSessionId && (
                <RegisteredMembersModal
                    sessionId={selectedSessionId}
                    onClose={() => setSelectedSessionId(null)}
                />
            )}
        </div>
    );
};

export default TrainerSessions;
