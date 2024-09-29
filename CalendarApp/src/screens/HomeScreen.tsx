import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid2,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    ListItemButton,
    Dialog,
    DialogContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Event as EventIcon,
    Group as GroupIcon,
    Add as AddIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { getUpcomingEvents } from '../services/api';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';
import EventCreateScreen from '../dialogs/EventCreateScreen';
import { startOfMonth } from 'date-fns';
import CalendarGlance from '../components/Calendar/CalendarGlance';

const HomeScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: upcomingEvents, isLoading, error, refetch } = useApi<Events[]>(getUpcomingEvents);
    const [isEventCreateOpen, setIsEventCreateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

    const handleCreateEvent = () => {
        setIsEventCreateOpen(true);
    };

    const handleCloseEventCreate = () => {
        setIsEventCreateOpen(false);
        refetch(); // Refresh the events list after creating a new event
    };

    const handleEventCreated = () => {
        refetch(); // Refresh events after creation
    };

    const handleViewAllEvents = () => {
        navigate('/events');
    };

    const handleViewGroups = () => {
        navigate('/groups');
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {user?.firstName || 'User'}!
                </Typography>

                <Grid2 container spacing={3}>
                    <Grid2
                        sx={{
                            size: 12,
                            '@media (min-width:600px)': { size: 8 }
                        }}
                    >
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Upcoming Events</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<CalendarIcon />}
                                    onClick={handleViewAllEvents}
                                >
                                    View All
                                </Button>
                            </Box>
                            <List>
                                {upcomingEvents && upcomingEvents.length > 0 ? (
                                    upcomingEvents.slice(0, 5).map((event) => (
                                        <ListItem key={event.id} disablePadding>
                                            <ListItemButton onClick={() => navigate(`/events/${event.id}`)}>
                                                <ListItemIcon>
                                                    <EventIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={event.title}
                                                    secondary={`${formatDate(event.startTime, 'PPp')} - ${formatDate(event.endTime, 'PPp')}`}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No upcoming events
                                    </Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid2>

                    <Grid2
                        sx={{
                            size: 12,
                            '@media (min-width:600px)': { size: 4 }
                        }}
                    >
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
                </Grid2>

                <Box mt={4}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <CalendarGlance events={upcomingEvents || []} />
                    </Paper>
                </Box>
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
