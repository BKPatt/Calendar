import React, { useState } from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon, Button, Avatar } from '@mui/material';
import { Event as EventIcon, Repeat as RepeatIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';
import { Events } from '../../types/event';
import { format, isSameDay, addDays, parseISO } from 'date-fns';

const UpcomingEventsWidget: React.FC = () => {
    const { getUpcomingEvents } = eventApi;

    const navigate = useNavigate();
    const { data: events, isLoading, error } = useApi<Events[]>(getUpcomingEvents);
    const [expanded, setExpanded] = useState(false);

    if (isLoading) return <Typography>Loading events...</Typography>;
    if (error) return <Typography color="error">Error loading events: {error}</Typography>;

    const formatDateRange = (start: string, end: string, recurring: boolean) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date');
            }

            if (recurring) {
                // If the event is recurring, show only the time for that day
                return (
                    <Box>
                        <Typography component="span" variant="body2">
                            {format(startDate, 'MMM d, yyyy')}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                        </Typography>
                    </Box>
                );
            } else if (isSameDay(startDate, endDate)) {
                // For non-recurring events on the same day
                return (
                    <Box>
                        <Typography component="span" variant="body2">
                            {format(startDate, 'MMM d, yyyy')}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                        </Typography>
                    </Box>
                );
            } else {
                // For non-recurring events across multiple days
                return (
                    <Box>
                        <Typography component="span" variant="body2">
                            {format(startDate, 'MMM d, yyyy h:mm a')}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ display: 'block' }} align='center'>
                            -
                        </Typography>
                        <Typography component="span" variant="body2">
                            {format(endDate, 'MMM d, yyyy h:mm a')}
                        </Typography>
                    </Box>
                );
            }
        } catch (error) {
            console.error("Error parsing date:", error);
            return 'Invalid Date Range';
        }
    };

    const getNextSevenDaysEvents = (events: Events[]) => {
        const now = new Date();
        const sevenDaysLater = addDays(now, 7);
        return events.filter(event => {
            const eventStart = parseISO(event.start_time);
            return eventStart >= now && eventStart <= sevenDaysLater;
        });
    };

    const upcomingEvents = events ? getNextSevenDaysEvents(events) : [];
    const displayEvents = expanded ? upcomingEvents : upcomingEvents.slice(0, 7);

    return (
        <Box>
            <Typography variant="h6" gutterBottom align={'center'}>Upcoming Events</Typography>
            {upcomingEvents.length > 0 ? (
                <>
                    <List sx={{ paddingLeft: '0px' }}>
                        {displayEvents.map((event, index) => (
                            <ListItem
                                key={`${event.id}-${index}`}
                                onClick={() => navigate(`/events/${event.id}`)}
                                sx={{ paddingLeft: '0px' }}
                                style={{ cursor: 'pointer' }}
                            >
                                <ListItemIcon sx={{ minWidth: '30px', marginRight: '8px', marginLeft: '0px' }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: event.color || 'primary.main' }}>
                                        {event.recurring ? (
                                            <RepeatIcon style={{ fontSize: 16 }} />
                                        ) : (
                                            <EventIcon style={{ fontSize: 16 }} />
                                        )}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={event.title}
                                    secondary={formatDateRange(event.start_time, event.end_time, event.recurring)}
                                />
                            </ListItem>
                        ))}
                    </List>
                    {upcomingEvents.length > 7 && (
                        <Button
                            onClick={() => setExpanded(!expanded)}
                            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            fullWidth
                        >
                            {expanded ? 'Show Less' : `Show ${upcomingEvents.length - 7} More`}
                        </Button>
                    )}
                </>
            ) : (
                <Typography>No upcoming events in the next 7 days</Typography>
            )}
            <Box textAlign="right" mt={1}>
                <Typography
                    variant="body2"
                    color="primary"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/events')}
                >
                    View all events
                </Typography>
            </Box>
        </Box>
    );
};

export default UpcomingEventsWidget;
