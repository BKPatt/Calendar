import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
    Close as CloseIcon
} from '@mui/icons-material';
import { startOfDay, endOfDay, addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useAuth } from '../../hooks/useAuth';
import { eventApi } from '../../services/api/eventApi';
import { Events, EventType, RecurrenceRule } from '../../types/event';
import CalendarGlance from '../Calendar/CalendarGlance';
import EventDetailsForm from './Form/EventDetailsForm';
import RecurrenceForm from './Form/RecurrenceForm';
import RemindersForm from './Form/RemindersForm';
import EventConfirmDialog from './Form/EventConfirmDialog';

const EVENT_TYPES: EventType[] = ['meeting', 'appointment', 'social', 'work', 'other'];
const REMINDER_TIMES = [
    { label: '15 minutes before', value: '15m' },
    { label: '30 minutes before', value: '30m' },
    { label: '1 hour before', value: '60m' },
    { label: '1 day before', value: '1440m' }
];
const REMINDER_TYPES = ['email', 'push', 'in_app'] as const;
const FREQUENCIES: RecurrenceRule['frequency'][] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EVENT_COLORS = ['#007bff', '#28a745', '#ff5722', '#9c27b0', '#e91e63', '#3f51b5'];

interface EventFormProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: () => void;
    availableUsers?: { id: number; name: string }[];
    availableGroups?: { id: number; name: string }[];
}

const nowConstant = new Date();

