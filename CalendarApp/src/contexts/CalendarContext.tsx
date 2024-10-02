import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths } from 'date-fns';
import { Events } from '../types/event';

interface CalendarContextType {
    currentMonth: Date;
    daysInMonth: Date[];
    events: Events[];
    setEvents: React.Dispatch<React.SetStateAction<Events[]>>;
    goToNextMonth: () => void;
    goToPreviousMonth: () => void;
    goToToday: () => void;
    formatDate: (date: Date) => string;
    getEventsForDay: (date: Date) => Events[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [events, setEvents] = useState<Events[]>([]);

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

    const getEventsForDay = useCallback((date: Date) => {
        const dateString = formatDate(date);
        return events.filter(event => event.start_time.startsWith(dateString));
    }, [events, formatDate]);

    const value: CalendarContextType = {
        currentMonth,
        daysInMonth,
        events,
        setEvents,
        goToNextMonth,
        goToPreviousMonth,
        goToToday,
        formatDate,
        getEventsForDay,
    };

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }
    return context;
};