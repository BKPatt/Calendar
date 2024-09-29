import { User } from '../types/user';
import { apiRequest, handleApiError } from '../utils/apiHelpers';

interface AuthResponse {
    token: string;
    user: User;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await apiRequest<AuthResponse>('/auth/login/', 'POST', { username, password });
        console.log('Full response:', response);

        // Check if the response contains token and user
        if (response.data && response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            return response.data;
        } else {
            throw new Error("Invalid response structure");
        }
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const register = async (userData: Partial<User>): Promise<AuthResponse> => {
    try {
        const response = await apiRequest<AuthResponse>('/auth/register/', 'POST', userData);
        // Store the token in localStorage
        localStorage.setItem('authToken', response.data.token);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const logout = async (): Promise<void> => {
    try {
        await apiRequest('/auth/logout/', 'POST');
        // Remove the token from localStorage
        localStorage.removeItem('authToken');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
        await apiRequest('/auth/change-password/', 'POST', { old_password: oldPassword, new_password: newPassword });
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    try {
        await apiRequest('/auth/reset-password/', 'POST', { email });
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const verifyToken = async (token: string): Promise<boolean> => {
    try {
        await apiRequest('/auth/verify-token/', 'POST', { token });
        return true;
    } catch (error) {
        return false;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await apiRequest<User>('/auth/user/');
        return response.data;
    } catch (error) {
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('authToken');
};