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
    Avatar,
    IconButton,
    Chip,
    Collapse,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Card,
    CardHeader,
    CardContent,
    CardActions,
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
    Public as PublicIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import Grid2 from '@mui/material/Grid2';
import { useAuth } from '../hooks/useAuth';
import { groupApi } from '../services/api/groupApi';
import { Group } from '../types/group';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';
import CreateGroupDialog from '../components/Dialogs/CreateGroupDialog';

const GroupScreen: React.FC = () => {
    const { getGroups, getGroupEvents } = groupApi;
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
        <Container maxWidth="lg" sx={{ pb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        pb: 2,
                    }}
                >
                    <Typography variant="h4" component="h1" color="text.primary" sx={{ fontWeight: 600 }}>
                        My Groups
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateGroup}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: 0,
                            backgroundColor: theme.palette.grey[200],
                            color: theme.palette.text.primary,
                        }}
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
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        mb: 3,
                        bgcolor: theme.palette.background.default,
                        borderRadius: 0,
                    }}
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
                    <Grid2 container spacing={3} component="div">
                        {filteredGroups.map((group) => (
                            <Grid2
                                key={group.id}
                                component="div"
                                size={{ xs: 12, sm: 6, md: 4 }}
                            >
                                <Card
                                    elevation={3}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 0,
                                        border: `1px solid ${theme.palette.divider}`,
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: theme.shadows[6],
                                        },
                                    }}
                                >
                                    <CardHeader
                                        avatar={
                                            <Avatar sx={{ bgcolor: theme.palette.primary.main, borderRadius: 0 }}>
                                                <GroupIcon />
                                            </Avatar>
                                        }
                                        action={
                                            <IconButton
                                                onClick={() => handleExpandClick(group.id)}
                                                aria-expanded={expandedGroupId === group.id}
                                                aria-label="show more"
                                                sx={{
                                                    borderRadius: 0,
                                                }}
                                            >
                                                {expandedGroupId === group.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        }
                                        title={
                                            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                                {group.name}
                                            </Typography>
                                        }
                                        subheader={
                                            <Typography variant="body2" color="text.secondary">
                                                {group.members.length} members
                                            </Typography>
                                        }
                                        sx={{
                                            pb: 0,
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {group.description || <em>No description provided</em>}
                                        </Typography>
                                        <Box
                                            mt={2}
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Chip
                                                icon={group.is_public ? <PublicIcon /> : <LockIcon />}
                                                label={group.is_public ? 'Public' : 'Private'}
                                                color={group.is_public ? 'primary' : 'default'}
                                                size="small"
                                                sx={{ fontWeight: 500, borderRadius: 0 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                Created: {formatDate(group.createdAt, 'PP')}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <Collapse in={expandedGroupId === group.id} timeout="auto" unmountOnExit>
                                        <Divider />
                                        <CardContent sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom color="text.primary">
                                                Members:
                                            </Typography>
                                            <List disablePadding>
                                                {group.members.slice(0, 5).map((member) => (
                                                    <ListItem key={member.id} disableGutters>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ borderRadius: 0 }}>
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
                                                    <ListItem disableGutters>
                                                        <ListItemText
                                                            primary={`+${group.members.length - 5} more members`}
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                            <Typography variant="subtitle1" gutterBottom color="text.primary" sx={{ mt: 2 }}>
                                                Upcoming Events:
                                            </Typography>
                                            <GroupEvents groupId={group.id} />
                                        </CardContent>
                                    </Collapse>
                                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/groups/${group.id}`)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                borderRadius: 0,
                                            }}
                                        >
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

            <CreateGroupDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onGroupCreated={handleGroupCreated}
            />
        </Container>
    );
};

export default GroupScreen;
