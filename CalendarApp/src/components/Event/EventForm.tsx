import React, { useRef, useState } from 'react';
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
    ListItemText,
    Alert,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { eventApi } from '../../services/api/eventApi';
import { groupApi } from '../../services/api/groupApi';
import { Group } from '../../types/group';
import { ApiResponse, EVENT_TYPES, Events, RecurrenceRule } from '../../types/event';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import LocationAutocomplete from '../Maps/LocationAutocomplete';
import CustomDateTimePicker from '../Calendar/CustomDateTimePicker';

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

const REMINDER_TYPES = ['email', 'push', 'in_app'];

interface EventFormProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ open, onClose, onEventCreated }) => {
    const { createEvent } = eventApi;
    const { getGroups } = groupApi;
    const { user } = useAuth();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const { data: groups } = useApi<Group[]>(getGroups);

    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [eventData, setEventData] = useState<Events>({
        title: '',
        description: '',
        event_type: 'other',
        location: '',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        start_date: format(new Date(), 'yyyy-MM-dd'),
        is_all_day: false,
        recurring: false,
        color: EVENT_COLORS[0].value,
        shared_with: [],
        reminders: [],
    });
    const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceRule['frequency']>('WEEKLY');
    const [recurringInterval, setRecurringInterval] = useState<number>(1);
    const [errors, setErrors] = useState<{ [key: string]: string | string[] }>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async () => {
        if (!user) return;

        try {
            const finalEventData: Partial<Events> = {
                ...eventData,
                created_by: user.id,
                recurring: eventData.recurring,
                recurrence_rule: eventData.recurring
                    ? {
                        frequency: recurringFrequency,
                        interval: recurringInterval,
                        days_of_week: recurringFrequency === 'WEEKLY' ? selectedDays : undefined,
                    }
                    : undefined,
            };

            const response: ApiResponse<Events> = await createEvent(finalEventData);
            console.log(response)
            if (response && !response.error) {
                console.log("Success response:", response);
                onEventCreated();
                onClose();
            } else if (response.error) {
                console.error("API error response:", response.error);
                setGeneralError(response.error.join(', ') || "An error occurred while creating the event.");

                if (contentRef.current) {
                    contentRef.current.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                }
            }
        } catch (error: any) {
            if (contentRef.current) {
                contentRef.current.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            }

            console.error("Unhandled error:", error);
            setGeneralError("An unexpected error occurred.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: 'start_time' | 'end_time') => (date: Date | null) => {
        if (date) {
            setEventData(prev => ({
                ...prev,
                [name]: date.toISOString(),
                start_date: name === 'start_time' ? format(date, 'yyyy-MM-dd') : prev.start_date,
            }));
        }
    };

    const handleCheckboxChange = (name: 'is_all_day' | 'recurring') => (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleDaysChange = (event: SelectChangeEvent<string[]>) => {
        setSelectedDays(event.target.value as string[]);
    };

    const handleLocationChange = (value: string) => {
        setEventData(prev => ({ ...prev, location: value }));
    };

    const renderFieldError = (fieldName: string): string | undefined => {
        const error = errors[fieldName];
        if (error) {
            return Array.isArray(error) ? error.join(', ') : error;
        }
        return undefined;
    };

    return (
        <Dialog
            open={open}
            sx={{ mt: 8 }}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle>Create New Event</DialogTitle>
            <DialogContent ref={contentRef}>
                <Box>
                    {generalError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {generalError}
                        </Alert>
                    )}
                    <FormControl fullWidth margin="normal">
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={eventData.title}
                            onChange={handleInputChange}
                            required
                            error={!!errors.title}
                            helperText={renderFieldError('title')}
                        />
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={eventData.description}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                            error={!!errors.description}
                            helperText={renderFieldError('description')}
                        />
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Event Type</InputLabel>
                        <Select
                            name="event_type"
                            value={eventData.event_type}
                            onChange={handleSelectChange}
                            label="Event Type"
                            error={!!errors.event_type}
                        >
                            {EVENT_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                        {renderFieldError('event_type')}
                    </FormControl>
                    <LocationAutocomplete
                        value={eventData.location || ''}
                        onChange={handleLocationChange}
                        error={!!errors.location}
                    />
                    {renderFieldError('location')}
                    <CustomDateTimePicker
                        label="Start Time"
                        value={new Date(eventData.start_time)}
                        onChange={(newValue) => {
                            handleDateChange('start_time')(newValue);

                            if (newValue && new Date(eventData.end_time) < newValue) {
                                setEventData((prev) => ({
                                    ...prev,
                                    end_time: newValue.toISOString(),
                                }));
                            }
                        }}
                        error={!!errors.start_time}
                        helperText={renderFieldError('start_time')}
                    />
                    <CustomDateTimePicker
                        label="End Time"
                        value={new Date(eventData.end_time)}
                        onChange={(newValue) => handleDateChange('end_time')(newValue)}
                        error={!!errors.end_time}
                        helperText={renderFieldError('end_time')}
                    />
                    <FormControl fullWidth margin="normal">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eventData.is_all_day}
                                    onChange={handleCheckboxChange('is_all_day')}
                                    name="is_all_day"
                                />
                            }
                            label="All Day Event"
                        />
                        {renderFieldError('is_all_day')}
                    </FormControl>
                    <FormControl fullWidth margin="normal">
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
                        {renderFieldError('recurring')}
                    </FormControl>
                    {eventData.recurring && (
                        <Box>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Recurring Frequency</InputLabel>
                                <Select
                                    value={recurringFrequency}
                                    onChange={(e) => setRecurringFrequency(e.target.value as RecurrenceRule['frequency'])}
                                    label="Recurring Frequency"
                                    error={!!errors.recurrence_rule}
                                >
                                    <MenuItem value="DAILY">Daily</MenuItem>
                                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                                    <MenuItem value="YEARLY">Yearly</MenuItem>
                                </Select>
                                {renderFieldError('recurrence_rule')}
                            </FormControl>
                            <FormControl fullWidth margin="normal">
                                <TextField
                                    label="Repeat every (number of days/weeks/months/years)"
                                    type="number"
                                    value={recurringInterval}
                                    onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                                    inputProps={{ min: 1 }}
                                    error={!!errors.recurrence_interval}
                                    helperText={renderFieldError('recurrence_interval')}
                                />
                            </FormControl>
                            {recurringFrequency === 'WEEKLY' && (
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Days of Week</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedDays}
                                        onChange={handleDaysChange}
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        error={!!errors.days_of_week}
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                            <MenuItem key={day} value={day}>
                                                <Checkbox checked={selectedDays.indexOf(day) > -1} />
                                                <ListItemText primary={day} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {renderFieldError('days_of_week')}
                                </FormControl>
                            )}
                        </Box>
                    )}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Event Color</InputLabel>
                        <Select
                            name="color"
                            value={eventData.color}
                            onChange={handleSelectChange}
                            label="Event Color"
                            error={!!errors.color}
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
                        {renderFieldError('color')}
                    </FormControl>
                    <Box mt={2}>
                        <Typography variant="subtitle1">Reminders</Typography>
                        {eventData.reminders.map((reminder, index) => (
                            <Box key={index} display="flex" alignItems="center" mt={1}>
                                <FormControl margin="normal">
                                    <TextField
                                        label="Time before event"
                                        type="number"
                                        value={reminder.reminder_time}
                                        onChange={(e) => handleReminderChange(index, 'reminder_time', e.target.value)}
                                        style={{ marginRight: '10px', width: '150px' }}
                                        error={!!errors.reminders}
                                    />
                                </FormControl>
                                <FormControl margin="normal">
                                    <Select
                                        value={reminder.reminder_type}
                                        onChange={(e) => handleReminderChange(index, 'reminder_type', e.target.value as string)}
                                        style={{ marginRight: '10px', width: '150px' }}
                                        error={!!errors.reminders}
                                    >
                                        {REMINDER_TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <IconButton onClick={() => handleRemoveReminder(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        {renderFieldError('reminders')}
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
                </Box>
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