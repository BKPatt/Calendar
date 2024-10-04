import { ApiResponse, PaginatedResponse, Availability, WorkSchedule, Events, RecurrenceRule } from '../../types/event';
import { apiRequest, getPaginatedResults, handleApiError } from '../../utils/apiHelpers';

/**
 * scheduleApi.ts
 * 
 * This file contains all the API calls related to schedules in the calendar application.
 * It provides functions for managing availabilities, work schedules, and recurring events.
 */

export const scheduleApi = {
    /**
     * Fetch availabilities based on provided parameters
     * @param params - Optional query parameters for filtering availabilities
     * @returns Promise with a paginated response of Availabilities
     */
    getAvailabilities: async (params?: Record<string, string>): Promise<PaginatedResponse<Availability[]>> => {
        try {
            return await getPaginatedResults<Availability>('/availabilities/', params);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Create a new availability
     * @param availabilityData - Partial Availability object containing the new availability details
     * @returns Promise with the created Availability object
     */
    createAvailability: async (availabilityData: Partial<Availability>): Promise<ApiResponse<Availability>> => {
        try {
            const response = await apiRequest<Availability>('/availabilities/', 'POST', availabilityData);
            return {
                data: response.data,
                message: 'Availability created successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update an existing availability
     * @param availabilityId - ID of the availability to update
     * @param availabilityData - Partial Availability object containing the updated availability details
     * @returns Promise with the updated Availability object
     */
    updateAvailability: async (availabilityId: number, availabilityData: Partial<Availability>): Promise<ApiResponse<Availability>> => {
        try {
            const response = await apiRequest<Availability>(`/availabilities/${availabilityId}/`, 'PATCH', availabilityData);
            return {
                data: response.data,
                message: 'Availability updated successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete an availability
     * @param availabilityId - ID of the availability to delete
     * @returns Promise that resolves when the availability is deleted
     */
    deleteAvailability: async (availabilityId: number): Promise<void> => {
        try {
            await apiRequest(`/availabilities/${availabilityId}/`, 'DELETE');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch work schedules based on provided parameters
     * @param params - Optional query parameters for filtering work schedules
     * @returns Promise with a paginated response of WorkSchedules
     */
    getWorkSchedules: async (params?: Record<string, string>): Promise<PaginatedResponse<WorkSchedule[]>> => {
        try {
            return await getPaginatedResults<WorkSchedule>('/work-schedules/', params);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Create a new work schedule
     * @param scheduleData - Partial WorkSchedule object containing the new work schedule details
     * @returns Promise with the created WorkSchedule object
     */
    createWorkSchedule: async (scheduleData: Partial<WorkSchedule>): Promise<ApiResponse<WorkSchedule>> => {
        try {
            const response = await apiRequest<WorkSchedule>('/work-schedules/', 'POST', scheduleData);
            return {
                data: response.data,
                message: 'Work schedule created successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update an existing work schedule
     * @param scheduleId - ID of the work schedule to update
     * @param scheduleData - Partial WorkSchedule object containing the updated work schedule details
     * @returns Promise with the updated WorkSchedule object
     */
    updateWorkSchedule: async (scheduleId: number, scheduleData: Partial<WorkSchedule>): Promise<ApiResponse<WorkSchedule>> => {
        try {
            const response = await apiRequest<WorkSchedule>(`/work-schedules/${scheduleId}/`, 'PATCH', scheduleData);
            return {
                data: response.data,
                message: 'Work schedule updated successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete a work schedule
     * @param scheduleId - ID of the work schedule to delete
     * @returns Promise that resolves when the work schedule is deleted
     */
    deleteWorkSchedule: async (scheduleId: number): Promise<void> => {
        try {
            await apiRequest(`/work-schedules/${scheduleId}/`, 'DELETE');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Create a new recurring event
     * @param eventData - Partial Events object containing the new recurring event details
     * @returns Promise with the created Events object
     */
    createRecurringEvent: async (eventData: Partial<Events>): Promise<ApiResponse<Events>> => {
        try {
            const response = await apiRequest<Events>('/events/', 'POST', { ...eventData, recurring: true });
            return {
                data: response.data,
                message: 'Recurring event created successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update an existing recurring event
     * @param eventId - ID of the recurring event to update
     * @param eventData - Partial Events object containing the updated recurring event details
     * @returns Promise with the updated Events object
     */
    updateRecurringEvent: async (eventId: number, eventData: Partial<Events>): Promise<ApiResponse<Events>> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/`, 'PATCH', eventData);
            return {
                data: response.data,
                message: 'Recurring event updated successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete a recurring event
     * @param eventId - ID of the recurring event to delete
     * @returns Promise that resolves when the recurring event is deleted
     */
    deleteRecurringEvent: async (eventId: number): Promise<void> => {
        try {
            await apiRequest(`/events/${eventId}/`, 'DELETE');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch user's availability for a specific date range
     * @param startDate - Start date for the availability range
     * @param endDate - End date for the availability range
     * @returns Promise with an array of available time slots
     */
    getUserAvailability: async (startDate: string, endDate: string): Promise<ApiResponse<{ start: string, end: string }[]>> => {
        try {
            const response = await apiRequest<{ start: string, end: string }[]>(`/user-availability/?start_date=${startDate}&end_date=${endDate}`, 'GET');
            return {
                data: response.data,
                message: 'User availability fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Check for scheduling conflicts
     * @param startTime - Start time of the event to check
     * @param endTime - End time of the event to check
     * @returns Promise with conflict information
     */
    checkConflicts: async (startTime: string, endTime: string): Promise<ApiResponse<{ hasConflicts: boolean, conflictingEvents?: Events[] }>> => {
        try {
            const response = await apiRequest<{ hasConflicts: boolean, conflictingEvents?: Events[] }>('/check-conflicts/', 'POST', { start_time: startTime, end_time: endTime });
            return {
                data: response.data,
                message: 'Conflict check completed successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },
};