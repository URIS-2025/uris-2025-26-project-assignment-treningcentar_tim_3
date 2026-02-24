import React, { useEffect, useState } from 'react';
import { Activity, Search, AlertCircle, Weight, Ruler } from 'lucide-react';
import { measurementService, type MeasurementAppointmentDto } from '../services/measurementService';

const TrainerClientMeasurements: React.FC = () => {
    const [appointments, setAppointments] = useState<MeasurementAppointmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMeasurements = async () => {
            try {
                // The backend measurementService.getAllAppointments() already filters
                // so the Trainer only gets appointments where EmployeeId == TrainerId.
                const data = await measurementService.getAllAppointments();
                setAppointments(data);
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
        // Since we might not have the full name of the member in the DTO right away,
        // we can filter by whatever context we have, or simply rely on the fact they are here.
        // Assuming we could filter by memberId or if we augmented the DTO later.
        return appt.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                        placeholder="Search by ID..."
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
                        <p className="text-amber-900/40 text-sm mt-1">Clients need to book your sessions and have measurements recorded.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAppointments.map(appt => (
                            <div key={appt.appointmentId} className="bg-white border border-amber-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-amber-100/50 transition-all group">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-amber-50">
                                    <div>
                                        <h4 className="font-black text-amber-950 truncate max-w-[150px]">Client {appt.memberId.substring(0, 8)}...</h4>
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                            {new Date(appt.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black">
                                        {appt.measurements?.bodyFatPercent ? Math.round(appt.measurements.bodyFatPercent) + '%' : '- %'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-900/60">
                                            <Weight className="w-4 h-4" />
                                            <span className="text-sm font-bold">Weight</span>
                                        </div>
                                        <span className="font-black text-amber-950">
                                            {appt.measurements?.weightKg ? `${appt.measurements.weightKg} kg` : 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-900/60">
                                            <Ruler className="w-4 h-4" />
                                            <span className="text-sm font-bold">Height</span>
                                        </div>
                                        <span className="font-black text-amber-950">
                                            {appt.measurements?.heightCm ? `${appt.measurements.heightCm} cm` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerClientMeasurements;
