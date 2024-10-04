import React, { useState, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
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
} from '@mui/material';
import { useTheme } from '@mui/system';
import {
    Event as EventIcon,
    Schedule as ScheduleIcon,
    Room as RoomIcon,
    Group as GroupIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Share as ShareIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { ApiResponse, Events } from '../types/event';
import { User } from '../types/user';
import { formatDate } from '../utils/dateHelpers';
import EventForm from '../components/Event/EventForm';

const EventScreen: React.FC = () => {
    const { getEvent, updateEvent, deleteEvent, shareEvent } = eventApi;
    const theme = useTheme();
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

    const { data: eventResponse, isLoading, error, refetch } = useApi<ApiResponse<Events>>(() => getEvent(Number(eventId)));
    const event = eventResponse?.data;

    const handleEdit = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleDelete = useCallback(() => {
        setIsDeleting(true);
    }, []);

    const handleShare = useCallback(() => {
        setIsSharing(true);
    }, []);

    const handleCreateEvent = () => {
        setIsCreateEventOpen(true);
    };

    const handleEventCreated = () => {
        setIsCreateEventOpen(false);
    };

    const getInitials = (user: User) => {
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || user.username[0];
    };

    const handleConfirmDelete = useCallback(async () => {
        if (event) {
            try {
                await deleteEvent(event.id!);
                navigate('/calendar');
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }
        setIsDeleting(false);
    }, [event, navigate]);

    const handleConfirmShare = useCallback(async () => {
        if (event) {
            try {
                await shareEvent(event.id!, shareEmail);
                refetch();
            } catch (error) {
                console.error('Error sharing event:', error);
            }
        }
        setIsSharing(false);
        setShareEmail('');
    }, [event, shareEmail, refetch]);

    const handleEventUpdate = useCallback(async (updatedEvent: Partial<Events>) => {
        if (event) {
            try {
                await updateEvent(event.id!, updatedEvent);
                refetch();
                setIsEditing(false);
            } catch (error) {
                console.error('Error updating event:', error);
            }
        }
    }, [event, refetch]);

    if (isLoading) return (
        <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
        </Box>
    );
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!event) return <Typography>Event not found</Typography>;

    const isOwner = user && event.created_by === user.id;

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0px 4px 20px ${theme.palette.grey[300]}`,
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <ScheduleIcon sx={{ mr: 1 }} color="action" />
                            <Typography variant="body1">
                                {`${formatDate(event.start_time, 'PPp')} - ${formatDate(event.end_time, 'PPp')}`}
                            </Typography>
                        </Box>
                        {event.location && (
                            <Box display="flex" alignItems="center" mb={1}>
                                <RoomIcon sx={{ mr: 1 }} color="action" />
                                <Typography variant="body1">{event.location}</Typography>
                            </Box>
                        )}
                        <Box display="flex" alignItems="center" mb={1}>
                            <EventIcon sx={{ mr: 1 }} color="action" />
                            <Chip label={event.eventType} color="primary" size="small" />
                        </Box>
                        {event.group && (
                            <Box display="flex" alignItems="center" mb={1}>
                                <GroupIcon sx={{ mr: 1 }} color="action" />
                                <Typography variant="body1">{event.group}</Typography>
                            </Box>
                        )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>Description</Typography>
                        <Typography variant="body1">{event.description}</Typography>
                    </Grid>
                </Grid>

                <Box mt={3}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>Shared with</Typography>
                    <List>
                        {event.sharedWith.map((userId: number) => (
                            <ListItem key={userId}>
                                <ListItemAvatar>
                                    <Avatar>
                                        {userId}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`User ID: ${userId}`} />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {event.eta && (
                    <Box mt={2} display="flex" alignItems="center">
                        <AccessTimeIcon sx={{ mr: 1 }} color="action" />
                        <Typography variant="body1">ETA: {event.eta}</Typography>
                    </Box>
                )}
            </Paper>

            <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogContent>
                    <EventForm
                        open={isCreateEventOpen}
                        onClose={() => setIsCreateEventOpen(false)}
                        onEventCreated={handleEventCreated}
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
        </Container>
    );
};

export default EventScreen;
