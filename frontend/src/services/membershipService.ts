import type { UserMembershipDto, MembershipPackageDto } from '../types/membership';

const API_BASE_URL = 'https://membership-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/Membership';

export const membershipService = {
    async getUserMembership(userId: string, token: string): Promise<UserMembershipDto | null> {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204 || response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch membership');
        }

        return await response.json();
    },

    async getPackages(): Promise<MembershipPackageDto[]> {
        const response = await fetch(`${API_BASE_URL.replace('/Membership', '/Packages')}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch packages');
        }

        return await response.json();
    },

    async createMembership(dto: { userId: string; packageId: string; status: number; startDate: string; endDate: string }, token: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create membership');
        }

        return await response.json();
    }
};
