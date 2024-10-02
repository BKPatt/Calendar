import { useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth';
import { RegistrationData, User } from '../types/user';

interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: RegistrationData) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                const accessToken = await refreshAccessToken(refreshToken);
                if (accessToken) {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    await logout();
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                await logout();
            }
        } else {
            await logout();
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const refreshAccessToken = async (refresh_token: string): Promise<string | null> => {
        try {
            const response = await authService.refreshToken(refresh_token);
            if (response.access) {
                localStorage.setItem('access_token', response.access);
                return response.access;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            await logout();
            return null;
        }
    };

    // Add a useEffect to trigger refresh if user is null but token exists
    useEffect(() => {
        if (!user && localStorage.getItem('refresh_token')) {
            checkAuthStatus();
        }
    }, [user, checkAuthStatus]);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const { user, access_token, refresh_token } = await authService.login(username, password);
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: RegistrationData) => {
        setIsLoading(true);
        try {
            const { user, access_token, refresh_token } = await authService.register(userData);
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return { user, isAuthenticated, isLoading, login, logout, register };
}
