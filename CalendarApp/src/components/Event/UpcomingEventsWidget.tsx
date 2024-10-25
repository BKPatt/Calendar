import React, { useState } from 'react';
import {
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Avatar,
    Tooltip,
    Paper
} from '@mui/material';
import {
    Event as EventIcon,
    Repeat as RepeatIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    AccessTime as AccessTimeIcon,
    Room as LocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';
import { Events } from '../../types/event';
import { format, isSameDay, addDays, parseISO, differenceInMinutes, startOfToday } from 'date-fns';

const UpcomingEventsWidget: React.FC = () => {
    const { getUpcomingEvents } = eventApi;
    const navigate = useNavigate();
    const { data: events, isLoading, error } = useApi<Events[]>(getUpcomingEvents);
    const [expanded, setExpanded] = useState(false);

    if (isLoading) return <Typography>Loading events...</Typography>;
    if (error) return <Typography color="error">Error loading events: {error}</Typography>;

    const formatEventTime = (start: string, end: string, recurring: boolean) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);

            const startFormat = format(startDate, 'h:mm a');
            const endFormat = format(endDate, 'h:mm a');
            const dayFormat = format(startDate, 'EEE, MMM d');

            return (
                <Box>
                    <Typography variant="body2" color="textPrimary">
                        {dayFormat}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {startFormat} - {endFormat}
                        {recurring &&
                            <Tooltip title="Recurring Event">
                                <RepeatIcon
                                    fontSize="small"
                                    sx={{ ml: 1, verticalAlign: 'middle', opacity: 0.7 }}
                                />
                            </Tooltip>
                        }
                    </Typography>
                </Box>
            );
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid Date Range';
        }
    };

    const getEventDuration = (start: string, end: string): number => {
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        return differenceInMinutes(endDate, startDate);
    };

    const getNextSevenDaysEvents = (events: Events[]) => {
        const now = new Date();
        const sevenDaysLater = addDays(now, 7);
        const startOfDay = startOfToday();

        return events
            ?.filter(event => {
                const eventStart = parseISO(event.start_time);
                return eventStart >= startOfDay && eventStart <= sevenDaysLater;
            })
            .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    };

    const upcomingEvents = events ? getNextSevenDaysEvents(events) : [];
    const displayEvents = expanded ? upcomingEvents : upcomingEvents.slice(0, 5);

    const renderEventItem = (event: Events) => (
        <Paper
            elevation={1}
            sx={{
                my: 1,
                p: 1.5,
                borderLeft: 4,
                borderColor: event.color || 'primary.main',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                }
            }}
            onClick={() => navigate(`/events/${event.id}`)}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: event.color || 'primary.main'
                    }}
                >
                    {event.recurring ? <RepeatIcon /> : <EventIcon />}
                </Avatar>
                <Box flexGrow={1}>
                    <Typography variant="subtitle2" noWrap>{event.title}</Typography>
                    {formatEventTime(event.start_time, event.end_time, event.recurring)}
                </Box>
            </Box>

            {event.location && (
                <Box display="flex" alignItems="center" mt={1} ml={5}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                    <Typography variant="body2" color="textSecondary" noWrap>
                        {event.location}
                    </Typography>
                </Box>
            )}

            {getEventDuration(event.start_time, event.end_time) > 0 && (
                <Box display="flex" alignItems="center" mt={0.5} ml={5}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                    <Typography variant="body2" color="textSecondary">
                        {getEventDuration(event.start_time, event.end_time)} minutes
                    </Typography>
                </Box>
            )}
        </Paper>
    );

    return (
        <Box>
            <Typography variant="h6" gutterBottom align="center">
                Upcoming Events
            </Typography>

            {upcomingEvents.length > 0 ? (
                <>
                    <Box sx={{ mt: 2 }}>
                        {displayEvents.map((event) => renderEventItem(event))}
                    </Box>

                    {upcomingEvents.length > 5 && (
                        <Button
                            onClick={() => setExpanded(!expanded)}
                            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            {expanded ? 'Show Less' : `Show ${upcomingEvents.length - 5} More`}
                        </Button>
                    )}
                </>
            ) : (
                <Typography align="center" color="textSecondary">
                    No upcoming events in the next 7 days
                </Typography>
            )}

            <Box textAlign="right" mt={2}>
                <Button
                    color="primary"
                    onClick={() => navigate('/events')}
                    size="small"
                >
                    View all events
                </Button>
            </Box>
        </Box>
    );
};

export default UpcomingEventsWidget;