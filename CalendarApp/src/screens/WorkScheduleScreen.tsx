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
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { scheduleApi } from '../services/api/scheduleApi';

const WorkScheduleScreen: React.FC = () => {
    const { getWorkSchedules, createWorkSchedule, updateWorkSchedule } = scheduleApi;

    const { user } = useAuth();
    const { data: schedules, isLoading, error, refetch } = useApi(getWorkSchedules);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [start_time, setstart_time] = useState<Date | null>(null);
    const [end_time, setend_time] = useState<Date | null>(null);

    const handleUpdateSchedule = () => {
        if (selectedDay !== null && start_time && end_time && user) {
            const updateScheduleAsync = async () => {
                try {
                    const existingSchedule = schedules?.find(s => s.dayOfWeek === selectedDay);
                    const scheduleData = {
                        dayOfWeek: selectedDay,
                        start_time: start_time.toTimeString().slice(0, 5),
                        end_time: end_time.toTimeString().slice(0, 5),
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
                                secondary={schedule ? `${schedule.start_time} - ${schedule.end_time}` : 'Not set'}
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
                                value={start_time}
                                onChange={(newValue) => setstart_time(newValue)}
                            />
                        </Box>
                        <Box my={2}>
                            <TimePicker
                                label="End Time"
                                value={end_time}
                                onChange={(newValue) => setend_time(newValue)}
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