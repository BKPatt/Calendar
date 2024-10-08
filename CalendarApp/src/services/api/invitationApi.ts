import { ApiResponse, PaginatedResponse, Invitation } from '../../types/event';
import { apiRequest, getPaginatedResults, handleApiError } from '../../utils/apiHelpers';

/**
 * invitationApi.ts
 * 
 * This file contains all the API calls related to invitations in the calendar application.
 * It provides functions for creating, fetching, and responding to invitations for both events and groups.
 */
type InvitationResponse = Invitation[] | PaginatedResponse<Invitation[]>;

export const invitationApi = {
    /**
     * Fetch invitations based on provided parameters
     * @param params - Optional query parameters for filtering invitations
     * @returns Promise with a paginated response of Invitations
     */
    getInvitations: async (params?: Record<string, string>): Promise<ApiResponse<Invitation[]>> => {
        try {
            const response = await apiRequest<InvitationResponse>('/invitations/', 'GET', undefined, params);

            let invitations: Invitation[];
            if (Array.isArray(response)) {
                invitations = response;
            } else if ('results' in response && Array.isArray(response.results)) {
                invitations = response.results;
            } else {
                throw new Error('Invalid response structure');
            }

            return {
                data: invitations,
                message: 'Invitations fetched successfully',
            };
        } catch (error) {
            throw new Error(handleApiError(error).join(', '));
        }
    },

    /**
     * Create a new invitation
     * @param invitationData - Partial Invitation object containing the new invitation details
     * @returns Promise with the created Invitation object
     */
    createInvitation: async (invitationData: Partial<Invitation>): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>('/invitations/', 'POST', invitationData);
            return {
                data: response.data,
                message: 'Invitation created successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch a single invitation by its ID
     * @param invitationId - ID of the invitation to fetch
     * @returns Promise with the Invitation object
     */
    getInvitation: async (invitationId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>(`/invitations/${invitationId}/`, 'GET');
            return {
                data: response.data,
                message: 'Invitation fetched successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Accept an invitation
     * @param invitationId - ID of the invitation to accept
     * @returns Promise with the updated Invitation object
     */
    acceptInvitation: async (invitationId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>(`/invitations/${invitationId}/accept/`, 'POST');
            return {
                data: response.data,
                message: 'Invitation accepted successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Decline an invitation
     * @param invitationId - ID of the invitation to decline
     * @returns Promise with the updated Invitation object
     */
    declineInvitation: async (invitationId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>(`/invitations/${invitationId}/decline/`, 'POST');
            return {
                data: response.data,
                message: 'Invitation declined successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Cancel an invitation (for invitation creators)
     * @param invitationId - ID of the invitation to cancel
     * @returns Promise that resolves when the invitation is canceled
     */
    cancelInvitation: async (invitationId: number): Promise<ApiResponse<void>> => {
        try {
            await apiRequest(`/invitations/${invitationId}/cancel/`, 'POST');
            return {
                data: undefined,
                message: 'Invitation canceled successfully',
            };
        } catch (error) {
            return {
                data: undefined,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Resend an invitation
     * @param invitationId - ID of the invitation to resend
     * @returns Promise with the updated Invitation object
     */
    resendInvitation: async (invitationId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>(`/invitations/${invitationId}/resend/`, 'POST');
            return {
                data: response.data,
                message: 'Invitation resent successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch pending invitations for the current user
     * @returns Promise with an array of pending Invitations
     */
    getPendingInvitations: async (): Promise<ApiResponse<Invitation[]>> => {
        try {
            const response = await apiRequest<Invitation[]>('/invitations/pending/', 'GET');
            return {
                data: response.data,
                message: 'Pending invitations fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Fetch sent invitations by the current user
     * @returns Promise with an array of sent Invitations
     */
    getSentInvitations: async (): Promise<ApiResponse<Invitation[]>> => {
        try {
            const response = await apiRequest<Invitation[]>('/invitations/sent/', 'GET');
            return {
                data: response.data,
                message: 'Sent invitations fetched successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Create a group invitation
     * @param groupId - ID of the group to invite to
     * @param userId - ID of the user to invite
     * @returns Promise with the created Invitation object
     */
    createGroupInvitation: async (groupId: number, userId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>('/group-invitations/', 'POST', { group_id: groupId, user_id: userId });
            return {
                data: response.data,
                message: 'Group invitation created successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Create an event invitation
     * @param eventId - ID of the event to invite to
     * @param userId - ID of the user to invite
     * @returns Promise with the created Invitation object
     */
    createEventInvitation: async (eventId: number, userId: number): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>('/event-invitations/', 'POST', { event_id: eventId, user_id: userId });
            return {
                data: response.data,
                message: 'Event invitation created successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },

    /**
     * Bulk create invitations for an event
     * @param eventId - ID of the event to invite to
     * @param userIds - Array of user IDs to invite
     * @returns Promise with an array of created Invitation objects
     */
    bulkCreateEventInvitations: async (eventId: number, userIds: number[]): Promise<ApiResponse<Invitation[]>> => {
        try {
            const response = await apiRequest<Invitation[]>('/event-invitations/bulk/', 'POST', { event_id: eventId, user_ids: userIds });
            return {
                data: response.data,
                message: 'Bulk event invitations created successfully',
            };
        } catch (error) {
            return {
                data: [],
                error: handleApiError(error),
            };
        }
    },

    /**
     * Update an invitation's message
     * @param invitationId - ID of the invitation to update
     * @param message - New message for the invitation
     * @returns Promise with the updated Invitation object
     */
    updateInvitationMessage: async (invitationId: number, message: string): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await apiRequest<Invitation>(`/invitations/${invitationId}/`, 'PATCH', { message });
            return {
                data: response.data,
                message: 'Invitation message updated successfully',
            };
        } catch (error) {
            return {
                data: {} as Invitation,
                error: handleApiError(error),
            };
        }
    },
};
