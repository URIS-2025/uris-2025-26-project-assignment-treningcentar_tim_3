import { authService } from './authService';
import type {
    MeasurementAppointmentDTO,
    MeasurementAppointmentCreateDTO,
    MeasurementResultsDTO,
    GuidelineDTO,
    GuidelineCreateDTO,
} from '../types/measurement';

const APPT_BASE = 'http://localhost:5225/api/measurementAppointment';
const GUIDELINE_BASE = 'http://localhost:5225/api/guidelines';

const getHeaders = (): HeadersInit => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as unknown as T;
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export const measurementService = {
    // ── Appointments ──────────────────────────────────────────────────────
    async getAllAppointments(): Promise<MeasurementAppointmentDTO[]> {
        const res = await fetch(APPT_BASE, { headers: getHeaders() });
        if (res.status === 204) return [];
        return handleResponse<MeasurementAppointmentDTO[]>(res);
    },

    async getAppointmentById(id: string): Promise<MeasurementAppointmentDTO> {
        const res = await fetch(`${APPT_BASE}/${id}`, { headers: getHeaders() });
        return handleResponse<MeasurementAppointmentDTO>(res);
    },

    async createAppointment(dto: MeasurementAppointmentCreateDTO): Promise<MeasurementAppointmentDTO> {
        const res = await fetch(APPT_BASE, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        return handleResponse<MeasurementAppointmentDTO>(res);
    },

    async deleteAppointment(id: string): Promise<void> {
        const res = await fetch(`${APPT_BASE}/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse<void>(res);
    },

    // ── Results ───────────────────────────────────────────────────────────
    async updateResults(id: string, dto: MeasurementResultsDTO): Promise<void> {
        const res = await fetch(`${APPT_BASE}/${id}/results`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        return handleResponse<void>(res);
    },

    // ── Guidelines ────────────────────────────────────────────────────────
    async createGuideline(appointmentId: string, dto: GuidelineCreateDTO): Promise<GuidelineDTO> {
        const res = await fetch(`${APPT_BASE}/${appointmentId}/guidelines`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        return handleResponse<GuidelineDTO>(res);
    },

    async getGuidelineById(id: string): Promise<GuidelineDTO> {
        const res = await fetch(`${GUIDELINE_BASE}/${id}`, { headers: getHeaders() });
        return handleResponse<GuidelineDTO>(res);
    },

    async updateGuideline(id: string, dto: GuidelineCreateDTO): Promise<void> {
        const res = await fetch(`${GUIDELINE_BASE}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        return handleResponse<void>(res);
    },

    async getAllGuidelines(): Promise<GuidelineDTO[]> {
        const res = await fetch(GUIDELINE_BASE, { headers: getHeaders() });
        if (res.status === 204) return [];
        return handleResponse<GuidelineDTO[]>(res);
    },
};
