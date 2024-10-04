import React, { useState } from 'react';
import {
    TextField,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    SelectChangeEvent,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { getGroups } from '../../services/api';
import { Group } from '../../types/group';
import { User } from '../../types/user';

interface InvitationFormProps {
    open: boolean;
    onClose: () => void;
    onInvitationSent: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ open, onClose, onInvitationSent }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const { data: groups, isLoading, error } = useApi<Group[]>(getGroups);

    const [invitationData, setInvitationData] = useState<Partial<User>>({
        email: '',
    });
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !selectedGroupId) return;

        try {
            // Send invitation based on selectedGroupId and invitationData.email
            // Implement the invitation sending API call here
            onInvitationSent();
            onClose();
        } catch (error) {
            console.error('Failed to send invitation:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvitationData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (event: SelectChangeEvent<number>) => {
        setSelectedGroupId(event.target.value as number);
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
            <DialogTitle>Invite People</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={invitationData.email}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Group</InputLabel>
                        <Select
                            value={selectedGroupId || ''}
                            onChange={handleGroupChange}
                            label="Select Group"
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {groups?.map((group) => (
                                <MenuItem key={group.id} value={group.id}>
                                    {group.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Send Invitation
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InvitationForm;