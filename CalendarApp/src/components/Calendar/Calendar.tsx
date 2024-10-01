import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Grid2,
    Button,
    useTheme,
    useMediaQuery,
    Tooltip,
    Card,
    CardActionArea,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today as TodayIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
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
    events: Events[] | null;
    onDateClick: (date: Date) => void;
    onEventClick: (eventId: number) => void;
    changeMonth: (amount: number) => void;
    goToToday: () => void;
    handleCreateEvent: () => void;
}

const CalendarContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: theme.palette.background.default,
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
}));

interface DayCellProps {
    isToday?: boolean;
    isSelected?: boolean;
    isCurrentMonth?: boolean;
}

const DayCell = styled(Card, {
    shouldForwardProp: (prop) =>
        prop !== 'isToday' && prop !== 'isSelected' && prop !== 'isCurrentMonth',
})<DayCellProps>(({ theme, isToday, isSelected, isCurrentMonth }) => ({
    height: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    backgroundColor: isSelected
        ? theme.palette.primary.main
        : isToday
            ? theme.palette.primary.light
            : theme.palette.background.paper,
    color: isSelected
        ? theme.palette.primary.contrastText
        : isToday
            ? theme.palette.primary.contrastText
            : theme.palette.text.primary,
    opacity: isCurrentMonth ? 1 : 0.5,
    borderRadius: '8px',
    boxShadow: isToday ? '0px 4px 10px rgba(0, 0, 0, 0.2)' : '0px 1px 5px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
    '&:hover': {
        backgroundColor: isSelected
            ? theme.palette.primary.dark
            : theme.palette.action.hover,
        transform: 'scale(1.03)',
    },
}));

const DayNumber = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isToday',
})<{ isToday?: boolean }>(({ theme, isToday }) => ({
    fontWeight: isToday ? 'bold' : 'normal',
    color: isToday ? theme.palette.secondary.main : theme.palette.text.primary,
}));

const EventDot = styled(Box)(({ theme }) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
    marginRight: 4,
}));

const Calendar: React.FC<CalendarProps> = ({
    currentMonth,
    events,
    onDateClick,
    onEventClick,
    changeMonth,
    goToToday,
    handleCreateEvent,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => ({
            date: day,
            events: events?.filter((event) => isSameDay(new Date(event.startTime), day)) || [],
        }));
    }, [currentMonth, events]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <CalendarContainer>
            <CalendarHeader>
                <Box display="flex" alignItems="center">
                    <IconButton onClick={() => changeMonth(-1)}>
                        <ChevronLeft />
                    </IconButton>
                    <Typography variant="h5" sx={{ mx: 2 }}>
                        {format(currentMonth, 'MMMM yyyy')}
                    </Typography>
                    <IconButton onClick={() => changeMonth(1)}>
                        <ChevronRight />
                    </IconButton>
                </Box>
                <Box>
                    <Button startIcon={<TodayIcon />} onClick={goToToday} sx={{ mr: 1 }}>
                        Today
                    </Button>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={handleCreateEvent}>
                        Create Event
                    </Button>
                </Box>
            </CalendarHeader>

            <Grid2 container spacing={1}>
                {weekDays.map((day) => (
                    <Grid2 key={day} size={12 / 7} display="flex" justifyContent="center">
                        <Typography align="center" variant="subtitle2">
                            {isMobile ? day.charAt(0) : day}
                        </Typography>
                    </Grid2>
                ))}
            </Grid2>

            <Grid2 container spacing={1}>
                {calendarDays.map(({ date, events }) => (
                    <Grid2 key={date.toISOString()} size={12 / 7}>
                        <CardActionArea>
                            <DayCell
                                isToday={isToday(date)}
                                isSelected={isSameDay(date, new Date())}
                                isCurrentMonth={isSameMonth(date, currentMonth)}
                                onClick={() => onDateClick(date)}
                            >
                                <DayNumber variant="body2" isToday={isToday(date)}>
                                    {format(date, 'd')}
                                </DayNumber>
                                {events.slice(0, 3).map((event, index) => (
                                    <Tooltip key={index} title={event.title} arrow>
                                        <Box display="flex" alignItems="center" mt={0.5}>
                                            <EventDot />
                                            {!isMobile && (
                                                <Typography variant="caption" noWrap>
                                                    {event.title}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Tooltip>
                                ))}
                                {events.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                        +{events.length - 3} more
                                    </Typography>
                                )}
                            </DayCell>
                        </CardActionArea>
                    </Grid2>
                ))}
            </Grid2>
        </CalendarContainer>
    );
};

export default Calendar;
