import { authService } from './authService';

export interface UserSearchResult {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
}

const AUTH_BASE = 'https://auth-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/auth';

export const userSearchService = {
    async search(q: string, role: 'Member' | 'Trainer'): Promise<UserSearchResult[]> {
        const token = authService.getToken();
        const params = new URLSearchParams({ q: q.trim(), role });
        const res = await fetch(`${AUTH_BASE}/users/search?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (res.status === 204) return [];
        if (!res.ok) throw new Error(`User search failed: HTTP ${res.status}`);
        return res.json() as Promise<UserSearchResult[]>;
    },
};
