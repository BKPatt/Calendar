import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TextField, Box, Grid, Popover, IconButton, InputAdornment, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parse, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import EventIcon from '@mui/icons-material/Event';
import Calendar from './Calendar';

interface CustomDateTimePickerProps {
    label: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    error?: boolean;
    helperText?: string;
    minDateTime?: Date;
    maxDateTime?: Date;
    disabled?: boolean;
    fullWidth?: boolean;
    dateFormat?: string;
    timeFormat?: string;
    clearable?: boolean;
    onBlur?: () => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    label,
    value,
    onChange,
    error = false,
    helperText,
    minDateTime,
    maxDateTime,
    disabled = false,
    fullWidth = true,
    dateFormat = 'PPP',
    timeFormat = 'HH:mm',
    clearable = true,
    onBlur,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [dateInputValue, setDateInputValue] = useState<string>('');
    const [timeInputValue, setTimeInputValue] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const updateStateFromValue = useCallback((newValue: Date | null) => {
        if (newValue && isValid(newValue)) {
            setDateInputValue(format(newValue, dateFormat));
            setTimeInputValue(format(newValue, timeFormat));
            setSelectedDate(newValue);
        } else {
            setDateInputValue('');
            setTimeInputValue('');
            setSelectedDate(null);
        }
    }, [dateFormat, timeFormat]);

    useEffect(() => {
        updateStateFromValue(value);
    }, [value, updateStateFromValue]);

    const handleIconClick = (event: React.MouseEvent<HTMLElement>) => {
        if (!disabled) {
            setAnchorEl(inputRef.current);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const handleDateClick = (newDate: Date) => {
        const currentTime = selectedDate || new Date();
        newDate = setHours(setMinutes(newDate, getMinutes(currentTime)), getHours(currentTime));
        updateDateTime(newDate);
    };

    const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeValue = event.target.value;
        setTimeInputValue(newTimeValue);

        if (selectedDate) {
            const [hours, minutes] = newTimeValue.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                const newDateTime = setHours(setMinutes(selectedDate, minutes), hours);
                updateDateTime(newDateTime);
            }
        }
    };

    const updateDateTime = (newDateTime: Date | null) => {
        updateStateFromValue(newDateTime);
        onChange(newDateTime);
    };

    const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setDateInputValue(newValue);

        const parsedDate = parse(newValue, dateFormat, new Date());
        if (isValid(parsedDate)) {
            const newDateTime = selectedDate
                ? setHours(setMinutes(parsedDate, getMinutes(selectedDate)), getHours(selectedDate))
                : parsedDate;
            updateDateTime(newDateTime);
        } else {
            onChange(null);
        }
    };

    const handleClear = () => {
        updateStateFromValue(null);
        onChange(null);
        handlePopoverClose();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box ref={inputRef}>
                <Grid container spacing={2}>
                    <Grid item xs={7}>
                        <TextField
                            label={label}
                            value={dateInputValue}
                            onChange={handleDateInputChange}
                            onBlur={onBlur}
                            error={error}
                            helperText={helperText}
                            disabled={disabled}
                            fullWidth={fullWidth}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleIconClick} edge="end" disabled={disabled}>
                                            <EventIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={5}>
                        <TextField
                            label="Time"
                            type="time"
                            value={timeInputValue}
                            onChange={handleTimeChange}
                            disabled={disabled}
                            fullWidth
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                step: 300, // 5 minutes
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ width: '300px', maxWidth: '90vw', p: 2 }}>
                    <Calendar
                        currentMonth={selectedDate || new Date()}
                        events={[]}
                        onDateClick={handleDateClick}
                        onEventClick={() => { }}
                        changeMonth={() => { }}
                        goToToday={() => { }}
                        handleCreateEvent={() => { }}
                        viewMode="month"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        {clearable && (
                            <Button
                                variant="text"
                                color="primary"
                                onClick={handleClear}
                                size="small"
                            >
                                Clear selection
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePopoverClose}
                            size="small"
                        >
                            Done
                        </Button>
                    </Box>
                </Box>
            </Popover>
        </LocalizationProvider>
    );
};

export default CustomDateTimePicker;
