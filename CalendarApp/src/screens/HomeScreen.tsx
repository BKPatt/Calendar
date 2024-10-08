import React, { useState, useEffect } from 'react';
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
    Grid2,
} from '@mui/material';
import {
    Add as AddIcon,
    Group as GroupIcon,
    Share as ShareIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { groupApi } from '../services/api/groupApi';
import { Events } from '../types/event';
import { startOfMonth, endOfMonth, format, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import EventForm from '../components/Event/EventForm';
import UpcomingEventsWidget from '../components/Event/UpcomingEventsWidget';
import GroupForm from '../components/Group/GroupForm';
import InvitationForm from '../components/Group/InvitationForm';
import { Group } from '../types/group';
import GroupOverview from '../components/Group/GroupOverview';

const HomeScreen: React.FC = () => {
    const { getEvents, getUpcomingEvents } = eventApi;
    const { getGroups } = groupApi;
    const theme = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [events, setEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
    const { data: upcomingEvents, isLoading: isLoadingUpcomingEvents, error: errorEvents, refetch: refetchEvents } = useApi<Events[]>(getUpcomingEvents);

    const [isEventCreateOpen, setIsEventCreateOpen] = useState(false);
    const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
    const [isGroupEditOpen, setIsGroupEditOpen] = useState(false);
    const [isInvitationOpen, setIsInvitationOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

    const { data: groups, isLoading: isLoadingGroups } = useApi(getGroups);

    const fetchEventsForMonth = async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const start_date = format(startOfMonth(month), 'yyyy-MM-dd');
            const end_date = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({
                start_date: start_date,
                end_date: end_date,
                user_id: user?.id?.toString() || '',
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
        setIsEventCreateOpen(true);
    };

    const handleCloseEventCreate = () => {
        setIsEventCreateOpen(false);
        fetchEventsForMonth(currentMonth);
    };

    const handleCreateGroup = () => {
        setIsGroupCreateOpen(true);
    };

    const handleCloseGroupCreate = () => {
        setIsGroupCreateOpen(false);
    };

    const handleEditGroup = () => {
        setIsGroupEditOpen(true);
    };

    const handleCloseGroupEdit = () => {
        setIsGroupEditOpen(false);
    };

    const handleInvitePeople = () => {
        setIsInvitationOpen(true);
    };

    const handleCloseInvitation = () => {
        setIsInvitationOpen(false);
    };

    const handleViewGroups = () => {
        navigate('/groups');
    };

    const handleShareEvent = () => {
        // Implement share event functionality
    };

    const changeMonth = (amount: number) => {
        setCurrentMonth(addMonths(currentMonth, amount));
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    return (
        <Container maxWidth="xl" sx={{ p: 0 }}>
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom align='center'>
                    Welcome, {user?.firstName || 'User'}!
                </Typography>

                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, lg: 2 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            {isLoadingUpcomingEvents ? (
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

                    <Grid2 size={{ xs: 12, lg: 8 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            {isLoadingEvents ? (
                                <CircularProgress />
                            ) : (
                                <Calendar
                                    currentMonth={currentMonth}
                                    events={events}
                                    onDateClick={(date) => console.log('Date clicked:', date)}
                                    onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                                    changeMonth={changeMonth}
                                    goToToday={goToToday}
                                    handleCreateEvent={handleCreateEvent}
                                    viewMode={'month'}
                                />
                            )}
                        </Paper>
                    </Grid2>

                    <Grid2 size={{ xs: 12, lg: 2 }}>
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
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<AddIcon />}
                                    fullWidth
                                    onClick={handleCreateGroup}
                                >
                                    Create Group
                                </Button>
                                {groups && groups.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        fullWidth
                                        onClick={handleEditGroup}
                                    >
                                        Edit Group
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PersonAddIcon />}
                                    fullWidth
                                    onClick={handleInvitePeople}
                                >
                                    Invite People
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<ShareIcon />}
                                    fullWidth
                                    onClick={handleShareEvent}
                                >
                                    Share Event
                                </Button>
                            </Box>
                        </Paper>
                    </Grid2>
                </Grid2>
            </Box>

            <Box my={4}>
                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, lg: 5 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <GroupOverview />
                            </Box>
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
                    <EventForm
                        onClose={handleCloseEventCreate}
                        onEventCreated={handleCloseEventCreate}
                        open={isEventCreateOpen}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isGroupCreateOpen}
                onClose={handleCloseGroupCreate}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <GroupForm
                        onClose={handleCloseGroupCreate}
                        onGroupCreated={handleCloseGroupCreate}
                        open={isGroupCreateOpen}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isGroupEditOpen}
                onClose={handleCloseGroupEdit}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <GroupForm
                        onClose={handleCloseGroupEdit}
                        onGroupUpdated={handleCloseGroupEdit}
                        open={isGroupEditOpen}
                        group={selectedGroup}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isInvitationOpen}
                onClose={handleCloseInvitation}
                fullWidth
                maxWidth="sm"
            >
                <DialogContent>
                    <InvitationForm
                        onClose={handleCloseInvitation}
                        onInvitationSent={handleCloseInvitation}
                        open={isInvitationOpen}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default HomeScreen;
