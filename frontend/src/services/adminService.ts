import { authService } from './authService';

const AUTH_API = 'https://auth-service.happyisland-1ee81c4a.germanywestcentral.azurecontainerapps.io/api/auth';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UpdateRoleDTO {
  username: string;
  newRole: string;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authService.getToken()}`,
});

export const adminService = {
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await fetch(`${AUTH_API}/users`, {
      headers: getHeaders(),
    });
    if (response.status === 204) return [];
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async createUser(dto: CreateUserDTO): Promise<void> {
    const response = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || 'Failed to create user');
    }
  },

  async updateUser(dto: UpdateUserDTO): Promise<void> {
    const response = await fetch(`${AUTH_API}/users/${dto.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || 'Failed to update user');
    }
  },

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${AUTH_API}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  async updateRole(dto: UpdateRoleDTO): Promise<void> {
    const response = await fetch(`${AUTH_API}/update-role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || 'Failed to update role');
    }
  },
};
