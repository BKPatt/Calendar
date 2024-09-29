import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { WorkSchedule } from '../../types/event';

interface GroupScheduleViewProps {
    schedules: WorkSchedule[];
    groupName: string;
}

const GroupScheduleView: React.FC<GroupScheduleViewProps> = ({ schedules, groupName }) => {
    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h5" gutterBottom>
                {groupName} Schedule
            </Typography>
            {schedules.map((schedule, index) => (
                <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="body1" color="textPrimary">
                        {schedule.user.username}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {`${schedule.dayOfWeek}: ${schedule.startTime} - ${schedule.endTime}`}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
};

export default GroupScheduleView;
