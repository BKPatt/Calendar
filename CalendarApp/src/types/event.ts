import { Group } from "./group";
import { User } from "./user";

export type EventType = 'meeting' | 'appointment' | 'social' | 'work' | 'other';
export const EVENT_TYPES: EventType[] = ['meeting', 'appointment', 'social', 'work', 'other'];

export interface RecurrenceRule {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    end_date?: string;
    occurrences?: number;
    days_of_week?: string[];
    day_of_month?: number;
    month_of_year?: number;
    start_date?: string;
}

export interface Attachment {
    id: number;
    file: string;
    uploadedBy: User;
    uploadedAt: string;
}

export interface PaginatedEvents {
    count: number;
    next: string | null;
    previous: string | null;
    results: Events[];
}

export interface Events {
    id?: number;
    title: string;
    description?: string;
    event_type: EventType;
    location?: string;
    start_time: string;
    end_time: string;
    start_date?: string;
    end_date?: string;
    created_by?: number;
    group?: number;
    recurrence_rule?: RecurrenceRule;
    shared_with: number[];
    eta?: string;
    is_all_day: boolean;
    color: string;
    attachments?: Attachment[];
    created_at?: string;
    updated_at?: string;
    reminders: Array<{
        reminder_time: string;
        reminder_type: 'email' | 'push' | 'in_app';
    }>;
    recurring: boolean;
    recurrence_end_date?: string;
    event_timezone?: string;
    is_archived?: boolean;
    is_recurring?: boolean;
    category?: number;
    recurring_schedule?: number;
}

export interface Availability {
    id: number;
    user: User;
    start_time: string;
    end_time: string;
    isAvailable: boolean;
    note?: string;
}

export interface WorkSchedule {
    id: number;
    userId: number;
    user: User;
    dayOfWeek: number;
    start_time: string;
    end_time: string;
    isRecurring: boolean;
    effectiveDate: string;
    end_date?: string;
}

export type InvitationType = 'group' | 'event';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
    id: number;
    sender: User;
    recipient: User;
    group?: Group;
    event?: Events;
    invitationType: InvitationType;
    message?: string;
    status: InvitationStatus;
    createdAt: string;
    respondedAt?: string;
    expirationDate?: string;
}

export type NotificationType = 'event_reminder' | 'invitation' | 'group_update' | 'event_update' | 'system';
export type DeliveryMethod = 'in_app' | 'email' | 'push';

export interface Notifications {
    id: number;
    recipient: User;
    sender?: User;
    notificationType: NotificationType;
    event?: Events;
    group?: Group;
    message: string;
    isRead: boolean;
    createdAt: string;
    deliveryMethod: DeliveryMethod;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface UserDeviceToken {
    id: number;
    user: User;
    token: string;
    deviceType: 'ios' | 'android' | 'web';
    is_active: boolean;
    lastUsed: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string[];
    count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    results: T[];
    count: number;
    next?: string | null;
    previous?: string | null;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type RootStackParamList = {
    Home: undefined;
    Calendar: undefined;
    Event: { eventId: number } | undefined;
    Group: { groupId: number } | undefined;
    Profile: { userId: number } | undefined;
    Settings: undefined;
};
