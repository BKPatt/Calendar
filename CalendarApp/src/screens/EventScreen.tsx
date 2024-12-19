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
    Grid
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
import { userApi } from '../services/api/userApi';
import { useNavigate, useParams } from 'react-router-dom';
import EventForm from '../components/Event/EventForm';
import MapComponent from '../components/Maps/MapComponent';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { Events } from '../types/event';
import { User } from '../types/user';
import { getTimeDifference, formatDate } from '../utils/dateHelpers';

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
    const [deleteSeriesDialog, setDeleteSeriesDialog] = useState(false);

    const { data: event, isLoading, error, refetch } = useApi<Events>(() => getEvent(Number(eventId)));

    const [createdByUser, setCreatedByUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState<boolean>(false);

    useEffect(() => {
        if (event?.created_by) {
            setCreatedByUser(event.created_by as unknown as User);
        }
    }, [event?.created_by]);

    const handleEdit = useCallback(() => setIsEditing(true), []);
    const handleDelete = useCallback(() => {
        if (event && (event.recurring || event.is_recurring || event.recurring_schedule)) {
            setDeleteSeriesDialog(true);
        } else {
            setIsDeleting(true);
        }
    }, [event]);

    const handleConfirmDelete = useCallback(async (deleteSeries: boolean = false) => {
        if (event) {
            try {
                await deleteEvent(event.id!, deleteSeries);
                navigate('/calendar');
            } catch (error) {
                setSnackbarMessage('Failed to delete event. Please try again.');
                setSnackbarOpen(true);
            }
        }
        setIsDeleting(false);
        setDeleteSeriesDialog(false);
    }, [event, navigate, deleteEvent]);

    const handleShare = useCallback(() => setIsSharing(true), []);
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
                        {/* TODO: fix for checking if user is owner */ true && (
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

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
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
                    </Grid>

                    <Grid item xs={12} md={4}>
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
                    </Grid>
                </Grid>
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
                    <Button onClick={() => handleConfirmDelete(false)} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteSeriesDialog} onClose={() => setDeleteSeriesDialog(false)}>
                <DialogTitle>Delete Recurring Event</DialogTitle>
                <DialogContent>
                    <Typography>Do you want to delete this occurrence or the entire series?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteSeriesDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleConfirmDelete(false)} color="error">This Occurrence</Button>
                    <Button onClick={() => handleConfirmDelete(true)} color="error">Entire Series</Button>
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
