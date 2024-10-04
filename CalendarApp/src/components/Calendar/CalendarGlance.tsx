import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Grid2,
    Paper,
    useTheme,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    ViewDay,
    ViewWeek,
    ViewModule,
} from '@mui/icons-material';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    addDays,
    addWeeks,
    addMonths,
    subDays,
    subWeeks,
    subMonths,
} from 'date-fns';
import { Events } from '../../types/event';

type ViewType = 'day' | 'week' | 'month';

interface CalendarGlanceProps {
    events: Events[];
}

const CalendarGlance: React.FC<CalendarGlanceProps> = ({ events }) => {
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('month');

    const handleViewChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: ViewType | null
    ) => {
        if (newView !== null) {
            setViewType(newView);
        }
    };

    const handlePrevious = () => {
        setCurrentDate((date) => {
            switch (viewType) {
                case 'day':
                    return subDays(date, 1);
                case 'week':
                    return subWeeks(date, 1);
                case 'month':
                    return subMonths(date, 1);
            }
        });
    };

    const handleNext = () => {
        setCurrentDate((date) => {
            switch (viewType) {
                case 'day':
                    return addDays(date, 1);
                case 'week':
                    return addWeeks(date, 1);
                case 'month':
                    return addMonths(date, 1);
            }
        });
    };

    const daysToShow = useMemo(() => {
        switch (viewType) {
            case 'day':
                return [currentDate];
            case 'week':
                return eachDayOfInterval({
                    start: startOfWeek(currentDate),
                    end: endOfWeek(currentDate),
                });
            case 'month':
                return eachDayOfInterval({
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate),
                });
        }
    }, [currentDate, viewType]);

    const getEventsForDate = (date: Date) => {
        return events.filter((event) =>
            isSameDay(new Date(event.start_time), date)
        );
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="textPrimary">
                    Calendar at a Glance
                </Typography>
                <Box>
                    <ToggleButtonGroup
                        value={viewType}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                    >
                        <Tooltip title="Day View">
                            <ToggleButton value="day">
                                <ViewDay />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Week View">
                            <ToggleButton value="week">
                                <ViewWeek />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Month View">
                            <ToggleButton value="month">
                                <ViewModule />
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>
                </Box>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <IconButton onClick={handlePrevious} color="default">
                    <ChevronLeft />
                </IconButton>
                <Typography variant="h6" color="textSecondary">
                    {format(currentDate, viewType === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
                </Typography>
                <IconButton onClick={handleNext} color="default">
                    <ChevronRight />
                </IconButton>
            </Box>
            <Grid2 container spacing={1}>
                {daysToShow.map((date, index) => (
                    <Grid2 size={viewType === 'month' ? 12 / 7 : 12 / daysToShow.length} key={index} component="div">
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: 3,
                                backgroundColor: isSameDay(date, new Date())
                                    ? theme.palette.primary.light
                                    : theme.palette.background.default,
                                border: '1px solid',
                                borderColor: isSameDay(date, new Date())
                                    ? theme.palette.primary.main
                                    : theme.palette.divider,
                                '&:hover': {
                                    backgroundColor: isSameDay(date, new Date())
                                        ? theme.palette.primary.dark
                                        : theme.palette.action.hover,
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                },
                            }}
                        >
                            <Typography variant="subtitle2" align="center" color="textPrimary">
                                {format(date, viewType === 'month' ? 'd' : 'EEE d')}
                            </Typography>
                            {getEventsForDate(date).map((event, eventIndex) => (
                                <Box
                                    key={eventIndex}
                                    sx={{
                                        mt: 1,
                                        p: 1,
                                        backgroundColor: event.color || theme.palette.info.main,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: theme.palette.getContrastText(
                                            event.color || theme.palette.info.main
                                        ),
                                    }}
                                >
                                    <Typography variant="caption" noWrap>
                                        {event.title}
                                    </Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
};

export default CalendarGlance;