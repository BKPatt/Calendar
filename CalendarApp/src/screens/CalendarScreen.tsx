import React, { useState, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Paper,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useTheme, alpha } from '@mui/system';
import {
    ChevronLeft,
    ChevronRight,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { useApi } from '../hooks/useApi';
import { getEvents } from '../services/api';
import { Events } from '../types/event';
import EventForm from '../components/Event/EventForm';

const CalendarScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    const { data: events, isLoading, error, refetch } = useApi<Events[]>(() =>
        getEvents({
            start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        })
    );

    const changeMonth = useCallback((amount: number) => {
        setCurrentMonth(prevMonth => amount > 0 ? addMonths(prevMonth, 1) : subMonths(prevMonth, 1));
    }, []);

    const handleDateClick = useCallback((day: Date) => {
        setSelectedDate(day);
    }, []);

    const handleEventClick = useCallback((eventId: number) => {
        navigate(`/events/${eventId}`);
    }, [navigate]);

    const handleCreateEvent = useCallback(() => {
        setIsEventFormOpen(true);
    }, []);

    const handleEventFormClose = useCallback(() => {
        setIsEventFormOpen(false);
        refetch();
    }, [refetch]);

    const renderCalendar = useCallback(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = monthStart;
        const endDate = monthEnd;

        const dateFormat = "d";
        const rows = [];

        let days = eachDayOfInterval({ start: startDate, end: endDate });
        let formattedDays = days.map(day => ({
            date: day,
            events: events?.filter(event => isSameDay(new Date(event.startTime), day)) || []
        }));

        let dayCounter = 0;
        for (let i = 0; i < 6; i++) {
            let row = [];
            for (let j = 0; j < 7; j++) {
                let day = formattedDays[dayCounter];
                if (day) {
                    row.push(
                        <Grid item key={day.date.toString()} xs={1} sm={1} md={1} lg={1}>
                            <Paper
                                elevation={isSameDay(day.date, selectedDate) ? 8 : 1}
                                sx={{
                                    height: 100,
                                    cursor: 'pointer',
                                    bgcolor: isSameDay(day.date, new Date())
                                        ? alpha(theme.palette.primary.main, 0.1)
                                        : 'background.paper',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                }}
                                onClick={() => handleDateClick(day.date)}
                            >
                                <Box p={1}>
                                    <Typography
                                        color={
                                            !isSameMonth(day.date, monthStart)
                                                ? 'text.disabled'
                                                : 'text.primary'
                                        }
                                    >
                                        {format(day.date, dateFormat)}
                                    </Typography>
                                    {day.events.slice(0, 2).map((event) => (
                                        <Box
                                            key={event.id}
                                            sx={{
                                                bgcolor: event.color || theme.palette.primary.main,
                                                color: 'white',
                                                borderRadius: 1,
                                                p: 0.5,
                                                mt: 0.5,
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                            }}
                                            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                                                e.stopPropagation();
                                                handleEventClick(event.id);
                                            }}
                                        >
                                            {event.title}
                                        </Box>
                                    ))}
                                    {day.events.length > 2 && (
                                        <Typography variant="caption" color="text.secondary">
                                            +{day.events.length - 2} more
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    );
                    dayCounter++;
                } else {
                    row.push(<Grid item key={`empty-${i}-${j}`} xs={1} sm={1} md={1} lg={1} />);
                }
            }
            rows.push(
                <Grid container item spacing={1} key={i}>
                    {row}
                </Grid>
            );
        }

        return rows;
    }, [currentMonth, events, selectedDate, handleDateClick, handleEventClick, theme]);

    if (isLoading) return <Typography>Loading calendar...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4">
                        {format(currentMonth, 'MMMM yyyy')}
                    </Typography>
                    <Box>
                        <IconButton onClick={() => changeMonth(-1)}>
                            <ChevronLeft />
                        </IconButton>
                        <IconButton onClick={() => changeMonth(1)}>
                            <ChevronRight />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateEvent}
                            sx={{ ml: 2 }}
                        >
                            Create Event
                        </Button>
                    </Box>
                </Box>
                <Grid container spacing={1}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <Grid item xs={1} sm={1} md={1} lg={1} key={day}>
                            <Typography align="center" fontWeight="bold">
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                <Box mt={1}>
                    <Grid container spacing={1}>
                        {renderCalendar()}
                    </Grid>
                </Box>
            </Box>
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
        </Container>
    );
};

export default CalendarScreen;