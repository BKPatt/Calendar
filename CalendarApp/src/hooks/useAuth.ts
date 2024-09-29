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
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const isValid = await authService.verifyToken(token);
                if (isValid) {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('authToken');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login(username, password);
            setUser(response.user);
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
            await authService.logout();
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
            const response = await authService.register(userData);
            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return { user, isAuthenticated, isLoading, login, logout, register };
}