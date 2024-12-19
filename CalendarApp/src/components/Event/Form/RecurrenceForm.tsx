import React from 'react';
import {
    Paper,
    Stack,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Checkbox,
    MenuItemProps
} from '@mui/material';
import { RecurrenceRule } from '../../../types/event';

interface RecurrenceFormProps {
    recurring: boolean;
    frequency: RecurrenceRule['frequency'];
    onFrequencyChange: (val: RecurrenceRule['frequency']) => void;
    interval: number;
    onIntervalChange: (val: number) => void;
    selectedDays: string[];
    onSelectedDaysChange: (val: string[]) => void;
    dayOfMonth: number;
    onDayOfMonthChange: (val: number) => void;
    monthOfYear: number;
    onMonthOfYearChange: (val: number) => void;
    FREQUENCIES: RecurrenceRule['frequency'][];
    WEEKDAYS: string[];
}

const RecurrenceForm: React.FC<RecurrenceFormProps> = ({
    recurring,
    frequency,
    onFrequencyChange,
    interval,
    onIntervalChange,
    selectedDays,
    onSelectedDaysChange,
    dayOfMonth,
    onDayOfMonthChange,
    monthOfYear,
    onMonthOfYearChange,
    FREQUENCIES,
    WEEKDAYS
}) => {
    if (!recurring) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Recurrence
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                        value={frequency}
                        onChange={(e) => onFrequencyChange(e.target.value as RecurrenceRule['frequency'])}
                        label="Frequency"
                    >
                        {FREQUENCIES.map((freq) => (
                            <MenuItem key={freq} value={freq}>
                                {freq.charAt(0) + freq.slice(1).toLowerCase()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    fullWidth
                    label="Interval"
                    type="number"
                    value={interval}
                    onChange={(e) => onIntervalChange(parseInt(e.target.value) || 1)}
                />
                {frequency === 'WEEKLY' && (
                    <FormControl fullWidth>
                        <InputLabel>Days of Week</InputLabel>
                        <Select
                            multiple
                            value={selectedDays}
                            onChange={(e) => onSelectedDaysChange(e.target.value as string[])}
                            renderValue={(selected) => selected.join(', ')}
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
                {frequency === 'MONTHLY' && (
                    <TextField
                        fullWidth
                        label="Day of Month"
                        type="number"
                        value={dayOfMonth}
                        onChange={(e) => onDayOfMonthChange(parseInt(e.target.value) || 1)}
                    />
                )}
                {frequency === 'YEARLY' && (
                    <>
                        <TextField
                            fullWidth
                            label="Day of Month"
                            type="number"
                            value={dayOfMonth}
                            onChange={(e) => onDayOfMonthChange(parseInt(e.target.value) || 1)}
                        />
                        <TextField
                            fullWidth
                            label="Month of Year (1-12)"
                            type="number"
                            value={monthOfYear}
                            onChange={(e) => onMonthOfYearChange(parseInt(e.target.value) || 1)}
                        />
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default RecurrenceForm;
