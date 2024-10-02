import React, { useEffect, useState } from 'react';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Box,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    IconButton,
    Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { createEvent, getGroups } from '../../services/api';
import { Group } from '../../types/group';
import { Events, EventType, RecurrenceRule } from '../../types/event';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

const EVENT_COLORS = [
    { name: 'Red', value: '#F44336' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Deep Purple', value: '#673AB7' },
    { name: 'Indigo', value: '#3F51B5' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Light Blue', value: '#03A9F4' },
    { name: 'Cyan', value: '#00BCD4' },
    { name: 'Teal', value: '#009688' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Light Green', value: '#8BC34A' },
    { name: 'Lime', value: '#CDDC39' },
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Amber', value: '#FFC107' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Deep Orange', value: '#FF5722' },
    { name: 'Brown', value: '#795548' },
    { name: 'Grey', value: '#9E9E9E' },
];

const EVENT_TYPES: EventType[] = ['meeting', 'appointment', 'social', 'other'];
const REMINDER_TYPES = ['email', 'push', 'in_app'];

interface EventFormProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ open, onClose, onEventCreated }) => {
    const { user, isAuthenticated } = useAuth();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const { data: groups, isLoading, error } = useApi<Group[]>(getGroups);

    useEffect(() => {
        console.log("User: ", user)
    }, []);

    const [eventData, setEventData] = useState<Events>({
        title: '',
        description: '',
        eventType: 'other',
        location: '',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        isAllDay: false,
        recurring: false,
        color: EVENT_COLORS[0].value,
        sharedWith: [],
        reminders: [],
    });

    const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceRule['frequency']>('weekly');
    const [recurringInterval, setRecurringInterval] = useState<number>(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        const startTime = new Date(eventData.startTime);
        const endTime = new Date(eventData.endTime);

        if (endTime <= startTime) {
            console.error('End time must be after start time');
            return;
        }

        try {
            const formattedStartTime = format(startTime, "yyyy-MM-dd'T'HH:mm:ss");
            const formattedEndTime = format(endTime, "yyyy-MM-dd'T'HH:mm:ss");

            const finalEventData: Events = {
                ...eventData,
                created_by: user.id,
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                recurring: eventData.recurring,
                recurrenceRule: eventData.recurring
                    ? { frequency: recurringFrequency, interval: recurringInterval }
                    : undefined,
            };

            await createEvent(finalEventData);
            onEventCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: 'startTime' | 'endTime') => (date: Date | null) => {
        if (date) {
            setEventData(prev => ({ ...prev, [name]: date.toISOString() }));
        }
    };

    const handleCheckboxChange = (name: 'isAllDay' | 'recurring') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventData(prev => ({ ...prev, [name]: e.target.checked }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (event: SelectChangeEvent<number>) => {
        setEventData(prev => ({ ...prev, group: event.target.value as number }));
    };

    const handleAddReminder = () => {
        setEventData(prev => ({
            ...prev,
            reminders: [...prev.reminders, { reminder_time: '30', reminder_type: 'email' }],
        }));
    };

    const handleRemoveReminder = (index: number) => {
        setEventData(prev => ({
            ...prev,
            reminders: prev.reminders.filter((_, i) => i !== index),
        }));
    };

    const handleReminderChange = (index: number, field: string, value: string) => {
        setEventData(prev => ({
            ...prev,
            reminders: prev.reminders.map((reminder, i) =>
                i === index ? { ...reminder, [field]: value } : reminder
            ),
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle>Create New Event</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={eventData.title}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={eventData.description}
                            onChange={handleInputChange}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Event Type</InputLabel>
                            <Select
                                name="eventType"
                                value={eventData.eventType}
                                onChange={handleSelectChange}
                                label="Event Type"
                            >
                                {EVENT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={eventData.location}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                        <DateTimePicker
                            label="Start Time"
                            value={new Date(eventData.startTime)}
                            onChange={handleDateChange('startTime')}
                        />
                        <DateTimePicker
                            label="End Time"
                            value={new Date(eventData.endTime)}
                            onChange={handleDateChange('endTime')}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eventData.isAllDay}
                                    onChange={handleCheckboxChange('isAllDay')}
                                    name="isAllDay"
                                />
                            }
                            label="All Day Event"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eventData.recurring}
                                    onChange={handleCheckboxChange('recurring')}
                                    name="recurring"
                                />
                            }
                            label="Recurring Event"
                        />
                        {eventData.recurring && (
                            <Box>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Recurring Frequency</InputLabel>
                                    <Select
                                        value={recurringFrequency}
                                        onChange={(e) => setRecurringFrequency(e.target.value as RecurrenceRule['frequency'])}
                                        label="Recurring Frequency"
                                    >
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                        <MenuItem value="yearly">Yearly</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Repeat every (number of days/weeks/months/years)"
                                    type="number"
                                    value={recurringInterval}
                                    onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                                    inputProps={{ min: 1 }}
                                    margin="normal"
                                />
                            </Box>
                        )}
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Event Color</InputLabel>
                            <Select
                                name="color"
                                value={eventData.color}
                                onChange={handleSelectChange}
                                label="Event Color"
                            >
                                {EVENT_COLORS.map((color) => (
                                    <MenuItem key={color.value} value={color.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    marginRight: 1,
                                                    backgroundColor: color.value,
                                                }}
                                            />
                                            {color.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Share with Group</InputLabel>
                            <Select
                                value={eventData.group || ''}
                                onChange={handleGroupChange}
                                label="Share with Group"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {groups?.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box mt={2}>
                            <Typography variant="subtitle1">Reminders</Typography>
                            {eventData.reminders.map((reminder, index) => (
                                <Box key={index} display="flex" alignItems="center" mt={1}>
                                    <TextField
                                        label="Time before event"
                                        type="number"
                                        value={reminder.reminder_time}
                                        onChange={(e) => handleReminderChange(index, 'reminder_time', e.target.value)}
                                        style={{ marginRight: '10px', width: '150px' }}
                                    />
                                    <Select
                                        value={reminder.reminder_type}
                                        onChange={(e) => handleReminderChange(index, 'reminder_type', e.target.value as string)}
                                        style={{ marginRight: '10px', width: '150px' }}
                                    >
                                        {REMINDER_TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <IconButton onClick={() => handleRemoveReminder(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                onClick={handleAddReminder}
                                variant="outlined"
                                size="small"
                                style={{ marginTop: '10px' }}
                            >
                                Add Reminder
                            </Button>
                        </Box>
                    </form>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Create Event
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventForm;