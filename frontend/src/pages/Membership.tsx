import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, ArrowUpCircle, Package, Info } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { membershipService } from '../services/membershipService';
import type { UserMembershipDto, MembershipPackageDto } from '../types/membership';

interface MembershipPageData {
    userMembership: (UserMembershipDto & { packageName: string }) | null;
    availablePackages: MembershipPackageDto[];
}

const Membership: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const token = useSelector((state: RootState) => state.auth.token);
    const [data, setData] = useState<MembershipPageData>({
        userMembership: null,
        availablePackages: []
    });

    useEffect(() => {
        // Fetch Packages
        membershipService.getPackages()
            .then(packages => {
                setData(prev => ({ ...prev, availablePackages: packages }));
            })
            .catch(error => console.error("Error fetching packages:", error));

        // Fetch User Membership
        if (user?.id && token) {
            membershipService.getUserMembership(user.id, token)
                .then(realMembership => {
                    if (realMembership) {
                        setData(prev => {
                            const pkg = prev.availablePackages.find(p => p.packageId === realMembership.packageId);
                            return {
                                ...prev,
                                userMembership: {
                                    ...realMembership,
                                    packageName: pkg ? pkg.name : 'Active Plan'
                                }
                            };
                        });
                    } else {
                        setData(prev => ({ ...prev, userMembership: null }));
                    }
                })
                .catch(error => {
                    console.error("Error fetching real membership:", error);
                    setData(prev => ({ ...prev, userMembership: null }));
                });
        }
    }, [user?.id, token]);

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1: return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>;
            case 2: return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider">Expired</span>;
            case 3: return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">Suspended</span>;
            case 4: return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold uppercase tracking-wider">Cancelled</span>;
            default: return null;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleUpgrade = (packageName: string) => {
        console.log(`Upgrading to ${packageName}`);
        // Logic for upgrade API call would go here
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div>
                <h1 className="text-4xl font-black text-amber-950 tracking-tight">Membership</h1>
                <p className="text-amber-800/60 font-medium">Manage your subscription and packages</p>
            </div>

            {/* Current Membership Section */}
            {!data.userMembership ? (
                <div className="bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2.5rem] p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-amber-600 opacity-40" />
                    </div>
                    <h2 className="text-2xl font-black text-amber-950">No Active Membership</h2>
                    <p className="text-amber-800/60 max-w-md mx-auto font-medium">
                        You don't have an active subscription yet. Choose one of our premium packages below to start your fitness journey.
                    </p>
                </div>
            ) : (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 to-orange-300 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-xl border border-amber-50 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-amber-50">
                            <div className="p-8 space-y-3">
                                <div className="flex items-center gap-2 text-amber-800/40 uppercase text-[10px] font-black tracking-[0.2em]">
                                    <Package className="w-3 h-3" /> Current Plan
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-amber-950">{data.userMembership.packageName}</span>
                                    <div className="mt-1">{getStatusLabel(data.userMembership.status)}</div>
                                </div>
                            </div>

                            <div className="p-8 space-y-3">
                                <div className="flex items-center gap-2 text-amber-800/40 uppercase text-[10px] font-black tracking-[0.2em]">
                                    <Calendar className="w-3 h-3" /> Valid Until
                                </div>
                                <div className="text-xl font-bold text-amber-900">{formatDate(data.userMembership.endDate)}</div>
                                <p className="text-xs text-amber-800/40">Started: {formatDate(data.userMembership.startDate)}</p>
                            </div>

                            <div className="p-8 space-y-3">
                                <div className="flex items-center gap-2 text-amber-800/40 uppercase text-[10px] font-black tracking-[0.2em]">
                                    <Info className="w-3 h-3" /> Account Info
                                </div>
                                <div className="text-sm font-medium text-amber-900">Created: {formatDate(data.userMembership.createdDate)}</div>
                                {data.userMembership.cancelledDate && (
                                    <div className="text-xs text-rose-500 font-bold">Cancelled on: {formatDate(data.userMembership.cancelledDate)}</div>
                                )}
                            </div>

                            <div className="p-8 flex items-center justify-center bg-amber-50/30">
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-amber-800/40 uppercase tracking-[0.2em] mb-2 text-center">Status</span>
                                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <ArrowUpCircle className="w-6 h-6 text-amber-600" />
                    <h2 className="text-2xl font-black text-amber-950 uppercase tracking-tight">Upgrade Your Experience</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.availablePackages.map((pkg) => {
                        const isCurrent = data.userMembership?.packageId === pkg.packageId;
                        return (
                            <div key={pkg.packageId} 
                                className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 ${
                                    isCurrent 
                                    ? 'bg-amber-50/50 border-2 border-amber-200 opacity-80' 
                                    : 'bg-white shadow-xl shadow-amber-900/5 border border-amber-100 hover:scale-[1.02] hover:shadow-2xl'
                                }`}>
                                {isCurrent && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-200 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-widest whitespace-nowrap">
                                        Your Current Plan
                                    </div>
                                )}
                                
                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-amber-950 mb-2">{pkg.name}</h3>
                                    <p className="text-sm text-amber-800/60 font-medium leading-relaxed">{pkg.description}</p>
                                </div>

                                <div className="mb-8 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-amber-950">${pkg.price}</span>
                                    <span className="text-xs font-bold text-amber-800/40 uppercase">/ {pkg.duration} days</span>
                                </div>

                                <div className="flex-1 space-y-4 mb-10">
                                    <span className="block text-[10px] font-black text-amber-800/30 uppercase tracking-[0.2em] mb-2">What's included:</span>
                                    {pkg.services.map((service, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-medium text-amber-900/80">{service}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(pkg.name)}
                                    disabled={isCurrent}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                                        isCurrent
                                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
                                        : 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/20 active:scale-95'
                                    }`}>
                                    {isCurrent ? 'Current Plan' : (data.userMembership ? 'Upgrade Now' : 'Get Started')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Membership;
