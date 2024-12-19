import React from 'react';
import { Box, Typography, IconButton, ToggleButton, ToggleButtonGroup, Button, Paper, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, ViewDay, ViewWeek, ViewModule } from '@mui/icons-material';
import { format } from 'date-fns';

type ViewType = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
    currentDate: Date;
    viewType: ViewType;
    onViewChange: (newView: ViewType) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    viewType,
    onViewChange,
    onPrevious,
    onNext,
    onToday
}) => {
    const theme = useTheme();

    const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
        if (newView !== null) onViewChange(newView);
    };

    return (
        <Paper sx={{ p: 1, mb: 1, borderRadius: 1, boxShadow: theme.shadows[2] }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 600, ml: 1 }}>Calendar</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                    <ToggleButtonGroup value={viewType} exclusive onChange={handleViewChange} size="small">
                        <ToggleButton value="day"><ViewDay fontSize="small" /></ToggleButton>
                        <ToggleButton value="week"><ViewWeek fontSize="small" /></ToggleButton>
                        <ToggleButton value="month"><ViewModule fontSize="small" /></ToggleButton>
                    </ToggleButtonGroup>
                    <Box display="flex" alignItems="center">
                        <IconButton onClick={onPrevious} size="small"><ChevronLeft /></IconButton>
                        <Typography variant="body2" sx={{ px: 1, fontWeight: 500 }}>
                            {format(currentDate, viewType === 'month' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </Typography>
                        <IconButton onClick={onNext} size="small"><ChevronRight /></IconButton>
                    </Box>
                    <Button variant="outlined" size="small" onClick={onToday}>Today</Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default CalendarHeader;
