import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { Events } from '../types/event';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import Calendar from '../components/Calendar/Calendar';
import EventForm from '../components/Event/EventForm';

const CalendarScreen: React.FC = () => {
    const { getEvents } = eventApi;
    const navigate = useNavigate();

    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [events, setEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    // Fetch events for the current month
    const fetchEventsForMonth = async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({
                start_date: startDate,
                end_date: endDate,
            });
            setEvents(response.data || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchEventsForMonth(currentMonth);
    }, [currentMonth]);

    const handleCreateEvent = () => {
        setIsEventFormOpen(true);
    };

    const handleCloseEventForm = () => {
        setIsEventFormOpen(false);
        fetchEventsForMonth(currentMonth);
    };

    const changeMonth = (amount: number) => {
        setCurrentMonth(addMonths(currentMonth, amount));
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    if (isLoadingEvents) return <Typography>Loading calendar...</Typography>;

    return (
        <Container maxWidth="xl">
            <Box my={4}>
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Calendar
                        currentMonth={currentMonth}
                        events={events}
                        onDateClick={(date) => console.log('Date clicked:', date)}
                        onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                        changeMonth={changeMonth}
                        goToToday={goToToday}
                        handleCreateEvent={handleCreateEvent}
                    />
                </Paper>
            </Box>

            <Dialog
                open={isEventFormOpen}
                onClose={handleCloseEventForm}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <EventForm
                        onClose={handleCloseEventForm}
                        onEventCreated={handleCloseEventForm}
                        open={isEventFormOpen}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default CalendarScreen;
