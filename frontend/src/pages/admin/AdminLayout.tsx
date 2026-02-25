import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    Calendar,
    BookOpen,
    CreditCard,
    ScrollText,
    Settings,
    LogOut,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    Zap,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Trainers', path: '/admin/trainers', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Trainings', path: '/admin/trainings', icon: <Dumbbell className="w-5 h-5" /> },
    { label: 'Schedule', path: '/admin/schedule', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Reservations', path: '/admin/reservations', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Memberships', path: '/admin/memberships', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'System Logs', path: '/admin/logs', icon: <ScrollText className="w-5 h-5" /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const user = authService.getUserFromToken();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-amber-50/50">
            {/* Sidebar */}
            <aside
                className={`flex flex-col bg-white border-r border-amber-100 transition-all duration-300 ease-in-out relative ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-6 border-b border-amber-100">
                    <div className="flex-shrink-0 w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-amber-950 tracking-tight leading-tight">Training</p>
                            <p className="text-xs font-bold text-amber-600 tracking-widest uppercase">Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                    : 'text-amber-900/60 hover:bg-amber-50 hover:text-amber-600'
                                }`
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="border-t border-amber-100 p-3">
                    {!collapsed && user && (
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-amber-600">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-amber-950 truncate">{user.fullName}</p>
                                <p className="text-[10px] text-amber-600 uppercase tracking-wider font-bold">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-900/40 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-amber-100 flex items-center justify-center text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors rounded-full z-10 shadow-sm"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
