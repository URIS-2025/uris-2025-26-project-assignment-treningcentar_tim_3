import { createBrowserRouter } from 'react-router-dom';
import RoleRedirect from './RoleRedirect';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import ProtectedRoute from './ProtectedRoute';
import { Role } from '../types/auth';
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
import AdminMemberships from '../pages/admin/AdminMemberships';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminSystemLogs from '../pages/admin/AdminSystemLogs';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminMeasurements from '../pages/admin/AdminMeasurements';
import TrainerDashboard from '../pages/TrainerDashboard';
import TrainerSessions from '../pages/TrainerSessions';
import TrainerClientMeasurements from '../pages/TrainerClientMeasurements';
import MeasurementAppointments from '../pages/nutritionist/MeasurementAppointments';
import AppointmentDetails from '../pages/nutritionist/AppointmentDetails';
import NutritionistHome from '../pages/nutritionist/NutritionistHome';


import ReceptionistLayout from '../pages/receptionist/ReceptionistLayout';
import ReceptionistCheckIn from '../pages/receptionist/ReceptionistCheckIn';
import ReceptionistMembership from '../pages/receptionist/ReceptionistMembership';
import ReceptionistSchedule from '../pages/receptionist/ReceptionistSchedule';
import ReceptionistPayment from '../pages/receptionist/ReceptionistPayment';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <RoleRedirect /> },
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
            },
            {
                element: <ProtectedRoute requiredRole={Role.Nutritionist} />,
                children: [
                    { path: 'nutritionist', element: <NutritionistHome /> },
                    { path: 'nutritionist/measurement-appointments', element: <MeasurementAppointments /> },
                    { path: 'nutritionist/measurement-appointments/:id', element: <AppointmentDetails /> }
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
                    { path: 'memberships', element: <AdminMemberships /> },
                    { path: 'measurements', element: <AdminMeasurements /> },
                    { path: 'payments', element: <AdminPayments /> },
                    { path: 'logs', element: <AdminSystemLogs /> },
                    { path: 'settings', element: <AdminSettings /> }
                ]
            }
        ]
    },
    {
        path: '/receptionist',
        element: <ProtectedRoute requiredRole={Role.Receptionist} />,
        children: [
            {
                element: <ReceptionistLayout />,
                children: [
                    { index: true, element: <ReceptionistCheckIn /> },
                    { path: 'membership', element: <ReceptionistMembership /> },
                    { path: 'schedule', element: <ReceptionistSchedule /> },
                    { path: 'payment', element: <ReceptionistPayment /> }
                ]
            }
        ]
    }
]);