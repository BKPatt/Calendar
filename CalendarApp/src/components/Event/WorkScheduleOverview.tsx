import React from 'react';
import { Typography, Box, List, ListItem, ListItemText, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { scheduleApi } from '../../services/api/scheduleApi';
import { WorkSchedule } from '../../types/event';

const WorkScheduleOverview: React.FC = () => {
    const { getWorkSchedules } = scheduleApi;

    const navigate = useNavigate();
    const { data: schedules, isLoading, error } = useApi<WorkSchedule[]>(getWorkSchedules);

    if (isLoading) return <Typography>Loading work schedule...</Typography>;
    if (error) return <Typography color="error">Error loading work schedule</Typography>;

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>This Week's Work Schedule</Typography>
            <List>
                {daysOfWeek.map((day, index) => {
                    const schedule = schedules?.find(s => s.dayOfWeek === index);
                    return (
                        <ListItem key={day}>
                            <ListItemText
                                primary={day}
                                secondary={schedule ? `${schedule.start_time} - ${schedule.end_time}` : 'Off'}
                            />
                        </ListItem>
                    );
                })}
            </List>
            <Box textAlign="right" mt={2}>
                <Button color="primary" onClick={() => navigate('/schedule')}>Manage Schedule</Button>
            </Box>
        </Box>
    );
};

export default WorkScheduleOverview;