import React, { useState } from 'react';
import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    Button,
    Box,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { getWorkSchedules, createWorkSchedule, updateWorkSchedule } from '../services/api';

const WorkScheduleScreen: React.FC = () => {
    const { user } = useAuth();
    const { data: schedules, isLoading, error, refetch } = useApi(getWorkSchedules);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    const handleUpdateSchedule = () => {
        if (selectedDay !== null && startTime && endTime && user) {
            const updateScheduleAsync = async () => {
                try {
                    const existingSchedule = schedules?.find(s => s.dayOfWeek === selectedDay);
                    const scheduleData = {
                        dayOfWeek: selectedDay,
                        startTime: startTime.toTimeString().slice(0, 5),
                        endTime: endTime.toTimeString().slice(0, 5),
                        isRecurring: true,
                        userId: user.id,
                    };

                    if (existingSchedule) {
                        await updateWorkSchedule(existingSchedule.id, scheduleData);
                    } else {
                        await createWorkSchedule(scheduleData);
                    }
                    refetch();
                    setSelectedDay(null);
                } catch (error) {
                    console.error('Error updating work schedule:', error);
                }
            };

            updateScheduleAsync();
        }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" component="h1" gutterBottom>
                Work Schedule
            </Typography>
            <List>
                {dayNames.map((day, index) => {
                    const schedule = schedules?.find(s => s.dayOfWeek === index);
                    return (
                        <ListItem
                            component="li"
                            key={index}
                            onClick={() => setSelectedDay(index)}
                        >
                            <ListItemText
                                primary={day}
                                secondary={schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'Not set'}
                            />
                        </ListItem>
                    );
                })}
            </List>
            <Dialog open={selectedDay !== null} onClose={() => setSelectedDay(null)}>
                <DialogTitle>Edit Schedule for {selectedDay !== null ? dayNames[selectedDay] : ''}</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box my={2}>
                            <TimePicker
                                label="Start Time"
                                value={startTime}
                                onChange={(newValue) => setStartTime(newValue)}
                            />
                        </Box>
                        <Box my={2}>
                            <TimePicker
                                label="End Time"
                                value={endTime}
                                onChange={(newValue) => setEndTime(newValue)}
                            />
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedDay(null)}>Cancel</Button>
                    <Button onClick={handleUpdateSchedule} color="primary">
                        Update Schedule
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default WorkScheduleScreen;