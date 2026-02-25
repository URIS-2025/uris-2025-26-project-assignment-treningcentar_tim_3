import { authService } from './authService';

const API_BASE_URL = 'http://localhost:5286/api/session';
const TRAINING_HALL_API = 'http://localhost:5286/api/traininghall';

export interface TrainerDto {
    id: string;
    firstName: string;
    lastName: string;
}

export interface TrainingHallDto {
    trainingHallId: string;
    trainingHallName: string;
    description?: string;
    capacity: number;
}

export interface SessionDto {
    sessionId: string;
    name: string;
    startTime: string; // DateTime
    endTime: string; // DateTime
    status: number; // 0=Upcoming, 1=Finished, 2=Canceled
    trainingType: number; // Enum: Strength=0, Hypertrophy=1, etc.
    trainerId: TrainerDto;
    maxCapacity?: number;
    trainingHallId?: string;
    trainingHallName?: string;
}

export interface SessionCreateDto {
    name: string;
    startTime: string; // DateTime ISO
    endTime: string; // DateTime ISO
    status: number;
    trainingType: number;
    trainerId: string;
    maxCapacity?: number;
    trainingHallId?: string;
    isGroup: boolean;
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
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    async getPersonalSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/personal`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch personal sessions');
        return response.json();
    },

    async getGroupSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${API_BASE_URL}/group`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch group sessions');
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
    },

    async getTrainingHalls(): Promise<TrainingHallDto[]> {
        const response = await fetch(`${TRAINING_HALL_API}`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch training halls');
        return response.json();
    }
};
