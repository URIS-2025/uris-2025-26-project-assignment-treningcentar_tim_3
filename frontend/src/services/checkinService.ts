const API_BASE_URL = 'https://membership-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/checkins';

export interface CheckinDto {
    userId: string;
    timestamp: string;
    location: string;
    checkinId?: string;
}

export const checkinService = {
    async getCurrentMonthCheckins(userId: string, token: string): Promise<CheckinDto[]> {
        const response = await fetch(`${API_BASE_URL}/${userId}/current-month`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204 || response.status === 404) {
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch check-ins');
        }

        return await response.json();
    }
};
