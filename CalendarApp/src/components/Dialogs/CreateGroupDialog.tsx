import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    CircularProgress,
    Typography,
    useTheme,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { groupApi } from '../../services/api/groupApi';

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onClose, onGroupCreated }) => {
    const theme = useTheme();
    const { createGroup } = groupApi;
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Group name is required');
            return;
        }

        setIsSubmitting(true);

        try {
            await createGroup({
                name: name.trim(),
                description: description.trim(),
                is_public: isPublic,
                // Additional fields can be added here if supported by the backend
            });
            onGroupCreated();
            onClose();
            setName('');
            setDescription('');
            setIsPublic(false);
        } catch (err: any) {
            setError('Unable to create group. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={!isSubmitting ? onClose : undefined}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <DialogTitle
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                }}
            >
                Create New Group
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        label="Group Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                        required
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                        multiline
                        rows={3}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                disabled={isSubmitting}
                            />
                        }
                        label="Make this group public"
                    />

                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Box display="flex" justifyContent="flex-end" mt={3}>
                        <Button
                            onClick={onClose}
                            sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 0, mr: 2 }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 0 }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Group'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CreateGroupDialog;
