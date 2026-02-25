import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * Smart index redirect — sends each role to their correct home page.
 * Prevents the redirect loop where non-Member roles bounce between
 * "/" → "/dashboard" → ProtectedRoute(Member) → "/" → ...
 */
const RoleRedirect: React.FC = () => {
    const user = authService.getUserFromToken();

    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case 'Admin':
            return <Navigate to="/admin" replace />;
        case 'Trainer':
            return <Navigate to="/trainer-dashboard" replace />;
        case 'Nutritionist':
            return <Navigate to="/nutritionist" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
};

export default RoleRedirect;
