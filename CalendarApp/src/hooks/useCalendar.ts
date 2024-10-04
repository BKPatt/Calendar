import { useState, useCallback } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths } from 'date-fns';
import { Events } from '../types/event';

interface UseCalendarReturn {
    currentMonth: Date;
    daysInMonth: Date[];
    goToNextMonth: () => void;
    goToPreviousMonth: () => void;
    goToToday: () => void;
    formatDate: (date: Date) => string;
    getEventsForDay: (date: Date, events: Events[]) => Events[];
}

export function useCalendar(): UseCalendarReturn {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const goToNextMonth = useCallback(() => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    }, []);

    const goToPreviousMonth = useCallback(() => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentMonth(new Date());
    }, []);

    const formatDate = useCallback((date: Date) => {
        return format(date, 'yyyy-MM-dd');
    }, []);

    const getEventsForDay = useCallback((date: Date, events: Events[]) => {
        const dateString = formatDate(date);
        return events.filter(event => event.start_time.startsWith(dateString));
    }, [formatDate]);

    return {
        currentMonth,
        daysInMonth,
        goToNextMonth,
        goToPreviousMonth,
        goToToday,
        formatDate,
        getEventsForDay
    };
}