import React from 'react';
import {
    Paper,
    Stack,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Box,
    Avatar,
    Tooltip
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { ColorLens as ColorLensIcon } from '@mui/icons-material';
import { EventType } from '../../../types/event';
import LocationAutocomplete from '../../Maps/LocationAutocomplete';

interface EventDetailsFormProps {
    title: string;
    onTitleChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    eventType: EventType;
    onEventTypeChange: (value: EventType) => void;
    isAllDay: boolean;
    onIsAllDayChange: (value: boolean) => void;
    allDayDate: Date | null;
    onAllDayDateChange: (value: Date | null) => void;
    startTime: Date | null;
    onStartTimeChange: (value: Date | null) => void;
    endTime: Date | null;
    onEndTimeChange: (value: Date | null) => void;
    recurring: boolean;
    onRecurringChange: (value: boolean) => void;
    location: string;
    onLocationChange: (value: string) => void;
    color: string;
    onColorChange: (value: string) => void;
    EVENT_TYPES: EventType[];
    EVENT_COLORS: string[];
    availableUsers?: { id: number; name: string }[];
    sharedWith: number[];
    onSharedWithChange: (value: number[]) => void;
    availableGroups?: { id: number; name: string }[];
    groupId: number | null;
    onGroupIdChange: (value: number | null) => void;
}

const EventDetailsForm: React.FC<EventDetailsFormProps> = ({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
    eventType,
    onEventTypeChange,
    isAllDay,
    onIsAllDayChange,
    allDayDate,
    onAllDayDateChange,
    startTime,
    onStartTimeChange,
    endTime,
    onEndTimeChange,
    recurring,
    onRecurringChange,
    location,
    onLocationChange,
    color,
    onColorChange,
    EVENT_TYPES,
    EVENT_COLORS,
    availableUsers = [],
    sharedWith,
    onSharedWithChange,
    availableGroups = [],
    groupId,
    onGroupIdChange
}) => {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Details
                </Typography>
                <TextField
                    fullWidth
                    label="Event Title *"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    required
                />
                <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                />
                <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                        value={eventType}
                        onChange={(e) => onEventTypeChange(e.target.value as EventType)}
                        label="Event Type"
                    >
                        {EVENT_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box display="flex" alignItems="center" gap={2}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isAllDay}
                                onChange={(e) => onIsAllDayChange(e.target.checked)}
                            />
                        }
                        label="All Day"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={recurring}
                                onChange={(e) => onRecurringChange(e.target.checked)}
                            />
                        }
                        label="Recurring"
                    />
                </Box>

                {isAllDay ? (
                    <Box display="flex" gap={2}>
                        <DatePicker
                            label="Date"
                            value={allDayDate}
                            onChange={(date) => onAllDayDateChange(date)}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Box>
                ) : (
                    <Box display="flex" gap={2}>
                        <DateTimePicker
                            label="Starts"
                            value={startTime}
                            onChange={onStartTimeChange}
                            ampm={false}
                            slotProps={{
                                textField: {
                                    fullWidth: true
                                }
                            }}
                        />
                        <DateTimePicker
                            label="Ends"
                            value={endTime}
                            onChange={onEndTimeChange}
                            ampm={false}
                            slotProps={{
                                textField: {
                                    fullWidth: true
                                }
                            }}
                        />
                    </Box>
                )}

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Location
                    </Typography>
                    <LocationAutocomplete
                        value={location}
                        onChange={onLocationChange}
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Event Color
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {EVENT_COLORS.map((col) => (
                            <Tooltip title={col} key={col}>
                                <Avatar
                                    sx={{
                                        bgcolor: col,
                                        cursor: 'pointer',
                                        border: color === col ? '2px solid #000' : '2px solid transparent'
                                    }}
                                    onClick={() => onColorChange(col)}
                                >
                                    <ColorLensIcon />
                                </Avatar>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
                {availableUsers.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Share With Users
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Users</InputLabel>
                            <Select
                                multiple
                                value={sharedWith}
                                onChange={(e) => onSharedWithChange(e.target.value as number[])}
                                renderValue={(selected) =>
                                    (selected as number[])
                                        .map((id) => availableUsers.find((u) => u.id === id)?.name)
                                        .join(', ')
                                }
                            >
                                {availableUsers.map((u) => (
                                    <MenuItem key={u.id} value={u.id}>
                                        <Checkbox checked={sharedWith.indexOf(u.id) > -1} />
                                        {u.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
                {availableGroups.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Assign to Group
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Group</InputLabel>
                            <Select
                                value={groupId || ''}
                                onChange={(e) =>
                                    onGroupIdChange(e.target.value ? (e.target.value as number) : null)
                                }
                                label="Group"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {availableGroups.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>
                                        {g.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
};

export default EventDetailsForm;
