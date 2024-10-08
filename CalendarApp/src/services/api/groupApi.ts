import { ApiResponse, PaginatedResponse, Events } from '../../types/event';
import { Group } from '../../types/group';
import { WorkSchedule } from '../../types/event';
import { apiRequest, getPaginatedResults, handleApiError } from '../../utils/apiHelpers';
import { User } from '../../types/user';
import { getCurrentUser } from '../auth';

/**
 * groupApi.ts
 * 
 * This file contains all the API calls related to groups in the calendar application.
 * It provides functions for creating, reading, updating, and deleting groups, as well as
 * managing group memberships and fetching group-specific data like events and schedules.
 */

export const groupApi = {
    /**
     * Fetch groups based on provided parameters
     * @param params - Optional query parameters for filtering groups
     * @returns Promise with a paginated response of Groups
     */
    getGroups: async (params?: Record<string, string>): Promise<PaginatedResponse<Group[]>> => {
        try {
            const user = await getCurrentUser();

            if (!user || !user.id) {
                throw new Error('User is not authenticated');
            }

            const queryParams = new URLSearchParams({ ...params, user_id: user.id.toString() });
            const fullEndpoint = `/groups/?${queryParams.toString()}`;
            const response = await getPaginatedResults<Group>(fullEndpoint);

            if (response && typeof response === 'object' && 'results' in response) {
                return response as PaginatedResponse<Group[]>;
            } else {
                throw new Error('Invalid paginated response structure');
            }
        } catch (error) {
            throw new Error(handleApiError(error).join(', '));
        }
    },

    /**
     * Fetch a single group by its ID
     * @param groupId - ID of the group to fetch
     * @returns Promise with the Group object
     */
    getGroup: async (groupId: number): Promise<ApiResponse<Group>> => {
        try {
            const response = await apiRequest<Group>(`/groups/${groupId}/`, 'GET');
            return {
                data: response.data,
                message: 'Group fetched successfully',
            };
        } catch (error) {
            return {
                data: {} as Group,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Create a new group
     * @param groupData - Partial Group object containing the new group details
     * @returns Promise with the created Group object
     */
    createGroup: async (groupData: Partial<Group>): Promise<ApiResponse<Group>> => {
        try {
            const user = await getCurrentUser();

            if (!user || !user.id) {
                return {
                    data: {} as Group,
                    error: ['User is not authenticated'],
                };
            }

            const fullGroupData = { ...groupData, admin: user.id };

            const response = await apiRequest<Group>('/groups/', 'POST', fullGroupData);
            return {
                data: response.data,
                message: 'Group created successfully',
            };
        } catch (error) {
            return {
                data: {} as Group,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Update an existing group
     * @param groupId - ID of the group to update
     * @param groupData - Partial Group object containing the updated group details
     * @returns Promise with the updated Group object
     */
    updateGroup: async (groupId: number, groupData: Partial<Group>): Promise<ApiResponse<Group>> => {
        try {
            const response = await apiRequest<Group>(`/groups/${groupId}/`, 'PATCH', groupData);
            return {
                data: response.data,
                message: 'Group updated successfully',
            };
        } catch (error) {
            return {
                data: {} as Group,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Delete a group
     * @param groupId - ID of the group to delete
     * @returns Promise that resolves when the group is deleted
     */
    deleteGroup: async (groupId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/groups/${groupId}/`, 'DELETE');
            return {
                data: undefined,
                message: 'Group deleted successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch events for a specific group
     * @param groupId - ID of the group to fetch events for
     * @returns Promise with an array of Events
     */
    getGroupEvents: async (groupId: number): Promise<ApiResponse<Events[]>> => {
        try {
            const response = await apiRequest<Events[]>(`/groups/${groupId}/events/`, 'GET');
            return {
                data: response.data,
                message: 'Group events fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch the schedule for a specific group
     * @param groupId - ID of the group to fetch the schedule for
     * @returns Promise with an array of WorkSchedules
     */
    getGroupSchedule: async (groupId: number): Promise<ApiResponse<WorkSchedule[]>> => {
        try {
            const response = await apiRequest<WorkSchedule[]>(`/groups/${groupId}/schedules/`, 'GET');
            return {
                data: response.data,
                message: 'Group schedule fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Add a member to a group
     * @param groupId - ID of the group to add the member to
     * @param userId - ID of the user to add to the group
     * @returns Promise that resolves when the member is added
     */
    addGroupMember: async (groupId: number, userId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/groups/${groupId}/members/`, 'POST', { user_id: userId });
            return {
                data: undefined,
                message: 'Member added successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Remove a member from a group
     * @param groupId - ID of the group to remove the member from
     * @param userId - ID of the user to remove from the group
     * @returns Promise that resolves when the member is removed
     */
    removeGroupMember: async (groupId: number, userId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/groups/${groupId}/members/${userId}/`, 'DELETE');
            return {
                data: undefined,
                message: 'Member removed successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch members of a specific group
     * @param groupId - ID of the group to fetch members for
     * @returns Promise with an array of User objects
     */
    getGroupMembers: async (groupId: number): Promise<ApiResponse<User[]>> => {
        try {
            const response = await apiRequest<User[]>(`/groups/${groupId}/members/`, 'GET');
            return {
                data: response.data,
                message: 'Group members fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Join a public group
     * @param groupId - ID of the public group to join
     * @returns Promise that resolves when the user has joined the group
     */
    joinGroup: async (groupId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/groups/${groupId}/join/`, 'POST');
            return {
                data: undefined,
                message: 'Group joined successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Leave a group
     * @param groupId - ID of the group to leave
     * @returns Promise that resolves when the user has left the group
     */
    leaveGroup: async (groupId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/groups/${groupId}/leave/`, 'POST');
            return {
                data: undefined,
                message: 'Group left successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch the common availability for a group
     * @param groupId - ID of the group to fetch common availability for
     * @param start_date - Start date for the availability range
     * @param end_date - End date for the availability range
     * @returns Promise with an array of available time slots
     */
    getGroupAvailability: async (groupId: number, start_date: string, end_date: string): Promise<ApiResponse<{ start: string, end: string }[]>> => {
        try {
            const response = await apiRequest<{ start: string, end: string }[]>(
                `/groups/${groupId}/availability/?start_date=${start_date}&end_date=${end_date}`,
                'GET'
            );
            return {
                data: response.data,
                message: 'Group availability fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },
};
