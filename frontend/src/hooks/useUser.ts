import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Role } from '../types/auth';

interface UserInfo {
    username: string;
    firstName: string;
    lastName: string;
    roles: Role[];
    isAuthenticated: boolean;
}

export const useUser = () => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = () => {
        const tokenData = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();

        if (tokenData && isAuthenticated) {
            // Mapping standard JWT claims to readable property names
            // .NET often uses these long schema URLs for claims
            const firstName = tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] || tokenData.firstName || '';
            const lastName = tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] || tokenData.lastName || '';
            const username = tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || tokenData.unique_name || '';
            
            const rawRoles = tokenData["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || tokenData.role || [];
            const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

            setUser({
                username,
                firstName,
                lastName,
                roles: roles as Role[],
                isAuthenticated: true
            });
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshUser();
        
        // Optional: Listen for storage events to sync login/logout across tabs
        window.addEventListener('storage', refreshUser);
        return () => window.removeEventListener('storage', refreshUser);
    }, []);

    return { user, loading, refreshUser };
};
