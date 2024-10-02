import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    IconButton,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid2,
    Paper,
    Tooltip,
} from '@mui/material';
import {
    Event as EventIcon,
    Search as SearchIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getUpcomingEvents } from '../services/api';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';

const UpcomingEventsScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [filterType, setFilterType] = useState('all');
    const { data: events, isLoading, error, refetch } = useApi<Events[]>(getUpcomingEvents);

    const [filteredEvents, setFilteredEvents] = useState<Events[]>([]);

    useEffect(() => {
        if (events) {
            let filtered = events;

            // Apply search
            if (searchTerm) {
                filtered = filtered.filter(event =>
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            // Apply filter
            if (filterType !== 'all') {
                filtered = filtered.filter(event => event.eventType === filterType);
            }

            // Apply sort
            filtered.sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                } else {
                    return a.title.localeCompare(b.title);
                }
            });

            setFilteredEvents(filtered);
        }
    }, [events, searchTerm, sortBy, filterType]);

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    if (isLoading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Upcoming Events
                </Typography>

                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Grid2 container spacing={2} alignItems="center">
                        <Grid2 sx={{ size: 12, '@media (min-width:600px)': { size: 4 } }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon color="action" />,
                                }}
                            />
                        </Grid2>
                        <Grid2 sx={{ size: 6, '@media (min-width:600px)': { size: 2 } }}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Sort By</InputLabel>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as string)}
                                    label="Sort By"
                                >
                                    <MenuItem value="date">Date</MenuItem>
                                    <MenuItem value="title">Title</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 sx={{ size: 6, '@media (min-width:600px)': { size: 2 } }}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Filter</InputLabel>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as string)}
                                    label="Filter"
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="meeting">Meeting</MenuItem>
                                    <MenuItem value="appointment">Appointment</MenuItem>
                                    <MenuItem value="reminder">Reminder</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>
                </Paper>

                <List>
                    {filteredEvents.map((event) => (
                        <Paper key={event.id} elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    borderLeft: 6,
                                    borderColor: event.color || theme.palette.primary.main,
                                }}
                                secondaryAction={
                                    <Tooltip title="View Event Details">
                                        <IconButton
                                            edge="end"
                                            aria-label="view details"
                                            onClick={() => handleEventClick(event.id!)}
                                        >
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: event.color || theme.palette.primary.main }}>
                                        <EventIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="h6" component="div">
                                            {event.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(event.startTime, 'PPp')} - {formatDate(event.endTime, 'PPp')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {event.location}
                                            </Typography>
                                            <Box mt={1}>
                                                <Chip
                                                    size="small"
                                                    label={event.eventType}
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                                {event.group && (
                                                    <Chip
                                                        size="small"
                                                        label={event.group}
                                                        sx={{ mr: 1, mb: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        </>
                                    }
                                />
                            </ListItem>
                        </Paper>
                    ))}
                </List>

                {filteredEvents.length === 0 && (
                    <Typography variant="body1" color="text.secondary" align="center">
                        No upcoming events found.
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default UpcomingEventsScreen;
