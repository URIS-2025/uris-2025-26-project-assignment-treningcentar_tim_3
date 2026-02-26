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

export interface Package {
    packageId: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    services: string[];
}

export interface PackageCreateDTO {
    name: string;
    description: string;
    price: number;
    duration: number;
    services: string[];
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

export const membershipAdminService = {
    // Packages (Membership Plans)
    async getAllPackages(): Promise<Package[]> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch packages');
        return response.json();
    },

    async createPackage(dto: PackageCreateDTO): Promise<Package> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to create package');
        }
        return response.json();
    },

    async updatePackage(id: string, dto: PackageCreateDTO): Promise<Package> {
        const response = await fetch(`${MEMBERSHIP_API}/packages/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to update package');
        }
        return response.json();
    },

    async deletePackage(id: string): Promise<void> {
        const response = await fetch(`${MEMBERSHIP_API}/packages/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to delete package');
        }
    },

    // Membership Types (via packages endpoint)
    async getAllMembershipTypes(): Promise<MembershipType[]> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch membership types');
        const data = await response.json();
        return data.map((pkg: any) => ({
            id: pkg.packageId || pkg.id,
            name: pkg.name,
            durationDays: pkg.duration || pkg.durationDays,
            price: pkg.price,
            description: pkg.description,
        }));
    },

    async createMembershipType(dto: MembershipTypeCreateDTO): Promise<MembershipType> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) throw new Error('Failed to create membership type');
        const pkg = await response.json();
        return {
            id: pkg.packageId || pkg.id,
            name: pkg.name,
            durationDays: pkg.duration || pkg.durationDays,
            price: pkg.price,
            description: pkg.description,
        };
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
