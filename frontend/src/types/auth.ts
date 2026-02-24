export interface RegisterDTO {
  username: string;
  email: string;
  passwordHash?: string;
  password?: string;
  firstName: string;
  lastName: string;
}

export const Role = {
  Admin: 'Admin',
  Member: 'Member',
  Trainer: 'Trainer',
  Nutritionist: 'Nutritionist',
  Receptionist: 'Receptionist'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface LoginDTO {
  username: string;
  password?: string;
}

export interface loginResponse {
  user: string; // "FirstName LastName"
  role: string;
  token: string;
  id?: string;
}

export interface UserInfo {
  id: string;
  fullName: string;
  role: Role;
  isAuthenticated: boolean;
}

export interface DecodedToken {
  unique_name: string;
  nameid?: string;
  sub?: string;
  role: Role | Role[];
  exp: number;
  [key: string]: any;
}
