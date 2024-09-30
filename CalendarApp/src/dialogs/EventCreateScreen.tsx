import React, { useState } from 'react';
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
    Chip,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { createEvent, getGroups } from '../services/api';
import { Group } from '../types/group';
import { Events, RecurrenceRule } from '../types/event';

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

interface EventCreateScreenProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

const EventCreateScreen: React.FC<EventCreateScreenProps> = ({ open, onClose, onEventCreated }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(new Date());
    const [endTime, setEndTime] = useState<Date | null>(new Date());
    const [location, setLocation] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceRule['frequency']>('weekly');
    const [recurringInterval, setRecurringInterval] = useState<number>(1);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value);

    const { data: groups, isLoading, error } = useApi<Group[]>(getGroups);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !startTime || !endTime) return;

        try {
            const eventData: Partial<Events> = {
                title,
                description,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                location,
                createdBy: user,
                recurring: isRecurring,
                recurrenceRule: isRecurring ? { frequency: recurringFrequency, interval: recurringInterval } : undefined,
                group: groups?.find(g => g.id.toString() === selectedGroups[0]),
                color: eventColor,
            };

            await createEvent(eventData);
            onEventCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const handleGroupChange = (event: SelectChangeEvent<string[]>) => {
        setSelectedGroups(event.target.value as string[]);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
            PaperProps={{
                style: {
                    marginTop: theme.spacing(8), // Use theme.spacing for consistent spacing (default is 8px per unit)
                    height: `calc(100% - ${theme.spacing(20)})`, // Adjust height based on spacing
                },
            }}
        >
            <DialogTitle>Create New Event</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <DateTimePicker
                            label="Start Time"
                            value={startTime}
                            onChange={(newValue) => setStartTime(newValue)}
                        />
                        <DateTimePicker
                            label="End Time"
                            value={endTime}
                            onChange={(newValue) => setEndTime(newValue)}
                        />
                        <TextField
                            fullWidth
                            label="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            margin="normal"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                />
                            }
                            label="Recurring Event"
                        />
                        {isRecurring && (
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
                                value={eventColor}
                                onChange={(e) => setEventColor(e.target.value)}
                                label="Event Color"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                marginRight: 1,
                                                backgroundColor: selected,
                                            }}
                                        />
                                        {EVENT_COLORS.find(color => color.value === selected)?.name}
                                    </Box>
                                )}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                        },
                                    },
                                }}
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
                            <InputLabel>Share with Groups</InputLabel>
                            <Select
                                multiple
                                value={selectedGroups}
                                onChange={handleGroupChange}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={groups?.find(g => g.id.toString() === value)?.name || ''} />
                                        ))}
                                    </Box>
                                )}
                                disabled={!groups || groups.length === 0}
                            >
                                {groups?.map((group) => (
                                    <MenuItem key={group.id} value={group.id.toString()}>
                                        {group.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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

export default EventCreateScreen;
