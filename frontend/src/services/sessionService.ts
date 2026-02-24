import { authService } from './authService';

const API_BASE_URL = 'http://localhost:5286/api/session';

export interface SessionDto {
    sessionId: string;
    date: string;
    startTime: string; // TimeSpan from backend might come as strongly typed string or object. Often string 'HH:mm:ss'
    endTime: string;
    trainerId: string;
    trainerName?: string;
    capacity: number;
    trainingType: number; // 0 = Personal, 1 = Group etc depends on enum
}

export interface SessionCreateDto {
    date: string; // ISO string 
    startTime: string; // 'HH:mm:ss'
    endTime: string;
    capacity: number;
    trainingType: number;
}

export interface SessionUpdateDto {
    sessionId: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    trainingType: number;
}

const getHeaders = () => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const sessionService = {
    async getAllSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}`, { headers: getHeaders() });
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch sessions');
        }
        return response.json();
    },

    async getPersonalSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/personal`, { headers: getHeaders() });
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch personal sessions');
        }
        return response.json();
    },

    async getGroupSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/group`, { headers: getHeaders() });
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch group sessions');
        }
        return response.json();
    },

    async addSession(dto: SessionCreateDto): Promise<SessionDto> {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to create session');
        return response.json();
    },

    async updateSession(dto: SessionUpdateDto): Promise<SessionDto> {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to update session');
        return response.json();
    },

    async deleteSession(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete session');
    }
};
