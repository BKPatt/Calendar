import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    useTheme,
    Tooltip,
} from '@mui/material';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isSameDay,
    format,
    isToday,
} from 'date-fns';
import { Events } from '../../types/event';

interface CalendarProps {
    currentMonth: Date;
    events: Events[];
    onDateClick: (date: Date) => void;
    onEventClick: (eventId: number) => void;
    changeMonth: (amount: number) => void;
    goToToday: () => void;
    handleCreateEvent: () => void;
    viewMode: 'day' | 'week' | 'month';
}

const Calendar: React.FC<CalendarProps> = ({
    currentMonth,
    events,
    onDateClick,
    onEventClick,
    viewMode,
}) => {
    const theme = useTheme();

    const renderEventItem = (event: Events, isCompact: boolean) => (
        <Tooltip title={`${event.title} - ${format(new Date(event.start_time), 'HH:mm')}`} key={event.id}>
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event.id!);
                }}
                sx={{
                    backgroundColor: event.color || theme.palette.primary.main,
                    color: theme.palette.getContrastText(event.color || theme.palette.primary.main),
                    p: isCompact ? '1px 2px' : '2px 4px',
                    borderRadius: '4px',
                    mb: '2px',
                    fontSize: isCompact ? '0.6rem' : '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    '&:hover': {
                        filter: 'brightness(0.9)',
                    },
                }}
            >
                {isCompact ? '•' : event.title}
            </Box>
        </Tooltip>
    );

    const renderDayContent = (day: Date) => {
        const dayEvents = events.filter(event =>
            isSameDay(new Date(event.start_time), day)
        );

        return (
            <Box
                onClick={() => onDateClick(day)}
                sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                    '&:focus': { outline: 'none' },
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: isToday(day) ? 'bold' : 'normal',
                        color: isToday(day) ? theme.palette.primary.main : 'inherit',
                    }}
                >
                    {format(day, 'd')}
                </Typography>
                <Box sx={{ mt: '2px', overflow: 'hidden', flexGrow: 1 }}>
                    {dayEvents.length > 0 && (
                        dayEvents.length <= 3
                            ? dayEvents.map(event => renderEventItem(event, false))
                            : (
                                <>
                                    {renderEventItem(dayEvents[0], false)}
                                    {renderEventItem(dayEvents[1], false)}
                                    <Tooltip title={`${dayEvents.length - 2} more events`}>
                                        <Typography variant="caption" color="text.secondary">
                                            +{dayEvents.length - 2} more
                                        </Typography>
                                    </Tooltip>
                                </>
                            )
                    )}
                </Box>
            </Box>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const start_date = startOfWeek(monthStart);
        const end_date = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = start_date;

        while (day <= end_date) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                days.push(
                    <Grid item xs={1} key={day.toString()} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: '100%',
                                aspectRatio: '1',
                                opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                            }}
                        >
                            {renderDayContent(cloneDay)}
                        </Box>
                    </Grid>
                );
                day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
            }
            rows.push(
                <Grid container key={day.toString()} columns={7} spacing={0.5} sx={{ mb: 0.5 }}>
                    {days}
                </Grid>
            );
            days = [];
        }

        return (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Grid container columns={7} spacing={0.5} sx={{ mb: 0.5 }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((dayName) => (
                        <Grid item xs={1} key={dayName}>
                            <Typography variant="caption" align="center">
                                {dayName}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {rows}
                </Box>
            </Box>
        );
    };

    const calendarContent = useMemo(() => {
        return renderMonthView();
    }, [currentMonth, events]);

    return <Box sx={{ width: '100%' }}>{calendarContent}</Box>;
};

export default Calendar;
