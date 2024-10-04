import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Switch,
    Select,
    MenuItem,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    Snackbar,
    CircularProgress,
    ListItemButton,
    SelectChangeEvent
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Palette as PaletteIcon,
    Lock as LockIcon,
    ExitToApp as LogoutIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../contexts/AppContext';
import { useApi } from '../hooks/useApi';
import { userApi } from '../services/api/userApi';
import { Theme } from '../types/types';
import { UserProfile } from '../types/user';

const SettingsScreen: React.FC = () => {
    const { updateUserProfile, getUserProfile, changePassword, deleteAccount } = userApi;

    const { user, logout } = useAuth();
    const { theme, setTheme } = useApp();
    const [notificationPreferences, setNotificationPreferences] = useState({
        email: false,
        push: false,
        inApp: false,
    });
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const { data: profile, isLoading, error, refetch } = useApi<UserProfile>(() =>
        user ? getUserProfile(user.id) : Promise.reject('No user')
    );

    useEffect(() => {
        if (profile) {
            setNotificationPreferences(profile.notificationPreferences);
        }
    }, [profile]);

    const handleNotificationChange = async (type: 'email' | 'push' | 'inApp') => {
        const updatedPreferences = {
            ...notificationPreferences,
            [type]: !notificationPreferences[type],
        };
        setNotificationPreferences(updatedPreferences);
        if (user) {
            try {
                await updateUserProfile(user.id, { notificationPreferences: updatedPreferences });
                setSnackbarMessage('Notification preferences updated');
                setSnackbarOpen(true);
            } catch (error) {
                setSnackbarMessage('Failed to update notification preferences');
                setSnackbarOpen(true);
            }
        }
    };

    const handleThemeChange = (e: SelectChangeEvent<Theme>) => {
        const newTheme = e.target.value as Theme;
        setTheme(newTheme);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setSnackbarMessage('New passwords do not match');
            setSnackbarOpen(true);
            return;
        }
        try {
            await changePassword(oldPassword, newPassword);
            setIsChangePasswordOpen(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSnackbarMessage('Password changed successfully');
            setSnackbarOpen(true);
        } catch (error) {
            setSnackbarMessage('Failed to change password');
            setSnackbarOpen(true);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            logout();
            setSnackbarMessage('Account deleted successfully');
            setSnackbarOpen(true);
        } catch (error) {
            setSnackbarMessage('Failed to delete account');
            setSnackbarOpen(true);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Settings
                </Typography>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Notifications" />
                    </ListItem>
                    <ListItem>
                        <ListItemText secondary="Email Notifications" />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                onChange={() => handleNotificationChange('email')}
                                checked={notificationPreferences.email}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                        <ListItemText secondary="Push Notifications" />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                onChange={() => handleNotificationChange('push')}
                                checked={notificationPreferences.push}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                        <ListItemText secondary="In-App Notifications" />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                onChange={() => handleNotificationChange('inApp')}
                                checked={notificationPreferences.inApp}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>

                    <Divider />
                    <ListItem>
                        <ListItemIcon>
                            <PaletteIcon />
                        </ListItemIcon>
                        <ListItemText primary="Theme" />
                        <ListItemSecondaryAction>
                            <Select value={theme} onChange={handleThemeChange}>
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </Select>
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem onClick={() => setIsChangePasswordOpen(true)}>
                        <ListItemButton>
                            <LockIcon />
                        </ListItemButton>
                        <ListItemText primary="Change Password" />
                    </ListItem>
                    <ListItem onClick={handleLogout}>
                        <ListItemButton>
                            <LogoutIcon />
                        </ListItemButton>
                        <ListItemText primary="Logout" />
                    </ListItem>
                    <ListItem onClick={() => setIsDeleteAccountOpen(true)}>
                        <ListItemButton>
                            <DeleteIcon />
                        </ListItemButton>
                        <ListItemText primary="Delete Account" />
                    </ListItem>
                </List>
            </Paper>

            <Dialog open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Current Password"
                        type="password"
                        fullWidth
                        value={oldPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Confirm New Password"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                    <Button onClick={handleChangePassword} color="primary">
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteAccountOpen} onClose={() => setIsDeleteAccountOpen(false)}>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete your account? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteAccountOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteAccount} color="error">
                        Delete Account
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default SettingsScreen;
