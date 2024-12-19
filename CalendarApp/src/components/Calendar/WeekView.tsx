import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { addDays, startOfWeek } from 'date-fns';
import TimelineDay from './TimelineDay';
import { Events } from '../../types/event';

type ViewType = 'day' | 'week' | 'month';

type ProcessedEvent = Events & {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
    displayStartTime: string;
    displayEndTime: string;
};

interface WeekViewProps {
    currentDate: Date;
    processEventsForDay: (date: Date) => ProcessedEvent[];
    getTooltipTimeDisplay: (startTime: Date, endTime: Date, isRecurring?: boolean, isAllDay?: boolean) => string;
}

const WeekView: React.FC<WeekViewProps> = ({
    currentDate,
    processEventsForDay,
    getTooltipTimeDisplay
}) => {
    const theme = useTheme();
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const content = weekDays.map(day => {
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

    const noEventsInWeek = weekDays.every(day => processEventsForDay(day).length === 0);

    return (
        <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column', borderRadius: 1, p: 1, background: theme.palette.mode === 'dark' ? '#303030' : '#fafafa' }}>
            {content}
            {noEventsInWeek && (
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
                    No events
                </Typography>
            )}
        </Box>
    );
};

export default WeekView;
