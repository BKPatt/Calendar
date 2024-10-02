import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Button,
    Box,
    Divider,
    IconButton,
} from '@mui/material';
import { Event as EventIcon, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Events } from '../../types/event';
import EventForm from './EventForm';

interface DayEventsDialogProps {
    open: boolean;
    onClose: () => void;
    date: Date;
    events: Events[];
}

const DayEventsDialog: React.FC<DayEventsDialogProps> = ({ open, onClose, date, events }) => {
    const navigate = useNavigate();
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    const handleCreateEvent = () => {
        setIsCreateEventOpen(true);
    };

    const handleEventCreated = () => {
        setIsCreateEventOpen(false);
        // Refresh events list or handle post-event creation logic here
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Events for {format(date, 'MMMM d, yyyy')}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                {events.length > 0 ? (
                    <List>
                        {events.map((event) => (
                            <React.Fragment key={event.id}>
                                <ListItem
                                    onClick={() => handleEventClick(event.id!)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar style={{ backgroundColor: event.color }}>
                                            <EventIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={event.title}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                                                </Typography>
                                                {event.location && (
                                                    <>
                                                        <br />
                                                        <Typography component="span" variant="body2">
                                                            {event.location}
                                                        </Typography>
                                                    </>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography color="textSecondary" align="center">
                        No events scheduled for this day.
                    </Typography>
                )}
                <Box mt={2} display="flex" justifyContent="center">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateEvent}
                    >
                        Create New Event
                    </Button>
                </Box>
            </DialogContent>
            <EventForm
                open={isCreateEventOpen}
                onClose={() => setIsCreateEventOpen(false)}
                onEventCreated={handleEventCreated}
            />
        </Dialog>
    );
};

export default DayEventsDialog;
