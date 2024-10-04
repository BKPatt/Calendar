import React, { useState, useEffect } from 'react';
import {
    Grid2,
    Typography,
    IconButton,
    Box,
    useMediaQuery
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    format,
    addMonths,
    subMonths,
    isSameDay
} from 'date-fns';
import Day from './Day';
import Event from './Event';
import { Events } from '../../types/event';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';

const MonthViewContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
}));

const MonthHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
}));

const WeekDaysHeader = styled(Grid2)(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

const DaysGrid = styled(Grid2)(({ theme }) => ({
    height: '70vh',
    overflow: 'auto',
}));

const EventList = styled(Box)(({ theme }) => ({
    maxHeight: '30vh',
    overflowY: 'auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
}));

const MonthView: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { getEvents } = eventApi;

    const { data: events, isLoading, error, refetch } = useApi<Events[]>(getEvents);

    useEffect(() => {
        refetch();
    }, [currentMonth]);

    const onDateClick = (day: Date) => setSelectedDate(day);

    const changeMonth = (amount: number) => {
        setCurrentMonth(prevMonth => amount > 0 ? addMonths(prevMonth, 1) : subMonths(prevMonth, 1));
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateFormat = "MMMM yyyy";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getEventsForDay = (day: Date): Events[] => {
        return events?.filter(event =>
            isSameDay(new Date(event.start_time), day)
        ) || [];
    };

    const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

    return (
        <MonthViewContainer>
            <MonthHeader>
                <IconButton onClick={() => changeMonth(-1)}>
                    <ChevronLeft />
                </IconButton>
                <Typography variant="h4">
                    {format(currentMonth, dateFormat)}
                </Typography>
                <IconButton onClick={() => changeMonth(1)}>
                    <ChevronRight />
                </IconButton>
            </MonthHeader>

            <WeekDaysHeader container>
                {weekDays.map(day => (
                    <Grid2 key={day} size={1} container justifyContent="center">
                        <Typography align="center" variant="subtitle2">
                            {day}
                        </Typography>
                    </Grid2>
                ))}
            </WeekDaysHeader>

            <DaysGrid container spacing={1}>
                {days.map((day) => (
                    <Grid2 key={day.toISOString()} size={isMobile ? 3 : 1.7}>
                        <Day
                            date={day}
                            events={getEventsForDay(day)}
                            isToday={isSameDay(day, new Date())}
                            isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                            onSelect={onDateClick}
                            isCurrentMonth={isSameMonth(day, currentMonth)}
                        />
                    </Grid2>
                ))}
            </DaysGrid>

            {selectedDate && (
                <EventList>
                    <Typography variant="h6" gutterBottom>
                        Events for {format(selectedDate, 'MMMM d, yyyy')}
                    </Typography>
                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                            <Event key={event.id} event={event} />
                        ))
                    ) : (
                        <Typography>No events for this day.</Typography>
                    )}
                </EventList>
            )}
        </MonthViewContainer>
    );
};

export default MonthView;
