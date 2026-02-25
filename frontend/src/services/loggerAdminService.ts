import { authService } from './authService';

const LOGGER_API = 'http://localhost:5194/api/logger';

export interface SystemLog {
    id: string;
    level: string;
    serviceName: string;
    action: string;
    message: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    timestamp: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const loggerAdminService = {
    async getLogs(): Promise<SystemLog[]> {
        const response = await fetch(`${LOGGER_API}`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch logs');
        return response.json();
    },
};
