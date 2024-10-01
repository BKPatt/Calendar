import { AuthResponse, User } from '../types/user';
import { apiRequest, handleApiError } from '../utils/apiHelpers';

export const login = async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login/', 'POST', { username, password });
    console.log(response)
    if (!response.data || !response.data.access_token || !response.data.refresh_token) {
        throw new Error('Invalid response from login');
    }

    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    return response.data;
};

export const register = async (userData: Partial<User>): Promise<AuthResponse> => {
    try {
        const response = await apiRequest<AuthResponse>('/auth/register/', 'POST', userData);

        if (!response.data || !response.data.access_token || !response.data.refresh_token) {
            throw new Error('Invalid response from registration');
        }

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const logout = async (): Promise<void> => {
    try {
        await apiRequest('/auth/logout/', 'POST');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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

export const getCurrentUser = async (): Promise<User> => {
    const response = await apiRequest<User>('/auth/user/', 'GET');
    if (!response.data) {
        throw new Error('Failed to fetch user');
    }
    return response.data;
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('access_token');
};

export const refreshToken = async (refresh_token: string): Promise<{ access: string }> => {
    const response = await apiRequest<{ access: string }>('/auth/token/refresh/', 'POST', { refresh: refresh_token });
    if (!response.data || !response.data.access) {
        throw new Error('Token refresh failed');
    }

    localStorage.setItem('access_token', response.data.access);

    return response.data;
};
