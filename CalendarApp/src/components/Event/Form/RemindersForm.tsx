import React from 'react';
import {
    Paper,
    Stack,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    Checkbox
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Reminder {
    reminder_time: string;
    reminder_type: 'email' | 'push' | 'in_app';
}

interface RemindersFormProps {
    reminders: Reminder[];
    onRemindersChange: (val: Reminder[]) => void;
    selectedReminderTime: string;
    onSelectedReminderTimeChange: (val: string) => void;
    selectedReminderType: 'email' | 'push' | 'in_app';
    onSelectedReminderTypeChange: (val: 'email' | 'push' | 'in_app') => void;
    REMINDER_TIMES: { label: string; value: string }[];
    REMINDER_TYPES: readonly ('email' | 'push' | 'in_app')[];
}

const RemindersForm: React.FC<RemindersFormProps> = ({
    reminders,
    onRemindersChange,
    selectedReminderTime,
    onSelectedReminderTimeChange,
    selectedReminderType,
    onSelectedReminderTypeChange,
    REMINDER_TIMES,
    REMINDER_TYPES
}) => {
    const addReminder = () => {
        if (!selectedReminderTime) return;
        onRemindersChange([
            ...reminders,
            { reminder_time: selectedReminderTime, reminder_type: selectedReminderType }
        ]);
        onSelectedReminderTimeChange('');
        onSelectedReminderTypeChange('email');
    };

    const removeReminder = (index: number) => {
        const newReminders = [...reminders];
        newReminders.splice(index, 1);
        onRemindersChange(newReminders);
    };

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Reminders
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Reminder Time</InputLabel>
                            <Select
                                value={selectedReminderTime}
                                onChange={(e) => onSelectedReminderTimeChange(e.target.value)}
                                label="Reminder Time"
                            >
                                {REMINDER_TIMES.map((rt) => (
                                    <MenuItem key={rt.value} value={rt.value}>
                                        {rt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>Reminder Type</InputLabel>
                            <Select
                                value={selectedReminderType}
                                onChange={(e) => onSelectedReminderTypeChange(e.target.value as 'email' | 'push' | 'in_app')}
                                label="Reminder Type"
                            >
                                {REMINDER_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2} display="flex" alignItems="center">
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={addReminder}
                            disabled={!selectedReminderTime}
                            startIcon={<AddIcon />}
                        >
                            Add
                        </Button>
                    </Grid>
                </Grid>
                <div>
                    {reminders.map((reminder, index) => (
                        <Chip
                            key={index}
                            label={`${reminder.reminder_time} - ${reminder.reminder_type}`}
                            onDelete={() => removeReminder(index)}
                            deleteIcon={<DeleteIcon />}
                            sx={{ m: 0.5 }}
                        />
                    ))}
                </div>
            </Stack>
        </Paper>
    );
};

export default RemindersForm;
