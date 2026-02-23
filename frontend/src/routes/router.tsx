import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import ProtectedRoute from './ProtectedRoute';
import UserDashboard from '../components/Dashboards/UserDashboard';
import { Role } from '../types/auth';

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
                    }
                ]
            }
        ]
    },
]);
