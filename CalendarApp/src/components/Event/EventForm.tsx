import React, { useState } from 'react';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Box,
    Typography,
    IconButton,
    Divider,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Chip,
    SelectChangeEvent,
} from '@mui/material';
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import CustomDateTimePicker from '../Calendar/CustomDateTimePicker';
import Calendar from '../Calendar/Calendar';
import LocationAutocomplete from '../Maps/LocationAutocomplete';
import { Events, EventType, RecurrenceRule } from '../../types/event';

const EVENT_TYPES: EventType[] = ['meeting', 'appointment', 'social', 'work', 'other'];
const REMINDER_TIMES = ['15 minutes before', '30 minutes before', '1 hour before', '1 day before'];
const REMINDER_TYPES = ['email', 'push', 'in_app'] as const;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface EventFormProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: (eventData: Partial<Events>) => void;
}

const EventForm: React.FC<EventFormProps> = ({ open, onClose, onEventCreated }) => {
    const [eventData, setEventData] = useState<Partial<Events>>({
        title: '',
        event_type: 'meeting',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        is_all_day: false,
        recurring: false,
        location: '',
        reminders: [],
    });

    const [selectedReminderTime, setSelectedReminderTime] = useState('');
    const [selectedReminderType, setSelectedReminderType] = useState<'email' | 'push' | 'in_app'>('email');
    const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceRule['frequency']>('WEEKLY');
    const [recurringInterval, setRecurringInterval] = useState<number>(1);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEventData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<EventType>) => {
        setEventData((prev) => ({ ...prev, event_type: e.target.value as EventType }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setEventData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleDateChange = (date: Date | null, name: keyof Events) => {
        if (date) {
            setEventData((prev) => ({ ...prev, [name]: date.toISOString() }));
        }
    };

    const handleLocationChange = (location: string) => {
        setEventData((prev) => ({ ...prev, location }));
    };

    const addReminder = () => {
        if (selectedReminderTime && selectedReminderType) {
            const newReminder = {
                reminder_time: selectedReminderTime,
                reminder_type: selectedReminderType,
            };
            setEventData((prev) => ({
                ...prev,
                reminders: [...(prev.reminders || []), newReminder],
            }));
            setSelectedReminderTime('');
            setSelectedReminderType('email');
        }
    };

    const removeReminder = (index: number) => {
        setEventData((prev) => ({
            ...prev,
            reminders: prev.reminders?.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const recurrenceRule: RecurrenceRule | undefined = eventData.recurring
            ? {
                frequency: recurringFrequency,
                interval: recurringInterval,
                days_of_week: recurringFrequency === 'WEEKLY' ? selectedDays : undefined,
            }
            : undefined;

        onEventCreated({ ...eventData, recurrence_rule: recurrenceRule });
        onClose();
    };

    const handleDaysChange = (e: SelectChangeEvent<string[]>) => {
        setSelectedDays(e.target.value as string[]);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">New Event</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Event Title"
                                name="title"
                                value={eventData.title}
                                onChange={handleInputChange}
                                autoFocus
                                required
                            />
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Event Type</InputLabel>
                                <Select value={eventData.event_type} onChange={handleSelectChange}>
                                    {EVENT_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Grid container spacing={2} mt={2}>
                                <Grid item xs={12} sm={6}>
                                    <CustomDateTimePicker
                                        label="Starts"
                                        value={eventData.start_time ? new Date(eventData.start_time) : null}
                                        onChange={(date) => handleDateChange(date, 'start_time')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomDateTimePicker
                                        label="Ends"
                                        value={eventData.end_time ? new Date(eventData.end_time) : null}
                                        onChange={(date) => handleDateChange(date, 'end_time')}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="is_all_day"
                                                checked={eventData.is_all_day || false}
                                                onChange={handleCheckboxChange}
                                            />
                                        }
                                        label="All day"
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="recurring"
                                                checked={eventData.recurring || false}
                                                onChange={handleCheckboxChange}
                                            />
                                        }
                                        label="Recurring Event"
                                    />
                                </Grid>
                            </Grid>

                            {eventData.recurring && (
                                <>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Recurring Frequency</InputLabel>
                                        <Select
                                            value={recurringFrequency}
                                            onChange={(e) => setRecurringFrequency(e.target.value as RecurrenceRule['frequency'])}
                                            label="Recurring Frequency"
                                        >
                                            <MenuItem value="DAILY">Daily</MenuItem>
                                            <MenuItem value="WEEKLY">Weekly</MenuItem>
                                            <MenuItem value="MONTHLY">Monthly</MenuItem>
                                            <MenuItem value="YEARLY">Yearly</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        label="Repeat Interval"
                                        type="number"
                                        value={recurringInterval}
                                        onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                                        inputProps={{ min: 1 }}
                                        margin="normal"
                                    />

                                    {recurringFrequency === 'WEEKLY' && (
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel>Days of Week</InputLabel>
                                            <Select
                                                multiple
                                                value={selectedDays}
                                                onChange={handleDaysChange}
                                                renderValue={(selected) => (selected as string[]).join(', ')}
                                            >
                                                {WEEKDAYS.map((day) => (
                                                    <MenuItem key={day} value={day}>
                                                        <Checkbox checked={selectedDays.indexOf(day) > -1} />
                                                        {day}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box mt={2}>
                                <Typography variant="h6">Reminders</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Reminder Time</InputLabel>
                                            <Select
                                                value={selectedReminderTime}
                                                onChange={(e) => setSelectedReminderTime(e.target.value as string)}
                                            >
                                                {REMINDER_TIMES.map((time) => (
                                                    <MenuItem key={time} value={time}>
                                                        {time}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Reminder Type</InputLabel>
                                            <Select
                                                value={selectedReminderType}
                                                onChange={(e) => setSelectedReminderType(e.target.value as 'email' | 'push' | 'in_app')}
                                            >
                                                {REMINDER_TYPES.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button variant="contained" onClick={addReminder} disabled={!selectedReminderTime || !selectedReminderType}>
                                            Add Reminder
                                        </Button>
                                    </Grid>
                                </Grid>
                                <Box mt={2}>
                                    {eventData.reminders && eventData.reminders.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle1">Current Reminders:</Typography>
                                            {eventData.reminders.map((reminder, index) => (
                                                <Chip
                                                    key={`${reminder.reminder_time}-${reminder.reminder_type}`}
                                                    label={`${reminder.reminder_time} - ${reminder.reminder_type}`}
                                                    onDelete={() => removeReminder(index)}
                                                    deleteIcon={<DeleteIcon />}
                                                    sx={{ m: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Calendar
                                currentMonth={eventData.start_time ? new Date(eventData.start_time) : new Date()}
                                events={[]}
                                onDateClick={() => { }}
                                onEventClick={() => { }}
                                changeMonth={() => { }}
                                goToToday={() => { }}
                                handleCreateEvent={() => { }}
                                viewMode="day"
                            />
                        </Grid>
                    </Grid>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventForm;
