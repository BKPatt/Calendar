import { ApiResponse, Events } from '../../types/event';
import { apiRequest, getPaginatedResults, handleApiError } from '../../utils/apiHelpers';
import { getCurrentUser } from '../auth';

/**
 * eventApi.ts
 * 
 * This file contains all the API calls related to events in the calendar application.
 * It provides functions for creating, reading, updating, and deleting events, as well as
 * specialized operations like sharing events and updating ETAs.
 */

export const eventApi = {
    /**
     * Fetch events based on provided parameters
     * @param params - Optional query parameters for filtering events
     * @returns Promise with an array of Events
     */
    getEvents: async (params?: Record<string, string>): Promise<ApiResponse<Events[]>> => {
        try {
            let url = '/events/';
            const user = await getCurrentUser();

            if (!user || !user.id) {
                throw new Error('User is not authenticated');
            }

            if (params) {
                params.user_id = user.id.toString();
            } else {
                params = { user_id: user.id.toString() };
            }

            const queryParams = new URLSearchParams(params);
            url += `?${queryParams.toString()}`;

            const response = await apiRequest<Events[]>(url, 'GET');

            return {
                data: response.data,
                message: 'Events fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Create a new event
     * @param eventData - Partial Event object containing the new event details
     * @returns Promise with the created Event object
     */
    createEvent: async (eventData: Partial<Events>): Promise<Events> => {
        if (!eventData.start_time || !eventData.end_time || !eventData.start_date) {
            throw new Error('Start time, end time, and start date are required');
        }

        try {
            const payload = {
                ...eventData,
                recurrence_rule: eventData.recurring && eventData.recurrence_rule
                    ? {
                        ...eventData.recurrence_rule,
                        days_of_week: Array.isArray(eventData.recurrence_rule.days_of_week)
                            ? eventData.recurrence_rule.days_of_week.join(',')
                            : eventData.recurrence_rule.days_of_week,
                    }
                    : undefined,
            };

            if (!payload.recurring) {
                delete payload.recurrence_rule;
            }

            const response = await apiRequest<Events>('/events/', 'POST', payload);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Update an existing event
     * @param eventId - ID of the event to update
     * @param eventData - Partial Event object containing the updated event details
     * @returns Promise with the updated Event object
     */
    updateEvent: async (eventId: number, eventData: Partial<Events>): Promise<Events> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/`, 'PATCH', eventData);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch a single event by its ID
     * @param eventId - ID of the event to fetch
     * @returns Promise with the Event object
     */
    getEvent: async (eventId: number): Promise<ApiResponse<ApiResponse<Events>>> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/`, 'GET');
            return {
                data: {
                    data: response.data,
                    message: 'Event fetched successfully'
                },
                message: 'Outer API response',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete an event
     * @param eventId - ID of the event to delete
     * @returns Promise that resolves when the event is deleted
     */
    deleteEvent: async (eventId: number): Promise<void> => {
        try {
            await apiRequest(`/events/${eventId}/`, 'DELETE');
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Share an event with another user
     * @param eventId - ID of the event to share
     * @param email - Email of the user to share the event with
     * @returns Promise that resolves when the event is shared
     */
    shareEvent: async (eventId: number, email: string): Promise<void> => {
        const response = await fetch(`/api/events/${eventId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Failed to share event');
        }
    },

    /**
     * Update the ETA for an event
     * @param eventId - ID of the event to update
     * @param eta - New ETA for the event
     * @returns Promise with the updated Event object
     */
    updateEventETA: async (eventId: number, eta: string): Promise<Event> => {
        try {
            const response = await apiRequest<Event>(`/events/${eventId}/update-eta/`, 'PATCH', { eta });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch upcoming events for the current user
     * @returns Promise with an array of upcoming Events
     */
    getUpcomingEvents: async (): Promise<ApiResponse<Events[]>> => {
        try {
            const user = await getCurrentUser();
            const response = await apiRequest<Events[]>(`/events/upcoming/?user_id=${user.id}`, 'GET');
            return {
                data: response.data,
                message: 'Upcoming events fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },
};