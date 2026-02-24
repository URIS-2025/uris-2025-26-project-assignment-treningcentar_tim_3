import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import ProtectedRoute from './ProtectedRoute';
import { Role } from '../types/auth';
import UserDashboard from '../pages/UserDashboard';
import Membership from '../pages/Membership';
import Services from '../pages/Services';
import Sessions from '../pages/Sessions';
import TrainerDashboard from '../pages/TrainerDashboard';
import TrainerSessions from '../pages/TrainerSessions';
import TrainerClientMeasurements from '../pages/TrainerClientMeasurements';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'register',
                element: <Register />,
            },
            {
                element: <ProtectedRoute requiredRole={Role.Member} />,
                children: [
                    {
                        path: 'dashboard',
                        element: <UserDashboard />,
                    },
                    {
                        path: 'membership',
                        element: <Membership />,
                    },
                    {
                        path: 'services',
                        element: <Services />,
                    },
                    {
                        path: 'sessions',
                        element: <Sessions />,
                    }
                ]
            },
            {
                element: <ProtectedRoute requiredRole={Role.Trainer} />,
                children: [
                    {
                        path: 'trainer-dashboard',
                        element: <TrainerDashboard />,
                    },
                    {
                        path: 'trainer-sessions',
                        element: <TrainerSessions />,
                    },
                    {
                        path: 'trainer-measurements',
                        element: <TrainerClientMeasurements />,
                    }
                ]
            }
        ]
    },
]);