const EventForm: React.FC<EventFormProps> = ({
    open,
    onClose,
    onEventCreated,
    availableUsers = [],
    availableGroups = []
}) => {
    const oneHourLater = useMemo(() => new Date(nowConstant.getTime() + 60 * 60 * 1000), []);
    const { user } = useAuth();
    const { getEvents, createEvent } = eventApi;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState<EventType>('meeting');
    const [startTime, setStartTime] = useState<Date | null>(nowConstant);
    const [endTime, setEndTime] = useState<Date | null>(oneHourLater);
    const [isAllDay, setIsAllDay] = useState(false);
    const [allDayDate, setAllDayDate] = useState<Date | null>(nowConstant);
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>('WEEKLY');
    const [interval, setInterval] = useState<number>(1);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [monthOfYear, setMonthOfYear] = useState<number>(1);
    const [location, setLocation] = useState('');
    const [color, setColor] = useState<string>('#007bff');
    const [sharedWith, setSharedWith] = useState<number[]>([]);
    const [groupId, setGroupId] = useState<number | null>(null);
    const [reminders, setReminders] = useState<{ reminder_time: string; reminder_type: 'email' | 'push' | 'in_app' }[]>([]);
    const [selectedReminderTime, setSelectedReminderTime] = useState('');
    const [selectedReminderType, setSelectedReminderType] = useState<'email' | 'push' | 'in_app'>('email');
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [fetchedEvents, setFetchedEvents] = useState<Events[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
    const [events, setEvents] = useState<Events[]>([]);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setEventType('meeting');
        setStartTime(nowConstant);
        setEndTime(oneHourLater);
        setIsAllDay(false);
        setAllDayDate(nowConstant);
        setRecurring(false);
        setFrequency('WEEKLY');
        setInterval(1);
        setSelectedDays([]);
        setDayOfMonth(1);
        setMonthOfYear(1);
        setLocation('');
        setColor('#007bff');
        setSharedWith([]);
        setGroupId(null);
        setReminders([]);
        setSelectedReminderTime('');
        setSelectedReminderType('email');
        setViewMode('day');
        setFetchedEvents([]);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setConfirmDialogOpen(true);
    };

    const handleConfirm = async () => {
        if (isAllDay && !allDayDate) {
            console.error("Cannot create an all-day event without 'allDayDate'.");
            return;
        }

        if (!isAllDay && !startTime) {
            console.error("Cannot create a timed event without 'startTime'.");
            return;
        }

        let startDateString: string;
        let endDateString: string;
        let start_date: string;

        if (isAllDay && allDayDate) {
            const y = allDayDate.getFullYear();
            const m = String(allDayDate.getMonth() + 1).padStart(2, '0');
            const d = String(allDayDate.getDate()).padStart(2, '0');
            startDateString = `${y}-${m}-${d}`;
            endDateString = `${y}-${m}-${d}`;
            start_date = `${y}-${m}-${d}`;
        } else {
            if (!startTime || !endTime) {
                console.error("Start and end times must be defined for a non-all-day event.");
                return;
            }

            startDateString = startTime.toISOString();
            endDateString = endTime.toISOString();

            const st = new Date(startTime);
            const y = st.getFullYear();
            const m = String(st.getMonth() + 1).padStart(2, '0');
            const d = String(st.getDate()).padStart(2, '0');
            start_date = `${y}-${m}-${d}`;
        }

        const recurrence_rule = recurring
            ? {
                frequency,
                interval,
                days_of_week: frequency === 'WEEKLY' ? selectedDays : undefined,
                day_of_month: frequency === 'MONTHLY' ? dayOfMonth : undefined,
                month_of_year: frequency === 'YEARLY' ? monthOfYear : undefined,
                start_date
            }
            : undefined;

        const eventData: Partial<Events> = {
            title: title.trim(),
            description: description.trim(),
            event_type: eventType,
            start_time: startDateString,
            end_time: endDateString,
            start_date,
            is_all_day: isAllDay,
            recurring,
            recurrence_rule,
            location: location.trim(),
            color,
            shared_with: sharedWith,
            reminders
        };

        setIsCreating(true);
        const response = await createEvent(eventData);
        setIsCreating(false);

        if (response.error) {
            console.error('Failed to create event:', response.error);
        } else {
            onEventCreated();
            setConfirmDialogOpen(false);
            onClose();
        }
    };

    const handleCancelConfirm = () => {
        setConfirmDialogOpen(false);
    };

    const handleFrequencyChange = (newFreq: RecurrenceRule['frequency']) => {
        setFrequency(newFreq);
        setSelectedDays([]);
        setDayOfMonth(1);
        setMonthOfYear(1);
    };

    const fetchEventsForMonth = useCallback(async (month: Date) => {
        setIsLoadingEvents(true);
        try {
            const start_date = format(startOfMonth(month), 'yyyy-MM-dd');
            const end_date = format(endOfMonth(month), 'yyyy-MM-dd');
            const response = await getEvents({ start_date, end_date });
            setEvents(response.data || []);
        } catch {
        } finally {
            setIsLoadingEvents(false);
        }
    }, [getEvents]);

    useEffect(() => {
        fetchEventsForMonth(currentMonth);
    }, [currentMonth, fetchEventsForMonth]);

    const generatePreviewEvents = useCallback((): Events[] => {
        if (isAllDay && allDayDate && title.trim()) {
            const y = allDayDate.getFullYear();
            const m = String(allDayDate.getMonth() + 1).padStart(2, '0');
            const d = String(allDayDate.getDate()).padStart(2, '0');
            const dateOnly = `${y}-${m}-${d}`;
            return [
                {
                    title: title.trim(),
                    description: description.trim(),
                    event_type: eventType,
                    start_time: dateOnly,
                    end_time: dateOnly,
                    is_all_day: true,
                    color,
                    recurring,
                    shared_with: [],
                    reminders: []
                }
            ];
        } else if (!isAllDay && startTime && endTime && title.trim()) {
            return [
                {
                    title: title.trim(),
                    description: description.trim(),
                    event_type: eventType,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    is_all_day: false,
                    color,
                    recurring,
                    shared_with: [],
                    reminders: []
                }
            ];
        }
        return [];
    }, [isAllDay, allDayDate, title, description, eventType, startTime, endTime, color, recurring]);

    const previewEvents = useMemo(() => generatePreviewEvents(), [generatePreviewEvents]);

    const fetchEvents = useCallback(async () => {
        if (!user) return;
        setIsLoadingEvents(true);

        const baseDate = isAllDay && allDayDate ? allDayDate : startTime || nowConstant;

        let fetchStart: Date;
        let fetchEnd: Date;

        if (viewMode === 'day') {
            fetchStart = startOfDay(baseDate);
            fetchEnd = endOfDay(baseDate);
        } else if (viewMode === 'week') {
            const weekStart = startOfDay(addDays(baseDate, -baseDate.getDay()));
            const weekEnd = endOfDay(addDays(weekStart, 6));
            fetchStart = weekStart;
            fetchEnd = weekEnd;
        } else {
            const ms = startOfMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
            const me = endOfMonth(ms);
            fetchStart = startOfDay(ms);
            fetchEnd = endOfDay(me);
        }

        const start_date = format(fetchStart, "yyyy-MM-dd'T'HH:mm:ss");
        const end_date = format(fetchEnd, "yyyy-MM-dd'T'HH:mm:ss");

        try {
            const response = await getEvents({
                user_id: user.id.toString(),
                start_date,
                end_date
            });
            setFetchedEvents(response.data || []);
        } catch {
            setFetchedEvents([]);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [user, startTime, endTime, allDayDate, viewMode, isAllDay, getEvents]);

    useEffect(() => {
        if (open) {
            fetchEvents();
        }
    }, [open, fetchEvents]);

    const combinedEvents = useMemo(() => [...fetchedEvents, ...previewEvents], [fetchedEvents, previewEvents]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ pb: 0 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h5" fontWeight="bold">
                            Create New Event
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, overflow: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
                    <form onSubmit={handleSubmit}>
                        <Grid2 container spacing={3} columns={12}>
                            <Grid2 size={{ xs: 12, md: 7 }} sx={{ pb: 2 }}>
                                <Grid2 container direction="column" spacing={2}>
                                    <Grid2>
                                        <EventDetailsForm
                                            title={title}
                                            onTitleChange={setTitle}
                                            description={description}
                                            onDescriptionChange={setDescription}
                                            eventType={eventType}
                                            onEventTypeChange={setEventType}
                                            isAllDay={isAllDay}
                                            onIsAllDayChange={setIsAllDay}
                                            allDayDate={allDayDate}
                                            onAllDayDateChange={setAllDayDate}
                                            startTime={startTime}
                                            onStartTimeChange={setStartTime}
                                            endTime={endTime}
                                            onEndTimeChange={setEndTime}
                                            recurring={recurring}
                                            onRecurringChange={setRecurring}
                                            location={location}
                                            onLocationChange={setLocation}
                                            color={color}
                                            onColorChange={setColor}
                                            EVENT_TYPES={EVENT_TYPES}
                                            EVENT_COLORS={EVENT_COLORS}
                                            availableUsers={availableUsers}
                                            sharedWith={sharedWith}
                                            onSharedWithChange={setSharedWith}
                                            availableGroups={availableGroups}
                                            groupId={groupId}
                                            onGroupIdChange={setGroupId}
                                        />
                                    </Grid2>

                                    <Grid2>
                                        <RecurrenceForm
                                            recurring={recurring}
                                            frequency={frequency}
                                            onFrequencyChange={handleFrequencyChange}
                                            interval={interval}
                                            onIntervalChange={setInterval}
                                            selectedDays={selectedDays}
                                            onSelectedDaysChange={setSelectedDays}
                                            dayOfMonth={dayOfMonth}
                                            onDayOfMonthChange={setDayOfMonth}
                                            monthOfYear={monthOfYear}
                                            onMonthOfYearChange={setMonthOfYear}
                                            FREQUENCIES={FREQUENCIES}
                                            WEEKDAYS={WEEKDAYS}
                                        />
                                    </Grid2>

                                    <Grid2>
                                        <RemindersForm
                                            reminders={reminders}
                                            onRemindersChange={setReminders}
                                            selectedReminderTime={selectedReminderTime}
                                            onSelectedReminderTimeChange={setSelectedReminderTime}
                                            selectedReminderType={selectedReminderType}
                                            onSelectedReminderTypeChange={setSelectedReminderType}
                                            REMINDER_TIMES={REMINDER_TIMES}
                                            REMINDER_TYPES={REMINDER_TYPES}
                                        />
                                    </Grid2>
                                </Grid2>
                            </Grid2>

                            <Grid2 size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Stack sx={{ height: '100%' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Quick Date Preview
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Adjust your event details and see how it fits into the schedule here.
                                    </Typography>
                                    <Box ref={calendarContainerRef} sx={{ position: 'relative', flexGrow: 1, overflowY: 'auto' }}>
                                        {isLoadingEvents ? (
                                            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                                                <CircularProgress />
                                            </Box>
                                        ) : (
                                            <CalendarGlance events={combinedEvents} />
                                        )}
                                    </Box>
                                </Stack>
                            </Grid2>
                        </Grid2>
                    </form>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Save Event'}
                    </Button>
                </DialogActions>
            </Dialog>

            <EventConfirmDialog
                open={confirmDialogOpen}
                onClose={handleCancelConfirm}
                onConfirm={handleConfirm}
                title={title}
                isAllDay={isAllDay}
                allDayDate={allDayDate}
                startTime={startTime}
                endTime={endTime}
                recurring={recurring}
                location={location}
                reminders={reminders}
                color={color}
            />
        </LocalizationProvider>
    );
};

export default EventForm;
