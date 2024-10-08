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
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme();

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        if (anchorEl) {
            setAnchorEl(null);
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const logoutClicked = () => {
        setAnchorEl(null);
        logout();
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onMenuClick}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    SincIt
                </Typography>
                {user && (
                    <Box>
                        <IconButton
                            edge="end"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleProfileMenuClick}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, backgroundColor: theme.palette.secondary.main }}>
                                {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
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