import React, { useState } from 'react';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { groupApi } from '../../services/api/groupApi';
import { Group } from '../../types/group';
import { ApiResponse } from '../../types/event';

interface GroupFormProps {
    open: boolean;
    onClose: () => void;
    onGroupCreated?: () => void;
    onGroupUpdated?: () => void;
    group?: Group | null;
}

const GroupForm: React.FC<GroupFormProps> = ({ open, onClose, onGroupCreated, onGroupUpdated, group }) => {
    const { createGroup, updateGroup } = groupApi;

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [groupData, setGroupData] = useState<Partial<Group>>({
        name: group?.name || '',
        description: group?.description || '',
        is_public: group?.is_public || false,
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (group) {
                await updateGroup(group.id, groupData);
                onGroupUpdated && onGroupUpdated();
            } else {
                await createGroup(groupData);
                onGroupCreated && onGroupCreated();
            }
            onClose();
        } catch (error) {
            console.error('Failed to create/update group:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setGroupData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setGroupData(prev => ({ ...prev, [name]: checked }));
    };

    return (
        <Dialog
            open={open}
            sx={{ mt: 8 }}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle>{group ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Group Name"
                        name="name"
                        value={groupData.name}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={groupData.description}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={4}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={groupData.is_public}
                                onChange={handleCheckboxChange}
                                name="is_public"
                            />
                        }
                        label="Public Group"
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {group ? 'Update Group' : 'Create Group'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GroupForm;