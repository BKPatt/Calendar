import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    Tooltip,
    useTheme
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isSameDay,
    format,
    isToday,
    addDays,
    addMonths,
    startOfToday
} from 'date-fns';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import { Events } from '../../types/event';

interface CalendarProps {
    currentMonth: Date;
    events: Events[];
    onDateClick: (date: Date) => void;
    onEventClick: (eventId: number) => void;
    changeMonth: (date: Date) => void;
    goToToday: () => void;
    handleCreateEvent: () => void;
    viewMode: 'day' | 'week' | 'month';
    setViewMode: (mode: 'day' | 'week' | 'month') => void;
}

export default function Calendar({
    currentMonth,
    events,
    onDateClick,
    onEventClick,
    viewMode,
    changeMonth,
    goToToday,
    handleCreateEvent,
    setViewMode
}: CalendarProps) {
    const theme = useTheme();

    const renderEventItem = (event: Events, isCompact: boolean) => (
        <Tooltip title={`${event.title} - ${format(new Date(event.start_time), 'HH:mm')}`} key={event.id} arrow>
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
                    '&:hover': { filter: 'brightness(0.9)' }
                }}
            >
                {isCompact ? '•' : event.title}
            </Box>
        </Tooltip>
    );

    function getEventDate(event: Events): Date {
        if (event.is_all_day) {
            const dateStr = event.start_time.split('T')[0];
            const [year, month, day] = dateStr.split('-');
            return new Date(Number(year), Number(month) - 1, Number(day));
        } else {
            return new Date(event.start_time);
        }
    }

    const renderDayContent = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(getEventDate(e), day));
        return (
            <Box
                onClick={() => onDateClick(day)}
                sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    p: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
                aria-label={format(day, 'd MMM yyyy')}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: isToday(day) ? 'bold' : 'normal',
                        color: isToday(day) ? theme.palette.primary.main : 'inherit',
                        mb: '2px'
                    }}
                >
                    {format(day, 'd')}
                </Typography>
                <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                    {dayEvents.length > 0 && (
                        dayEvents.length <= 3
                            ? dayEvents.map(e => renderEventItem(e, false))
                            : (
                                <>
                                    {renderEventItem(dayEvents[0], false)}
                                    {renderEventItem(dayEvents[1], false)}
                                    <Tooltip title={`${dayEvents.length - 2} more events`} arrow>
                                        <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }}>
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
        const start_date = startOfWeek(monthStart, { weekStartsOn: 0 });
        const end_date = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const rows = [];
        let days = [];
        let day = start_date;
        while (day <= end_date) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                days.push(
                    <Grid2 size={1} key={day.toString()} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: '100%',
                                aspectRatio: '1',
                                opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                                overflow: 'hidden',
                                display: 'flex'
                            }}
                        >
                            {renderDayContent(cloneDay)}
                        </Box>
                    </Grid2>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <Grid2 container columns={7} spacing={0.5} sx={{ mb: 0.5 }} key={day.toString()}>
                    {days}
                </Grid2>
            );
            days = [];
        }
        return (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Grid2 container columns={7} spacing={0.5} sx={{ mb: 0.5 }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <Grid2 size={1} key={d}>
                            <Typography variant="caption" align="center" sx={{ fontWeight: 'bold' }}>
                                {d}
                            </Typography>
                        </Grid2>
                    ))}
                </Grid2>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {rows}
                </Box>
            </Box>
        );
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const renderEventsInHour = (day: Date, hour: number) => {
        const hourStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
        const hourEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 59, 59);
        const hourEvents = events.filter(e => {
            const st = getEventDate(e);
            return st >= hourStart && st <= hourEnd && isSameDay(st, day);
        });
        return hourEvents.map(e => renderEventItem(e, false));
    };

    const renderDayHours = (day: Date) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {hours.map(h => (
                <Box
                    key={h}
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                        minHeight: '40px',
                        p: '2px'
                    }}
                >
                    {renderEventsInHour(day, h)}
                </Box>
            ))}
        </Box>
    );

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
        const daysInWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        return (
            <Box sx={{ width: '100%' }}>
                <Grid2 container columns={7} spacing={0.5} sx={{ mb: 0.5 }}>
                    {daysInWeek.map(day => (
                        <Grid2 size={1} key={day.toString()}>
                            <Typography variant="caption" align="center" sx={{ fontWeight: 'bold' }}>
                                {format(day, 'EEE d')}
                            </Typography>
                        </Grid2>
                    ))}
                </Grid2>
                <Grid2 container columns={7} spacing={0.5}>
                    {daysInWeek.map(day => (
                        <Grid2 size={1} key={day.toString()}>
                            {renderDayHours(day)}
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        );
    };

    const renderDayView = () => (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {format(currentMonth, 'EEEE, d MMM yyyy')}
            </Typography>
            {renderDayHours(currentMonth)}
        </Box>
    );

    const calendarContent = useMemo(() => {
        if (viewMode === 'month') return renderMonthView();
        if (viewMode === 'week') return renderWeekView();
        if (viewMode === 'day') return renderDayView();
    }, [currentMonth, events, viewMode]);

    const handlePrev = () => {
        if (viewMode === 'month') {
            changeMonth(addMonths(currentMonth, -1));
        } else if (viewMode === 'week') {
            changeMonth(addDays(currentMonth, -7));
        } else {
            changeMonth(addDays(currentMonth, -1));
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            changeMonth(addMonths(currentMonth, 1));
        } else if (viewMode === 'week') {
            changeMonth(addDays(currentMonth, 7));
        } else {
            changeMonth(addDays(currentMonth, 1));
        }
    };

    const handleGoToToday = () => {
        const today = startOfToday();
        if (viewMode === 'month') {
            changeMonth(startOfMonth(today));
        } else if (viewMode === 'week') {
            changeMonth(startOfWeek(today, { weekStartsOn: 0 }));
        } else {
            changeMonth(today);
        }
    };

    const handleViewModeChange = (newMode: 'day' | 'week' | 'month') => {
        const today = startOfToday();
        if (newMode === 'day') {
            changeMonth(today);
        } else if (newMode === 'week') {
            changeMonth(startOfWeek(currentMonth, { weekStartsOn: 0 }));
        } else {
            changeMonth(startOfMonth(currentMonth));
        }
        setViewMode(newMode);
    };

    let headerText = '';
    if (viewMode === 'month') {
        headerText = format(currentMonth, 'MMMM yyyy');
    } else if (viewMode === 'week') {
        const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
        headerText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
        headerText = format(currentMonth, 'EEEE, d MMM yyyy');
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handlePrev}>
                        <ArrowBackIosIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="h6" sx={{ minWidth: '200px', textAlign: 'center' }}>
                        {headerText}
                    </Typography>
                    <IconButton onClick={handleNext}>
                        <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={handleGoToToday}>
                        <TodayIcon />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small">
                        <Select
                            value={viewMode}
                            onChange={(e) => handleViewModeChange(e.target.value as 'day' | 'week' | 'month')}
                        >
                            <MenuItem value="day">Day</MenuItem>
                            <MenuItem value="week">Week</MenuItem>
                            <MenuItem value="month">Month</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateEvent}
                        sx={{
                            backgroundColor: theme.palette.grey[200],
                            color: theme.palette.text.primary,
                        }}
                    >
                        Create Event
                    </Button>
                </Box>
            </Box>
            {calendarContent}
        </Box>
    );
}
