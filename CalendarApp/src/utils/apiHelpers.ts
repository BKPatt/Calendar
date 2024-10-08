import { ApiResponse, PaginatedResponse } from "../types/event";
import { authApi } from "../services/api/authApi";
import { FieldErrors } from "../types/types";

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

    if (response.status === 401 && refreshToken) {
        try {
            const newAccessToken = await refreshAccessToken(refreshToken);
            if (newAccessToken) {
                accessToken = newAccessToken;
                headers.Authorization = `Bearer ${newAccessToken}`;
                config.headers = { ...headers };
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Authentication failed');
        }
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
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
        const response = await authApi.refreshToken(refreshToken);
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            return response.data.access;
        } else {
            throw new Error('Token refresh failed');
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
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

    const fullEndpoint = endpoint.includes('?')
        ? `${endpoint}${queryString}`
        : `${endpoint}?${queryString}`;

    const response = await apiRequest<PaginatedResponse<T[]>>(fullEndpoint);

    if (response && typeof response === 'object') {
        if ('data' in response) {
            const paginatedData = response.data;

            if ('count' in paginatedData && 'results' in paginatedData) {
                return paginatedData as PaginatedResponse<T[]>;
            }
        } else if ('count' in response && 'results' in response) {
            return response as PaginatedResponse<T[]>;
        }
    }

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
 * @returns formatted error messages as an array of strings
 */
export const handleApiError = (error: any): string[] => {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error && error.message) {
        try {
            const parsedError = JSON.parse(error.message);

            if (parsedError.error) {
                const rawError = parsedError.error;

                const errorMatch = rawError.match(/{'(.*?)': \[(.*?)\]}/);

                if (errorMatch) {
                    const field = errorMatch[1];
                    const message = errorMatch[2].replace(/ErrorDetail\(string='(.*?)', code='.*?'\)/, '$1').replace(/'/g, '');

                    if (field === '__all__') {
                        return [message];
                    }

                    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
                    return [`${capitalizedField}: ${message}`];
                }

                return [rawError];
            }

            if (parsedError.errors) {
                const detailedErrors = Object.entries(parsedError.errors).flatMap(([field, details]) => {
                    if (Array.isArray(details)) {
                        return details.map((detail: string) => {
                            if (field === '__all__') {
                                return detail;
                            }
                            const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
                            return `${capitalizedField}: ${detail}`;
                        });
                    }
                    return [];
                });
                return detailedErrors;
            }
        } catch (parseError) {
            console.error('Error parsing API error response:', parseError);
            errorMessage = error.message;
        }
    }

    // If the error is not a standard Error or couldn't be parsed, return the error as is
    return [errorMessage];
};
