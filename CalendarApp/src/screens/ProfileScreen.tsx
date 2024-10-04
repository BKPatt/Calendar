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
    SelectChangeEvent,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/api';
import { UserProfile } from '../types/user';

const randomColor = () => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800'];
    return colors[Math.floor(Math.random() * colors.length)];
};

const initialsFromName = (username: string) => username.slice(0, 2).toUpperCase();

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [avatarColor, setAvatarColor] = useState<string>(randomColor());

    useEffect(() => {
        if (user) {
            getUserProfile(user.id)
                .then((response) => {
                    setProfile(response.data);
                    setAvatarColor(randomColor()); // Set random color for avatar on load
                })
                .catch(() => setSnackbarMessage('Error loading profile data'));
        }
    }, [user]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile({ ...profile });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile({});
    };

    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (user && profile) {
            try {
                await updateUserProfile(user.id, editedProfile);
                setSnackbarMessage('Profile updated successfully');
                setSnackbarOpen(true);
                setIsEditing(false);
            } catch (error) {
                setSnackbarMessage('Failed to update profile');
                setSnackbarOpen(true);
            }
        }
    };

    if (!user) return <Typography>Please log in to view your profile.</Typography>;
    if (!profile) return <CircularProgress />;

    const avatarContent = profile.profilePicture ? (
        <Avatar src={profile.profilePicture} sx={{ width: 150, height: 150, mb: 2 }} />
    ) : (
        <Avatar sx={{ width: 150, height: 150, mb: 2, bgcolor: avatarColor }}>
            {initialsFromName(user.username)}
        </Avatar>
    );

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        User Profile
                    </Typography>
                    {!isEditing ? (
                        <Box>
                            <Button startIcon={<EditIcon />} onClick={handleEdit}>
                                Edit Profile
                            </Button>
                            <Button startIcon={<LogoutIcon />} onClick={logout} sx={{ ml: 2 }}>
                                Log Out
                            </Button>
                        </Box>
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
                    <Grid2 sx={{ size: 12, '@media (min-width:600px)': { size: 4 } }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            {avatarContent}
                            {isEditing && (
                                <Button variant="outlined" component="label">
                                    Upload Picture
                                    <input type="file" hidden />
                                </Button>
                            )}
                        </Box>
                    </Grid2>
                    <Grid2 sx={{ size: 12, '@media (min-width:600px)': { size: 8 } }}>
                        <Grid2 container spacing={2}>
                            <Grid2 sx={{ size: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={profile.username}
                                    disabled
                                />
                            </Grid2>
                            <Grid2 sx={{ size: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={profile.email}
                                    disabled
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
                            {profile.bio && (
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
                            )}
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
