import { authService } from './authService';

const API_BASE_URL = 'http://localhost:5225/api/measurementAppointment';

export interface MeasurementAppointmentDto {
    appointmentId: string;
    memberId: string;
    employeeId: string;
    nutritionistId: string;
    date: string;
    serviceId: string;
    measurements?: {
        weightKg?: number;
        heightCm?: number;
        bodyFatPercent?: number;
    };
    guideline?: {
        guidelineId: string;
        category: string;
        title: string;
        pdfFileUrl: string;
        lastUpdated: string;
    };
}

const getHeaders = () => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const measurementService = {
    async getAllAppointments(): Promise<MeasurementAppointmentDto[]> {
        const response = await fetch(`${API_BASE_URL}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch measurements');
        return response.json();
    },

    async getAppointmentById(id: string): Promise<MeasurementAppointmentDto> {
        const response = await fetch(`${API_BASE_URL}/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch measurement');
        return response.json();
    }
};
