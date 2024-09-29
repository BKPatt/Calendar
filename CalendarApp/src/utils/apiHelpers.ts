import { ApiResponse, PaginatedResponse } from "../types/event";

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
    const token = localStorage.getItem('authToken');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
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