import React, { useState } from 'react';
import {
    Container,
    Typography,
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
    Box,
} from '@mui/material';
import { Group as GroupIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { getGroups, createGroup } from '../../services/api';
import { Group } from '../../types/group';

const GroupList: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');

    const { data: groups, isLoading, error, refetch } = useApi(getGroups);

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

    const handleGroupClick = (groupId: number) => {
        navigate(`/groups/${groupId}`);
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="md">
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
            <List>
                {groups?.map((group: Group) => (
                    <ListItem
                        key={group.id}
                        component="button"
                        onClick={() => handleGroupClick(group.id)}
                        style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0, textAlign: 'left', width: '100%' }}
                    >
                        <ListItemAvatar>
                            <Avatar>
                                <GroupIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={group.name}
                            secondary={`${group.members.length} members`}
                        />
                    </ListItem>
                ))}
            </List>
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

export default GroupList;