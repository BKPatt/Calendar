import { useAuth } from '../hooks/useAuth';
import { ApiResponse, Attachment, Availability, Events, Invitation, Tag, UserDeviceToken, WorkSchedule } from '../types/event';
import { Group } from '../types/group';
import { User, UserProfile } from '../types/user';
import { apiRequest, getPaginatedResults, handleApiError } from '../utils/apiHelpers';
import { getCurrentUser } from './auth';

/**
 * Get user profile by user ID with authentication token
 */
export async function getUserProfile(userId: number): Promise<ApiResponse<UserProfile>> {
    const access_token = localStorage.getItem('access_token'); // Get token from localStorage

    if (!access_token) {
        throw new Error('Authentication credentials were not provided.');
    }

    try {
        const response = await apiRequest<UserProfile>(`/users/${userId}/`, 'GET', null, {
            Authorization: `Bearer ${access_token}` // Attach token to headers
        });

        return {
            data: response.data,
            message: 'User profile fetched successfully',
        };
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}

/**
 * Update the user profile
 * @param userId - The ID of the user whose profile is being updated
 * @param userData - Partial object containing the updated user profile fields
 * @returns Promise with the updated user profile
 */
export const updateUserProfile = async (
    userId: number,
    userData: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> => {
    const endpoint = `/users/${userId}/profile/`;
    return await apiRequest<UserProfile>(endpoint, 'PUT', userData);
};

export const getEvents = async (params?: Record<string, string>): Promise<ApiResponse<Events[]>> => {
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
        console.log(response);

        return {
            data: response.data,
            message: 'Events fetched successfully',
        };
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createEvent = async (eventData: Partial<Events>): Promise<Events> => {
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
        console.error("Error in createEvent:", error);  // Add this line for debugging
        throw new Error(handleApiError(error));
    }
};

export const updateEvent = async (eventId: number, eventData: Partial<Events>): Promise<Events> => {
    try {
        const response = await apiRequest<Events>(`/events/${eventId}/`, 'PATCH', eventData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getEvent = async (eventId: number): Promise<ApiResponse<ApiResponse<Events>>> => {
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
};

export const getGroupSchedule = async (groupId: number): Promise<ApiResponse<WorkSchedule[]>> => {
    try {
        const response = await apiRequest<WorkSchedule[]>(`/groups/${groupId}/schedules/`);
        return response;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateEventETA = async (eventId: number, eta: string): Promise<Event> => {
    try {
        const response = await apiRequest<Event>(`/events/${eventId}/update-eta/`, 'PATCH', { eta });
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteEvent = async (eventId: number): Promise<void> => {
    try {
        await apiRequest(`/events/${eventId}/`, 'DELETE');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getGroups = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<Group>('/groups/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getGroup = async (groupId: number): Promise<ApiResponse<Group>> => {
    try {
        const response = await apiRequest<Group>(`/groups/${groupId}/`, 'GET');
        return {
            data: response.data,
            message: 'Group fetched successfully',
        };
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getGroupEvents = async (groupId: number): Promise<ApiResponse<Events[]>> => {
    try {
        const response = await apiRequest<Events[]>(`/groups/${groupId}/events/`, 'GET');
        return {
            data: response.data,
            message: 'Events fetched successfully',
        };
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getUpcomingEvents = async (): Promise<ApiResponse<Events[]>> => {
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
};

export const shareEvent = async (eventId: number, email: string): Promise<void> => {
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
};

export const createGroup = async (groupData: Partial<Group>): Promise<Group> => {
    try {
        const response = await apiRequest<Group>('/groups/', 'POST', groupData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateGroup = async (groupId: number, groupData: Partial<Group>): Promise<Group> => {
    try {
        const response = await apiRequest<Group>(`/groups/${groupId}/`, 'PATCH', groupData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const deleteGroup = async (groupId: number): Promise<void> => {
    try {
        await apiRequest(`/groups/${groupId}/`, 'DELETE');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getAvailabilities = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<Availability>('/availabilities/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createAvailability = async (availabilityData: Partial<Availability>): Promise<Availability> => {
    try {
        const response = await apiRequest<Availability>('/availabilities/', 'POST', availabilityData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getWorkSchedules = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<WorkSchedule>('/work-schedules/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createWorkSchedule = async (scheduleData: Partial<WorkSchedule>): Promise<WorkSchedule> => {
    try {
        const response = await apiRequest<WorkSchedule>('/work-schedules/', 'POST', scheduleData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const updateWorkSchedule = async (scheduleId: number, scheduleData: Partial<WorkSchedule>): Promise<WorkSchedule> => {
    try {
        const response = await apiRequest<WorkSchedule>(`/work-schedules/${scheduleId}/`, 'PATCH', scheduleData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getInvitations = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<Invitation>('/invitations/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createInvitation = async (invitationData: Partial<Invitation>): Promise<Invitation> => {
    try {
        const response = await apiRequest<Invitation>('/invitations/', 'POST', invitationData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getNotifications = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<Notification>('/notifications/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const getTags = async (params?: Record<string, string>) => {
    try {
        return await getPaginatedResults<Tag>('/tags/', params);
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const createAttachment = async (attachmentData: FormData): Promise<Attachment> => {
    try {
        const response = await apiRequest<Attachment>('/attachments/', 'POST', attachmentData, {
            'Content-Type': 'multipart/form-data',
        });
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const registerDeviceToken = async (tokenData: Partial<UserDeviceToken>): Promise<UserDeviceToken> => {
    try {
        const response = await apiRequest<UserDeviceToken>('/device-tokens/', 'POST', tokenData);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (oldPassword === 'oldpassword') {
                resolve();
            } else {
                reject(new Error('Invalid current password'));
            }
        }, 1000);
    });
}

export async function deleteAccount(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), 1000);
    });
}