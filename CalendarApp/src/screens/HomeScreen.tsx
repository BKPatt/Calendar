import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid2,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Event as EventIcon,
    Group as GroupIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { getUpcomingEvents, getGroups } from '../services/api';
import { Events } from '../types/event';
import EventCreateScreen from '../dialogs/EventCreateScreen';
import { startOfMonth, addMonths } from 'date-fns';
import Calendar from '../components/Calendar/Calendar';
import UpcomingEventsWidget from '../components/Event/UpcomingEventsWidget';
import GroupOverview from '../components/Group/GroupOverview';
import WorkScheduleOverview from '../components/Event/WorkScheduleOverview';

const HomeScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // API Hooks to get upcoming events and groups
    const { data: upcomingEvents, isLoading: isLoadingEvents, error: errorEvents, refetch: refetchEvents } = useApi<Events[]>(getUpcomingEvents);
    const { data: groups, isLoading: isLoadingGroups, error: errorGroups, refetch: refetchGroups } = useApi(getGroups);

    const [isEventCreateOpen, setIsEventCreateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

    const handleCreateEvent = () => {
        setIsEventCreateOpen(true);
    };

    const handleCloseEventCreate = () => {
        setIsEventCreateOpen(false);
        refetchEvents(); // Refresh the events list after creating a new event
    };

    const handleEventCreated = () => {
        refetchEvents(); // Refresh events after creation
    };

    const handleViewAllEvents = () => {
        navigate('/events');
    };

    const handleViewGroups = () => {
        navigate('/groups');
    };

    const changeMonth = (amount: number) => {
        setCurrentMonth(addMonths(currentMonth, amount));
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    const handleDateClick = (date: Date) => {
        console.log('Date clicked:', date);
    };

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    // Render conditional content dynamically based on data availability and errors
    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {user?.firstName || 'User'}!
                </Typography>

                <Grid2 container spacing={4}>
                    {/* Upcoming Events Section */}
                    <Grid2 size={{ xs: 12, md: 8, lg: 6 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            {isLoadingEvents ? (
                                <CircularProgress />
                            ) : errorEvents ? (
                                <Typography variant="body2" color="error">
                                    Unable to load upcoming events.
                                </Typography>
                            ) : upcomingEvents && upcomingEvents.length > 0 ? (
                                <UpcomingEventsWidget />
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    No upcoming events available.
                                </Typography>
                            )}
                        </Paper>
                    </Grid2>

                    {/* Quick Actions Section */}
                    <Grid2 size={{ xs: 12, md: 4, lg: 3 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Quick Actions
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    fullWidth
                                    onClick={handleCreateEvent}
                                >
                                    Create Event
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<GroupIcon />}
                                    fullWidth
                                    onClick={handleViewGroups}
                                >
                                    View Groups
                                </Button>
                            </Box>
                        </Paper>
                    </Grid2>

                    <Grid2 size={{ xs: 12, lg: 9 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Calendar
                                currentMonth={currentMonth}
                                events={upcomingEvents || []}
                                onDateClick={handleDateClick}
                                onEventClick={handleEventClick}
                                changeMonth={changeMonth}
                                goToToday={goToToday}
                                handleCreateEvent={handleCreateEvent}
                            />
                        </Paper>
                    </Grid2>

                    {/* Group Overview Section */}
                    {isLoadingGroups ? (
                        <Grid2 size={{ xs: 12, lg: 3 }}>
                            <CircularProgress />
                        </Grid2>
                    ) : errorGroups ? (
                        <Grid2 size={{ xs: 12 }}>
                            <Typography variant="body2" color="error">
                                Unable to load groups.
                            </Typography>
                        </Grid2>
                    ) : groups && groups.length > 0 ? (
                        <Grid2 size={{ xs: 12, lg: 3 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <GroupOverview />
                            </Paper>
                        </Grid2>
                    ) : (
                        <Grid2 size={{ xs: 12, lg: 3 }}>
                            <Typography variant="body2" color="textSecondary">
                                No groups available.
                            </Typography>
                        </Grid2>
                    )}

                    {/* Work Schedule Section */}
                    <Grid2 size={{ xs: 12, lg: 9 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <WorkScheduleOverview />
                        </Paper>
                    </Grid2>
                </Grid2>
            </Box>

            <Dialog
                open={isEventCreateOpen}
                onClose={handleCloseEventCreate}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <EventCreateScreen
                        open={isEventCreateOpen}
                        onClose={handleCloseEventCreate}
                        onEventCreated={handleEventCreated}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default HomeScreen;
