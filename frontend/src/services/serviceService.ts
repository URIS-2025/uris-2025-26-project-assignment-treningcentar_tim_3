const API_BASE_URL = 'https://service-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/service';

export interface ServiceDto {
    id: string;
    name: string;
    description: string;
    price: number;
    category: number; // Enum: 1=Membership, 2=PersonalTraining, 3=GroupTraining, 4=Nutrition, 5=Measurement
}

export const serviceService = {
    async getAll(): Promise<ServiceDto[]> {
        const response = await fetch(`${API_BASE_URL}`);
        if (!response.ok) {
            if (response.status === 204) return [];
            throw new Error('Failed to fetch services');
        }
        return response.json();
    }
};
