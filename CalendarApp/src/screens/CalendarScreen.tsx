import React, { useState, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getEvents } from '../services/api';
import { Events } from '../types/event';
import EventForm from '../components/Event/EventForm';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import Calendar from '../components/Calendar/Calendar';

const CalendarScreen: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    const navigate = useNavigate();

    // Fetch events using the existing API hook
    const { data: events, isLoading, error, refetch } = useApi<Events[]>(() =>
        getEvents({
            start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        })
    );

    // Function to change month
    const changeMonth = useCallback((amount: number) => {
        setCurrentMonth((prevMonth) => (amount > 0 ? addMonths(prevMonth, 1) : subMonths(prevMonth, 1)));
    }, []);

    // Function to reset calendar to the current date
    const goToToday = useCallback(() => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    }, []);

    // Function to open event creation form
    const handleCreateEvent = useCallback(() => {
        setIsEventFormOpen(true);
    }, []);

    // Function to close event creation form
    const handleEventFormClose = useCallback(() => {
        setIsEventFormOpen(false);
        refetch();
    }, [refetch]);

    // Navigate to the event details page when an event is clicked
    const handleEventClick = useCallback((eventId: number) => {
        navigate(`/events/${eventId}`);
    }, [navigate]);

    if (isLoading) return <Typography>Loading calendar...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                {/* Calendar component */}
                <Calendar
                    currentMonth={currentMonth}
                    events={events}
                    onDateClick={setSelectedDate}
                    onEventClick={handleEventClick}
                    changeMonth={changeMonth}
                    goToToday={goToToday}
                    handleCreateEvent={handleCreateEvent}
                />

                {/* Dialog for creating a new event */}
                <Dialog open={isEventFormOpen} onClose={handleEventFormClose} maxWidth="md" fullWidth>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogContent>
                        <EventForm
                            onSubmit={() => {
                                handleEventFormClose();
                                refetch();
                            }}
                            onCancel={handleEventFormClose}
                            initialDate={selectedDate || new Date()}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEventFormClose}>Cancel</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default CalendarScreen;
