import { Group } from "./group";
import { User } from "./user";

export type EventType = 'meeting' | 'appointment' | 'social' | 'work' | 'other';

export interface Events {
    id?: number;
    title: string;
    description?: string;
    eventType: EventType;
    location?: string;
    start_time: string;
    end_time: string;
    start_date: string;
    created_by?: number;
    group?: number;
    recurring: boolean;
    recurrence_rule?: RecurrenceRule;
    sharedWith: number[];
    eta?: string;
    isAllDay: boolean;
    color: string;
    attachments?: Attachment[];
    createdAt?: string;
    updatedAt?: string;
    reminders: Array<{
        reminder_time: string;
        reminder_type: 'email' | 'push' | 'in_app';
    }>;
}

export interface RecurrenceRule {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    endDate?: string;
    occurrences?: number;
    days_of_week?: string[];
}

export interface Availability {
    id: number;
    user: User;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    note?: string;
}

export interface WorkSchedule {
    id: number;
    userId: number;
    user: User;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    effectiveDate: string;
    endDate?: string;
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
    event?: Event;
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

export interface Attachment {
    id: number;
    file: string;
    uploadedBy: User;
    uploadedAt: string;
}

export interface UserDeviceToken {
    id: number;
    user: User;
    token: string;
    deviceType: 'ios' | 'android' | 'web';
    isActive: boolean;
    lastUsed: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    errors?: string[];
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