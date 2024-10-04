import { ApiResponse } from '../../types/event';
import { User, UserProfile, RegistrationData, AuthResponse } from '../../types/user';
import { apiRequest, handleApiError } from '../../utils/apiHelpers';

/**
 * userApi.ts
 * 
 * This file contains all the API calls related to users in the calendar application.
 * It provides functions for managing user profiles, authentication, and user-specific operations.
 */

export const userApi = {
    /**
     * Fetch a user's profile
     * @param userId - ID of the user to fetch the profile for
     * @returns Promise with the UserProfile object
     */
    getUserProfile: async (userId: number): Promise<ApiResponse<UserProfile>> => {
        try {
            const response = await apiRequest<UserProfile>(`/users/${userId}/`, 'GET');
            return {
                data: response.data,
                message: 'User profile fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update a user's profile
     * @param userId - ID of the user whose profile is being updated
     * @param userData - Partial UserProfile object containing the updated user data
     * @returns Promise with the updated UserProfile object
     */
    updateUserProfile: async (userId: number, userData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
        try {
            const response = await apiRequest<UserProfile>(`/users/${userId}/update_profile/`, 'POST', userData);
            return {
                data: response.data,
                message: 'User profile updated successfully',
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
            await apiRequest('/users/change-password/', 'POST', { old_password: oldPassword, new_password: newPassword });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete user's account
     * @returns Promise that resolves when the account is deleted successfully
     */
    deleteAccount: async (): Promise<void> => {
        try {
            await apiRequest('/users/delete-account/', 'DELETE');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Register a new user
     * @param userData - RegistrationData object containing the new user's information
     * @returns Promise with the AuthResponse object
     */
    register: async (userData: RegistrationData): Promise<ApiResponse<AuthResponse>> => {
        try {
            const response = await apiRequest<AuthResponse>('/auth/register/', 'POST', userData);
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
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Refresh the authentication token
     * @param refreshToken - The refresh token
     * @returns Promise with the new access token
     */
    refreshToken: async (refreshToken: string): Promise<ApiResponse<{ access: string }>> => {
        try {
            const response = await apiRequest<{ access: string }>('/auth/token/refresh/', 'POST', { refresh: refreshToken });
            return {
                data: response.data,
                message: 'Token refreshed successfully',
            };
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
            const response = await apiRequest<User>('/users/me/', 'GET');
            return {
                data: response.data,
                message: 'Current user fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update user's notification preferences
     * @param preferences - Object containing updated notification preferences
     * @returns Promise with the updated UserProfile object
     */
    updateNotificationPreferences: async (preferences: Partial<UserProfile['notificationPreferences']>): Promise<ApiResponse<UserProfile>> => {
        try {
            const response = await apiRequest<UserProfile>('/users/notification-preferences/', 'PATCH', { notification_preferences: preferences });
            return {
                data: response.data,
                message: 'Notification preferences updated successfully',
            };
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
};