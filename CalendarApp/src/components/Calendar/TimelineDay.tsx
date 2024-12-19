import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { format, isToday, parseISO } from 'date-fns';
import { Clock } from 'lucide-react';
import { Events } from '../../types/event';

type ProcessedEvent = Events & {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
    displayStartTime: string;
    displayEndTime: string;
};

interface TimelineDayProps {
    date: Date;
    dayEvents: ProcessedEvent[];
    getTooltipTimeDisplay: (startTime: Date, endTime: Date, isRecurring?: boolean, isAllDay?: boolean) => string;
}

const TimelineDay: React.FC<TimelineDayProps> = ({
    date,
    dayEvents,
    getTooltipTimeDisplay
}) => {
    const theme = useTheme();
    const sortedEvents = [...dayEvents].sort((a, b) => {
        const aStart = parseISO(a.start_time);
        const aEnd = parseISO(a.end_time);
        const bStart = parseISO(b.start_time);
        const bEnd = parseISO(b.end_time);

        const aMultiDay = (a.displayStartTime.slice(0, 10) !== a.displayEndTime.slice(0, 10));
        const bMultiDay = (b.displayStartTime.slice(0, 10) !== b.displayEndTime.slice(0, 10));

        if (aMultiDay !== bMultiDay) return aMultiDay ? 1 : -1;
        return aStart.getTime() - bStart.getTime();
    });

    const isCurrentDay = isToday(date);

    return (
        <Box sx={{ mb: 1 }}>
            <Box sx={{
                display: 'flex',
                borderBottom: 1,
                borderColor: 'divider',
                p: 3,
                backgroundColor: isCurrentDay ? theme.palette.action.hover : 'transparent',
                borderRadius: 1,
                transition: 'background 0.3s'
            }}>
                <Typography sx={{
                    width: 60,
                    fontWeight: 'medium',
                    fontSize: '0.875rem',
                    color: isCurrentDay ? theme.palette.primary.main : 'text.primary'
                }}>
                    {format(date, 'EEE')}
                    <span style={{ display: 'block', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        {format(date, 'MMM d')}
                    </span>
                </Typography>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: '32px' }}>
                    {sortedEvents.map((event) => {
                        const displayStart = parseISO(event.displayStartTime);
                        const displayEnd = parseISO(event.displayEndTime);
                        return (
                            <Tooltip
                                key={`${event.id}-${event.start_time}`}
                                title={
                                    <Box sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {event.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.75rem' }}>
                                            <Clock style={{ width: 12, height: 12 }} />
                                            <span>
                                                {getTooltipTimeDisplay(displayStart, displayEnd, event.recurring || event.is_recurring, event.is_all_day)}
                                            </span>
                                        </Box>
                                    </Box>
                                }
                            >
                                <Box
                                    sx={{
                                        borderRadius: 1,
                                        px: 2,
                                        py: 1,
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s, transform 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        '&:hover': { opacity: 0.9, transform: 'scale(1.01)' },
                                        backgroundColor: event.color || theme.palette.primary.main,
                                        color: 'white',
                                        height: 'auto',
                                        minHeight: '24px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        <Typography
                                            sx={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {event.title}
                                        </Typography>
                                        {!event.is_all_day && (
                                            <Typography
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.9,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {getTooltipTimeDisplay(displayStart, displayEnd, event.recurring || event.is_recurring, event.is_all_day)}
                                            </Typography>
                                        )}
                                        {event.is_all_day && (
                                            <Typography
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.9,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                All Day
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Tooltip>
                        );
                    })}

                    {sortedEvents.length === 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                            No events
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default TimelineDay;
