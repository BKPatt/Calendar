import React from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button } from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getGroups, getInvitations } from '../../services/api';
import { Group } from '../../types/group';
import { Invitation, Events } from '../../types/event';

const GroupOverview: React.FC = () => {
    const navigate = useNavigate();
    const { data: groups, isLoading: groupsLoading, error: groupsError } = useApi<Group[]>(getGroups);
    const { data: invitations, isLoading: invitationsLoading, error: invitationsError } = useApi<Invitation[]>(getInvitations);

    if (groupsLoading || invitationsLoading) return <Typography>Loading...</Typography>;
    if (groupsError || invitationsError) return <Typography color="error">Error loading data</Typography>;

    const getInvitationTitle = (invitation: Invitation) => {
        if (invitation.group) {
            return `Invitation to group: ${invitation.group.name}`;
        } else if (invitation.event) {
            return `Invitation to event: ${(invitation.event as Events).title}`;
        } else {
            return 'Invitation';
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Your Groups</Typography>
            <List>
                {groups?.slice(0, 3).map((group) => (
                    <ListItem
                        key={group.id}
                        component="div"
                        onClick={() => navigate(`/groups/${group.id}`)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                    >
                        <ListItemAvatar>
                            <Avatar>
                                <GroupIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={group.name} secondary={`${group.members.length} members`} />
                    </ListItem>
                ))}
            </List>
            {invitations && invitations.length > 0 && (
                <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>Pending Invitations</Typography>
                    <List>
                        {invitations.map((invitation) => (
                            <ListItem key={invitation.id} component="div">
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonAddIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={getInvitationTitle(invitation)}
                                    secondary={`From: ${invitation.sender.username}`}
                                />
                                <Button size="small" color="primary">Respond</Button>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
            <Box textAlign="right" mt={2}>
                <Button color="primary" onClick={() => navigate('/groups')}>Manage Groups</Button>
            </Box>
        </Box>
    );
};

export default GroupOverview;