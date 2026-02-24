import { authService } from './authService';

const API_BASE_URL = 'http://localhost:5286/api/reservation';

export interface MemberDto {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
}

export interface ReservationDto {
    reservationId: string;
    member: MemberDto;
    sessionId: string;
    status: number;
}

const getHeaders = () => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const reservationService = {
    async getAllReservations(): Promise<ReservationDto[]> {
        const response = await fetch(`${API_BASE_URL}`, { headers: getHeaders() });
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch reservations');
        }
        return response.json();
    },

    async getSessionReservations(sessionId: string): Promise<ReservationDto[]> {
        // Since there's no direct filtering endpoint by sessionId in the basic controller,
        // we fetch all and filter client side. For production, a backend filter is better.
        const allReservations = await this.getAllReservations();
        return allReservations.filter(res => res.sessionId === sessionId);
    }
};
