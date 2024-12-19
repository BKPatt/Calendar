import { ApiResponse, Events, PaginatedEvents } from '../../types/event';
import { apiRequest, handleApiError } from '../../utils/apiHelpers';
import { getCurrentUser } from '../auth';

export const eventApi = {
    getEvents: async (params?: Record<string, string>): Promise<ApiResponse<Events[]>> => {
        try {
            let url = '/events/';
            const user = await getCurrentUser();
            if (!user || !user.id) {
                return {
                    data: [],
                    error: ['User is not authenticated'],
                };
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
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    createEvent: async (eventData: Partial<Events>): Promise<ApiResponse<Events>> => {
        if (!eventData.start_time || !eventData.end_time) {
            return {
                data: {} as Events,
                error: ['Start time and end time are required'],
            };
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

            const { shared_with, ...payloadWithoutSharedWith } = payload;
            const response = await apiRequest<Events>('/events/', 'POST', payloadWithoutSharedWith);

            if (shared_with && shared_with.length > 0) {
                await apiRequest<Events>(`/events/${response.data.id}/`, 'PATCH', { shared_with });
            }
            return {
                data: response.data,
                message: 'Event created successfully',
            };
        } catch (error: any) {
            return {
                data: {} as Events,
                error: handleApiError(error),
            };
        }
    },

    updateEvent: async (eventId: number, eventData: Partial<Events>): Promise<ApiResponse<Events>> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/`, 'PATCH', eventData);
            return {
                data: response.data,
                message: 'Event updated successfully',
            };
        } catch (error) {
            return {
                data: {} as Events,
                error: handleApiError(error),
            };
        }
    },

    getEvent: async (eventId: number): Promise<ApiResponse<Events>> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/`, 'GET');
            return {
                data: response.data,
                message: 'Event fetched successfully',
            };
        } catch (error) {
            return {
                data: {} as Events,
                error: handleApiError(error),
            };
        }
    },

    deleteEvent: async (eventId: number, deleteSeries: boolean = false): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/events/${eventId}/?delete_series=${deleteSeries}`, 'DELETE');
            return {
                data: undefined,
                message: 'Event deleted successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    shareEvent: async (eventId: number, email: string): Promise<ApiResponse<void>> => {
        try {
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
            return {
                data: undefined,
                message: 'Event shared successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    updateEventETA: async (eventId: number, eta: string): Promise<ApiResponse<Events>> => {
        try {
            const response = await apiRequest<Events>(`/events/${eventId}/update-eta/`, 'PATCH', { eta });
            return {
                data: response.data,
                message: 'ETA updated successfully',
            };
        } catch (error) {
            return {
                data: {} as Events,
                error: handleApiError(error),
            };
        }
    },

    getUpcomingEvents: async (page_size: number = 9): Promise<ApiResponse<Events[]>> => {
        try {
            const user = await getCurrentUser();
            const response = await apiRequest<Events[]>(`/events/upcoming/?user_id=${user.id}&page_size=${page_size}`, 'GET');
            return {
                data: response.data,
                message: 'Upcoming events fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    getAllEvents: async (params: Record<string, string> = {}): Promise<ApiResponse<Events[]>> => {
        try {
            const user = await getCurrentUser();
            if (!user || !user.id) {
                return {
                    data: [],
                    error: ['User is not authenticated'],
                };
            }
            params.user_id = user.id.toString();
            const queryParams = new URLSearchParams(params);
            const url = `/events/?${queryParams.toString()}`;

            const response = await apiRequest<Events[]>(url, 'GET');

            return {
                data: response.data,
                message: 'Events fetched successfully',
                count: response.count
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },
};
