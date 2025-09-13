import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient, ApiError } from '../services/api';
import { LoginRequest, RegisterRequest } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userId?: string;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; userId: string }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userId: action.userId,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        error: action.error,
        userId: undefined,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        const response = await apiClient.getCurrentUser();
        dispatch({ type: 'AUTH_SUCCESS', userId: response.user });
      } catch (error) {
        // Try to refresh token
        const refreshed = await apiClient.refreshToken();
        if (refreshed) {
          try {
            const response = await apiClient.getCurrentUser();
            dispatch({ type: 'AUTH_SUCCESS', userId: response.user });
          } catch {
            // Don't show error on initial load - just set as not authenticated
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // Don't show error on initial load - just set as not authenticated
          dispatch({ type: 'LOGOUT' });
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      await apiClient.login(credentials);

      // Get user info after successful login
      const response = await apiClient.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', userId: response.user });
      return true;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', error: message });
      return false;
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      await apiClient.register(userData);

      // Auto-login after registration
      await apiClient.login({
        email: userData.email,
        password: userData.password,
      });

      const response = await apiClient.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', userId: response.user });
      return true;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', error: message });
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextValue = {
    state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}