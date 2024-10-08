import { ApiResponse, PaginatedResponse, Notifications, UserDeviceToken } from '../../types/event';
import { NotificationPreferences } from '../../types/user';
import { apiRequest, getPaginatedResults, handleApiError } from '../../utils/apiHelpers';

/**
 * notificationApi.ts
 * 
 * This file contains all the API calls related to notifications in the calendar application.
 * It provides functions for managing notifications, user preferences for notifications,
 * and device token management for push notifications.
 */

export const notificationApi = {
    /**
     * Fetch notifications based on provided parameters
     * @param params - Optional query parameters for filtering notifications
     * @returns Promise with a paginated response of Notifications
     */
    getNotifications: async (params?: Record<string, string>): Promise<PaginatedResponse<Notifications[]>> => {
        try {
            return await getPaginatedResults<Notifications>('/notifications/', params);
        } catch (error) {
            throw new Error(handleApiError(error).join(', '));
        }
    },

    /**
     * Mark a notification as read
     * @param notificationId - ID of the notification to mark as read
     * @returns Promise that resolves when the notification is marked as read
     */
    markNotificationAsRead: async (notificationId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/notifications/${notificationId}/mark-read/`, 'POST');
            return {
                data: undefined,
                message: 'Notification marked as read successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Mark all notifications as read
     * @returns Promise that resolves when all notifications are marked as read
     */
    markAllNotificationsAsRead: async (): Promise<ApiResponse<void>> => {
        try {
            await apiRequest('/notifications/mark-all-read/', 'POST');
            return {
                data: undefined,
                message: 'All notifications marked as read',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Delete a notification
     * @param notificationId - ID of the notification to delete
     * @returns Promise that resolves when the notification is deleted
     */
    deleteNotification: async (notificationId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/notifications/${notificationId}/`, 'DELETE');
            return {
                data: undefined,
                message: 'Notification deleted successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch unread notifications count
     * @returns Promise with the count of unread notifications
     */
    getUnreadNotificationsCount: async (): Promise<ApiResponse<number>> => {
        try {
            const response = await apiRequest<number>('/notifications/unread-count/', 'GET');
            return {
                data: response.data,
                message: 'Unread notifications count fetched successfully',
            };
        } catch (error) {
            return {
                data: 0,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Update notification preferences
     * @param preferences - Object containing updated notification preferences
     * @returns Promise with the updated NotificationPreferences object
     */
    updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> => {
        try {
            const response = await apiRequest<NotificationPreferences>('/users/notification-preferences/', 'PATCH', preferences);
            return {
                data: response.data,
                message: 'Notification preferences updated successfully',
            };
        } catch (error) {
            return {
                data: {} as NotificationPreferences,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch current notification preferences
     * @returns Promise with the current NotificationPreferences object
     */
    getNotificationPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
        try {
            const response = await apiRequest<NotificationPreferences>('/users/notification-preferences/', 'GET');
            return {
                data: response.data,
                message: 'Notification preferences fetched successfully',
            };
        } catch (error) {
            return {
                data: {} as NotificationPreferences,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Register a device token for push notifications
     * @param tokenData - Object containing the device token and device type
     * @returns Promise with the created UserDeviceToken object
     */
    registerDeviceToken: async (tokenData: Partial<UserDeviceToken>): Promise<ApiResponse<UserDeviceToken>> => {
        try {
            const response = await apiRequest<UserDeviceToken>('/device-tokens/', 'POST', tokenData);
            return {
                data: response.data,
                message: 'Device token registered successfully',
            };
        } catch (error) {
            return {
                data: {} as UserDeviceToken,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Update a device token
     * @param tokenId - ID of the device token to update
     * @param tokenData - Object containing the updated device token information
     * @returns Promise with the updated UserDeviceToken object
     */
    updateDeviceToken: async (tokenId: number, tokenData: Partial<UserDeviceToken>): Promise<ApiResponse<UserDeviceToken>> => {
        try {
            const response = await apiRequest<UserDeviceToken>(`/device-tokens/${tokenId}/`, 'PATCH', tokenData);
            return {
                data: response.data,
                message: 'Device token updated successfully',
            };
        } catch (error) {
            return {
                data: {} as UserDeviceToken,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Delete a device token
     * @param tokenId - ID of the device token to delete
     * @returns Promise that resolves when the device token is deleted
     */
    deleteDeviceToken: async (tokenId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/device-tokens/${tokenId}/`, 'DELETE');
            return {
                data: undefined,
                message: 'Device token deleted successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch all device tokens for the current user
     * @returns Promise with an array of UserDeviceToken objects
     */
    getUserDeviceTokens: async (): Promise<ApiResponse<UserDeviceToken[]>> => {
        try {
            const response = await apiRequest<UserDeviceToken[]>('/device-tokens/', 'GET');
            return {
                data: response.data,
                message: 'User device tokens fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Send a test notification to a specific device
     * @param tokenId - ID of the device token to send the test notification to
     * @returns Promise that resolves when the test notification is sent
     */
    sendTestNotification: async (tokenId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/device-tokens/${tokenId}/send-test-notification/`, 'POST');
            return {
                data: undefined,
                message: 'Test notification sent successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },
};
