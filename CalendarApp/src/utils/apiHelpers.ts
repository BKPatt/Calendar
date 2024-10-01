import { ApiResponse, PaginatedResponse } from "../types/event";
import * as authService from '../services/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Generic function to make API requests
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param body - request body (optional)
 * @param headers - additional headers (optional)
 * @returns Promise with API response
 */
export const apiRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any,
    customHeaders?: Record<string, string>
): Promise<ApiResponse<T>> => {
    let accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // Define the headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...customHeaders,
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If access token has expired, refresh the token
    if (response.status === 401 && refreshToken) {
        try {
            const newAccessToken = await refreshAccessToken(refreshToken);
            if (newAccessToken) {
                // Retry the request with the new access token
                accessToken = newAccessToken;
                headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the request with updated Authorization header
                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...config,
                    headers,
                });
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Authentication failed');
        }
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
};

/**
 * Function to refresh the access token using the refresh token
 * @param refreshToken - the refresh token
 * @returns Promise with new access token
 */
const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const response = await authService.refreshToken(refreshToken);
        if (response.access) {
            localStorage.setItem('access_token', response.access);
            return response.access;
        } else {
            throw new Error('Token refresh failed');
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
};

/**
 * Handle paginated API responses
 * @param endpoint - API endpoint
 * @param params - query parameters
 * @returns Promise with paginated response
 */
export const getPaginatedResults = async <T>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<PaginatedResponse<T[]>> => {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = `${endpoint}?${queryString}`;
    const response = await apiRequest<PaginatedResponse<T[]>>(fullEndpoint);

    // Check if the response has the expected structure
    if (response && typeof response === 'object' && 'data' in response) {
        const paginatedData = response.data;
        if ('count' in paginatedData && 'results' in paginatedData) {
            return paginatedData as PaginatedResponse<T[]>;
        }
    }

    // If the response doesn't match the expected structure, throw an error
    throw new Error('Invalid paginated response structure');
};

/**
 * Construct query string from an object
 * @param params - object containing query parameters
 * @returns query string
 */
export const buildQueryString = (params: Record<string, string | number | boolean>): string => {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
};

/**
 * Handle API errors
 * @param error - caught error object
 * @returns formatted error message
 */
export const handleApiError = (error: any): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
};
