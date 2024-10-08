import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid2,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const renderDayContent = (day: Date) => {
        const dayEvents = events.filter(event =>
            isSameDay(new Date(event.start_time), day)
        );

        return (
            <Box
                onClick={() => onDateClick(day)}
                sx={{
                    height: '100%',
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: isToday(day) ? 'bold' : 'normal',
                        color: isToday(day) ? theme.palette.primary.main : 'inherit',
                    }}
                >
                    {format(day, 'd')}
                </Typography>
                {dayEvents.slice(0, 3).map((event, index) => (
                    <Box
                        key={event.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event.id!);
                        }}
                        sx={{
                            backgroundColor: event.color || theme.palette.primary.main,
                            color: theme.palette.getContrastText(event.color || theme.palette.primary.main),
                            p: 0.5,
                            borderRadius: 1,
                            mb: 0.5,
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {event.title}
                    </Box>
                ))}
                {dayEvents.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                        +{dayEvents.length - 3} more
                    </Typography>
                )}
            </Box>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const start_date = startOfWeek(monthStart);
        const end_date = endOfWeek(monthEnd);

        const dateFormat = "EEE";
        const rows = [];

        let days = [];
        let day = start_date;
        let formattedDate = "";

        while (day <= end_date) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                days.push(
                    <Grid2 size={{ xs: 12 / 7 }} key={day.toString()}>
                        <Paper
                            elevation={1}
                            sx={{
                                height: isMobile ? 100 : 150,
                                opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                            }}
                        >
                            {renderDayContent(cloneDay)}
                        </Paper>
                    </Grid2>
                );
                day = new Date(day.getTime() + 24 * 60 * 60 * 1000); // add 1 day
            }
            rows.push(
                <Grid2 container key={day.toString()} spacing={1}>
                    {days}
                </Grid2>
            );
            days = [];
        }

        return (
            <Box>
                <Grid2 container spacing={1}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                        <Grid2 size={{ xs: 12 / 7 }} key={dayName}>
                            <Typography variant="subtitle2" align="center">
                                {dayName}
                            </Typography>
                        </Grid2>
                    ))}
                </Grid2>
                {rows}
            </Box>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentMonth);
        const weekEnd = endOfWeek(weekStart);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return (
            <Grid2 container spacing={1}>
                {days.map((day) => (
                    <Grid2 size={{ xs: 12 / 7 }} key={day.toString()}>
                        <Paper elevation={1} sx={{ height: 200 }}>
                            {renderDayContent(day)}
                        </Paper>
                    </Grid2>
                ))}
            </Grid2>
        );
    };

    const renderDayView = () => {
        return (
            <Paper elevation={1} sx={{ height: 600, p: 2 }}>
                {renderDayContent(currentMonth)}
            </Paper>
        );
    };

    const calendarContent = useMemo(() => {
        switch (viewMode) {
            case 'day':
                return renderDayView();
            case 'week':
                return renderWeekView();
            case 'month':
            default:
                return renderMonthView();
        }
    }, [viewMode, currentMonth, events, isMobile]);

    return <Box>{calendarContent}</Box>;
};

export default Calendar;