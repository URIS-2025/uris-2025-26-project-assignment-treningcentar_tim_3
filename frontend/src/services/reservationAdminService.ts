import { authService } from './authService';

const RESERVATION_API = 'http://localhost:5286/api';

export interface SessionDto {
    sessionId: string;
    name: string;
    description: string;
    sessionType: string;
    trainerId: string;
    trainerName?: string;
    dateTime: string;
    capacity: number;
    reservationCount?: number;
    trainingHallId?: string;
}

export interface SessionCreateDTO {
    name: string;
    description: string;
    sessionType: string;
    trainerId: string;
    dateTime: string;
    capacity: number;
    trainingHallId?: string;
}

export interface SessionUpdateDTO {
    sessionId: string;
    name: string;
    description: string;
    sessionType: string;
    trainerId: string;
    dateTime: string;
    capacity: number;
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
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    async createSession(dto: SessionCreateDTO): Promise<SessionDto> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to create session');
        return response.json();
    },

    async updateSession(dto: SessionUpdateDTO): Promise<SessionDto> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to update session');
        return response.json();
    },

    async deleteSession(id: string): Promise<void> {
        const response = await fetch(`${RESERVATION_API}/Session/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete session');
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
