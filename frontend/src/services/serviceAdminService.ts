import { authService } from './authService';

const API_BASE_URL = 'https://service-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/service';

export interface ServiceDto {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: number;
}

export interface ServiceCreateDto {
    name: string;
    description?: string;
    price: number;
    category: number;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authService.getToken()}`
});

export const serviceAdminService = {
    async getAll(): Promise<ServiceDto[]> {
        const response = await fetch(`${API_BASE_URL}`, { headers: getHeaders() });
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch services');
        }
        return response.json();
    },

    async create(dto: ServiceCreateDto): Promise<ServiceDto> {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to create service');
        }
        return response.json();
    },

    async update(id: string, dto: ServiceCreateDto): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to update service');
        }
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to delete service');
        }
    }
};
