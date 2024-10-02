import React, { useState, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Dialog,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getUpcomingEvents } from '../services/api';
import { Events } from '../types/event';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import Calendar from '../components/Calendar/Calendar';
import EventForm from '../components/Event/EventForm';

const CalendarScreen: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    const navigate = useNavigate();

    const { data: events, isLoading, error, refetch } = useApi<Events[]>(getUpcomingEvents);

    console.log('API request:', {
        start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
    });

    console.log('Fetched events:', events);

    const changeMonth = useCallback((amount: number) => {
        setCurrentMonth((prevMonth) => addMonths(prevMonth, amount));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    }, []);

    const handleCreateEvent = useCallback(() => {
        setIsEventFormOpen(true);
    }, []);

    const handleEventFormClose = useCallback(() => {
        setIsEventFormOpen(false);
        refetch();
    }, [refetch]);

    const handleEventClick = useCallback((eventId: number) => {
        navigate(`/events/${eventId}`);
    }, [navigate]);

    const handleDateClick = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    if (isLoading) return <Typography>Loading calendar...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Calendar
                    currentMonth={currentMonth}
                    events={events || []}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    changeMonth={changeMonth}
                    goToToday={goToToday}
                    handleCreateEvent={handleCreateEvent}
                />

                <Dialog open={isEventFormOpen} onClose={handleEventFormClose} maxWidth="md" fullWidth>
                    <EventForm
                        open={isEventFormOpen}
                        onClose={handleEventFormClose}
                        onEventCreated={refetch}
                    />
                </Dialog>
            </Box>
        </Container>
    );
};

export default CalendarScreen;
