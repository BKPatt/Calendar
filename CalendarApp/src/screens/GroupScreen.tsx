import React, { useState, useCallback } from 'react';
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
} from '@mui/material';
import { useTheme } from '@mui/system';
import {
    Group as GroupIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { getGroups, createGroup, getGroupEvents } from '../services/api';
import { Group } from '../types/group';
import { Events } from '../types/event';
import { formatDate } from '../utils/dateHelpers';

const GroupScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<number | false>(false);

    const { data: groups, isLoading, error, refetch } = useApi<Group[]>(getGroups);

    const handleCreateGroup = async () => {
        if (newGroupName.trim() && user) {
            try {
                await createGroup({
                    name: newGroupName.trim(),
                    description: newGroupDescription.trim(),
                    admin: user.id,
                });
                setIsDialogOpen(false);
                setNewGroupName('');
                setNewGroupDescription('');
                refetch();
            } catch (error) {
                console.error('Error creating group:', error);
            }
        }
    };

    const handleAccordionChange = useCallback((groupId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedGroup(isExpanded ? groupId : false);
    }, []);

    const GroupEvents: React.FC<{ groupId: number }> = ({ groupId }) => {
        const { data: events, isLoading, error } = useApi<Events[]>(() => getGroupEvents(groupId));

        if (isLoading) return <CircularProgress size={24} />;
        if (error) return <Typography color="error">Error loading events</Typography>;

        return (
            <List>
                {events && events.length > 0 ? (
                    events.map((event) => (
                        <ListItem key={event.id} sx={{ pl: 4 }}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: event.color || theme.palette.primary.main }}>
                                    <EventIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={event.title}
                                secondary={`${formatDate(event.startTime, 'PPp')} - ${formatDate(event.endTime, 'PPp')}`}
                            />
                        </ListItem>
                    ))
                ) : (
                    <ListItem sx={{ pl: 4 }}>
                        <ListItemText primary="No upcoming events" />
                    </ListItem>
                )}
            </List>
        );
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" component="h1">
                        My Groups
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Create Group
                    </Button>
                </Box>
                {groups && groups.length > 0 ? (
                    groups.map((group) => (
                        <Accordion
                            key={group.id}
                            expanded={expandedGroup === group.id}
                            onChange={handleAccordionChange(group.id)}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box display="flex" alignItems="center" width="100%">
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                                        <GroupIcon />
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography variant="h6">{group.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {group.members.length} members
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={group.isPublic ? 'Public' : 'Private'}
                                        color={group.isPublic ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography paragraph>{group.description}</Typography>
                                <Divider />
                                <Typography variant="subtitle1" mt={2} mb={1}>
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
                                                primary={`${member.firstName} ${member.lastName}`}
                                                secondary={member.email}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider />
                                <Typography variant="subtitle1" mt={2} mb={1}>
                                    Upcoming Events:
                                </Typography>
                                <GroupEvents groupId={group.id} />
                                <Box mt={2}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        View Full Group Details
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))
                ) : (
                    <Typography>You are not a member of any groups yet.</Typography>
                )}
            </Box>
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Group Name"
                        fullWidth
                        value={newGroupName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={newGroupDescription}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default GroupScreen;