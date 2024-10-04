import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
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
    IconButton,
    Chip,
    Divider,
    Pagination,
    Skeleton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Event as EventIcon,
    Search as SearchIcon,
    ArrowForward as ArrowForwardIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { eventApi } from '../services/api/eventApi';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';

const UpcomingEventsScreen: React.FC = () => {
    const { getUpcomingEvents } = eventApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const { data: events, isLoading, error, refetch } = useApi<Events[]>(getUpcomingEvents);

    const [filteredEvents, setFilteredEvents] = useState<Events[]>([]);

    useEffect(() => {
        if (events) {
            let filtered = events;

            if (searchTerm) {
                filtered = filtered.filter(
                    (event) =>
                        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (event.description &&
                            event.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            if (filterType !== 'all') {
                filtered = filtered.filter((event) => event.eventType === filterType);
            }

            filtered.sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                } else {
                    return a.title.localeCompare(b.title);
                }
            });

            setFilteredEvents(filtered);
            setCurrentPage(1);
        }
    }, [events, searchTerm, sortBy, filterType]);

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedEvents = filteredEvents.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <Container maxWidth="lg">
                <Box my={4}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Upcoming Events
                    </Typography>
                    <Grid container spacing={3}>
                        {[...Array(9)].map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card>
                                    <CardHeader
                                        avatar={
                                            <Skeleton variant="circular" width={40} height={40} />
                                        }
                                        title={<Skeleton variant="text" width="80%" />}
                                        subheader={<Skeleton variant="text" width="40%" />}
                                    />
                                    <CardContent>
                                        <Skeleton variant="text" />
                                        <Skeleton variant="text" width="60%" />
                                    </CardContent>
                                    <CardActions>
                                        <Skeleton variant="circular" width={24} height={24} />
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box my={4}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Upcoming Events
                    </Typography>
                    <Typography variant="body1" color="error">
                        Error: {error}
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h4" component="h1">
                        Upcoming Events
                    </Typography>
                    <Box display="flex" alignItems="center">
                        <TextField
                            variant="outlined"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                            }}
                            sx={{ mr: 2 }}
                        />
                        {!isMobile && (
                            <>
                                <FormControl variant="outlined" sx={{ minWidth: 120, mr: 2 }}>
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
                                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
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
                            </>
                        )}
                        {isMobile && (
                            <IconButton color="primary">
                                <FilterListIcon />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {displayedEvents.map((event) => (
                        <Grid item xs={12} sm={6} md={4} key={event.id}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
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
                                    subheader={formatDate(event.start_time, 'PPp')}
                                />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        {event.description}
                                    </Typography>
                                    <Box mt={2}>
                                        <Chip
                                            size="small"
                                            label={event.eventType}
                                            sx={{ mr: 1, bgcolor: theme.palette.primary.light }}
                                        />
                                        {event.group && (
                                            <Chip size="small" label={event.group} sx={{ bgcolor: theme.palette.secondary.light }} />
                                        )}
                                    </Box>
                                </CardContent>
                                <Box sx={{ flexGrow: 1 }} />
                                <Divider />
                                <CardActions>
                                    <IconButton onClick={() => handleEventClick(event.id!)}>
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredEvents.length === 0 && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        minHeight="200px"
                    >
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
            </Box>
        </Container>
    );
};

export default UpcomingEventsScreen;