import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
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
    FormControl,
    InputLabel,
    Box,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Palette as PaletteIcon,
    Lock as LockIcon,
    ExitToApp as LogoutIcon,
    Delete as DeleteIcon,
    Language as LanguageIcon,
    AccessTime as TimeIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../contexts/AppContext';
import { useApi } from '../hooks/useApi';
import { userApi } from '../services/api/userApi';
import { Theme, Language, TimeFormat, DateFormat } from '../types/types';
import { UserProfile, UserSettings } from '../types/user';
import { SelectChangeEvent } from '@mui/material';

const SettingsScreen: React.FC = () => {
    const { updateUserProfile, getUserProfile, changePassword, deleteAccount } = userApi;
    const { user, logout } = useAuth();
    const { theme, setTheme } = useApp();

    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
    const [passwordFields, setPasswordFields] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [isSettingsChanged, setIsSettingsChanged] = useState(false);

    const { data: profile, isLoading } = useApi<UserProfile>(() =>
        user ? getUserProfile(user.id) : Promise.reject('No user')
    );

    useEffect(() => {
        if (profile) {
            setSettings(profile.settings);
        }
    }, [profile]);

    const handleSettingChange = (setting: keyof UserSettings, value: any) => {
        setSettings((prevSettings) =>
            prevSettings ? { ...prevSettings, [setting]: value } : prevSettings
        );
        setIsSettingsChanged(true);
    };

    const handleNotificationChange = (type: keyof UserSettings['notificationPreferences']) => {
        setSettings((prevSettings) =>
            prevSettings
                ? {
                    ...prevSettings,
                    notificationPreferences: {
                        ...prevSettings.notificationPreferences,
                        [type]: !prevSettings.notificationPreferences[type],
                    },
                }
                : prevSettings
        );
        setIsSettingsChanged(true);
    };

    const handleThemeChange = (e: SelectChangeEvent<Theme>) => {
        const newTheme = e.target.value as Theme;
        handleSettingChange('theme', newTheme);
        setTheme(newTheme);
    };

    const handleSaveSettings = async () => {
        if (user && settings) {
            try {
                await updateUserProfile(user.id, { settings });
                showSnackbar('Settings saved successfully');
                setIsSettingsChanged(false);
            } catch {
                showSnackbar('Failed to save settings');
            }
        }
    };

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = passwordFields;
        if (newPassword !== confirmPassword) {
            showSnackbar('New passwords do not match');
            return;
        }
        try {
            await changePassword(oldPassword, newPassword);
            setIsChangePasswordOpen(false);
            resetPasswordFields();
            showSnackbar('Password changed successfully');
        } catch {
            showSnackbar('Failed to change password');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            logout();
            showSnackbar('Account deleted successfully');
        } catch {
            showSnackbar('Failed to delete account');
        }
    };

    const handleLogout = () => {
        logout();
    };

    const showSnackbar = (message: string) => {
        setSnackbar({ open: true, message });
    };

    const resetPasswordFields = () => {
        setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth={false} sx={{ px: 4, py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
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
                    {settings?.notificationPreferences &&
                        Object.entries(settings.notificationPreferences).map(([key, value]) => (
                            <ListItem key={key}>
                                <ListItemText secondary={`${key.charAt(0).toUpperCase() + key.slice(1)} Notifications`} />
                                <Switch
                                    edge="end"
                                    onChange={() => handleNotificationChange(key as keyof UserSettings['notificationPreferences'])}
                                    checked={value}
                                />
                            </ListItem>
                        ))}

                    <Divider sx={{ my: 2 }} />

                    <ListItem>
                        <ListItemIcon>
                            <PaletteIcon />
                        </ListItemIcon>
                        <ListItemText primary="Theme" />
                        <FormControl variant="outlined" sx={{ minWidth: 300, maxWidth: 400 }}>
                            <InputLabel>Theme</InputLabel>
                            <Select value={settings?.theme || 'light'} onChange={handleThemeChange} label="Theme">
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </Select>
                        </FormControl>
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Language" />
                        <FormControl variant="outlined" sx={{ minWidth: 300, maxWidth: 400 }}>
                            <InputLabel>Language</InputLabel>
                            <Select
                                value={settings?.language || 'en'}
                                onChange={(e) => handleSettingChange('language', e.target.value)}
                                label="Language"
                            >
                                <MenuItem value="en">English</MenuItem>
                                <MenuItem value="es">Español</MenuItem>
                                <MenuItem value="fr">Français</MenuItem>
                            </Select>
                        </FormControl>
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <TimeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Time Format" />
                        <FormControl variant="outlined" sx={{ minWidth: 300, maxWidth: 400 }}>
                            <InputLabel>Time Format</InputLabel>
                            <Select
                                value={settings?.timeFormat || '24h'}
                                onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                                label="Time Format"
                            >
                                <MenuItem value="12h">12-hour</MenuItem>
                                <MenuItem value="24h">24-hour</MenuItem>
                            </Select>
                        </FormControl>
                    </ListItem>

                    <Divider sx={{ my: 2 }} />

                    <ListItemButton onClick={() => setIsChangePasswordOpen(true)}>
                        <ListItemIcon>
                            <LockIcon />
                        </ListItemIcon>
                        <ListItemText primary="Change Password" />
                    </ListItemButton>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                    <ListItemButton onClick={() => setIsDeleteAccountOpen(true)}>
                        <ListItemIcon>
                            <DeleteIcon />
                        </ListItemIcon>
                        <ListItemText primary="Delete Account" />
                    </ListItemButton>
                </List>

                <Box mt={3} display="flex" justifyContent="center">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveSettings}
                        disabled={!isSettingsChanged}
                    >
                        Save Settings
                    </Button>
                </Box>
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
                        value={passwordFields.oldPassword}
                        onChange={(e) =>
                            setPasswordFields((prev) => ({ ...prev, oldPassword: e.target.value }))
                        }
                    />
                    <TextField
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={passwordFields.newPassword}
                        onChange={(e) =>
                            setPasswordFields((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Confirm New Password"
                        type="password"
                        fullWidth
                        value={passwordFields.confirmPassword}
                        onChange={(e) =>
                            setPasswordFields((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
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
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Container>
    );
};

export default SettingsScreen;