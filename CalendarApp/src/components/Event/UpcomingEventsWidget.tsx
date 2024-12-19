import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Avatar,
    Tooltip,
    Paper,
    Button,
    useTheme
} from '@mui/material';
import {
    Event as EventIcon,
    Repeat as RepeatIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    AccessTime as AccessTimeIcon,
    Room as LocationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../../services/api/eventApi';
import { Events } from '../../types/event';
import {
    format,
    parseISO,
    differenceInMinutes,
    startOfToday,
    addMonths,
    differenceInMilliseconds,
    isAfter,
    isBefore,
    isWithinInterval
} from 'date-fns';

function getDailyOccurrenceTimes(event: Events): { start: Date; end: Date } {
    const eventStart = parseISO(event.start_time);
    const eventEnd = parseISO(event.end_time);

    if (event.recurring) {
        // For recurring events, assume each daily occurrence runs 9:00 AM to 5:00 PM local time.
        const adjustedStart = new Date(
            eventStart.getFullYear(),
            eventStart.getMonth(),
            eventStart.getDate(),
            9, 0, 0
        );
        const adjustedEnd = new Date(
            eventStart.getFullYear(),
            eventStart.getMonth(),
            eventStart.getDate(),
            17, 0, 0
        );
        return { start: adjustedStart, end: adjustedEnd };
    }

    return { start: eventStart, end: eventEnd };
}

const UpcomingEventsWidget: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { getEvents } = eventApi;

    const [events, setEvents] = useState<Events[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const [now, setNow] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            const currentDay = startOfToday();
            const limitDate = addMonths(currentDay, 1);

            try {
                const params = {
                    start_date: format(currentDay, 'yyyy-MM-dd'),
                    end_date: format(limitDate, 'yyyy-MM-dd')
                };
                const response = await getEvents(params);
                setEvents(response.data || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [getEvents]);

    const upcomingEvents = useMemo(() => {
        if (!events) return [];
        const currentDay = startOfToday();
        const limitDate = addMonths(currentDay, 1);
        return events
            .filter(event => {
                const start = parseISO(event.start_time);
                return start >= currentDay && start <= limitDate;
            })
            .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    }, [events]);

    const displayedEvents = expanded ? upcomingEvents : upcomingEvents.slice(0, 6);
    const handleToggleExpand = () => setExpanded(!expanded);

    const formatEventTime = (start: Date, end: Date, recurring: boolean) => {
        const dayFormat = format(start, 'EEE, MMM d');
        const startTimeFormat = format(start, 'h:mm a');
        const endTimeFormat = format(end, 'h:mm a');

        return (
            <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                <Typography variant="body2" color="text.primary">
                    {dayFormat}
                </Typography>
                {startTimeFormat !== endTimeFormat ? (
                    <Typography variant="body2" color="text.secondary">
                        {startTimeFormat} - {endTimeFormat}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {startTimeFormat}
                    </Typography>
                )}
                {recurring && (
                    <Tooltip title="Recurring Event">
                        <RepeatIcon fontSize="small" sx={{ opacity: 0.7 }} />
                    </Tooltip>
                )}
            </Box>
        );
    };

    const getTimeDescription = (start: Date, end: Date): JSX.Element | null => {
        if (isBefore(now, start)) {
            // Event hasn't started yet, show countdown until start
            const diffMs = differenceInMilliseconds(start, now);
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const days = Math.floor(diffMinutes / (60 * 24));
            const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
            const minutes = diffMinutes % 60;

            const parts: string[] = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            parts.push(`${minutes}m`);

            return (
                <Box display="flex" alignItems="center" mt={0.5} ml={5}>
                    <Typography variant="body2" color="primary">
                        Starts in: {parts.join(' ')}
                    </Typography>
                </Box>
            );
        } else if (isWithinInterval(now, { start, end })) {
            // We are currently within the event
            const diffMinutes = differenceInMinutes(end, now);
            const days = Math.floor(diffMinutes / (60 * 24));
            const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
            const minutes = diffMinutes % 60;

            const parts: string[] = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            parts.push(`${minutes}m`);

            return (
                <Box display="flex" alignItems="center" mt={0.5} ml={5}>
                    <Typography variant="body2" color="primary">
                        In progress, ends in: {parts.join(' ')}
                    </Typography>
                </Box>
            );
        } else if (isAfter(now, end)) {
            // Event has ended
            return null;
        }

        return null;
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
    };

    const renderEventItem = (event: Events) => {
        const { id, title, location, recurring, color } = event;

        const { start, end } = getDailyOccurrenceTimes(event);
        const durationMinutes = Math.max(differenceInMinutes(end, start), 0);
        const durationText = formatDuration(durationMinutes);

        return (
            <Paper
                key={`${id}-${event.start_time}`}
                elevation={1}
                sx={{
                    my: 1,
                    p: 1.5,
                    borderLeft: `4px solid ${color || theme.palette.primary.main}`,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        cursor: 'pointer'
                    },
                }}
                onClick={() => navigate(`/events/${id}`)}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: color || theme.palette.primary.main
                        }}
                    >
                        {recurring ? <RepeatIcon /> : <EventIcon />}
                    </Avatar>

                    <Box flexGrow={1} overflow="hidden">
                        <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: 600, lineHeight: 1.2 }}
                        >
                            {title}
                        </Typography>
                        {formatEventTime(start, end, recurring)}
                    </Box>
                </Box>

                {location && (
                    <Box display="flex" alignItems="center" mt={1} ml={5}>
                        <LocationIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {location}
                        </Typography>
                    </Box>
                )}

                {durationMinutes > 0 && (
                    <Box display="flex" alignItems="center" mt={0.5} ml={5}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2" color="text.secondary">
                            {durationText}
                        </Typography>
                    </Box>
                )}

                {getTimeDescription(start, end)}
            </Paper>
        );
    };

    if (isLoading) {
        return (
            <Box textAlign="center" py={2}>
                <Typography variant="body2" color="text.secondary">
                    Loading events...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" py={2}>
                <Typography variant="body2" color="error">
                    Error loading events: {error}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                Upcoming Events
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {upcomingEvents.length > 0 ? (
                    <>
                        <Box mt={2}>
                            {displayedEvents.map(event => renderEventItem(event))}
                        </Box>

                        {upcomingEvents.length > 5 && (
                            <Button
                                onClick={handleToggleExpand}
                                startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                {expanded ? 'Show Less' : `Show ${upcomingEvents.length - 5} More`}
                            </Button>
                        )}
                    </>
                ) : (
                    <Typography align="center" color="text.secondary" mt={2}>
                        No upcoming events in the next month
                    </Typography>
                )}
            </Box>

            <Box textAlign="right" mt={2}>
                <Button
                    color="primary"
                    onClick={() => navigate('/events')}
                    size="small"
                    variant="outlined"
                >
                    View All Events
                </Button>
            </Box>
        </Box>
    );
};

export default UpcomingEventsWidget;
