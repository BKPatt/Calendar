import React, { useState, useCallback, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    TextField,
    InputAdornment,
    Grid2,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    IconButton,
    Chip,
    Collapse,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    useTheme,
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import {
    Group as GroupIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Search as SearchIcon,
    Public as PublicIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { groupApi } from '../services/api/groupApi';
import { Group } from '../types/group';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';
import GroupForm from '../components/Group/GroupForm';

const GroupScreen: React.FC = () => {
    const { getGroups, createGroup, getGroupEvents } = groupApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getGroups();
            if (Array.isArray(response.results)) {
                setGroups(response.results.flat());
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError('Error loading groups');
        } finally {
            setIsLoading(false);
        }
    }, [getGroups]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateGroup = () => {
        setIsDialogOpen(true);
    };

    const handleExpandClick = (groupId: number) => {
        setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
    };

    const handleGroupCreated = () => {
        setIsDialogOpen(false);
        fetchGroups();
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
                        <ListItem key={event.id}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: event.color || theme.palette.primary.main }}>
                                    <EventIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={event.title}
                                secondary={`${formatDate(event.start_time, 'PPp')} - ${formatDate(event.end_time, 'p')}`}
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
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        My Groups
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateGroup}
                    >
                        Create Group
                    </Button>
                </Box>
                <TextField
                    fullWidth
                    variant="outlined"
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
                {isLoading ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center" mt={4}>
                        {error}
                    </Typography>
                ) : filteredGroups.length > 0 ? (
                    <Grid2 container spacing={3}>
                        {filteredGroups.map((group) => (
                            <Grid2 key={group.id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                                <GroupIcon />
                                            </Avatar>
                                        }
                                        action={
                                            <IconButton
                                                onClick={() => handleExpandClick(group.id)}
                                                aria-expanded={expandedGroupId === group.id}
                                                aria-label="show more"
                                            >
                                                {expandedGroupId === group.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        }
                                        title={group.name}
                                        subheader={`${group.members.length} members`}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {group.description || 'No description provided'}
                                        </Typography>
                                        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                            <Chip
                                                icon={group.is_public ? <PublicIcon /> : <LockIcon />}
                                                label={group.is_public ? 'Public' : 'Private'}
                                                color={group.is_public ? 'success' : 'default'}
                                                size="small"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                Created: {formatDate(group.createdAt, 'PP')}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <Collapse in={expandedGroupId === group.id} timeout="auto" unmountOnExit>
                                        <Divider />
                                        <CardContent>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Members:
                                            </Typography>
                                            <List>
                                                {group.members.slice(0, 5).map((member) => (
                                                    <ListItem key={member.id}>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <PersonIcon />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={`${member.firstName} ${member.lastName}`}
                                                            secondary={member.email}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {group.members.length > 5 && (
                                                    <ListItem>
                                                        <ListItemText primary={`+${group.members.length - 5} more members`} />
                                                    </ListItem>
                                                )}
                                            </List>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Upcoming Events:
                                            </Typography>
                                            <GroupEvents groupId={group.id} />
                                        </CardContent>
                                    </Collapse>
                                    <CardActions>
                                        <Button size="small" onClick={() => navigate(`/groups/${group.id}`)}>
                                            View Details
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid2>
                        ))}
                    </Grid2>
                ) : (
                    <Typography align="center" mt={4}>
                        No groups found.
                    </Typography>
                )}
            </Paper>

            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent>
                    <GroupForm
                        onClose={() => setIsDialogOpen(false)}
                        onGroupCreated={handleGroupCreated}
                        open={isDialogOpen}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default GroupScreen;
