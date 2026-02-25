import React, { useEffect, useState } from 'react';
import { Activity, Search, AlertCircle, Weight, Ruler, Calendar, Percent } from 'lucide-react';
import { measurementService } from '../services/measurementService';
import type { MeasurementAppointmentDTO } from '../types/measurement';

const TrainerClientMeasurements: React.FC = () => {
    const [appointments, setAppointments] = useState<MeasurementAppointmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMeasurements = async () => {
            try {
                const data = await measurementService.getAllAppointments();
                setAppointments(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } catch (err) {
                console.error("Failed to load measurements", err);
                setError("Failed to load client measurements.");
            } finally {
                setLoading(false);
            }
        };

        fetchMeasurements();
    }, []);

    const filteredAppointments = appointments.filter(appt => {
        if (!searchTerm) return true;
        return appt.memberId.toLowerCase().includes(searchTerm.toLowerCase())
            || appt.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const upcoming = filteredAppointments.filter(a => new Date(a.date) >= new Date());
    const past = filteredAppointments.filter(a => new Date(a.date) < new Date());

    const renderCard = (appt: MeasurementAppointmentDTO) => {
        const isUpcoming = new Date(appt.date) >= new Date();
        const hasResults = appt.weightKg != null || appt.heightCm != null || appt.bodyFatPercent != null;

        return (
            <div key={appt.appointmentId} className="bg-white border border-amber-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-amber-100/50 transition-all">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-amber-50">
                    <div>
                        <h4 className="font-black text-amber-950 truncate max-w-[180px]" title={appt.memberId}>
                            Client {appt.memberId.substring(0, 8)}...
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                {new Date(appt.date).toLocaleDateString()}
                            </span>
                            {isUpcoming && (
                                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                                    Upcoming
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg text-white font-black text-sm ${hasResults ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-orange-500/20' : 'bg-amber-200 shadow-amber-200/20'
                        }`}>
                        {appt.bodyFatPercent != null ? Math.round(appt.bodyFatPercent) + '%' : '--'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900/60">
                            <Weight className="w-4 h-4" />
                            <span className="text-sm font-bold">Weight</span>
                        </div>
                        <span className="font-black text-amber-950">
                            {appt.weightKg != null ? `${appt.weightKg} kg` : 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900/60">
                            <Ruler className="w-4 h-4" />
                            <span className="text-sm font-bold">Height</span>
                        </div>
                        <span className="font-black text-amber-950">
                            {appt.heightCm != null ? `${appt.heightCm} cm` : 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900/60">
                            <Percent className="w-4 h-4" />
                            <span className="text-sm font-bold">Body Fat</span>
                        </div>
                        <span className="font-black text-amber-950">
                            {appt.bodyFatPercent != null ? `${appt.bodyFatPercent}%` : 'N/A'}
                        </span>
                    </div>

                    {appt.notes && (
                        <div className="pt-3 border-t border-amber-50">
                            <p className="text-xs text-amber-900/50 font-medium italic">"{appt.notes}"</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-amber-950">Client Measurements</h1>
                    <p className="text-amber-900/60 mt-2">Track the progress of your assigned clients.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="w-5 h-5 text-amber-900/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by client ID or notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-amber-900/40"
                    />
                </div>
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
                ) : appointments.length === 0 ? (
                    <div className="text-center py-16 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                        <Activity className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                        <h3 className="text-amber-900 font-bold text-lg">No client measurements found</h3>
                        <p className="text-amber-900/40 text-sm mt-1">Measurements will show here when clients have appointments assigned to you.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {upcoming.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black text-amber-900/40 uppercase tracking-widest mb-4">Upcoming Appointments ({upcoming.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcoming.map(renderCard)}
                                </div>
                            </div>
                        )}

                        {past.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black text-amber-900/40 uppercase tracking-widest mb-4">Past Measurements ({past.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {past.map(renderCard)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerClientMeasurements;
