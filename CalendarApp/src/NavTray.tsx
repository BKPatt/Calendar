import React from 'react';
import {
    Drawer,
    List,
    ListItemText,
    ListItemButton,
    ListItemIcon,
    Divider,
    Typography,
    Box,
    Avatar,
    ListSubheader,
    useTheme,
} from '@mui/material';
import {
    Home as HomeIcon,
    CalendarToday as CalendarIcon,
    Group as GroupIcon,
    AccountCircle as ProfileIcon,
    Event as EventIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

interface NavTrayProps {
    isDrawerOpen: boolean;
    toggleDrawer: () => void;
    userName?: string;
    avatarSrc?: string;
    appName?: string;
}

const NavTray: React.FC<NavTrayProps> = ({
    isDrawerOpen,
    toggleDrawer,
    userName = 'John Doe',
    avatarSrc = '',
    appName = 'MyApp',
}) => {
    const theme = useTheme();

    return (
        <Drawer
            variant="temporary"
            anchor="left"
            open={isDrawerOpen}
            onClose={toggleDrawer}
            PaperProps={{
                sx: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    pt: 2,
                    backgroundColor: theme.palette.background.default,
                    top: '64px'
                }
            }}
            ModalProps={{ keepMounted: true }}
        >
            <Box display="flex" flexDirection="column" alignItems="center" px={2} pb={2}>
                <Box display="flex" alignItems="center" width="100%" mb={2}>
                    <Avatar
                        src={avatarSrc}
                        sx={{ width: 48, height: 48, mr: 2 }}
                    />
                    <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                            {userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            View Profile
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider />

            <List
                subheader={
                    <ListSubheader component="div" sx={{ bgcolor: 'background.default', py: 1 }}>
                        Main
                    </ListSubheader>
                }
            >
                <ListItemButton component="a" href="/" sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
                <ListItemButton component="a" href="/calendar" sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                        <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText primary="Calendar" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
                <ListItemButton component="a" href="/groups" sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                        <GroupIcon />
                    </ListItemIcon>
                    <ListItemText primary="Groups" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
            </List>

            <Divider />

            <List
                subheader={
                    <ListSubheader component="div" sx={{ bgcolor: 'background.default', py: 1 }}>
                        My Account
                    </ListSubheader>
                }
            >
                <ListItemButton component="a" href="/profile" sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                        <ProfileIcon />
                    </ListItemIcon>
                    <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
                <ListItemButton component="a" href="/events" sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                        <EventIcon />
                    </ListItemIcon>
                    <ListItemText primary="Upcoming Events" primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
            </List>
        </Drawer>
    );
};

export default NavTray;
