import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo } from '../../types/auth';
import { Role } from '../../types/auth';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
}

import { authService } from '../../services/authService';

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token');
  const cachedUserStr = localStorage.getItem('auth_user');
  let user: UserInfo | null = cachedUserStr ? JSON.parse(cachedUserStr) : null;

  // If the cached user is missing the ID but we have a token, reconstruct it!
  if (token && (!user || !user.id)) {
    const tokenUser = authService.getUserFromToken();
    if (tokenUser && tokenUser.id) {
      user = tokenUser;
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  return { user, token };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: string; role: string; token: string; id?: string }>
    ) => {
      const { user, role, token, id } = action.payload;

      let resolvedId = id;

      // Ako backend nije poslao id, pokušaj da ga izvučeš iz JWT tokena
      if (!resolvedId) {
        const decodedUser = JSON.parse(atob(token.split('.')[1]));
        resolvedId =
          decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
          decodedUser.sub ||
          decodedUser.nameid ||
          '';
      }

      state.user = {
        id: resolvedId || '',
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
