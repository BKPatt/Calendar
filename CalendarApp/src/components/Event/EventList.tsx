import React, { useState, useEffect } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Box,
    Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { Edit, Delete, Event as EventIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { Events } from '../../types/event';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';
import EventForm from './EventForm';

const EventListContainer = styled(Box)(({ theme }) => ({
    maxWidth: 600,
    margin: 'auto',
    padding: theme.spacing(2),
}));

const EventItem = styled(ListItem)(({ theme }) => ({
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

const EventList: React.FC = () => {
    const { getEvents, deleteEvent } = eventApi;

    const [events, setEvents] = useState<Events[]>([]);
    const [editingEvent, setEditingEvent] = useState<Events | null>(null);

    const { data, isLoading, error, refetch: fetchEvents } = useApi(getEvents);
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (data) {
            setEvents(data);
        }
    }, [data]);

    const handleCreateEvent = () => {
        setIsCreateEventOpen(true);
    };

    const handleEventCreated = () => {
        setIsCreateEventOpen(false);
        // TODO: Refresh events list or handle post-event creation logic here
    };

    const handleEditEvent = (event: Events) => {
        setEditingEvent(event);
    };

    const handleDeleteEvent = async (eventId: number) => {
        try {
            await deleteEvent(eventId);
            fetchEvents();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };


    const handleEventSubmit = () => {
        setEditingEvent(null);
        fetchEvents();
    };

    const handleEventCancel = () => {
        setEditingEvent(null);
    };

    if (isLoading) return <Typography>Loading events...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <EventListContainer>
            {editingEvent ? (
                <EventForm
                    open={isCreateEventOpen}
                    onClose={() => setIsCreateEventOpen(false)}
                    onEventCreated={handleEventCreated}
                />
            ) : (
                <>
                    <Typography variant="h4" gutterBottom>
                        Events
                    </Typography>
                    <List>
                        {events.map((event) => (
                            <EventItem key={event.id}>
                                <EventIcon style={{ marginRight: 16, color: event.color }} />
                                <ListItemText
                                    primary={event.title}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {format(new Date(event.start_time), 'PPp')} - {format(new Date(event.end_time), 'PPp')}
                                            </Typography>
                                            <br />
                                            {event.location && (
                                                <Typography component="span" variant="body2">
                                                    Location: {event.location}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                                <Chip label={event.eventType} size="small" style={{ marginRight: 8 }} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditEvent(event)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEvent(event.id!)}>
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </EventItem>
                        ))}
                    </List>
                </>
            )}
        </EventListContainer>
    );
};

export default EventList;