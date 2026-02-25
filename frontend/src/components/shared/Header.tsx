import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
        window.location.href = '/login';
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-amber-100 flex items-center px-8 md:px-12 sticky top-0 z-50 shadow-[0_1px_10px_-5px_rgba(217,119,6,0.1)]">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:rotate-6 transition-transform">
                    <span className="text-white font-black text-xl">T</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent tracking-tight">
                        TRAINING CENTER
                    </span>
                    <span className="text-[10px] font-bold text-amber-900/40 uppercase tracking-[0.2em] -mt-1">
                        Professional Athletics
                    </span>
                </div>
            </div>

            <div className="flex-1"></div>

            <nav className="flex items-center gap-4 md:gap-8">
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-6 mr-4 border-r border-amber-50 pr-8">
                            {user.role === 'Trainer' ? (
                                <>
                                    <a href="/trainer-dashboard" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Dashboard</a>
                                    <a href="/trainer-sessions" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">My Sessions</a>
                                    <a href="/trainer-measurements" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Client Measurements</a>
                                </>
                            ) : user.role === 'Receptionist' ? (
                                <>
                                    <a href="/receptionist" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Check-In</a>
                                    <a href="/receptionist/membership" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Membership</a>
                                    <a href="/receptionist/schedule" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Schedule</a>
                                    <a href="/receptionist/payment" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Payment</a>
                                </>
                            ) : (
                                <>
                                    <a href="/dashboard" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Dashboard</a>
                                    <a href="/membership" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Membership</a>
                                    <a href="/services" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Services</a>
                                    <a href="/sessions" className="text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors">Sessions</a>
                                </>
                            )}
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-amber-950">
                                {user.fullName}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                {user.role}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 relative group cursor-pointer">
                            <User className="w-5 h-5 text-amber-600" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 text-amber-900/40 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <a href="/login" className="text-sm font-bold text-amber-950/60 hover:text-amber-600 transition-colors">Login</a>
                        <a href="/register" className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-100">
                            Get Started
                        </a>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
