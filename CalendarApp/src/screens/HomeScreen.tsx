import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Dialog,
    DialogContent,
    useTheme,
    useMediaQuery,
    ButtonProps
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
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
import { Group } from '../types/group';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { addMonths } from 'date-fns';
import Calendar from '../components/Calendar/Calendar';
import EventForm from '../components/Event/EventForm';
import UpcomingEventsWidget from '../components/Event/UpcomingEventsWidget';
import GroupForm from '../components/Group/GroupForm';
import InvitationForm from '../components/Group/InvitationForm';
import GroupOverview from '../components/Group/GroupOverview';
import QuickActions from '../navigation/QuickActions';

const HomeScreen: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const navigate = useNavigate();
    const { getEvents, getUpcomingEvents } = eventApi;
    const { getGroups } = groupApi;

    const [events, setEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
    const [isEventCreateOpen, setIsEventCreateOpen] = useState(false);
    const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
    const [isGroupEditOpen, setIsGroupEditOpen] = useState(false);
    const [isInvitationOpen, setIsInvitationOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const { data: upcomingEvents, isLoading: isLoadingUpcomingEvents, error: upcomingEventsError } = useApi<Events[]>(getUpcomingEvents);
    const { data: groups } = useApi(getGroups);

    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const [calendarHeight, setCalendarHeight] = useState<number | null>(null);

    const fetchEventsForMonth = useCallback(async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const start_date = format(startOfMonth(month), 'yyyy-MM-dd');
            const end_date = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({
                start_date,
                end_date,
                user_id: user?.id?.toString() || '',
            });
            setEvents(response.data || []);
        } catch { }
        finally {
            setIsLoadingEvents(false);
        }
    }, [getEvents, user]);

    useEffect(() => {
        fetchEventsForMonth(currentMonth);
    }, [currentMonth, fetchEventsForMonth]);

    useEffect(() => {
        if (calendarContainerRef.current) {
            setCalendarHeight(calendarContainerRef.current.offsetHeight);
        }
    }, [isLoadingEvents, events, isLoadingUpcomingEvents, upcomingEvents]);

    // Updated changeMonth function to accept a Date instead of an amount
    const changeMonth = (newDate: Date) => {
        setCurrentMonth(newDate);
    };

    const goToToday = () => {
        setCurrentMonth(startOfMonth(new Date()));
    };

    const handleCreateEvent = () => setIsEventCreateOpen(true);
    const handleCloseEventCreate = () => {
        setIsEventCreateOpen(false);
        fetchEventsForMonth(currentMonth);
    };
    const handleCreateGroup = () => setIsGroupCreateOpen(true);
    const handleCloseGroupCreate = () => setIsGroupCreateOpen(false);
    const handleEditGroup = () => setIsGroupEditOpen(true);
    const handleCloseGroupEdit = () => setIsGroupEditOpen(false);
    const handleInvitePeople = () => setIsInvitationOpen(true);
    const handleCloseInvitation = () => setIsInvitationOpen(false);
    const handleViewGroups = () => navigate('/groups');
    const handleShareEvent = () => { };

    const actions = [
        {
            label: 'Create Event',
            icon: <AddIcon />,
            variant: 'contained' as ButtonProps['variant'],
            color: 'primary' as ButtonProps['color'],
            onClick: handleCreateEvent
        },
        {
            label: 'View Groups',
            icon: <GroupIcon />,
            variant: 'outlined' as ButtonProps['variant'],
            onClick: handleViewGroups
        },
        {
            label: 'Create Group',
            icon: <AddIcon />,
            variant: 'contained' as ButtonProps['variant'],
            color: 'secondary' as ButtonProps['color'],
            onClick: handleCreateGroup
        },
        ...(groups && groups.length > 0 ? [{
            label: 'Edit Group',
            icon: <EditIcon />,
            variant: 'outlined' as ButtonProps['variant'],
            onClick: handleEditGroup
        }] : []),
        {
            label: 'Invite People',
            icon: <PersonAddIcon />,
            variant: 'contained' as ButtonProps['variant'],
            color: 'primary' as ButtonProps['color'],
            onClick: handleInvitePeople
        },
        {
            label: 'Share Event',
            icon: <ShareIcon />,
            variant: 'outlined' as ButtonProps['variant'],
            onClick: handleShareEvent
        },
    ];

    return (
        <Container maxWidth="xl" sx={{ p: isMobile ? 1 : 0 }}>
            <Box my={4}>
                <QuickActions actions={actions} />
                <Grid2 container spacing={3} columns={12}>
                    <Grid2
                        size={{ xs: 12, lg: 3 }}
                        sx={{ borderRight: `1px solid ${theme.palette.divider}` }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                height: calendarHeight ? `${calendarHeight}px` : 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {isLoadingUpcomingEvents ? (
                                <Box display="flex" justifyContent="center" alignItems="center" py={3} flexGrow={1}>
                                    <CircularProgress />
                                </Box>
                            ) : upcomingEventsError ? (
                                <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                                    <Typography variant="body2" color="error" align="center">
                                        Unable to load upcoming events.
                                    </Typography>
                                </Box>
                            ) : (upcomingEvents && upcomingEvents.length > 0) ? (
                                <UpcomingEventsWidget />
                            ) : (
                                <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        No upcoming events available.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid2>
                    <Grid2
                        size={{ xs: 12, lg: 9 }}
                        sx={{ display: 'flex', flexDirection: 'column' }}
                        ref={calendarContainerRef}
                    >
                        <Paper elevation={3} sx={{ p: 2, flexGrow: 1 }}>
                            {isLoadingEvents ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Calendar
                                    currentMonth={currentMonth}
                                    events={events}
                                    onDateClick={() => { }}
                                    onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                                    changeMonth={changeMonth}
                                    goToToday={goToToday}
                                    handleCreateEvent={handleCreateEvent}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                />
                            )}
                        </Paper>
                    </Grid2>
                </Grid2>
            </Box>
            <Box my={4}>
                <Grid2 container spacing={3} columns={12}>
                    <Grid2 size={{ xs: 12, lg: 5 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <GroupOverview />
                            </Box>
                        </Paper>
                    </Grid2>
                </Grid2>
            </Box>
            <Dialog open={isEventCreateOpen} onClose={handleCloseEventCreate} fullWidth maxWidth="sm">
                <DialogContent>
                    <EventForm
                        onClose={handleCloseEventCreate}
                        onEventCreated={handleCloseEventCreate}
                        open={isEventCreateOpen}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isGroupCreateOpen} onClose={handleCloseGroupCreate} fullWidth maxWidth="sm">
                <DialogContent>
                    <GroupForm
                        onClose={handleCloseGroupCreate}
                        onGroupCreated={handleCloseGroupCreate}
                        open={isGroupCreateOpen}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isGroupEditOpen} onClose={handleCloseGroupEdit} fullWidth maxWidth="sm">
                <DialogContent>
                    <GroupForm
                        onClose={handleCloseGroupEdit}
                        onGroupUpdated={handleCloseGroupEdit}
                        open={isGroupEditOpen}
                        group={selectedGroup}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isInvitationOpen} onClose={handleCloseInvitation} fullWidth maxWidth="sm">
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
