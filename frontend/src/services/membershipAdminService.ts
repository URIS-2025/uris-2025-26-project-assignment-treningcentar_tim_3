import { authService } from './authService';

const MEMBERSHIP_API = 'http://localhost:5118/api';

export interface MembershipType {
    id: string;
    name: string;
    durationDays: number;
    price: number;
    description?: string;
    services?: string[];
}

export interface MembershipTypeCreateDTO {
    name: string;
    durationDays: number;
    price: number;
    description?: string;
    services?: string[];
}

// Backend DTO types for mapping
interface BackendPackageDto {
    packageId: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    services: string[];
}

const mapBackendToFrontend = (pkg: BackendPackageDto): MembershipType => ({
    id: pkg.packageId,
    name: pkg.name,
    durationDays: pkg.duration,
    price: pkg.price,
    description: pkg.description,
    services: pkg.services,
});

const mapFrontendToBackend = (dto: MembershipTypeCreateDTO) => ({
    name: dto.name,
    description: dto.description || '',
    price: dto.price,
    duration: dto.durationDays,
    services: dto.services || [],
});

export interface ActiveMembership {
    id: string;
    userId: string;
    username?: string;
    membershipTypeId: string;
    membershipTypeName?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    displayStatus: 'Scheduled' | 'Active' | 'Expired' | 'Cancelled';
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
    // Membership Types (Packages)
    async getAllMembershipTypes(): Promise<MembershipType[]> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch membership types');
        const data: BackendPackageDto[] = await response.json();
        return data.map(mapBackendToFrontend);
    },

    async createMembershipType(dto: MembershipTypeCreateDTO): Promise<MembershipType> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(mapFrontendToBackend(dto)),
        });
        if (!response.ok) throw new Error('Failed to create membership type');
        const data: BackendPackageDto = await response.json();
        return mapBackendToFrontend(data);
    },

    async updateMembershipType(id: string, dto: MembershipTypeCreateDTO): Promise<MembershipType> {
        const response = await fetch(`${MEMBERSHIP_API}/packages/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(mapFrontendToBackend(dto)),
        });
        if (!response.ok) throw new Error('Failed to update membership type');
        const data: BackendPackageDto = await response.json();
        return mapBackendToFrontend(data);
    },

    async deleteMembershipType(id: string): Promise<void> {
        const response = await fetch(`${MEMBERSHIP_API}/packages/${id}`, {
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
        const data = await response.json();
        const now = new Date();
        // Map backend fields to frontend interface
        return data.map((m: any) => {
            const startDate = new Date(m.startDate);
            const endDate = new Date(m.endDate);
            const statusActive = m.status === 1 || m.status === 'Active';
            
            // Determine display status
            let displayStatus: 'Scheduled' | 'Active' | 'Expired' | 'Cancelled' = 'Cancelled';
            if (statusActive) {
                if (now < startDate) {
                    displayStatus = 'Scheduled';
                } else if (now > endDate) {
                    displayStatus = 'Expired';
                } else {
                    displayStatus = 'Active';
                }
            }
            
            return {
                id: m.membershipId,
                userId: m.userId,
                membershipTypeId: m.packageId,
                startDate: m.startDate,
                endDate: m.endDate,
                isActive: displayStatus === 'Active',
                displayStatus,
            };
        });
    },

    async assignMembership(dto: AssignMembershipDTO): Promise<ActiveMembership> {
        // Map frontend DTO to backend expected format
        const backendDto = {
            userId: dto.userId,
            packageId: dto.membershipTypeId,
            startDate: dto.startDate,
        };
        const response = await fetch(`${MEMBERSHIP_API}/Membership/admin/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendDto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to assign membership');
        }
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
