import React, { useState, useCallback, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Snackbar,
    Grid2,
} from '@mui/material';
import { styled } from '@mui/system';
import {
    Schedule as ScheduleIcon,
    Room as RoomIcon,
    Group as GroupIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Share as ShareIcon,
    AccessTime as AccessTimeIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { userApi } from '../services/api/userApi';
import { eventApi } from '../services/api/eventApi';
import { ApiResponse, Events } from '../types/event';
import { formatDate, getTimeDifference } from '../utils/dateHelpers';
import { useNavigate, useParams } from 'react-router-dom';
import EventForm from '../components/Event/EventForm';
import MapComponent from '../components/Maps/MapComponent';
import { User } from '../types/user';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0px 4px 20px ${theme.palette.grey[300]}`,
}));

const EventInfoCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    boxShadow: `0px 2px 10px ${theme.palette.grey[200]}`,
}));

const EventScreen: React.FC = () => {
    const { getEvent, updateEvent, deleteEvent, shareEvent } = eventApi;
    const { getUserProfile } = userApi;
    const { eventId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const { data: event, isLoading, error, refetch } = useApi<Events>(() => getEvent(Number(eventId)));

    const [createdByUser, setCreatedByUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState<boolean>(false);

    useEffect(() => {
        if (event?.created_by) {
            // TODO: This is sloppy code, fix this
            setCreatedByUser(event.created_by as unknown as User);
        }
    }, [event?.created_by]);

    const handleEdit = useCallback(() => setIsEditing(true), []);
    const handleDelete = useCallback(() => setIsDeleting(true), []);
    const handleShare = useCallback(() => setIsSharing(true), []);

    const handleConfirmDelete = useCallback(async () => {
        if (event) {
            try {
                await deleteEvent(event.id!);
                navigate('/calendar');
            } catch (error) {
                setSnackbarMessage('Failed to delete event. Please try again.');
                setSnackbarOpen(true);
            }
        }
        setIsDeleting(false);
    }, [event, navigate, deleteEvent]);

    const handleConfirmShare = useCallback(async () => {
        if (event) {
            try {
                await shareEvent(event.id!, shareEmail);
                refetch();
                setSnackbarMessage('Event shared successfully!');
                setSnackbarOpen(true);
            } catch (error) {
                setSnackbarMessage('Failed to share event. Please try again.');
                setSnackbarOpen(true);
            }
        }
        setIsSharing(false);
        setShareEmail('');
    }, [event, shareEmail, refetch, shareEvent]);

    const handleEventUpdate = useCallback(() => {
        refetch();
        setIsEditing(false);
        setSnackbarMessage('Event updated successfully!');
        setSnackbarOpen(true);
    }, [refetch]);

    if (isLoading || userLoading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress size={60} />
        </Box>
    );
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!event) return <Typography>Event not found</Typography>;

    const isOwner = user && event.created_by === user.id;
    const timeUntilEvent = getTimeDifference(new Date(), new Date(event.start_time));

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <StyledPaper>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        {event.title}
                    </Typography>
                    <Box>
                        {isOwner && (
                            <>
                                <Tooltip title="Edit Event">
                                    <IconButton onClick={handleEdit} color="primary" aria-label="edit">
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Event">
                                    <IconButton onClick={handleDelete} color="error" aria-label="delete">
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        <Tooltip title="Share Event">
                            <IconButton onClick={handleShare} color="primary" aria-label="share">
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Grid2 container spacing={4}>
                    <Grid2 size={{ xs: 12, md: 8 }}>
                        <EventInfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <CalendarIcon sx={{ mr: 2 }} color="primary" />
                                    <Typography variant="h6">
                                        {formatDate(event.start_time, 'PPP')}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <ScheduleIcon sx={{ mr: 2 }} color="primary" />
                                    <Typography variant="body1">
                                        {`${formatDate(event.start_time, 'p')} - ${formatDate(event.end_time, 'p')}`}
                                    </Typography>
                                </Box>
                                {event.location && (
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <RoomIcon sx={{ mr: 2 }} color="primary" />
                                        <Typography variant="body1">{event.location}</Typography>
                                    </Box>
                                )}
                                <Box display="flex" alignItems="center" mb={2}>
                                    <CategoryIcon sx={{ mr: 2 }} color="primary" />
                                    <Chip label={event.event_type} color="primary" size="small" />
                                </Box>
                                {event.group && (
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <GroupIcon sx={{ mr: 2 }} color="primary" />
                                        <Typography variant="body1">{event.group}</Typography>
                                    </Box>
                                )}
                                <Box display="flex" alignItems="center">
                                    <PersonIcon sx={{ mr: 2 }} color="primary" />
                                    <Typography variant="body1">
                                        Created by: {createdByUser ? createdByUser.email : 'Loading...'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </EventInfoCard>

                        <EventInfoCard>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Description</Typography>
                                <Typography variant="body1">{event.description || 'No description provided.'}</Typography>
                            </CardContent>
                        </EventInfoCard>

                        {event.location && (
                            <EventInfoCard>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Location</Typography>
                                    <MapComponent address={event.location} />
                                </CardContent>
                            </EventInfoCard>
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <EventInfoCard>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Event Countdown</Typography>
                                <Typography variant="h4" color="primary" align="center">
                                    {timeUntilEvent}
                                </Typography>
                            </CardContent>
                        </EventInfoCard>

                        <EventInfoCard>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Shared with</Typography>
                                <List>
                                    {event.shared_with && event.shared_with.length > 0 ? (
                                        event.shared_with.map((userId: number) => (
                                            <ListItem key={userId}>
                                                <ListItemAvatar>
                                                    <Avatar>{userId}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText primary={`User ID: ${userId}`} />
                                            </ListItem>
                                        ))
                                    ) : (
                                        <Typography variant="body1">This event is not shared with anyone.</Typography>
                                    )}
                                </List>
                            </CardContent>
                        </EventInfoCard>

                        {event.eta && (
                            <EventInfoCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <AccessTimeIcon sx={{ mr: 2 }} color="primary" />
                                        <Typography variant="body1">ETA: {event.eta}</Typography>
                                    </Box>
                                </CardContent>
                            </EventInfoCard>
                        )}
                    </Grid2>
                </Grid2>
            </StyledPaper>

            <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogContent>
                    <EventForm
                        open={isEditing}
                        onClose={() => setIsEditing(false)}
                        onEventCreated={handleEventUpdate}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this event?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleting(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isSharing} onClose={() => setIsSharing(false)}>
                <DialogTitle>Share Event</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={shareEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsSharing(false)}>Cancel</Button>
                    <Button onClick={handleConfirmShare} color="primary">Share</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default EventScreen;
