import React, { useState, useEffect } from 'react';
import { ShoppingBag, Dumbbell, Users, Utensils, Ruler, CreditCard, Loader2 } from 'lucide-react';
import { serviceService, type ServiceDto } from '../services/serviceService';

const Services: React.FC = () => {
    const [services, setServices] = useState<ServiceDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        serviceService.getAll()
            .then(data => {
                setServices(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                setError("Failed to load services. Please try again later.");
                setIsLoading(false);
            });
    }, []);

    const getIcon = (category: number) => {
        switch (category) {
            case 1: return <CreditCard className="w-8 h-8 text-amber-500" />;
            case 2: return <Dumbbell className="w-8 h-8 text-blue-500" />;
            case 3: return <Users className="w-8 h-8 text-purple-500" />;
            case 4: return <Utensils className="w-8 h-8 text-emerald-500" />;
            case 5: return <Ruler className="w-8 h-8 text-rose-500" />;
            default: return <ShoppingBag className="w-8 h-8 text-amber-500" />;
        }
    };

    const getCategoryName = (category: number) => {
        const categories = {
            1: "Membership",
            2: "Personal Training",
            3: "Group Training",
            4: "Nutrition",
            5: "Measurement"
        };
        return categories[category as keyof typeof categories] || "Other";
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
                <p className="text-amber-800/40 font-black uppercase tracking-widest text-xs">Loading Services...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <p className="text-rose-600 font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-amber-950 tracking-tight">Our Services</h1>
                    <p className="text-amber-800/60 font-medium">Explore everything we offer for your fitness journey</p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-amber-200">
                        <p className="text-amber-800/40 font-bold uppercase tracking-widest text-xs">No services available at the moment</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <div key={service.id} 
                            className="group bg-white rounded-[2.5rem] p-8 shadow-xl shadow-amber-900/5 border border-amber-100 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col">
                            
                            {/* Decorative Background Icon */}
                            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                {React.cloneElement(getIcon(service.category), { className: "w-48 h-48" } as any)}
                            </div>

                            <div className="relative z-10 flex flex-col h-full flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 rounded-2xl bg-amber-50/50">
                                        {getIcon(service.category)}
                                    </div>
                                    <span className="text-[10px] font-black text-amber-800/30 uppercase tracking-[0.2em] pt-2">
                                        {getCategoryName(service.category)}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-amber-950 mb-3 leading-tight">{service.name}</h3>
                                    <p className="text-sm text-amber-800/60 font-medium leading-relaxed mb-6">
                                        {service.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-amber-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-amber-800/40 uppercase tracking-wider">Starting from</span>
                                        <span className="text-2xl font-black text-amber-950">${service.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Services;
