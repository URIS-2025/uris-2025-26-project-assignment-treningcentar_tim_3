import { authService } from './authService';

const RESERVATION_API = 'http://localhost:5286/api';

export interface TrainerDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
}

export interface SessionDto {
    sessionId: string;
    name: string;
    startTime: string;
    endTime: string;
    status: string;
    trainingType: string;
    trainerId: TrainerDto;
    maxCapacity?: number;
    trainingHallId?: string;
    trainingHallName?: string;
}

export interface SessionCreateDTO {
    name: string;
    startTime: string;
    endTime: string;
    status: string;
    trainingType: string;
    trainerId: string;
    maxCapacity?: number;
    trainingHallId?: string;
    isGroup: boolean;
}

export interface SessionUpdateDTO {
    sessionId: string;
    name: string;
    startTime: string;
    endTime: string;
    status: string;
    trainingType: string;
    trainerId: string;
    maxCapacity?: number;
    trainingHallId?: string;
}

export interface ReservationDto {
    reservationId: string;
    userId: string;
    username?: string;
    sessionId: string;
    sessionName?: string;
    reservationDate: string;
    status: string;
}

export interface ReservationCreateDto {
    userId: string;
    sessionId: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const reservationAdminService = {
    // Sessions
    async getAllSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${RESERVATION_API}/Session`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch sessions: ${errorText}`);
        }
        return response.json();
    },

    async createSession(dto: SessionCreateDTO): Promise<SessionDto> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                console.error('Backend error:', errorJson);
                throw new Error(errorJson.error || 'Failed to create session');
            } catch {
                throw new Error(errorText || 'Failed to create session');
            }
        }
        return response.json();
    },

    async updateSession(dto: SessionUpdateDTO): Promise<SessionDto> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update session`);
        }
        return response.json();
    },

    async deleteSession(id: string): Promise<void> {
        const response = await fetch(`${RESERVATION_API}/Session/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete session: ${errorText}`);
        }
    },

    // Reservations
    async getAllReservations(): Promise<ReservationDto[]> {
        const response = await fetch(`${RESERVATION_API}/Reservation`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch reservations');
        return response.json();
    },

    async cancelReservation(id: string): Promise<void> {
        const response = await fetch(`${RESERVATION_API}/Reservation/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to cancel reservation');
    },
};
