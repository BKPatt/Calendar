import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Checkbox,
    FormControlLabel,
    SelectChangeEvent
} from '@mui/material';
import { styled } from '@mui/system';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Events, EventType } from '../../types/event';
import { createEvent, updateEvent } from '../../services/api';

interface EventFormProps {
    event?: Events;
    onSubmit: (updatedEvent: Partial<Events>) => void;
    onCancel: () => void;
    initialDate?: Date;
}

const FormContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    maxWidth: 400,
    margin: 'auto',
    padding: theme.spacing(2),
}));

const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel, initialDate }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [eventType, setEventType] = useState<EventType>(event?.eventType || 'other');
    const [location, setLocation] = useState(event?.location || '');
    const [startTime, setStartTime] = useState<Date>(event ? new Date(event.startTime) : initialDate || new Date());
    const [endTime, setEndTime] = useState<Date>(event ? new Date(event.endTime) : initialDate || new Date());
    const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
    const [color, setColor] = useState(event?.color || '#1976d2');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!startTime || !endTime) return;

        const eventData: Partial<Events> = {
            title,
            description,
            eventType,
            location,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay,
            color,
        };

        setIsLoading(true);
        setError(null);

        try {
            if (event) {
                await updateEvent(event.id, eventData);
            } else {
                await createEvent(eventData);
            }
            onSubmit(eventData);
        } catch (err) {
            console.error('Failed to save event:', err);
            setError('Failed to save event. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <FormContainer>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                    />
                    <FormControl fullWidth>
                        <InputLabel>Event Type</InputLabel>
                        <Select
                            value={eventType}
                            onChange={(e: SelectChangeEvent<EventType>) => setEventType(e.target.value as EventType)}  // Use SelectChangeEvent
                            label="Event Type"
                        >
                            <MenuItem value="meeting">Meeting</MenuItem>
                            <MenuItem value="appointment">Appointment</MenuItem>
                            <MenuItem value="social">Social</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Location"
                        value={location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                        fullWidth
                    />
                    <DateTimePicker
                        label="Start Time"
                        value={startTime || new Date()}
                        onChange={(newValue) => setStartTime(newValue || new Date())}
                    />
                    <DateTimePicker
                        label="End Time"
                        value={endTime || new Date()}
                        onChange={(newValue) => setEndTime(newValue || new Date())}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isAllDay}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAllDay(e.target.checked)}
                            />
                        }
                        label="All Day Event"
                    />
                    <TextField
                        label="Color"
                        type="color"
                        value={color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                        fullWidth
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button onClick={onCancel} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isLoading}>
                            {event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </Box>
                    {error && <Box color="error.main">{error}</Box>}
                </Box>
            </FormContainer>
        </LocalizationProvider>
    );
};

export default EventForm;
