import React, { useState, useCallback, useEffect } from 'react';
import {
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
} from '@mui/material';
import { Group as GroupIcon, ExpandMore as ExpandMoreIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { groupApi } from '../../services/api/groupApi';
import { invitationApi } from '../../services/api/invitationApi';
import { Group } from '../../types/group';
import { Invitation, Events } from '../../types/event';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T;
}

const GroupOverview: React.FC = () => {
    const { getGroups } = groupApi;
    const { getInvitations } = invitationApi;

    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
    const [groupsError, setGroupsError] = useState<string | null>(null);
    const [invitationsError, setInvitationsError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMoreGroups, setHasMoreGroups] = useState(true);
    const [totalGroupCount, setTotalGroupCount] = useState(0);

    const fetchGroups = useCallback(async (pageNumber: number) => {
        setIsLoadingGroups(true);
        setGroupsError(null);

        try {
            const params = { page: pageNumber.toString() };
            const response = await getGroups(params);
            setTotalGroupCount(response.count)

            if (response && 'results' in response && Array.isArray(response.results)) {
                const paginatedResponse = response as PaginatedResponse<Group[][]>;
                const newGroups: Group[] = paginatedResponse.results.flat();

                setGroups((prevGroups) => {
                    const updatedGroups = pageNumber === 1 ? newGroups : [...prevGroups, ...newGroups];
                    return updatedGroups;
                });

                setHasMoreGroups(!!paginatedResponse.next);
            } else {
                console.error('Invalid data format:', response);
                throw new Error('Invalid data format');
            }
        } catch (err) {
            console.error('Error loading groups:', err);
            setGroupsError('Error loading groups');
        } finally {
            setIsLoadingGroups(false);
        }
    }, [getGroups]);

    const fetchInvitations = useCallback(async () => {
        setIsLoadingInvitations(true);
        try {
            const response = await getInvitations();
            setInvitations(response.data);
        } catch (error) {
            console.error('Error loading invitations:', error);
            setInvitationsError('Error loading invitations');
        } finally {
            setIsLoadingInvitations(false);
        }
    }, [getInvitations]);

    useEffect(() => {
        fetchGroups(page);
        fetchInvitations();
    }, [page, fetchGroups, fetchInvitations]);

    const loadMoreGroups = () => {
        if (hasMoreGroups) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const getInvitationTitle = (invitation: Invitation) => {
        if (invitation.group) {
            return `Invitation to group: ${invitation.group.name}`;
        } else if (invitation.event) {
            return `Invitation to event: ${(invitation.event as Events).title}`;
        } else {
            return 'Invitation';
        }
    };

    if (isLoadingGroups || isLoadingInvitations) return <CircularProgress />;
    if (groupsError || invitationsError) return <Typography color="error">Error loading data</Typography>;

    return (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h6" gutterBottom align="center">Group Overview</Typography>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">Your Groups ({totalGroupCount})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {groups.length > 0 ? (
                        <List disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {groups.map((group) => (
                                <ListItem
                                    key={group.id}
                                    onClick={() => navigate(`/groups/${group.id}`)}
                                    sx={{ cursor: 'pointer', paddingLeft: 0 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar><GroupIcon /></Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={group.name}
                                        secondary={
                                            <Chip
                                                size="small"
                                                label={`${group.members.length} members`}
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography>No groups available</Typography>
                    )}
                    {hasMoreGroups && (
                        <Box display="flex" justifyContent="center" mt={2}>
                            <Button onClick={() => setPage((prevPage) => prevPage + 1)} disabled={isLoadingGroups}>
                                {isLoadingGroups ? <CircularProgress size={24} /> : 'Load More'}
                            </Button>
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {invitations.length > 0 && (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body1">Pending Invitations ({invitations.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {invitations.map((invitation) => (
                                <ListItem key={invitation.id} sx={{ paddingLeft: 0 }}>
                                    <ListItemAvatar>
                                        <Avatar><PersonAddIcon /></Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={getInvitationTitle(invitation)}
                                        secondary={`From: ${invitation.sender.username}`}
                                    />
                                    <Button size="small" color="primary">Respond</Button>
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            )}

            <Box textAlign="right" mt={2}>
                <Button color="primary" onClick={() => navigate('/groups')}>Manage Groups</Button>
            </Box>
        </Box>
    );
};

export default GroupOverview;
