import React, { useState } from 'react';
import type { SessionCreateDto } from '../../services/sessionService';
import { X, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

interface Props {
    trainerId: string;
    onClose: () => void;
    onSubmit: (dto: SessionCreateDto) => void;
}

const SessionForm: React.FC<Props> = ({ trainerId, onClose, onSubmit }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState<number>(1);
    const [trainingType, setTrainingType] = useState<number>(0); // 0 Personal, 1 Group

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct full Date objects for C# DateTime
        const localStart = new Date(`${date}T${startTime}`);
        const localEnd = new Date(`${date}T${endTime}`);

        onSubmit({
            name: trainingType === 0 ? 'Personal Training' : 'Group Training',
            startTime: localStart.toISOString(),
            endTime: localEnd.toISOString(),
            status: 0, // Upcoming
            trainingType: trainingType,
            trainerId: trainerId,
            maxCapacity: trainingType === 0 ? 1 : capacity,
            isGroup: trainingType === 1
        });
    };

    return (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-amber-100">
                <div className="p-6 border-b border-amber-50 flex items-center justify-between bg-amber-50/50">
                    <h2 className="text-xl font-black text-amber-950">New Session</h2>
                    <button onClick={onClose} className="p-2 text-amber-900/40 hover:text-amber-950 hover:bg-white rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-amber-900/40 uppercase tracking-widest mb-2">Training Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTrainingType(0)}
                                className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${trainingType === 0 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-900/60 border-amber-100 hover:border-amber-300'}`}
                            >
                                Personal
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrainingType(1)}
                                className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${trainingType === 1 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-900/60 border-amber-100 hover:border-amber-300'}`}
                            >
                                Group
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-amber-900/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" /> Date
                        </label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-amber-900/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Start Time
                            </label>
                            <input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-amber-900/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> End Time
                            </label>
                            <input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {trainingType === 1 && (
                        <div>
                            <label className="block text-xs font-black text-amber-900/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Capacity
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="50"
                                required
                                value={capacity}
                                onChange={(e) => setCapacity(parseInt(e.target.value))}
                                className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                            />
                        </div>
                    )}

                    <div className="pt-4 mt-6 border-t border-amber-50">
                        <button
                            type="submit"
                            className="w-full bg-amber-600 text-white rounded-xl py-3 font-black tracking-wide hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-600/20 transition-all active:scale-[0.98]"
                        >
                            Schedule Session
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SessionForm;
