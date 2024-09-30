import React from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getUpcomingEvents } from '../../services/api';
import { Events } from '../../types/event';
import { formatDate } from '../../utils/dateHelpers';

const UpcomingEventsWidget: React.FC = () => {
    const navigate = useNavigate();
    const { data: events, isLoading, error } = useApi<Events[]>(getUpcomingEvents);

    if (isLoading) return <Typography>Loading events...</Typography>;
    if (error) return <Typography color="error">Error loading events</Typography>;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
            <List>
                {events?.slice(0, 5).map((event) => (
                    <ListItem
                        key={event.id}
                        component="a"  // Set the component to "a" for link behavior
                        onClick={() => navigate(`/events/${event.id}`)}
                        style={{ cursor: 'pointer' }}  // Add pointer style for clickable UI
                    >
                        <ListItemIcon>
                            <EventIcon style={{ color: event.color }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={event.title}
                            secondary={formatDate(event.startTime, 'PPp')}
                        />
                    </ListItem>
                ))}
            </List>
            {events && events.length > 5 && (
                <Box textAlign="right">
                    <Typography
                        variant="body2"
                        color="primary"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/events')}
                    >
                        View all events
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UpcomingEventsWidget;
