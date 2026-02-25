import type { SessionDto } from '../types/reservation';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:5286/api';

// ===== Trainer/Admin DTO =====
export interface MemberDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface ReservationDto {
  reservationId: string;
  member: MemberDto;
  sessionId: string;
  status: number;
}

const getHeaders = (token?: string) => {
  const authToken = token || authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
};

export const reservationService = {
  // ===== MEMBER =====
  async getUserReservations(userId: string, token: string): Promise<SessionDto[]> {
    const response = await fetch(`${API_BASE_URL}/Reservation/user/${userId}`, {
      headers: getHeaders(token)
    });

    if (response.status === 204) return [];
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch reservations');
    }

    return response.json();
  },

  async getUpcomingSessions(userId: string, token: string): Promise<SessionDto[]> {
    const response = await fetch(`${API_BASE_URL}/Reservation/user/${userId}/upcoming`, {
      headers: getHeaders(token)
    });

    if (response.status === 204) return [];
    if (!response.ok) throw new Error('Failed to fetch upcoming sessions');
    return response.json();
  },

  async getSessionHistory(userId: string, token: string): Promise<SessionDto[]> {
    const response = await fetch(`${API_BASE_URL}/Reservation/user/${userId}/history`, {
      headers: getHeaders(token)
    });

    if (response.status === 204) return [];
    if (!response.ok) throw new Error('Failed to fetch session history');
    return response.json();
  },

  async getSessionsByRange(
    from: Date,
    to: Date,
    token: string,
    isGroup?: boolean
  ): Promise<SessionDto[]> {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString()
    });

    if (isGroup !== undefined) {
      params.append('isGroup', isGroup.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/Session/range?${params.toString()}`,
      { headers: getHeaders(token) }
    );

    if (response.status === 204) return [];
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch sessions');
    }

    return response.json();
  },

  // ===== TRAINER / ADMIN =====
  async getAllReservations(): Promise<ReservationDto[]> {
    const response = await fetch(`${API_BASE_URL}/Reservation`, {
      headers: getHeaders()
    });

    if (response.status === 204) return [];
    if (!response.ok) throw new Error('Failed to fetch reservations');

    return response.json();
  },

  async getSessionReservations(sessionId: string): Promise<ReservationDto[]> {
    const allReservations = await this.getAllReservations();
    return allReservations.filter(res => res.sessionId === sessionId);
  }
};