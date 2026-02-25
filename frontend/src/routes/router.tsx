import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import ProtectedRoute from './ProtectedRoute';
import { Role } from '../types/auth';
import { authService } from '../services/authService';
import UserDashboard from '../pages/UserDashboard';
import Membership from '../pages/Membership';
import Services from '../pages/Services';
import Sessions from '../pages/Sessions';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminTrainers from '../pages/admin/AdminTrainers';
import AdminTrainings from '../pages/admin/AdminTrainings';
import AdminSchedule from '../pages/admin/AdminSchedule';
import AdminReservations from '../pages/admin/AdminReservations';
import AdminMemberships from '../pages/admin/AdminMemberships';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminSystemLogs from '../pages/admin/AdminSystemLogs';
import AdminSettings from '../pages/admin/AdminSettings';
import TrainerDashboard from '../pages/TrainerDashboard';
import TrainerSessions from '../pages/TrainerSessions';
import TrainerClientMeasurements from '../pages/TrainerClientMeasurements';

const IndexRedirect = () => {
    if (authService.hasRole(Role.Admin)) return <Navigate to="/admin" replace />;
    if (authService.hasRole(Role.Trainer)) return <Navigate to="/trainer-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <IndexRedirect /> },
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            {
                element: <ProtectedRoute requiredRole={Role.Member} />,
                children: [
                    { path: 'dashboard', element: <UserDashboard /> },
                    { path: 'membership', element: <Membership /> },
                    { path: 'services', element: <Services /> },
                    { path: 'sessions', element: <Sessions /> }
                ]
            },
            {
                element: <ProtectedRoute requiredRole={Role.Trainer} />,
                children: [
                    { path: 'trainer-dashboard', element: <TrainerDashboard /> },
                    { path: 'trainer-sessions', element: <TrainerSessions /> },
                    { path: 'trainer-measurements', element: <TrainerClientMeasurements /> }
                ]
            }
        ]
    },
    {
        path: '/admin',
        element: <ProtectedRoute requiredRole={Role.Admin} />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: 'users', element: <AdminUsers /> },
                    { path: 'trainers', element: <AdminTrainers /> },
                    { path: 'trainings', element: <AdminTrainings /> },
                    { path: 'schedule', element: <AdminSchedule /> },
                    { path: 'reservations', element: <AdminReservations /> },
                    { path: 'memberships', element: <AdminMemberships /> },
                    { path: 'payments', element: <AdminPayments /> },
                    { path: 'logs', element: <AdminSystemLogs /> },
                    { path: 'settings', element: <AdminSettings /> }
                ]
            }
        ]
    }
]);