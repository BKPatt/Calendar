import React, { useState, useEffect } from 'react';
import { Grid2, Typography, IconButton, Box } from '@mui/material';
import { styled } from '@mui/system';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    format,
    addMonths,
    subMonths
} from 'date-fns';
import Day from './Day';
import { Events } from '../../types/event';
import { useApi } from '../../hooks/useApi';
import { getEvents } from '../../services/api';

const CalendarContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
}));

const DaysContainer = styled(Grid2)(({ theme }) => ({
    width: '100%',
}));

const Calendar: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    const startDate = startOfMonth(monthStart);
    const endDate = endOfMonth(monthEnd);

    const dateFormat = "MMMM yyyy";
    const rows = [];

    let days = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    let formattedDays = days.map(day => ({
        date: day,
        events: events?.filter(event =>
            new Date(event.startTime).toDateString() === day.toDateString()
        ) || []
    }));

    for (let i = 0; i < formattedDays.length; i += 7) {
        rows.push(formattedDays.slice(i, i + 7));
    }

    return (
        <CalendarContainer>
            <CalendarHeader>
                <IconButton onClick={() => changeMonth(-1)}>
                    <ChevronLeft />
                </IconButton>
                <Typography variant="h4">
                    {format(currentMonth, dateFormat)}
                </Typography>
                <IconButton onClick={() => changeMonth(1)}>
                    <ChevronRight />
                </IconButton>
            </CalendarHeader>
            <DaysContainer container spacing={1} columns={12}>
                {rows.map((row, i) => (
                    <React.Fragment key={i}>
                        {row.map(({ date, events }) => (
                            <Grid2 key={date.toISOString()} size={2}>
                                <Day
                                    date={date}
                                    events={events}
                                    isToday={date.toDateString() === new Date().toDateString()}
                                    isSelected={selectedDate?.toDateString() === date.toDateString()}
                                    onSelect={onDateClick}
                                    isCurrentMonth={isSameMonth(date, currentMonth)}
                                />
                            </Grid2>
                        ))}
                    </React.Fragment>
                ))}
            </DaysContainer>
        </CalendarContainer>
    );
};

export default Calendar;
