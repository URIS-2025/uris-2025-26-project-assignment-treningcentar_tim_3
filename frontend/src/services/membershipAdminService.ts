import { authService } from './authService';

const MEMBERSHIP_API = 'http://localhost:5118/api';

export interface MembershipType {
    id: string;
    name: string;
    durationDays: number;
    price: number;
    description?: string;
}

export interface MembershipTypeCreateDTO {
    name: string;
    durationDays: number;
    price: number;
    description?: string;
}

export interface ActiveMembership {
    id: string;
    userId: string;
    username?: string;
    membershipTypeId: string;
    membershipTypeName?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface AssignMembershipDTO {
    userId: string;
    membershipTypeId: string;
    startDate: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const membershipAdminService = {
    // Membership Types
    async getAllMembershipTypes(): Promise<MembershipType[]> {
        const response = await fetch(`${MEMBERSHIP_API}/MembershipType`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch membership types');
        return response.json();
    },

    async createMembershipType(dto: MembershipTypeCreateDTO): Promise<MembershipType> {
        const response = await fetch(`${MEMBERSHIP_API}/MembershipType`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to create membership type');
        return response.json();
    },

    async updateMembershipType(id: string, dto: MembershipTypeCreateDTO): Promise<MembershipType> {
        const response = await fetch(`${MEMBERSHIP_API}/MembershipType/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to update membership type');
        return response.json();
    },

    async deleteMembershipType(id: string): Promise<void> {
        const response = await fetch(`${MEMBERSHIP_API}/MembershipType/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete membership type');
    },

    // Active Memberships
    async getAllMemberships(): Promise<ActiveMembership[]> {
        const response = await fetch(`${MEMBERSHIP_API}/Membership`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch memberships');
        return response.json();
    },

    async assignMembership(dto: AssignMembershipDTO): Promise<ActiveMembership> {
        const response = await fetch(`${MEMBERSHIP_API}/Membership`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to assign membership');
        return response.json();
    },

    async deactivateMembership(id: string): Promise<void> {
        const response = await fetch(`${MEMBERSHIP_API}/Membership/${id}/deactivate`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to deactivate membership');
    },
};
