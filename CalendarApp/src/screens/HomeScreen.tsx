import React from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    ListItemButton,
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

const HomeScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: upcomingEvents, isLoading, error } = useApi<Events[]>(getUpcomingEvents);

    const handleCreateEvent = () => {
        navigate('/events/create');
    };

    const handleViewAllEvents = () => {
        navigate('/calendar');
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

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
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
                    </Grid>

                    <Grid item xs={12} md={4}>
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
                    </Grid>
                </Grid>

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Your Calendar at a Glance
                    </Typography>
                    <Paper elevation={3} sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
                        <Typography variant="body2" color="textSecondary">
                            Calendar overview to be implemented
                        </Typography>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default HomeScreen;