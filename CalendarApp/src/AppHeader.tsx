import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Box,
    Divider,
    ListItemIcon,
    ListItemText,
    useTheme,
    Tooltip,
    Stack,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    AccountCircle as AccountCircleIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from './contexts/AuthContext';

interface AppHeaderProps {
    onMenuClick: () => void;
    appName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, appName = 'SincIt' }) => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme();

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const logoutClicked = () => {
        setAnchorEl(null);
        logout();
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(5px)',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
            }}
        >
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton edge="start" aria-label="open drawer" onClick={onMenuClick}>
                        <MenuIcon sx={{ color: '#fff' }} />
                    </IconButton>
                    <Box display="flex" flexDirection="column" justifyContent="center">
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{ fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}
                        >
                            {appName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Powering Your Productivity
                        </Typography>
                    </Box>
                </Stack>
                {user && (
                    <Box>
                        <Tooltip title="Open user menu">
                            <IconButton
                                edge="end"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleProfileMenuClick}
                                sx={{ p: 0 }}
                            >
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: theme.palette.secondary.main,
                                        color: '#fff',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {user.username.charAt(0)}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                                elevation: 6,
                                sx: {
                                    minWidth: 200,
                                    mt: 1.5,
                                    overflow: 'visible',
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                        >
                            <MenuItem onClick={handleClose} component="a" href="/profile">
                                <ListItemIcon>
                                    <AccountCircleIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Profile" />
                            </MenuItem>
                            <MenuItem onClick={handleClose} component="a" href="/settings">
                                <ListItemIcon>
                                    <SettingsIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Settings" />
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={logoutClicked}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Log Out" />
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default AppHeader;
