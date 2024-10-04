import { ApiResponse } from '../../types/event';
import { User, AuthResponse, RegistrationData } from '../../types/user';
import { apiRequest, handleApiError } from '../../utils/apiHelpers';

/**
 * authApi.ts
 * 
 * This file contains all the API calls related to authentication in the calendar application.
 * It provides functions for user registration, login, logout, token refresh, and password management.
 */

export const authApi = {
    /**
     * Register a new user
     * @param userData - RegistrationData object containing the new user's information
     * @returns Promise with the AuthResponse object
     */
    register: async (userData: RegistrationData): Promise<ApiResponse<AuthResponse>> => {
        try {
            const response = await apiRequest<AuthResponse>('/auth/register/', 'POST', userData);
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            return {
                data: response.data,
                message: 'User registered successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Log in a user
     * @param credentials - Object containing username and password
     * @returns Promise with the AuthResponse object
     */
    login: async (credentials: { username: string; password: string }): Promise<ApiResponse<AuthResponse>> => {
        try {
            const response = await apiRequest<AuthResponse>('/auth/login/', 'POST', credentials);
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            return {
                data: response.data,
                message: 'User logged in successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Log out the current user
     * @returns Promise that resolves when the user is logged out successfully
     */
    logout: async (): Promise<void> => {
        try {
            await apiRequest('/auth/logout/', 'POST');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Refresh the authentication token
     * @returns Promise with the new access token
     */
    refreshToken: async (refreshToken: string): Promise<ApiResponse<{ access: string }>> => {
        try {
            const response = await apiRequest<{ access: string }>('/auth/token/refresh/', 'POST', { refresh: refreshToken });
            return response;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch the current user's information
     * @returns Promise with the User object
     */
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            const response = await apiRequest<User>('/auth/user/', 'GET');
            return {
                data: response.data,
                message: 'Current user fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Change user's password
     * @param oldPassword - User's current password
     * @param newPassword - User's new password
     * @returns Promise that resolves when the password is changed successfully
     */
    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        try {
            await apiRequest('/auth/change-password/', 'POST', { old_password: oldPassword, new_password: newPassword });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Request a password reset
     * @param email - User's email address
     * @returns Promise that resolves when the password reset email is sent
     */
    requestPasswordReset: async (email: string): Promise<void> => {
        try {
            await apiRequest('/auth/password-reset-request/', 'POST', { email });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Reset password using a reset token
     * @param token - Password reset token
     * @param newPassword - New password
     * @returns Promise that resolves when the password is reset successfully
     */
    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        try {
            await apiRequest('/auth/password-reset/', 'POST', { token, new_password: newPassword });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Verify user's email address
     * @param token - Email verification token
     * @returns Promise that resolves when the email is verified successfully
     */
    verifyEmail: async (token: string): Promise<void> => {
        try {
            await apiRequest('/auth/verify-email/', 'POST', { token });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Check if the user is authenticated
     * @returns Boolean indicating whether the user is authenticated
     */
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('access_token');
    },

    /**
     * Get the current access token
     * @returns The current access token or null if not available
     */
    getAccessToken: (): string | null => {
        return localStorage.getItem('access_token');
    },

    /**
     * Set the access token
     * @param token - The access token to set
     */
    setAccessToken: (token: string): void => {
        localStorage.setItem('access_token', token);
    },

    /**
     * Remove the access token
     */
    removeAccessToken: (): void => {
        localStorage.removeItem('access_token');
    },
};