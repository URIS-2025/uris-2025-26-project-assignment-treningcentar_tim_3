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
    ShoppingBag,
    Layers
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
    { label: 'Packages', path: '/admin/packages', icon: <Layers className="w-5 h-5" /> },
    { label: 'Offerings', path: '/admin/services', icon: <ShoppingBag className="w-5 h-5" /> },
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
        <div className="min-h-screen flex bg-neutral-50">
            {/* Sidebar */}
            <aside
                className={`relative flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-6 border-b border-neutral-200">
                    <div className="flex-shrink-0 w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-neutral-900 tracking-tight leading-tight">Training</p>
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
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
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
                <div className="border-t border-neutral-200 p-3">
                    {!collapsed && user && (
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-amber-600">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-neutral-900 truncate">{user.fullName}</p>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors rounded-r-lg z-10"
                    style={{ marginLeft: collapsed ? '4.5rem' : '15.5rem', transition: 'margin 300ms' }}
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto bg-neutral-50">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
