import { format, parseISO, isValid, differenceInMinutes, addMinutes } from 'date-fns';

/**
 * Format a date string to a specified format
 * @param dateString - ISO date string
 * @param formatString - desired format (default: 'yyyy-MM-dd')
 * @returns formatted date string
 */
export const formatDate = (dateString: string, formatString: string = 'yyyy-MM-dd'): string => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, formatString) : 'Invalid Date';
};

/**
 * Get the day of the week (0-6) from a date string
 * @param dateString - ISO date string
 * @returns day of the week (0-6)
 */
export const getDayOfWeek = (dateString: string): number => {
    const date = parseISO(dateString);
    return isValid(date) ? date.getDay() : -1;
};

/**
 * Check if two date ranges overlap
 * @param start1 - start of first range
 * @param end1 - end of first range
 * @param start2 - start of second range
 * @param end2 - end of second range
 * @returns boolean indicating if ranges overlap
 */
export const doDateRangesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean => {
    const s1 = parseISO(start1);
    const e1 = parseISO(end1);
    const s2 = parseISO(start2);
    const e2 = parseISO(end2);

    return s1 < e2 && s2 < e1;
};

/**
 * Calculate the duration between two dates in minutes
 * @param start - start date string
 * @param end - end date string
 * @returns duration in minutes
 */
export const calculateDuration = (start: string, end: string): number => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    if (!isValid(startDate) || !isValid(endDate)) {
        return 0;
    }

    return differenceInMinutes(endDate, startDate);
};

/**
 * Add minutes to a date string
 * @param dateString - ISO date string
 * @param minutes - number of minutes to add
 * @returns new date string
 */
export const addMinutesToDate = (dateString: string, minutes: number): string => {
    const date = parseISO(dateString);
    if (!isValid(date)) {
        return 'Invalid Date';
    }

    return addMinutes(date, minutes).toISOString();
};

/**
 * Check if a date is in the past
 * @param dateString - ISO date string
 * @returns boolean indicating if date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
    const date = parseISO(dateString);
    return isValid(date) ? date < new Date() : false;
};