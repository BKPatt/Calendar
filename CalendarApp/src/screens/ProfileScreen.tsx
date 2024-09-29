import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Avatar,
    Box,
    Grid2,
    Paper,
    CircularProgress,
    Snackbar,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    SelectChangeEvent
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { getUserProfile, updateUserProfile } from '../services/api';
import { UserProfile } from '../types/user';

const ProfileScreen: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const { data, isLoading, error, refetch } = useApi<UserProfile>(() =>
        getUserProfile(user?.id || 0)
    );

    useEffect(() => {
        if (data) {
            setProfile(data);
        }
    }, [data]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile({ ...profile });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile({});
    };

    // Separate handler for TextField
    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name as string]: value }));
    };

    // Separate handler for Select
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name as string]: value }));
    };

    const handleSave = async () => {
        if (user && profile) {
            try {
                await updateUserProfile(user.id, editedProfile);
                setSnackbarMessage('Profile updated successfully');
                setSnackbarOpen(true);
                setIsEditing(false);
                refetch();
            } catch (error) {
                setSnackbarMessage('Failed to update profile');
                setSnackbarOpen(true);
            }
        }
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;
    if (!profile) return <Typography>No profile data available</Typography>;

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        User Profile
                    </Typography>
                    {!isEditing ? (
                        <Button startIcon={<EditIcon />} onClick={handleEdit}>
                            Edit Profile
                        </Button>
                    ) : (
                        <Box>
                            <Button startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>
                                Save
                            </Button>
                            <Button startIcon={<CancelIcon />} onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Box>
                    )}
                </Box>
                <Grid2 container spacing={3}>
                    <Grid2
                        sx={{
                            size: 12,
                            '@media (min-width:600px)': { size: 4 },
                        }}
                    >
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Avatar
                                src={profile.profilePicture}
                                alt={`${profile.firstName} ${profile.lastName}`}
                                sx={{ width: 150, height: 150, mb: 2 }}
                            />
                            {isEditing && (
                                <Button variant="outlined" component="label">
                                    Upload Picture
                                    <input type="file" hidden />
                                </Button>
                            )}
                        </Box>
                    </Grid2>
                    <Grid2
                        sx={{
                            size: 12,
                            '@media (min-width:600px)': { size: 8 },
                        }}
                    >
                        <Grid2 container spacing={2}>
                            <Grid2 sx={{ size: 12, '@media (min-width:600px)': { size: 6 } }}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstName"
                                    value={isEditing ? editedProfile.firstName : profile.firstName}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                />
                            </Grid2>
                            <Grid2 sx={{ size: 12, '@media (min-width:600px)': { size: 6 } }}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastName"
                                    value={isEditing ? editedProfile.lastName : profile.lastName}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                />
                            </Grid2>
                            <Grid2 sx={{ size: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={isEditing ? editedProfile.email : profile.email}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                />
                            </Grid2>
                            <Grid2 sx={{ size: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={isEditing ? editedProfile.phoneNumber : profile.phoneNumber}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                />
                            </Grid2>
                            <Grid2 sx={{ size: 12 }}>
                                <FormControl fullWidth disabled={!isEditing}>
                                    <InputLabel id="default-timezone-label">Default Timezone</InputLabel>
                                    <Select
                                        labelId="default-timezone-label"
                                        name="defaultTimezone"
                                        value={isEditing ? editedProfile.defaultTimezone : profile.defaultTimezone}
                                        onChange={handleSelectChange}
                                        label="Default Timezone"
                                    >
                                        <MenuItem value="UTC">UTC</MenuItem>
                                        <MenuItem value="America/New_York">Eastern Time</MenuItem>
                                        <MenuItem value="America/Chicago">Central Time</MenuItem>
                                        <MenuItem value="America/Denver">Mountain Time</MenuItem>
                                        <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid2>
                            <Grid2 sx={{ size: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Bio"
                                    name="bio"
                                    value={isEditing ? editedProfile.bio : profile.bio}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                    multiline
                                    rows={4}
                                />
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </Grid2>
            </Paper>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default ProfileScreen;
