import { createBrowserRouter } from 'react-router-dom';
import RoleRedirect from './RoleRedirect';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import ProtectedRoute from './ProtectedRoute';
import { Role } from '../types/auth';
import UserDashboard from '../pages/UserDashboard';
import Membership from '../pages/Membership';
import Nutrition from '../pages/Nutrition';
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
import AdminMeasurements from '../pages/admin/AdminMeasurements';
import AdminServices from '../pages/admin/AdminServices';
import AdminPackages from '../pages/admin/AdminPackages';
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
import EditProfile from '../pages/EditProfile';



export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <RoleRedirect /> },
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: 'edit-profile', element: <EditProfile /> }
                ]
            },
            {
                element: <ProtectedRoute requiredRole={Role.Member} />,
                children: [
                    { path: 'dashboard', element: <UserDashboard /> },
                    { path: 'membership', element: <Membership /> },
                    { path: 'nutrition', element: <Nutrition /> },
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
                    { path: 'measurements', element: <AdminMeasurements /> },
                    { path: 'packages', element: <AdminPackages /> },
                    { path: 'services', element: <AdminServices /> },
                    { path: 'reservations', element: <AdminReservations /> },
                    { path: 'memberships', element: <AdminMemberships /> },
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