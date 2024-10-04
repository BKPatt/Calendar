import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authService from '../services/auth';
import { User, RegistrationData } from '../types/user';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: RegistrationData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('refresh_token');
        if (token) {
            try {
                const accessToken = await refreshAccessToken(token);
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
    };

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

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const { user, access_token, refresh_token } = await authService.login(username, password);
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
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

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
