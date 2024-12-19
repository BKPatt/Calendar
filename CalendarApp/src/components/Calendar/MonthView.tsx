import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import TimelineDay from './TimelineDay';
import { Events } from '../../types/event';

type ProcessedEvent = Events & {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
    displayStartTime: string;
    displayEndTime: string;
};

interface MonthViewProps {
    currentDate: Date;
    processEventsForDay: (date: Date) => ProcessedEvent[];
    getTooltipTimeDisplay: (startTime: Date, endTime: Date, isRecurring?: boolean, isAllDay?: boolean) => string;
}

const MonthView: React.FC<MonthViewProps> = ({
    currentDate,
    processEventsForDay,
    getTooltipTimeDisplay
}) => {
    const theme = useTheme();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const content = monthDays.map(day => {
        const dayEvents = processEventsForDay(day);
        return (
            <TimelineDay
                key={day.toISOString()}
                date={day}
                dayEvents={dayEvents}
                getTooltipTimeDisplay={getTooltipTimeDisplay}
            />
        );
    });

    const noEventsInMonth = monthDays.every(day => processEventsForDay(day).length === 0);

    return (
        <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column', borderRadius: 1, p: 1, background: theme.palette.mode === 'dark' ? '#303030' : '#fafafa' }}>
            {content}
            {noEventsInMonth && (
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
                    No events
                </Typography>
            )}
        </Box>
    );
};

export default MonthView;
