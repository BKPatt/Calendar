import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from './contexts/AuthContext';

interface AppHeaderProps {
    onMenuClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        setAnchorEl(null)
        logout();
    };

    return (
        <AppBar position="fixed" style={{ zIndex: 1301 }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={onMenuClick}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap style={{ flexGrow: 1 }}>
                    SincIt
                </Typography>
                {user && (
                    <Box>
                        <IconButton onClick={handleProfileMenuClick} color="inherit">
                            <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
                        >
                            <MenuItem onClick={handleClose} component="a" href="/profile">
                                Profile
                            </MenuItem>
                            <MenuItem onClick={logoutClicked}>Log Out</MenuItem>
                        </Menu>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default AppHeader;
