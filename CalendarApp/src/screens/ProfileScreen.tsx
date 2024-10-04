import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Avatar,
    Box,
    Grid,
    Paper,
    CircularProgress,
    Snackbar,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    SelectChangeEvent,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Logout as LogoutIcon,
    CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/api/userApi';
import { UserProfile } from '../types/user';
import { useNavigate } from 'react-router-dom';

const ProfileScreen: React.FC = () => {
    const { getUserProfile, updateUserProfile } = userApi;
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [avatarColor, setAvatarColor] = useState<string>('#2196f3');
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            getUserProfile(user.id)
                .then((response) => {
                    setProfile(response.data);
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
                const response = await updateUserProfile(user.id, editedProfile);
                setProfile(response.data);
                setSnackbarMessage('Profile updated successfully');
                setSnackbarOpen(true);
                setIsEditing(false);
            } catch (error) {
                setSnackbarMessage('Failed to update profile');
                setSnackbarOpen(true);
            }
        }
    };

    const openConfirmLogout = () => {
        setConfirmLogoutOpen(true);
    };

    const closeConfirmLogout = () => {
        setConfirmLogoutOpen(false);
    };

    const doLogout = async () => {
        await logout();
        navigate('/signin', { replace: true });
        window.location.reload();
    };

    if (!user) return <Typography>Please log in to view your profile.</Typography>;
    if (!profile) return <CircularProgress />;

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        User Profile
                    </Typography>
                    {!isEditing ? (
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={handleEdit}
                                sx={{ mr: 2 }}
                            >
                                Edit Profile
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<LogoutIcon />}
                                onClick={openConfirmLogout}
                            >
                                Log Out
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                sx={{ mr: 2 }}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        </Box>
                    )}
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Avatar
                                src={profile.profilePicture}
                                sx={{ width: 150, height: 150, mb: 2, bgcolor: avatarColor }}
                            >
                                {profile.username?.charAt(0).toUpperCase() || ''}
                            </Avatar>
                            {isEditing && (
                                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                                    Upload Picture
                                    <input type="file" hidden accept="image/*" />
                                </Button>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={profile.username}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={profile.email}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={isEditing ? editedProfile.phoneNumber : profile.phoneNumber}
                                    onChange={handleTextFieldChange}
                                    disabled={!isEditing}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth disabled={!isEditing}>
                                    <InputLabel id="timezone-label">Timezone</InputLabel>
                                    <Select
                                        labelId="timezone-label"
                                        name="defaultTimezone"
                                        value={
                                            isEditing ? editedProfile.defaultTimezone : profile.defaultTimezone
                                        }
                                        onChange={handleSelectChange}
                                        label="Timezone"
                                    >
                                        <MenuItem value="UTC">UTC</MenuItem>
                                        <MenuItem value="America/New_York">Eastern Time</MenuItem>
                                        <MenuItem value="America/Chicago">Central Time</MenuItem>
                                        <MenuItem value="America/Denver">Mountain Time</MenuItem>
                                        <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {profile.bio && (
                                <>
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                    </Grid>
                                    <Grid item xs={12}>
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
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />

            <Dialog open={confirmLogoutOpen} onClose={closeConfirmLogout}>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to log out?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirmLogout}>Cancel</Button>
                    <Button onClick={doLogout} color="error">
                        Log Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProfileScreen;