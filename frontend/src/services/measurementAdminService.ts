import { authService } from './authService';

const MEASUREMENT_API = 'https://measurment-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api';

export interface MeasurementAppointmentDto {
    appointmentId: string;
    memberId: string;
    employeeId: string;
    nutritionistId: string;
    date: string;
    weightKg?: number;
    heightCm?: number;
    bodyFatPercent?: number;
    notes?: string;
    serviceId?: string;
    guidelineId?: string;
    // UI enrichment
    memberName?: string;
    employeeName?: string;
    nutritionistName?: string;
}

export interface MeasurementAppointmentCreateDto {
    memberId: string;
    employeeId: string;
    nutritionistId?: string;
    date: string;
    notes?: string;
    serviceId?: string;
}

export interface MeasurementResultsDto {
    weightKg?: number;
    heightCm?: number;
    bodyFatPercent?: number;
}

export interface GuidelineDto {
    guidelineId: string;
    appointmentId: string;
    createdByNutritionistId: string;
    title: string;
    content: string;
    category: string;
    lastUpdated: string;
    // UI enrichment
    nutritionistName?: string;
}

export interface GuidelineCreateDto {
    title: string;
    content: string;
    category: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const measurementAdminService = {
    // === Appointments ===
    async getAllAppointments(): Promise<MeasurementAppointmentDto[]> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch appointments: ${errorText}`);
        }
        return response.json();
    },

    async getAppointmentById(id: string): Promise<MeasurementAppointmentDto> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch appointment');
        return response.json();
    },

    async createAppointment(dto: MeasurementAppointmentCreateDto): Promise<MeasurementAppointmentDto> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create appointment: ${errorText}`);
        }
        return response.json();
    },

    async updateAppointment(id: string, dto: MeasurementAppointmentCreateDto): Promise<void> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update appointment: ${errorText}`);
        }
    },

    async updateResults(id: string, dto: MeasurementResultsDto): Promise<void> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment/${id}/results`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update results: ${errorText}`);
        }
    },

    async deleteAppointment(id: string): Promise<void> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete appointment: ${errorText}`);
        }
    },

    // === Guidelines ===
    async getAllGuidelines(): Promise<GuidelineDto[]> {
        const response = await fetch(`${MEASUREMENT_API}/guidelines`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch guidelines');
        return response.json();
    },

    async getGuidelineById(id: string): Promise<GuidelineDto> {
        const response = await fetch(`${MEASUREMENT_API}/guidelines/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch guideline');
        return response.json();
    },

    async createGuidelineForAppointment(appointmentId: string, dto: GuidelineCreateDto): Promise<GuidelineDto> {
        const response = await fetch(`${MEASUREMENT_API}/measurementAppointment/${appointmentId}/guidelines`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create guideline: ${errorText}`);
        }
        return response.json();
    },

    async updateGuideline(id: string, dto: GuidelineCreateDto): Promise<void> {
        const response = await fetch(`${MEASUREMENT_API}/guidelines/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update guideline: ${errorText}`);
        }
    },

    async deleteGuideline(id: string): Promise<void> {
        const response = await fetch(`${MEASUREMENT_API}/guidelines/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete guideline');
    },
};
