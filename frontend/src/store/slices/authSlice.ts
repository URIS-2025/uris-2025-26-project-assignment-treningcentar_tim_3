import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo } from '../../types/auth';
import { Role } from '../../types/auth';

import { authService } from '../../services/authService';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('auth_user') ?? 'null'),
  token: localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: string; role: string; token: string }>
    ) => {
      const { user, role, token } = action.payload;
      state.user = {
        fullName: user,
        role: role as Role,
        isAuthenticated: true,
      };
      state.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('auth_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
    },
    // Useful for rehydrating from token on app load if needed
    setUserFromToken: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
    }
  },
});

export const { setCredentials, logout, setUserFromToken } = authSlice.actions;

export default authSlice.reducer;
