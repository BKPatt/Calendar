import React, { useState, useCallback, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    CircularProgress,
    Divider,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Collapse,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Grid,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Group as GroupIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { groupApi } from '../services/api/groupApi';
import { Group } from '../types/group';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';
import GroupForm from '../components/Group/GroupForm';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T;
}

const GroupScreen: React.FC = () => {
    const { getGroups, createGroup, getGroupEvents } = groupApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [events, setEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchGroups = useCallback(async (pageNumber: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = { page: pageNumber.toString() };
            const response = await getGroups(params);

            if (response && 'results' in response && Array.isArray(response.results)) {
                const paginatedResponse = response as PaginatedResponse<Group[][]>;
                const newGroups: Group[] = paginatedResponse.results.flat();

                setGroups((prevGroups) => {
                    const updatedGroups = pageNumber === 1 ? newGroups : [...prevGroups, ...newGroups];
                    return updatedGroups;
                });

                setHasMore(!!paginatedResponse.next);
            } else {
                console.error('Invalid data format:', response);
                throw new Error('Invalid data format');
            }
        } catch (err) {
            console.error('Error loading groups:', err);
            setError('Error loading groups');
        } finally {
            setIsLoading(false);
        }
    }, [getGroups]);

    useEffect(() => {
        fetchGroups(page);
    }, [page, fetchGroups]);

    const handleCreateGroup = () => {
        setIsDialogOpen(true);
    };

    const handleExpandClick = (groupId: number) => {
        setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
    };

    const loadMoreGroups = () => {
        if (hasMore) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const handleGroupCreated = () => {
        setIsDialogOpen(false);
        setPage(1);
        setGroups([]);
        fetchGroups(1);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const GroupEvents: React.FC<{ groupId: number }> = ({ groupId }) => {
        const [events, setEvents] = useState<Events[]>([]);
        const [isLoadingEvents, setIsLoadingEvents] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const fetchGroupEvents = async () => {
                setIsLoadingEvents(true);
                try {
                    const response = await getGroupEvents(groupId);
                    setEvents(response.data || []);
                } catch (err) {
                    setError('Error loading events');
                } finally {
                    setIsLoadingEvents(false);
                }
            };

            fetchGroupEvents();
        }, [groupId]);

        if (isLoadingEvents) {
            return (
                <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress size={24} />
                </Box>
            );
        }

        if (error) {
            return (
                <Typography color="error" align="center" mt={2}>
                    {error}
                </Typography>
            );
        }

        return (
            <List>
                {events.length > 0 ? (
                    events.map((event) => (
                        <ListItem key={event.id} sx={{ pl: 4 }}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: event.color || theme.palette.primary.main }}>
                                    <EventIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={event.title}
                                secondary={`${formatDate(event.start_time, 'PPp')} - ${formatDate(event.end_time, 'PPp')}`}
                            />
                        </ListItem>
                    ))
                ) : (
                    <Typography align="center" mt={2}>
                        No upcoming events
                    </Typography>
                )}
            </List>
        );
    };

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Grid container spacing={2} alignItems="center" mb={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h4" component="h1">
                            My Groups
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} container justifyContent="flex-end">
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateGroup}
                        >
                            Create Group
                        </Button>
                    </Grid>
                </Grid>
                <TextField
                    fullWidth
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 3 }}
                />
                {isLoading && page === 1 ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center" mt={4}>
                        {error}
                    </Typography>
                ) : filteredGroups.length > 0 ? (
                    <>
                        {filteredGroups.map((group) => (
                            <Card key={group.id} sx={{ mb: 3 }}>
                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                            <GroupIcon />
                                        </Avatar>
                                    }
                                    action={
                                        <Chip
                                            label={group.is_public ? 'Public' : 'Private'}
                                            color={group.is_public ? 'success' : 'default'}
                                            size="small"
                                        />
                                    }
                                    title={group.name}
                                    subheader={`${group.members.length} members`}
                                />
                                <CardActions disableSpacing>
                                    <IconButton
                                        onClick={() => handleExpandClick(group.id)}
                                        aria-expanded={expandedGroupId === group.id}
                                        aria-label="show more"
                                    >
                                        {expandedGroupId === group.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                        sx={{ ml: 'auto' }}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                                <Collapse in={expandedGroupId === group.id} timeout="auto" unmountOnExit>
                                    <CardContent>
                                        <Typography paragraph>{group.description || 'No description provided'}</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" gutterBottom>
                                            Members:
                                        </Typography>
                                        <List>
                                            {group.members.map((member) => (
                                                <ListItem key={member.id}>
                                                    <ListItemAvatar>
                                                        <Avatar>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={`${member.username}`}
                                                        secondary={member.email}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" gutterBottom>
                                            Upcoming Events:
                                        </Typography>
                                        <GroupEvents groupId={group.id} />
                                    </CardContent>
                                </Collapse>
                            </Card>
                        ))}
                        {hasMore && (
                            <Box display="flex" justifyContent="center" mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={loadMoreGroups}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </Button>
                            </Box>
                        )}
                    </>
                ) : (
                    <Typography align="center" mt={4}>
                        No groups found.
                    </Typography>
                )}
            </Box>
            <GroupForm
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onGroupCreated={handleGroupCreated}
            />
        </Container>
    );
};

export default GroupScreen;