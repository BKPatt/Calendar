import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Avatar,
    Box,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    Grid2,
    SelectChangeEvent,
    Divider,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Logout as LogoutIcon,
    CloudUpload as UploadIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/api/userApi';
import { UserProfile } from '../types/user';
import { useNavigate } from 'react-router-dom';

const ProfileScreen: React.FC = () => {
    const { getUserProfile, updateUserProfile } = userApi;
    const { user, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserProfile(user.id)
                .then((response) => {
                    setProfile(response.data);
                    setIsLoading(false);
                })
                .catch(() => {
                    setSnackbarMessage('Error loading profile data');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    setIsLoading(false);
                });
        }
    }, [user, getUserProfile]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile({ ...profile });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile({});
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setEditedProfile((prev) => ({ ...prev, [name as string]: value }));
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setEditedProfile((prev) => ({ ...prev, [name as string]: value }));
    };

    const handleSave = async () => {
        if (user && profile) {
            try {
                const updatedProfile = await updateUserProfile(user.id, {
                    ...editedProfile,
                    notificationPreferences: profile.notificationPreferences,
                });
                setProfile(updatedProfile.data);
                setSnackbarMessage('Profile updated successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setIsEditing(false);
            } catch (error) {
                setSnackbarMessage('Failed to update profile');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/signin', { replace: true });
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user || !profile) {
        return <Typography>Please log in to view your profile.</Typography>;
    }

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2, background: theme.palette.background.default }}>
                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Card elevation={2}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                                <Avatar
                                    src={profile.profilePicture}
                                    sx={{
                                        width: 150,
                                        height: 150,
                                        mb: 2,
                                        border: `4px solid ${theme.palette.primary.main}`,
                                    }}
                                >
                                    {profile.firstName?.[0] || profile.username?.[0] || ''}
                                </Avatar>
                                <Typography variant="h5" gutterBottom>
                                    {profile.firstName} {profile.lastName}
                                </Typography>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    @{profile.username}
                                </Typography>
                                {isEditing && (
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadIcon />}
                                        sx={{ mt: 2 }}
                                    >
                                        Upload Picture
                                        <input type="file" hidden accept="image/*" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 8 }}>
                        <Card elevation={2}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h4" component="h1">
                                        Profile Information
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
                                                onClick={() => setConfirmLogoutOpen(true)}
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
                                <Divider sx={{ mb: 3 }} />
                                <Grid2 container spacing={3}>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="First Name"
                                            name="firstName"
                                            value={isEditing ? editedProfile.firstName : profile.firstName}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            variant="outlined"
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Last Name"
                                            name="lastName"
                                            value={isEditing ? editedProfile.lastName : profile.lastName}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            variant="outlined"
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            value={isEditing ? editedProfile.email : profile.email}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                                            }}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="phoneNumber"
                                            value={isEditing ? editedProfile.phoneNumber : profile.phoneNumber}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                                            }}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="timezone-label">Timezone</InputLabel>
                                            <Select
                                                labelId="timezone-label"
                                                name="defaultTimezone"
                                                value={isEditing ? editedProfile.defaultTimezone : profile.defaultTimezone}
                                                onChange={handleSelectChange}
                                                disabled={!isEditing}
                                                label="Timezone"
                                                startAdornment={<LanguageIcon color="action" sx={{ mr: 1 }} />}
                                            >
                                                <MenuItem value="UTC">UTC</MenuItem>
                                                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                                                <MenuItem value="America/Chicago">Central Time</MenuItem>
                                                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                                                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Bio"
                                            name="bio"
                                            value={isEditing ? editedProfile.bio : profile.bio}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            multiline
                                            rows={4}
                                            variant="outlined"
                                        />
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </Card>
                    </Grid2>
                </Grid2>
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Dialog
                open={confirmLogoutOpen}
                onClose={() => setConfirmLogoutOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Confirm Logout</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to log out?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmLogoutOpen(false)}>Cancel</Button>
                    <Button onClick={handleLogout} color="error" autoFocus>
                        Log Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProfileScreen;