import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Container,
    Box,
    Paper,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { eventApi } from '../services/api/eventApi';
import { Events } from '../types/event';
import { format, startOfMonth, endOfMonth, parseISO, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import CalendarGlance from '../components/Calendar/CalendarGlance';
import EventDialog from '../components/Dialogs/EventDialog';

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
    const [calendarHeight, setCalendarHeight] = useState<number | null>(null);

    const calendarContainerRef = useRef<HTMLDivElement>(null);

    const fetchEventsForMonth = useCallback(async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const start_date = format(startOfMonth(month), 'yyyy-MM-dd');
            const end_date = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({ start_date, end_date });
            const fetchedEvents = response.data || [];

            const dayMap: Record<string, Events> = {};
            // Group by id and date, picking the earliest occurrence for each (id, date)
            for (const evt of fetchedEvents) {
                const eventStart = parseISO(evt.start_time);
                const eventDateStr = format(startOfDay(eventStart), 'yyyy-MM-dd');
                const key = `${evt.id}-${eventDateStr}`;

                // If we haven't added this event for the day or if this occurrence is earlier, take this one
                if (!dayMap[key]) {
                    dayMap[key] = evt;
                } else {
                    // Compare start times and keep the earliest
                    const existing = dayMap[key];
                    if (parseISO(evt.start_time).getTime() < parseISO(existing.start_time).getTime()) {
                        dayMap[key] = evt;
                    }
                }
            }

            const normalizedEvents = Object.values(dayMap);

            normalizedEvents.sort(
                (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
            );

            console.log(normalizedEvents)

            setEvents(normalizedEvents);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [getEvents]);

    useEffect(() => {
        fetchEventsForMonth(currentMonth);
    }, [currentMonth, fetchEventsForMonth]);

    useEffect(() => {
        if (calendarContainerRef.current) {
            setCalendarHeight(calendarContainerRef.current.offsetHeight);
        }
    }, [isLoadingEvents, events]);

    const handleCreateEvent = () => {
        setIsEventFormOpen(true);
    };

    const handleCloseEventForm = () => {
        setIsEventFormOpen(false);
        fetchEventsForMonth(currentMonth);
    };

    const changeMonth = (newDate: Date) => {
        setCurrentMonth(newDate);
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Grid2 container spacing={3} columns={12} sx={{ alignItems: 'flex-start' }}>
                    <Grid2
                        size={{ xs: 12, md: 4 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            maxHeight: calendarHeight ? `${calendarHeight}px` : 'auto',
                            borderRight: `1px solid ${theme.palette.divider}`
                        }}
                    >
                        <CalendarGlance events={events} />
                    </Grid2>
                    <Grid2
                        size={{ xs: 12, md: 8 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        ref={calendarContainerRef}
                    >
                        {isLoadingEvents ? (
                            <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ flexGrow: 1 }}>
                                <Calendar
                                    currentMonth={currentMonth}
                                    events={events}
                                    onDateClick={(date) => console.log('Date clicked:', date)}
                                    onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                                    changeMonth={changeMonth}
                                    goToToday={goToToday}
                                    handleCreateEvent={handleCreateEvent}
                                    viewMode={viewMode}
                                    setViewMode={(mode) => setViewMode(mode)}
                                />
                            </Box>
                        )}
                    </Grid2>
                </Grid2>
            </Paper>

            <EventDialog
                open={isEventFormOpen}
                onClose={handleCloseEventForm}
                onEventCreated={handleCloseEventForm}
            />
        </Container>
    );
};

export default CalendarScreen;
