import { authService } from './authService';

// ===== API Base URLs (from docker-compose) =====
const AUTH_API = 'http://localhost:5220/api/auth';
const MEMBERSHIP_API = 'http://localhost:5118/api';
const RESERVATION_API = 'http://localhost:5286/api';
const PAYMENT_API = 'http://localhost:5219/api';

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

export interface PaymentCreateDto {
    userId: string;
    amount: number;
    currency: string;
    membershipTypeId: string;
    paymentMethod: string;
}

export interface PaymentDto {
    id: string;
    userId: string;
    username?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    membershipTypeName?: string;
    paymentMethod?: string;
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
