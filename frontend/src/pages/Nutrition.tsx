import React, { useEffect, useState } from 'react';
import { Apple, Calendar, Loader2 } from 'lucide-react';
import { measurementService } from '../services/measurementService';
import { GuidelineCategoryLabel } from '../types/measurement';
import type { GuidelineDTO } from '../types/measurement';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const Nutrition: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [guidelines, setGuidelines] = useState<GuidelineDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuidelines = async () => {
            try {
                const data = await measurementService.getAllGuidelines();
                setGuidelines(data);
            } catch (error) {
                console.error('Failed to fetch guidelines', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchGuidelines();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-amber-950 tracking-tight">Nutrition & Diet</h1>
                    <p className="text-amber-800/60 font-medium">View your custom diet plans and guidelines</p>
                </div>
                <div className="w-16 h-16 bg-amber-100 rounded-3rd flex items-center justify-center rounded-2xl">
                    <Apple className="w-8 h-8 text-amber-600" />
                </div>
            </div>

            {guidelines.length === 0 ? (
                <div className="bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center">
                    <Apple className="w-16 h-16 text-amber-600 opacity-20 mb-4" />
                    <h2 className="text-2xl font-black text-amber-950">No Diet Plans Yet</h2>
                    <p className="text-amber-800/60 mt-2 max-w-md">
                        You don't have any nutrition guidelines assigned. Book an appointment with a nutritionist to get a custom diet plan!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {guidelines.map(g => (
                        <div key={g.guidelineId} className="bg-white rounded-[2rem] shadow-xl border border-amber-50 p-8 flex flex-col hover:shadow-2xl transition-all hover:-translate-y-1 group">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                                    <Apple className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-amber-950">{g.title}</h3>
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">
                                        {GuidelineCategoryLabel[g.category]}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-neutral-50 rounded-2xl p-4 text-sm font-medium text-neutral-600 leading-relaxed border border-neutral-100 whitespace-pre-wrap">
                                {g.content}
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-50 text-xs text-neutral-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Added {new Date(g.lastUpdated).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Nutrition;
