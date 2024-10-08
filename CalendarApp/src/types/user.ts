import { DateFormat, Language, Theme, TimeFormat } from "./types";

export interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
}

export interface UserProfile extends User {
    defaultTimezone?: string;
    bio?: string;
    profilePicture?: string;
    phoneNumber?: string;
    notificationPreferences: NotificationPreferences;
    lastLoginPlatform?: 'web' | 'ios' | 'android';
    profileComplete?: boolean;
    settings: UserSettings;
}

export interface RegistrationData {
    username: string;
    email: string;
    password: string;
}

export interface UserSettings {
    notificationPreferences: {
        email: boolean;
        push: boolean;
        inApp: boolean;
    };
    theme: Theme;
    language: Language;
    timeFormat: TimeFormat;
    dateFormat: DateFormat;
    defaultView: 'month' | 'week' | 'day';
}