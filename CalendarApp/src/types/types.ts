export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es' | 'fr';
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export type NotificationPreferences = {
    email: boolean;
    push: boolean;
    inApp: boolean;
};

export type NotificationType = keyof NotificationPreferences;

export interface UserNotificationSettings extends NotificationPreferences {
    userId: string;
    lastUpdated?: string;
}

export enum NotificationChannel {
    Email = 'email',
    Push = 'push',
    InApp = 'inApp'
}

export interface NotificationContent {
    title: string;
    body: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
    read: boolean;
}

export interface Notification extends NotificationContent {
    id: string;
    recipient: string;
    channel: NotificationChannel;
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