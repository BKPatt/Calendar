import React from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getUpcomingEvents } from '../../services/api';
import { Events } from '../../types/event';
import { format, isSameDay } from 'date-fns';

const UpcomingEventsWidget: React.FC = () => {
    const navigate = useNavigate();
    const { data: events, isLoading, error } = useApi<Events[]>(getUpcomingEvents);

    if (isLoading) return <Typography>Loading events...</Typography>;
    if (error) return <Typography color="error">Error loading events: {error}</Typography>;

    const formatDateRange = (start: string, end: string) => {
        try {
            const startDate = new Date(start);
            const endDate = new Date(end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date');
            }

            if (isSameDay(startDate, endDate)) {
                // If start and end are on the same day
                return `${format(startDate, 'MMM d, yyyy h:mm a')} - ${format(endDate, 'h:mm a')}`;
            } else {
                // If start and end are on different days
                return `${format(startDate, 'MMM d, yyyy h:mm a')} - ${format(endDate, 'MMM d, yyyy h:mm a')}`;
            }
        } catch (error) {
            console.error("Error parsing date:", error);
            return 'Invalid Date Range';
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
            {events && events.length > 0 ? (
                <List>
                    {events.slice(0, 5).map((event) => (
                        <ListItem
                            key={event.id}
                            onClick={() => navigate(`/events/${event.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <ListItemIcon>
                                <EventIcon style={{ color: event.color }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={event.title}
                                secondary={formatDateRange(event.start_time, event.end_time)}
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography>No upcoming events</Typography>
            )}
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