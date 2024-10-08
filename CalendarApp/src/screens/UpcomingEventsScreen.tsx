import React, { useState, useMemo } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    Chip,
    Divider,
    Pagination,
    useTheme,
    useMediaQuery,
    Grid2,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    Event as EventIcon,
    Search as SearchIcon,
    ArrowForward as ArrowForwardIcon,
    AccessTime as TimeIcon,
    Room as LocationIcon,
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { EVENT_TYPES, Events } from '../types/event';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const UpcomingEventsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { getUpcomingEvents } = eventApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const { data: events, isLoading, error } = useApi<Events[]>(getUpcomingEvents);

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        let filtered = events;

        if (searchTerm) {
            filtered = filtered.filter(
                (event) =>
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterType !== 'all') {
            filtered = filtered.filter((event) => event.event_type === filterType);
        }

        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            } else {
                return a.title.localeCompare(b.title);
            }
        });

        return filtered;
    }, [events, searchTerm, sortBy, filterType]);

    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredEvents.slice(startIndex, endIndex);
    }, [filteredEvents, currentPage]);

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Typography variant="h4" component="h1" gutterBottom color="error">
                    Error: {error}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Upcoming Events
                </Typography>
                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                                },
                            }}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="sort-by-label">Sort By</InputLabel>
                            <Select
                                labelId="sort-by-label"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as string)}
                                label="Sort By"
                            >
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="title">Title</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="filter-type-label">Filter</InputLabel>
                            <Select
                                labelId="filter-type-label"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as string)}
                                label="Filter"
                            >
                                {EVENT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid2>
                </Grid2>

                <Grid2 container spacing={3}>
                    {paginatedEvents.map((event) => (
                        <Grid2 key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: theme.shadows[6],
                                    },
                                }}
                            >
                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: event.color || theme.palette.primary.main }}>
                                            <EventIcon />
                                        </Avatar>
                                    }
                                    title={event.title}
                                    subheader={format(parseISO(event.start_time), 'PPP')}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {event.description}
                                    </Typography>
                                    <Box display="flex" alignItems="center" mt={1}>
                                        <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="body2">
                                            {format(parseISO(event.start_time), 'p')} - {format(parseISO(event.end_time), 'p')}
                                        </Typography>
                                    </Box>
                                    {event.location && (
                                        <Box display="flex" alignItems="center" mt={1}>
                                            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">{event.location}</Typography>
                                        </Box>
                                    )}
                                    <Box mt={2}>
                                        <Chip
                                            size="small"
                                            label={event.event_type}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                </CardContent>
                                <Divider />
                                <CardActions>
                                    <Button
                                        size="small"
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={() => handleEventClick(event.id!)}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>

                {filteredEvents.length === 0 && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography variant="h6" color="text.secondary">
                            No upcoming events found.
                        </Typography>
                    </Box>
                )}

                {filteredEvents.length > itemsPerPage && (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <Pagination
                            count={Math.ceil(filteredEvents.length / itemsPerPage)}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default UpcomingEventsScreen;