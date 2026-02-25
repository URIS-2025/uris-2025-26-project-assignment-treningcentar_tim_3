import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { LogOut, User } from 'lucide-react';

const NAV_CLS = 'text-xs font-black text-amber-900/40 uppercase tracking-widest hover:text-amber-600 transition-colors';

const Header: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-amber-100 flex items-center px-8 md:px-12 sticky top-0 z-50 shadow-[0_1px_10px_-5px_rgba(217,119,6,0.1)]">
            <Link to="/" className="flex items-center gap-3 group cursor-pointer">
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
            </Link>

            <div className="flex-1" />

            <nav className="flex items-center gap-4 md:gap-8">
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-6 mr-4 border-r border-amber-50 pr-8">
                            {user.role === 'Trainer' ? (
                                <>
                                    <Link to="/trainer-dashboard" className={NAV_CLS}>Dashboard</Link>
                                    <Link to="/trainer-sessions" className={NAV_CLS}>My Sessions</Link>
                                    <Link to="/trainer-measurements" className={NAV_CLS}>Client Measurements</Link>
                                </>
                            ) : user.role === 'Nutritionist' ? (
                                <>
                                    <Link to="/nutritionist/measurement-appointments" className={NAV_CLS}>Appointments</Link>
                                </>
                            ) : user.role === 'Admin' ? (
                                <>
                                    <Link to="/admin" className={NAV_CLS}>Dashboard</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/dashboard" className={NAV_CLS}>Dashboard</Link>
                                    <Link to="/membership" className={NAV_CLS}>Membership</Link>
                                    <Link to="/services" className={NAV_CLS}>Services</Link>
                                    <Link to="/sessions" className={NAV_CLS}>Sessions</Link>
                                </>
                            )}
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-amber-950">{user.fullName}</span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{user.role}</span>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 relative group cursor-pointer">
                            <User className="w-5 h-5 text-amber-600" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
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
                        <Link to="/login" className="text-sm font-bold text-amber-950/60 hover:text-amber-600 transition-colors">Login</Link>
                        <Link to="/register" className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-100">
                            Get Started
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
