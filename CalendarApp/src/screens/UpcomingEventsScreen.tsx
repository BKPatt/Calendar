import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    Chip,
    Divider,
    Button,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Pagination
} from '@mui/material';
import { Event as EventIcon, AccessTime as TimeIcon, Room as LocationIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Grid2 from '@mui/material/Grid2';
import { Events } from '../types/event';
import { eventApi } from '../services/api/eventApi';

const UpcomingEventsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Events[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);

        const params = {
            page: currentPage.toString(),
            page_size: pageSize.toString(),
        };

        const response = await eventApi.getAllEvents(params);
        if (response.error) {
            setError(response.error.join(', '));
        } else if (response.data) {
            setEvents(response.data);
            setCount(response.count || 0);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [currentPage, pageSize]);

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
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
                    All Events
                </Typography>

                <Grid2 container spacing={3}>
                    {events.map((event) => (
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
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: event.color || '#007bff' }}>
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

                {events.length === 0 && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography variant="h6" color="text.secondary">
                            No events found.
                        </Typography>
                    </Box>
                )}

                <Box display="flex" justifyContent="center" alignItems="center" mt={4} gap={2}>
                    <FormControl variant="outlined">
                        <InputLabel id="page-size-label">Page Size</InputLabel>
                        <Select
                            labelId="page-size-label"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(e.target.value as number);
                                setCurrentPage(1);
                            }}
                            label="Page Size"
                            sx={{ minWidth: 100 }}
                        >
                            <MenuItem value={3}>3</MenuItem>
                            <MenuItem value={6}>6</MenuItem>
                            <MenuItem value={9}>9</MenuItem>
                            <MenuItem value={12}>12</MenuItem>
                        </Select>
                    </FormControl>
                    <Pagination
                        count={Math.ceil(count / pageSize)}
                        page={currentPage}
                        onChange={(e, page) => setCurrentPage(page)}
                        color="primary"
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default UpcomingEventsScreen;
