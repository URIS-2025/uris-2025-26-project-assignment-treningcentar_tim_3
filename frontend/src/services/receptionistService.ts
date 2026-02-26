import { authService } from './authService';

// ===== API Base URLs (from docker-compose) =====
const AUTH_API = 'https://auth-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/auth';
const MEMBERSHIP_API = 'https://membership-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api';
const RESERVATION_API = 'https://reservation-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api';
const PAYMENT_API = 'https://payment-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api';
const SERVICE_API = 'https://service-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api';

// ===== Shared helpers =====
const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
});

// ===== DTOs =====
export interface MemberSummary {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface CheckinDto {
    checkinId?: string;
    userId: string;
    timestamp: string;
    location: string;
}

export interface MembershipInfo {
    id: string;
    userId: string;
    username?: string;
    membershipTypeId: string;
    membershipTypeName?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface MembershipType {
    id: string;
    name: string;
    durationDays: number;
    price: number;
    description?: string;
}

export interface TrainerSummary {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
}

export interface SessionDto {
    sessionId: string;
    name: string;
    startTime: string;
    endTime: string;
    status: number;
    trainingType: number;
    trainerId: {
        trainerId: string;
        fullName: string;
    };
    maxCapacity?: number;
    hallId?: number;
}

export interface SessionCreateDto {
    name: string;
    startTime: string;
    endTime: string;
    status: number;
    trainingType: number;
    trainerId: string;
    maxCapacity?: number;
    hallId?: number;
    isGroup: boolean;
}

export interface ReservationCreateDto {
    userId: string;
    sessionId: string;
}

export interface ServiceDto {
    id: string;
    name: string;
    description: string;
    price: number;
    category: number;
}

export interface PaymentCreateDto {
    amount: number;
    paymentDate: string;
    method: number; // 0=Card, 1=BankTransfer, 2=Cash
    serviceId: string;
}

export interface PaymentDto {
    id: string;
    amount: number;
    paymentDate: string;
    method: number;
    status: number; // 0=Pending, 1=Completed, 2=Failed, 3=Refunded
    serviceId: string;
}

// ===== Receptionist Service =====
export const receptionistService = {

    // ───── Members ─────
    async getAllMembers(): Promise<MemberSummary[]> {
        const response = await fetch(`${AUTH_API}/users`, { headers: getHeaders() });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch members');
        const users: MemberSummary[] = await response.json();
        return users;
    },

    async searchMembers(query: string): Promise<MemberSummary[]> {
        const all = await this.getAllMembers();
        const q = query.toLowerCase();
        return all.filter(
            (m) =>
                m.firstName?.toLowerCase().includes(q) ||
                m.lastName?.toLowerCase().includes(q) ||
                m.username?.toLowerCase().includes(q) ||
                m.id?.toLowerCase().includes(q)
        );
    },

    // ───── Check-In ─────
    async recordCheckin(dto: CheckinDto): Promise<CheckinDto> {
        const response = await fetch(`${MEMBERSHIP_API}/checkins`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to record check-in');
        }
        return response.json();
    },

    async getMemberCheckins(userId: string): Promise<CheckinDto[]> {
        const response = await fetch(`${MEMBERSHIP_API}/checkins/${userId}/current-month`, {
            headers: getHeaders(),
        });
        if (response.status === 204 || response.status === 404) return [];
        if (!response.ok) throw new Error('Failed to fetch check-in history');
        return response.json();
    },

    // ───── Membership Verification ─────
    async getMemberMembership(userId: string): Promise<MembershipInfo | null> {
        const response = await fetch(`${MEMBERSHIP_API}/Membership/user/${userId}/status`, {
            headers: getHeaders(),
        });
        if (response.status === 204 || response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch membership');
        const data = await response.json();

        let memData = data;
        // Handle both array and single object responses
        if (Array.isArray(data)) {
            memData = data.length > 0 ? data[0] : null;
        }

        if (!memData) return null;

        return {
            id: memData.membershipId || memData.id,
            userId: memData.userId,
            username: memData.username,
            membershipTypeId: memData.packageId || memData.membershipTypeId,
            membershipTypeName: memData.packageName || memData.membershipTypeName,
            startDate: memData.startDate,
            endDate: memData.endDate,
            isActive: memData.status === 'Active' || memData.isActive === true || memData.status === 1
        };
    },

    async getAllMembershipTypes(): Promise<MembershipType[]> {
        const response = await fetch(`${MEMBERSHIP_API}/packages`, {
            headers: getHeaders(),
        });
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

    // ───── Trainers ─────
    async getAllTrainers(): Promise<TrainerSummary[]> {
        const all = await this.getAllMembers();
        return all
            .filter((u) => u.role === 'Trainer')
            .map((t) => ({
                id: t.id,
                username: t.username,
                firstName: t.firstName,
                lastName: t.lastName,
            }));
    },

    // ───── Sessions / Scheduling ─────
    async getAllSessions(): Promise<SessionDto[]> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            headers: getHeaders(),
        });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    async createSession(dto: SessionCreateDto): Promise<SessionDto> {
        const response = await fetch(`${RESERVATION_API}/Session`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create training session');
        }
        return response.json();
    },

    async createReservation(dto: ReservationCreateDto): Promise<void> {
        const response = await fetch(`${RESERVATION_API}/Reservation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create reservation');
        }
    },

    // ───── Services ─────
    async getAllServices(): Promise<ServiceDto[]> {
        const response = await fetch(`${SERVICE_API}/Service`, {
            headers: getHeaders(),
        });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        // Handle both { value: [...] } and [...] response formats
        return Array.isArray(data) ? data : (data.value || []);
    },

    // ───── Payments ─────
    async recordPayment(dto: PaymentCreateDto): Promise<PaymentDto> {
        const response = await fetch(`${PAYMENT_API}/Payment`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to record payment');
        }
        return response.json();
    },

    async getAllPayments(): Promise<PaymentDto[]> {
        const response = await fetch(`${PAYMENT_API}/Payment`, {
            headers: getHeaders(),
        });
        if (response.status === 204) return [];
        if (!response.ok) throw new Error('Failed to fetch payments');
        return response.json();
    },

    // ───── Assign Membership (after payment) ─────
    async assignMembership(dto: { userId: string; membershipTypeId: string; startDate: string }): Promise<MembershipInfo> {
        const response = await fetch(`${MEMBERSHIP_API}/Membership`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to assign membership');
        }
        return response.json();
    },
};
