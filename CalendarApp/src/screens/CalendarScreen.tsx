import React, { useState, useCallback, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    useTheme,
    useMediaQuery,
    IconButton,
    Tooltip,
    Grid2,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today as TodayIcon,
    Add as AddIcon,
    ViewDay,
    ViewWeek,
    CalendarViewMonth,
} from '@mui/icons-material';
import { eventApi } from '../services/api/eventApi';
import { Events } from '../types/event';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import EventForm from '../components/Event/EventForm';
import CalendarGlance from '../components/Calendar/CalendarGlance';

const CalendarScreen: React.FC = () => {
    const { getEvents } = eventApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [events, setEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

    const fetchEventsForMonth = useCallback(async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const start_date = format(startOfMonth(month), 'yyyy-MM-dd');
            const end_date = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({
                start_date: start_date,
                end_date: end_date,
            });
            console.log(response.data)
            setEvents(response.data || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [getEvents]);

    useEffect(() => {
        fetchEventsForMonth(currentMonth);
    }, [currentMonth, fetchEventsForMonth]);

    const handleCreateEvent = () => {
        setIsEventFormOpen(true);
    };

    const handleCloseEventForm = () => {
        setIsEventFormOpen(false);
        fetchEventsForMonth(currentMonth);
    };

    const changeMonth = (amount: number) => {
        setCurrentMonth(prevMonth => amount > 0 ? addMonths(prevMonth, 1) : subMonths(prevMonth, 1));
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, sm: 4, md: 3 }}>
                        <CalendarGlance events={events} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 8, md: 9 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h4" component="h1">
                                {format(currentMonth, 'MMMM yyyy')}
                            </Typography>
                            <Box>
                                <IconButton onClick={() => changeMonth(-1)} aria-label="Previous month">
                                    <ChevronLeft />
                                </IconButton>
                                <IconButton onClick={goToToday} aria-label="Go to today">
                                    <TodayIcon />
                                </IconButton>
                                <IconButton onClick={() => changeMonth(1)} aria-label="Next month">
                                    <ChevronRight />
                                </IconButton>
                            </Box>
                        </Box>

                        {isLoadingEvents ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Calendar
                                currentMonth={currentMonth}
                                events={events}
                                onDateClick={(date) => console.log('Date clicked:', date)}
                                onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                                changeMonth={changeMonth}
                                goToToday={goToToday}
                                handleCreateEvent={handleCreateEvent}
                                viewMode={viewMode}
                            />
                        )}
                    </Grid2>
                </Grid2>
            </Paper>

            <Dialog
                open={isEventFormOpen}
                onClose={handleCloseEventForm}
                fullWidth
                maxWidth="md"
                fullScreen={isMobile}
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
