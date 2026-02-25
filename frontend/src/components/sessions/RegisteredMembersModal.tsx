import React, { useEffect, useState } from 'react';
import { reservationService, type ReservationDto } from '../../services/reservationService';
import { X, User } from 'lucide-react';

interface Props {
    sessionId: string;
    onClose: () => void;
}

const RegisteredMembersModal: React.FC<Props> = ({ sessionId, onClose }) => {
    const [reservations, setReservations] = useState<ReservationDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const data = await reservationService.getSessionReservations(sessionId);
                setReservations(data);
            } catch (err) {
                console.error("Failed to fetch reservations", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [sessionId]);

    return (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-amber-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-amber-50 flex items-center justify-between bg-amber-50/50">
                    <div>
                        <h2 className="text-xl font-black text-amber-950">Registered Members</h2>
                        <p className="text-xs font-bold text-amber-900/40 uppercase tracking-widest mt-1">
                            {reservations.length} Member(s)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-amber-900/40 hover:text-amber-950 hover:bg-white rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-amber-200" />
                            </div>
                            <h3 className="text-amber-950 font-bold">No members registered yet</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reservations.map((res) => (
                                <div key={res.reservationId} className="flex items-center gap-4 p-4 rounded-2xl border border-amber-50 bg-amber-50/30">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <span className="text-amber-700 font-black">{res.member.firstName[0]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-950">{res.member.firstName} {res.member.lastName}</h4>
                                        <p className="text-xs font-bold text-amber-600">{res.member.email}</p>
                                    </div>
                                    <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                        Active
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

export default RegisteredMembersModal;
