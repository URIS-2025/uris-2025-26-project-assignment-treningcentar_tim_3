import type { DecodedToken, LoginDTO, loginResponse, RegisterDTO, Role, UserInfo } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'https://auth-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/auth';

export const authService = {
    async login(dto: LoginDTO) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Login failed');
        }

        const data = await response.json();

        // Map capitalized keys from backend to lowercase interface keys
        const formattedData: loginResponse = {
            user: data.User || data.user,
            role: data.Role || data.role,
            token: data.Token || data.token
        };

        if (formattedData.token) {
            localStorage.setItem('token', formattedData.token);
            try {
                const decoded = jwtDecode<DecodedToken>(formattedData.token);
                formattedData.id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.nameid || decoded.sub;
            } catch (err) {
                console.error("Error decoding token for ID:", err);
            }
        }
        return formattedData;
    },

    async register(dto: RegisterDTO) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Registration failed');
        }

        return response.text();
    },

    logout() {
        localStorage.removeItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    getUserFromToken(): UserInfo | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            const id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub || decoded.nameid || '';
            const firstName = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] || decoded.firstName || '';
            const lastName = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] || decoded.lastName || '';
            const fullName = firstName && lastName ? `${firstName} ${lastName}` : (decoded.unique_name || 'User');

            const rawRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;
            const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as Role;

            return {
                id,
                fullName,
                role,
                isAuthenticated: true
            };
        } catch {
            return null;
        }
    },

    getCurrentUser(): DecodedToken | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            return jwtDecode<DecodedToken>(token);
        } catch {
            return null;
        }
    },

    hasRole(requiredRole: Role): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;

        const userRole = user["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || user.role;

        if (Array.isArray(userRole)) {
            return userRole.includes(requiredRole);
        }
        return userRole === requiredRole;
    },

    async getUserProfile(userId: string) {
        const token = this.getToken();
        const response = await fetch(`${API_BASE_URL}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');
        return response.json();
    },

    async updateProfile(dto: { firstName: string, lastName: string, email: string }) {
        const token = this.getToken();
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update profile');
        }

        return response.json();
    }
};
