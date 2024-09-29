// AuthProvider.tsx
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
    };

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const { user, token } = await authService.login(username, password);
            setUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('authToken', token);
        } catch (error) {
            console.error('Login error:', error);
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
            const { user, token } = await authService.register(userData);
            setUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('authToken', token); // Save token to localStorage
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
