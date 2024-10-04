import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Chip,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Snackbar,
} from '@mui/material';
import { AccessTime, Room, Group, Edit, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';
import { ApiResponse, Events } from '../../types/event';
import EventForm from './EventForm';

const EventDetails: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Events | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const { getEvent, deleteEvent, updateEvent } = eventApi;

    const { data, isLoading, error, refetch } = useApi<ApiResponse<Events>>(() => getEvent(Number(eventId)));

    const handleCreateEvent = () => {
        setIsCreateEventOpen(true);
    };

    const handleEventCreated = () => {
        setIsCreateEventOpen(false);
        // TODO: Refresh events list or handle post-event creation logic here
    };

    useEffect(() => {
        if (data) {
            setEvent(data.data);
        }
    }, [data]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleDelete = () => {
        setIsDeleting(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteEvent(Number(eventId));
            setSnackbarMessage('Event deleted successfully');
            setSnackbarOpen(true);
            setTimeout(() => navigate('/calendar'), 2000);
        } catch (error) {
            setSnackbarMessage('Failed to delete event');
            setSnackbarOpen(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEventUpdate = async (updatedEvent: Partial<Events>) => {
        try {
            const response = await updateEvent(Number(eventId), updatedEvent);
            setEvent(response);
            setIsEditing(false);
            setSnackbarMessage('Event updated successfully');
            setSnackbarOpen(true);
            refetch();
        } catch (error) {
            setSnackbarMessage('Failed to update event');
            setSnackbarOpen(true);
        }
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!event) return <Typography>No event found</Typography>;

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                {event.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1 }} />
                <Typography>
                    {format(new Date(event.start_time), 'PPp')} - {format(new Date(event.end_time), 'PPp')}
                </Typography>
            </Box>
            {event.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Room sx={{ mr: 1 }} />
                    <Typography>{event.location}</Typography>
                </Box>
            )}
            <Box sx={{ mb: 2 }}>
                <Chip label={event.eventType} color="primary" />
            </Box>
            <Typography variant="body1" paragraph>
                {event.description}
            </Typography>
            {event.group && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Group sx={{ mr: 1 }} />
                    <Typography>{event.group?.toString()}</Typography>
                </Box>
            )}
            <Typography variant="subtitle1" gutterBottom>
                Shared with:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {event.sharedWith.map((userId: number) => (
                    <Chip key={userId} label={`User ID: ${userId}`} />
                ))}
            </Box>
            <Box sx={{ mt: 2 }}>
                <Button startIcon={<Edit />} onClick={handleEdit} sx={{ mr: 1 }}>
                    Edit
                </Button>
                <Button startIcon={<Delete />} onClick={handleDelete} color="error">
                    Delete
                </Button>
            </Box>

            {isEditing && (
                <EventForm
                    open={isCreateEventOpen}
                    onClose={() => setIsCreateEventOpen(false)}
                    onEventCreated={handleEventCreated}
                />
            )}

            <Dialog
                open={isDeleting}
                onClose={() => setIsDeleting(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Delete Event?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this event? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleting(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default EventDetails;
