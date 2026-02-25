export interface ServiceOption {
    id: string;
    name: string;
    description: string;
    price: number;
    category: number;
}

const SERVICE_BASE = 'http://localhost:5079/api/service';

export const servicePickerService = {
    async getAll(): Promise<ServiceOption[]> {
        const res = await fetch(SERVICE_BASE);
        if (res.status === 204) return [];
        if (!res.ok) throw new Error(`Failed to load services: HTTP ${res.status}`);
        return res.json() as Promise<ServiceOption[]>;
    },
};
