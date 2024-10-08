export type Theme = 'light' | 'dark';

export interface Notification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

export interface ErrorDetail {
    string: string;
    code: string;
}

export interface FieldErrors {
    [key: string]: ErrorDetail[];
}

export interface ApiErrorResponse {
    error: string;
}