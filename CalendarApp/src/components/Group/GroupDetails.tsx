import React, { useState } from 'react';
import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Tabs,
    Tab,
    Box,
    CircularProgress,
} from '@mui/material';
import { Person as PersonIcon, Event as EventIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { groupApi } from '../../services/api/groupApi';
import { Group } from '../../types/group';
import { WorkSchedule, Events } from '../../types/event';
import GroupScheduleView from '../../components/Group/GroupScheduleView';
import { User } from '../../types/user';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div hidden={value !== index}>
            {value === index && <Box p={3}>{children}</Box>}
        </div>
    );
};

const GroupDetails: React.FC = () => {
    const { getGroup, getGroupEvents, getGroupSchedule } = groupApi;

    const { groupId } = useParams<{ groupId: string }>();
    const [tabValue, setTabValue] = useState(0);

    const { data: group, isLoading: groupLoading, error: groupError } = useApi<Group>(() => getGroup(Number(groupId)));
    const { data: schedules, isLoading: schedulesLoading, error: schedulesError } = useApi<WorkSchedule[]>(() => getGroupSchedule(Number(groupId)));
    const { data: events, isLoading: eventsLoading, error: eventsError } = useApi<Events[]>(() => getGroupEvents(Number(groupId)));

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    if (groupLoading || schedulesLoading || eventsLoading) return <CircularProgress />;
    if (groupError || schedulesError || eventsError) return <Typography color="error">Error loading group details</Typography>;
    if (!group) return <Typography>Group not found</Typography>;

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                {group.name}
            </Typography>
            <Typography variant="body1" paragraph>
                {group.description}
            </Typography>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="group details tabs">
                <Tab label="Members" />
                <Tab label="Schedule" />
                <Tab label="Events" />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
                <List>
                    {group.members.map((member: User) => (
                        <ListItem key={member.id}>
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={`${member.firstName} ${member.lastName}`} secondary={member.email} />
                        </ListItem>
                    ))}
                </List>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
                <GroupScheduleView schedules={schedules || []} groupName={group?.name} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
                <List>
                    {events?.map((event: Events) => (
                        <ListItem key={event.id}>
                            <ListItemAvatar>
                                <Avatar>
                                    <EventIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={event.title}
                                secondary={`${new Date(event.start_time).toLocaleString()} - ${new Date(event.end_time).toLocaleString()}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </TabPanel>
        </Container>
    );
};

export default GroupDetails;