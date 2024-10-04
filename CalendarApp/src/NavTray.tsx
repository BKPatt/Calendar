import React from 'react';
import {
    Drawer,
    List,
    ListItemText,
    ListItemButton,
    ListItemIcon,
    Divider,
    useTheme,
} from '@mui/material';
import {
    Home as HomeIcon,
    CalendarToday as CalendarIcon,
    Group as GroupIcon,
    AccountCircle as ProfileIcon,
    Event as EventIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface NavTrayProps {
    isDrawerOpen: boolean;
    toggleDrawer: () => void;
}

const NavTray: React.FC<NavTrayProps> = ({ isDrawerOpen, toggleDrawer }) => {
    const theme = useTheme();

    return (
        <Drawer
            variant="temporary"
            anchor="left"
            open={isDrawerOpen}
            onClose={toggleDrawer}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    top: '64px', // Adjust based on header height if necessary
                },
            }}
        >
            <List>
                <ListItemButton component="a" href="/">
                    <ListItemIcon>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>
                <ListItemButton component="a" href="/calendar">
                    <ListItemIcon>
                        <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText primary="Calendar" />
                </ListItemButton>
                <ListItemButton component="a" href="/groups">
                    <ListItemIcon>
                        <GroupIcon />
                    </ListItemIcon>
                    <ListItemText primary="Groups" />
                </ListItemButton>
                <Divider />
                <ListItemButton component="a" href="/profile">
                    <ListItemIcon>
                        <ProfileIcon />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                </ListItemButton>
                <ListItemButton component="a" href="/events">
                    <ListItemIcon>
                        <EventIcon />
                    </ListItemIcon>
                    <ListItemText primary="Upcoming Events" />
                </ListItemButton>
            </List>
        </Drawer>
    );
};

export default NavTray;