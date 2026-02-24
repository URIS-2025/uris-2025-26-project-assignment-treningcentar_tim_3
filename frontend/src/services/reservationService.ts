import type { SessionDto } from '../types/reservation';

const API_BASE_URL = 'http://localhost:5286/api/Reservation';

export const reservationService = {
    async getUserReservations(userId: string, token: string): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch reservations');
        }

        return await response.json();
    },

    async getSessionsByRange(from: Date, to: Date, token: string, isGroup?: boolean): Promise<SessionDto[]> {
        const params = new URLSearchParams({
            from: from.toISOString(),
            to: to.toISOString()
        });
        if (isGroup !== undefined) {
            params.append('isGroup', isGroup.toString());
        }

        const response = await fetch(`http://localhost:5286/api/Session/range?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch sessions');
        }

        return await response.json();
    },

    async getUpcomingSessions(userId: string, token: string): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/upcoming`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch upcoming sessions');
        return await response.json();
    },

    async getSessionHistory(userId: string, token: string): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch session history');
        return await response.json();
    }
};
